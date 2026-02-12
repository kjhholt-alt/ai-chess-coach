import { NextRequest, NextResponse } from "next/server";
import { fetchUserGames } from "@/lib/lichess";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const games = await fetchUserGames(username, 20);

    return NextResponse.json({
      games,
      username,
      count: games.length,
    });
  } catch (err: any) {
    const message = err.message || "Failed to fetch games";

    if (message.includes("404")) {
      return NextResponse.json(
        { error: `User "${username}" not found on Lichess` },
        { status: 404 }
      );
    }

    if (message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limited by Lichess. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
