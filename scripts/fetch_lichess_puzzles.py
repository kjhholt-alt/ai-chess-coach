"""Fetch + sample puzzles from the public Lichess puzzle database.

Why this exists:
  Current puzzle bank ships 53 hand-written puzzles, almost all under
  rating 1400. Players who improve hit a ceiling within a session or
  two. Lichess publishes ~280K free CC0 puzzles at
  https://database.lichess.org/lichess_db_puzzle.csv.zst — this script
  streams that CSV (zstd-decompressed on the fly), keeps a small
  per-bucket sample, and emits a TypeScript module the puzzles page
  can import.

We stop reading after collecting N puzzles per (theme, rating-band)
bucket so we don't pull the full 280K rows. Each sampled puzzle is
sanity-checked with python-chess: FEN must parse, every UCI move must
be legal in sequence.

Run:
  py scripts/fetch_lichess_puzzles.py
Output:
  src/lib/puzzle-bank-lichess.ts  (TS module with a PUZZLES array)
"""
from __future__ import annotations

import io
import json
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import chess
import httpx
import zstandard as zstd

URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"
OUT_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "puzzle-bank-lichess.ts"

# Theme keys we want to enrich. Map Lichess theme tag → our internal key.
THEME_MAP = {
    "fork": "fork",
    "pin": "pin",
    "skewer": "skewer",
    "discoveredAttack": "discoveredAttack",
    "backRankMate": "backRankMate",
    "hangingPiece": "hangingPiece",
    "trappedPiece": "trappedPiece",
    "overloadingPiece": "overloadedPiece",
    "deflection": "deflection",
    "decoy": "decoy",
    "sacrifice": "sacrifice",
    "mateIn1": "mateIn1",
    "mateIn2": "mateIn2",
    "mateIn3": "mateIn3",
    "endgame": "endgame",
    "middlegame": "middlegame",
    "opening": "opening",
    "pawnEndgame": "pawnEndgame",
    "rookEndgame": "rookEndgame",
    "promotion": "promotion",
}

# Per-theme buckets by rating range. (low, high, target_count).
# We want depth in the under-served buckets and breadth across difficulty.
BUCKETS = [
    (1000, 1399, 4),
    (1400, 1799, 5),
    (1800, 2199, 4),
    (2200, 2600, 3),
]

# Minimum popularity (Lichess uses a -100..+100 popularity score).
# Filters out weird or low-quality puzzles.
MIN_POPULARITY = 80
MIN_PLAYS = 500

# Cap on rows we'll stream before giving up. 280K full DB; sampling
# stops when buckets fill, but we put a hard ceiling so we don't
# accidentally pull the entire 1.5GB CSV.
MAX_ROWS = 200_000


def need_more(by_theme_bucket: dict[tuple[str, int], int]) -> bool:
    """Return True if any theme/bucket still needs more puzzles."""
    for theme in THEME_MAP.values():
        for lo, hi, target in BUCKETS:
            if by_theme_bucket.get((theme, lo), 0) < target:
                return True
    return False


def validate_puzzle(fen: str, uci_moves: list[str]) -> bool:
    """FEN parses + each UCI move is legal in sequence."""
    try:
        board = chess.Board(fen)
    except Exception:
        return False
    for m in uci_moves:
        try:
            move = chess.Move.from_uci(m)
        except Exception:
            return False
        if move not in board.legal_moves:
            return False
        board.push(move)
    return True


def bucket_for_rating(rating: int) -> int | None:
    for lo, hi, _ in BUCKETS:
        if lo <= rating <= hi:
            return lo
    return None


def main() -> int:
    print(f"streaming {URL}")
    sampled: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    counts: dict[tuple[str, int], int] = defaultdict(int)

    dctx = zstd.ZstdDecompressor()
    t0 = time.time()
    bytes_in = 0
    bytes_out = 0
    rows_read = 0
    skipped_invalid = 0
    skipped_pop = 0
    skipped_unwanted = 0

    class StreamWrapper:
        """zstandard's stream_reader needs a read()-able object. httpx's
        iter_bytes() is an iterator. Wrap it."""
        def __init__(self, it):
            self.it = it
            self.buf = b""
        def read(self, n: int = -1) -> bytes:
            while n < 0 or len(self.buf) < n:
                try:
                    self.buf += next(self.it)
                except StopIteration:
                    break
            if n < 0:
                out, self.buf = self.buf, b""
                return out
            out, self.buf = self.buf[:n], self.buf[n:]
            return out

    with httpx.stream("GET", URL, timeout=120.0, follow_redirects=True) as r:
        r.raise_for_status()
        stream = StreamWrapper(r.iter_bytes(chunk_size=64 * 1024))
        with dctx.stream_reader(stream) as zr:
            buf = io.BufferedReader(zr)  # type: ignore[arg-type]
            header_line = buf.readline().decode("utf-8", errors="replace").strip()
            cols = header_line.split(",")
            idx = {c: i for i, c in enumerate(cols)}
            while True:
                line = buf.readline()
                if not line:
                    break
                rows_read += 1
                bytes_out += len(line)
                if rows_read % 10_000 == 0:
                    bucket_summary = sum(counts.values())
                    print(
                        f"  rows={rows_read} sampled={len(sampled)} "
                        f"in_buckets={bucket_summary} elapsed={time.time() - t0:.0f}s"
                    )
                if rows_read > MAX_ROWS:
                    print(f"  hit MAX_ROWS={MAX_ROWS}, stopping")
                    break
                if not need_more(counts):
                    print(f"  all buckets full at row {rows_read}, stopping")
                    break
                try:
                    parts = line.decode("utf-8", errors="replace").rstrip("\n").rstrip("\r").split(",")
                    pid = parts[idx["PuzzleId"]]
                    if pid in seen_ids:
                        continue
                    fen = parts[idx["FEN"]]
                    moves_str = parts[idx["Moves"]]
                    rating = int(parts[idx["Rating"]])
                    pop = int(parts[idx["Popularity"]])
                    plays = int(parts[idx["NbPlays"]])
                    themes_str = parts[idx["Themes"]]
                except Exception:
                    skipped_invalid += 1
                    continue
                if pop < MIN_POPULARITY or plays < MIN_PLAYS:
                    skipped_pop += 1
                    continue
                bkt = bucket_for_rating(rating)
                if bkt is None:
                    skipped_unwanted += 1
                    continue
                themes_lichess = themes_str.split()
                # Map themes to our internal keys; only keep ones we recognize.
                themes_internal = sorted({
                    THEME_MAP[t] for t in themes_lichess if t in THEME_MAP
                })
                if not themes_internal:
                    skipped_unwanted += 1
                    continue
                # Is at least one bucket-theme combo still hungry?
                hungry_theme = None
                for t in themes_internal:
                    if counts[(t, bkt)] < dict((lo, target) for lo, _, target in BUCKETS)[bkt]:
                        hungry_theme = t
                        break
                if hungry_theme is None:
                    continue
                uci_moves = moves_str.split()
                if not validate_puzzle(fen, uci_moves):
                    skipped_invalid += 1
                    continue
                # Accepted
                seen_ids.add(pid)
                sampled.append({
                    "id": f"lichess_{pid}",
                    "fen": fen,
                    "moves": uci_moves,
                    "rating": rating,
                    "themes": themes_internal,
                    "description": "",
                })
                # Bump count for ALL matching themes in the bucket (not just hungry one)
                for t in themes_internal:
                    counts[(t, bkt)] += 1

    elapsed = time.time() - t0
    print(
        f"done: rows_read={rows_read} sampled={len(sampled)} "
        f"skipped(invalid={skipped_invalid},low_pop={skipped_pop},unwanted={skipped_unwanted}) "
        f"elapsed={elapsed:.0f}s"
    )

    # Write TS module.
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "/**",
        " * Lichess-sourced puzzles (CC0). Sampled and validated by",
        " * scripts/fetch_lichess_puzzles.py — do not hand-edit; re-run the",
        " * script to refresh. Each puzzle's FEN + UCI moves have been",
        " * verified legal-in-sequence with python-chess.",
        " */",
        "import type { PuzzleData } from \"./puzzle-bank\";",
        "",
        "export const LICHESS_PUZZLES: PuzzleData[] = [",
    ]
    for p in sampled:
        themes_js = ", ".join(f'"{t}"' for t in p["themes"])
        moves_js = ", ".join(f'"{m}"' for m in p["moves"])
        lines.append("  {")
        lines.append(f'    id: "{p["id"]}",')
        lines.append(f'    fen: "{p["fen"]}",')
        lines.append(f'    moves: [{moves_js}],')
        lines.append(f'    rating: {p["rating"]},')
        lines.append(f'    themes: [{themes_js}],')
        lines.append("  },")
    lines.append("];")
    lines.append("")
    OUT_TS.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT_TS} ({len(sampled)} puzzles)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
