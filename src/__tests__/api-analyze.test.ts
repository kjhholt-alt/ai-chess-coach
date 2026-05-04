import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 4,
    resetIn: 600000,
  }),
}));

// Mock claudex (Max-sub `claude -p` subprocess)
vi.mock("@/lib/claudex.js", () => ({
  ask: vi.fn(),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { ask } from "@/lib/claudex.js";

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockAsk = vi.mocked(ask);

const validGames = [
  {
    id: "game1",
    white: "testuser",
    black: "opponent",
    result: "white" as const,
    opening: "Sicilian Defense",
    pgn: "1. e4 c5",
    moves: ["e4", "c5"],
    timeControl: "5+3",
    date: "2024-01-01",
    userColor: "white" as const,
  },
];

const validAnalysis = {
  overall: "Strong player with tactical awareness",
  openings: [
    { name: "Sicilian", frequency: 1, winRate: 1.0, suggestion: "Keep playing it" },
  ],
  strengths: ["Tactics", "Opening prep", "Time management"],
  weaknesses: ["Endgames", "Pawn structure", "Defense"],
  topImprovements: [
    { area: "Endgames", description: "Practice king and pawn", example: "Game 1" },
    { area: "Defense", description: "Be more careful", example: "Game 1" },
    { area: "Pawns", description: "Improve pawn play", example: "Game 1" },
  ],
  studyPlan: ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/analyze", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetIn: 600000,
    });
    mockAsk.mockResolvedValue({
      text: JSON.stringify(validAnalysis),
      cached: false,
      promptHash: "test",
    } as never);
  });

  it("returns 400 if no games provided", async () => {
    const res = await POST(createRequest({ games: [], username: "test" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No games");
  });

  it("returns 400 if games is not an array", async () => {
    const res = await POST(createRequest({ games: "not an array", username: "test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if username is missing", async () => {
    const res = await POST(createRequest({ games: validGames }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Username is required");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 300000,
    });

    const res = await POST(
      createRequest({ games: validGames, username: "test" })
    );
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Too many analysis requests");
    expect(data.retryAfter).toBeDefined();
  });

  it("returns analysis on success", async () => {
    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analysis).toBeDefined();
    expect(data.analysis.overall).toBe(validAnalysis.overall);
    expect(data.analysis.strengths).toHaveLength(3);
    expect(data.analysis.studyPlan).toHaveLength(5);
  });

  it("handles markdown-wrapped JSON response from Claude", async () => {
    mockAsk.mockResolvedValueOnce({
      text: "```json\n" + JSON.stringify(validAnalysis) + "\n```",
      cached: false,
      promptHash: "test",
    } as never);

    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analysis.overall).toBe(validAnalysis.overall);
  });

  it("returns 500 if Claude returns unparseable response", async () => {
    mockAsk.mockResolvedValueOnce({
      text: "This is not JSON at all",
      cached: false,
      promptHash: "test",
    } as never);

    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("parse");
  });

  it("limits games context to 15 games", async () => {
    const manyGames = Array.from({ length: 25 }, (_, i) => ({
      ...validGames[0],
      id: `game-${i}`,
    }));

    await POST(createRequest({ games: manyGames, username: "testuser" }));

    const promptArg = mockAsk.mock.calls[0][0] as string;
    expect(promptArg).toContain("Game 15");
    expect(promptArg).not.toContain("Game 16");
  });
});
