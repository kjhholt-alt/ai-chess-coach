import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/coach/route";
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

const validBody = {
  pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6",
  playerColor: "white" as const,
  result: "white" as const,
  resultReason: "checkmate",
  analysisSummary: {
    accuracy: 85,
    brilliant: 1,
    great: 3,
    good: 10,
    inaccuracies: 2,
    mistakes: 1,
    blunders: 0,
  },
  mistakes: ["Move 15: Nxd4 — lost a tempo"],
  blunders: [],
};

const coachingResponse = `## GAME SUMMARY
You played a solid Ruy Lopez and converted your advantage cleanly.

## WHAT YOU DID WELL
- Move 3. Bb5 was textbook opening play
- Your knight maneuver on move 10 gained a tempo

## KEY MISTAKES
- Move 15: Nxd4 lost a tempo, consider maintaining tension

## LESSON TO FOCUS ON
Practice pawn structure understanding in the Ruy Lopez.

## PRACTICE SUGGESTION
Play 5 games with the Ruy Lopez and focus on maintaining central tension.`;

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/coach", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/coach", () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetIn: 600000,
    });

    process.env.ANTHROPIC_API_KEY = "test-key";

    mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: coachingResponse }],
    });

    vi.mocked(Anthropic).mockImplementation(
      () =>
        ({
          messages: { create: mockCreate },
        }) as unknown as Anthropic
    );
  });

  it("returns coaching feedback on success", async () => {
    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.coaching).toBeDefined();
    expect(data.coaching).toContain("GAME SUMMARY");
  });

  it("returns 400 if PGN is missing", async () => {
    const res = await POST(
      createRequest({ ...validBody, pgn: "" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("PGN");
  });

  it("returns 400 if PGN is not a string", async () => {
    const res = await POST(
      createRequest({ ...validBody, pgn: 123 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 if playerColor is invalid", async () => {
    const res = await POST(
      createRequest({ ...validBody, playerColor: "red" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("playerColor");
  });

  it("returns 400 if playerColor is missing", async () => {
    const { playerColor, ...noColor } = validBody;
    const res = await POST(createRequest(noColor));
    expect(res.status).toBe(400);
  });

  it("returns 400 if analysisSummary is missing", async () => {
    const { analysisSummary, ...noSummary } = validBody;
    const res = await POST(createRequest(noSummary));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("analysisSummary");
  });

  it("returns 503 if API key is not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(createRequest(validBody));
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

    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Too many coaching requests");
    expect(data.retryAfter).toBeDefined();
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 500 if Claude returns non-text response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "image", source: {} }],
    });

    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Unexpected response format");
  });

  it("handles Claude API authentication errors", async () => {
    mockCreate.mockRejectedValueOnce(new Error("authentication failed"));

    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("authentication");
  });

  it("handles Claude API rate limit errors", async () => {
    mockCreate.mockRejectedValueOnce(new Error("rate limit exceeded 429"));

    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("busy");
  });

  it("handles generic errors gracefully", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Something went wrong"));

    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("failed");
  });

  it("includes mistakes and blunders in the prompt", async () => {
    await POST(
      createRequest({
        ...validBody,
        mistakes: ["Bad knight move"],
        blunders: ["Hung the queen"],
      })
    );

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[0].content;
    expect(promptContent).toContain("Bad knight move");
    expect(promptContent).toContain("Hung the queen");
  });

  it("handles missing mistakes and blunders gracefully", async () => {
    const { mistakes, blunders, ...noMistakes } = validBody;
    await POST(createRequest(noMistakes));

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[0].content;
    expect(promptContent).toContain("(none identified)");
  });

  it("includes result reason in the prompt", async () => {
    await POST(createRequest(validBody));

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[0].content;
    expect(promptContent).toContain("win (checkmate)");
  });
});
