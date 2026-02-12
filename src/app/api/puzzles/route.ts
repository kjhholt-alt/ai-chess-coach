import { NextRequest, NextResponse } from "next/server";
import { Puzzle } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";

const FALLBACK_PUZZLE: Puzzle = {
  id: "fallback-1",
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  moves: ["Qxf7"],
  rating: 800,
  themes: ["mateIn1", "short"],
};

export async function GET(request: NextRequest) {
  // Rate limit - 60 puzzle fetches per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = checkRateLimit(`puzzles:${ip}`, 60, 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const res = await fetch("https://lichess.org/api/puzzle/daily", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`[puzzles] Lichess API error: ${res.status}`);
      return NextResponse.json({
        puzzle: FALLBACK_PUZZLE,
        isFallback: true,
      });
    }

    const data = await res.json();

    const puzzle: Puzzle = {
      id: data.puzzle?.id || String(Date.now()),
      fen: data.game?.pgn || data.puzzle?.fen || "",
      moves: data.puzzle?.solution || [],
      rating: data.puzzle?.rating || 1500,
      themes: data.puzzle?.themes || [],
    };

    return NextResponse.json({ puzzle, isFallback: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[puzzles] Error:", message);
    return NextResponse.json({
      puzzle: FALLBACK_PUZZLE,
      isFallback: true,
    });
  }
}
