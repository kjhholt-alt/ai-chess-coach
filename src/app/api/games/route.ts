import { NextRequest, NextResponse } from "next/server";
import { fetchUserGames } from "@/lib/lichess";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limit by IP - 30 requests per minute
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, resetIn } = checkRateLimit(`games:${ip}`, 30, 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Validate username format (Lichess usernames are alphanumeric + hyphens/underscores, 2-20 chars)
  const sanitizedUsername = username.trim();
  if (!/^[a-zA-Z0-9_-]{2,20}$/.test(sanitizedUsername)) {
    return NextResponse.json(
      { error: "Invalid Lichess username format" },
      { status: 400 }
    );
  }

  try {
    const games = await fetchUserGames(sanitizedUsername, 20);

    return NextResponse.json({
      games,
      username: sanitizedUsername,
      count: games.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch games";

    if (message.includes("404")) {
      return NextResponse.json(
        { error: `User "${sanitizedUsername}" not found on Lichess` },
        { status: 404 }
      );
    }

    if (message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limited by Lichess. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    console.error("[games] Error fetching games:", message);
    return NextResponse.json(
      { error: "Failed to fetch games. Please try again." },
      { status: 500 }
    );
  }
}
