import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Game, Analysis } from "@/types";

export async function POST(request: Request) {
  try {
    const { games, username } = (await request.json()) as {
      games: Game[];
      username: string;
    };

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "No games provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const gamesContext = games
      .slice(0, 15)
      .map(
        (g, i) =>
          `Game ${i + 1}: ${g.white} vs ${g.black} (${g.result}) - ${g.opening} [${g.timeControl}]\nPGN: ${g.pgn || g.moves.join(" ")}`
      )
      .join("\n\n");

    const winCount = games.filter(
      (g) =>
        (g.userColor === "white" && g.result === "white") ||
        (g.userColor === "black" && g.result === "black")
    ).length;
    const lossCount = games.filter(
      (g) =>
        (g.userColor === "white" && g.result === "black") ||
        (g.userColor === "black" && g.result === "white")
    ).length;
    const drawCount = games.filter((g) => g.result === "draw").length;

    const prompt = `You are an expert chess coach analyzing a player's recent games. The player's Lichess username is "${username}".

Here is their recent game history (${games.length} games):
Record: ${winCount}W / ${lossCount}L / ${drawCount}D

${gamesContext}

Please analyze these games and provide a comprehensive coaching report. Return your analysis as valid JSON matching this exact structure:
{
  "overall": "A paragraph assessing the player's overall level, style, and tendencies",
  "openings": [
    {
      "name": "Opening Name",
      "frequency": 3,
      "winRate": 0.67,
      "suggestion": "Specific advice for this opening"
    }
  ],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "topImprovements": [
    {
      "area": "Area name",
      "description": "Detailed description of what to improve",
      "example": "A specific example from their games"
    }
  ],
  "studyPlan": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
}

Analyze their opening choices and win rates, middlegame tactical patterns, endgame technique, time management tendencies, and common mistakes. Be specific and reference actual games where possible. Provide exactly 3 top improvements and 5 study plan steps. Return ONLY the JSON, no other text.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    let analysis: Analysis;
    try {
      const jsonStr = content.text.trim();
      const cleaned = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse analysis response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
