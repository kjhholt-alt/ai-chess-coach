import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

interface AnalysisSummary {
  accuracy: number;
  brilliant: number;
  great: number;
  good: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
}

interface CoachRequest {
  pgn: string;
  playerColor: "white" | "black";
  result: "white" | "black" | "draw";
  resultReason?: string;
  analysisSummary: AnalysisSummary;
  mistakes?: string[];
  blunders?: string[];
}

export async function POST(request: NextRequest) {
  // Rate limit by IP - 5 coaching requests per 10 minutes
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, resetIn } = checkRateLimit(
    `coach:${ip}`,
    5,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many coaching requests. Please wait before trying again.",
        retryAfter: Math.ceil(resetIn / 1000),
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const body: CoachRequest = await request.json();

    // Validate required fields
    if (!body.pgn || typeof body.pgn !== "string") {
      return NextResponse.json(
        { error: "PGN is required" },
        { status: 400 }
      );
    }

    if (!body.playerColor || !["white", "black"].includes(body.playerColor)) {
      return NextResponse.json(
        { error: "playerColor must be 'white' or 'black'" },
        { status: 400 }
      );
    }

    if (!body.analysisSummary || typeof body.analysisSummary !== "object") {
      return NextResponse.json(
        { error: "analysisSummary is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[coach] ANTHROPIC_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI coaching is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    const { analysisSummary, mistakes, blunders, playerColor, result, resultReason } = body;

    // Determine human-readable result
    let resultText: string;
    if (result === "draw") {
      resultText = "draw";
    } else if (result === playerColor) {
      resultText = "win";
    } else {
      resultText = "loss";
    }
    if (resultReason) {
      resultText += ` (${resultReason})`;
    }

    const mistakesList =
      mistakes && mistakes.length > 0
        ? mistakes.map((m) => `  - ${m}`).join("\n")
        : "  (none identified)";

    const blundersList =
      blunders && blunders.length > 0
        ? blunders.map((b) => `  - ${b}`).join("\n")
        : "  (none identified)";

    const prompt = `You are an expert chess coach (rated 2200+) reviewing a student's game. Be encouraging but honest.

Here is their game in PGN:
${body.pgn}

Here is the analysis summary:
- Player accuracy: ${analysisSummary.accuracy}%
- Brilliant moves: ${analysisSummary.brilliant}, Great moves: ${analysisSummary.great}, Good moves: ${analysisSummary.good}
- Inaccuracies: ${analysisSummary.inaccuracies}, Mistakes: ${analysisSummary.mistakes}, Blunders: ${analysisSummary.blunders}
- Key mistakes:
${mistakesList}
- Key blunders:
${blundersList}
- Player color: ${playerColor}
- Result: ${resultText}

Provide coaching feedback in this structure:
1. GAME SUMMARY (2-3 sentences about how the game went overall)
2. WHAT YOU DID WELL (2-3 specific good moments with move references)
3. KEY MISTAKES (the 2-3 most instructive errors — explain WHY the move was wrong in plain English)
4. LESSON TO FOCUS ON (one specific chess concept they should study)
5. PRACTICE SUGGESTION (one specific exercise)`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      console.error("[coach] Unexpected response type:", content.type);
      return NextResponse.json(
        { error: "Unexpected response format from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ coaching: content.text });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Coaching analysis failed";
    console.error("[coach] Error:", message);

    if (message.includes("authentication") || message.includes("401")) {
      return NextResponse.json(
        { error: "AI service authentication error. Please contact support." },
        { status: 503 }
      );
    }

    if (message.includes("rate") || message.includes("429")) {
      return NextResponse.json(
        { error: "AI service is busy. Please try again in a minute." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Coaching analysis failed. Please try again later." },
      { status: 500 }
    );
  }
}
