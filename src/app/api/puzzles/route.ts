import { NextRequest, NextResponse } from "next/server";
import { Puzzle } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const theme = searchParams.get("theme");

  try {
    const res = await fetch("https://lichess.org/api/puzzle/daily", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Lichess API error: ${res.status}`);
    }

    const data = await res.json();

    const puzzle: Puzzle = {
      id: data.puzzle?.id || String(Date.now()),
      fen: data.game?.pgn || data.puzzle?.fen || "",
      moves: data.puzzle?.solution || [],
      rating: data.puzzle?.rating || 1500,
      themes: data.puzzle?.themes || [],
    };

    if (theme && puzzle.themes.length > 0) {
      const hasTheme = puzzle.themes.some(
        (t: string) => t.toLowerCase() === theme.toLowerCase()
      );
      if (!hasTheme) {
        // Return anyway - theme filtering is best-effort with the daily puzzle
      }
    }

    return NextResponse.json({ puzzle });
  } catch (err: any) {
    // Fallback puzzle if API fails
    const fallback: Puzzle = {
      id: "fallback-1",
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
      moves: ["Qxf7"],
      rating: 800,
      themes: ["mateIn1", "short"],
    };

    return NextResponse.json({ puzzle: fallback });
  }
}
