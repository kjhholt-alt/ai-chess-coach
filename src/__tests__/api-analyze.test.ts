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

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

import { checkRateLimit } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";

const mockCheckRateLimit = vi.mocked(checkRateLimit);

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
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetIn: 600000,
    });

    // Set env var
    process.env.ANTHROPIC_API_KEY = "test-key";

    // Set up Anthropic mock
    mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(validAnalysis) }],
    });

    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          messages: { create: mockCreate },
        }) as unknown as Anthropic
    );
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

  it("returns 503 if API key is not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(
      createRequest({ games: validGames, username: "test" })
    );
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("temporarily unavailable");
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
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: "```json\n" + JSON.stringify(validAnalysis) + "\n```",
        },
      ],
    });

    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analysis.overall).toBe(validAnalysis.overall);
  });

  it("returns 500 if Claude returns unparseable response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "This is not JSON at all" }],
    });

    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("parse");
  });

  it("returns 500 if Claude returns non-text response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "image", source: {} }],
    });

    const res = await POST(
      createRequest({ games: validGames, username: "testuser" })
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Unexpected response format");
  });

  it("limits games context to 15 games", async () => {
    const manyGames = Array.from({ length: 25 }, (_, i) => ({
      ...validGames[0],
      id: `game-${i}`,
    }));

    await POST(createRequest({ games: manyGames, username: "testuser" }));

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[0].content;
    // Should only include first 15 games in context
    expect(promptContent).toContain("Game 15");
    expect(promptContent).not.toContain("Game 16");
  });
});
