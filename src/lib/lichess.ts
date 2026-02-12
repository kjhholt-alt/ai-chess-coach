import { Game } from "@/types";

const LICHESS_API = "https://lichess.org/api";

interface LichessRawGame {
  id?: string;
  players?: {
    white?: { user?: { name?: string } };
    black?: { user?: { name?: string } };
  };
  winner?: string;
  clock?: { initial: number; increment: number };
  speed?: string;
  opening?: { name?: string };
  pgn?: string;
  moves?: string;
  createdAt?: number;
}

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
      const raw: LichessRawGame = JSON.parse(line);
      games.push(parseGameData(raw, username));
    } catch {
      continue;
    }
  }

  return games;
}

export function parseGameData(raw: LichessRawGame, username?: string): Game {
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
