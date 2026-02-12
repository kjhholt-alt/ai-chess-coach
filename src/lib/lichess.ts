import { Game, Puzzle } from "@/types";

const LICHESS_API = "https://lichess.org/api";

export async function fetchUserGames(
  username: string,
  max: number = 20
): Promise<Game[]> {
  const res = await fetch(
    `${LICHESS_API}/games/user/${encodeURIComponent(username)}?max=${max}&pgnInJson=true&opening=true`,
    {
      headers: {
        Accept: "application/x-ndjson",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Lichess API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  const games: Game[] = [];

  for (const line of lines) {
    try {
      const raw = JSON.parse(line);
      games.push(parseGameData(raw, username));
    } catch {
      continue;
    }
  }

  return games;
}

export function parseGameData(raw: any, username?: string): Game {
  const white = raw.players?.white?.user?.name || "Anonymous";
  const black = raw.players?.black?.user?.name || "Anonymous";

  let result: "white" | "black" | "draw" = "draw";
  if (raw.winner === "white") result = "white";
  else if (raw.winner === "black") result = "black";

  const userColor: "white" | "black" =
    username && white.toLowerCase() === username.toLowerCase()
      ? "white"
      : "black";

  const timeControl = raw.clock
    ? `${Math.floor(raw.clock.initial / 60)}+${raw.clock.increment}`
    : raw.speed || "correspondence";

  const pgn = raw.pgn || "";
  const moves = raw.moves ? raw.moves.split(" ") : [];

  return {
    id: raw.id || String(Date.now()),
    white,
    black,
    result,
    opening: raw.opening?.name || "Unknown Opening",
    pgn,
    moves,
    timeControl,
    date: raw.createdAt
      ? new Date(raw.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    userColor,
  };
}

export async function fetchPuzzle(theme?: string): Promise<Puzzle> {
  const url = theme
    ? `https://lichess.org/api/puzzle/activity?max=1`
    : `https://lichess.org/api/puzzle/daily`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Lichess Puzzle API error: ${res.status}`);
  }

  const data = await res.json();

  const puzzle = data.game ? data : data;

  return {
    id: puzzle.puzzle?.id || String(Date.now()),
    fen: puzzle.game?.fen || puzzle.fen || "",
    moves: puzzle.puzzle?.solution || [],
    rating: puzzle.puzzle?.rating || 1500,
    themes: puzzle.puzzle?.themes || [],
  };
}

export async function fetchPuzzleById(id: string): Promise<Puzzle> {
  const res = await fetch(`https://lichess.org/api/puzzle/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Puzzle fetch error: ${res.status}`);
  }

  const data = await res.json();

  return {
    id: data.puzzle?.id || id,
    fen: data.game?.pgn
      ? data.game.pgn
      : data.puzzle?.fen || "",
    moves: data.puzzle?.solution || [],
    rating: data.puzzle?.rating || 1500,
    themes: data.puzzle?.themes || [],
  };
}
