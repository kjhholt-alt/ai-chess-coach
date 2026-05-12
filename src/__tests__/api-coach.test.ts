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

// Mock claudex's askStream as an async generator
vi.mock("@/lib/claudex.js", () => ({
  askStream: vi.fn(),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { askStream } from "@/lib/claudex.js";

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockAskStream = vi.mocked(askStream);

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

// Build a function that, when called, returns a fresh async generator yielding
// the response in N text chunks then a final result event. Matches askStream's
// shape so vitest .mockImplementation(...) can swap it in.
function makeStreamImpl(text: string, chunks = 3) {
  return async function* () {
    const size = Math.max(1, Math.ceil(text.length / chunks));
    for (let i = 0; i < chunks; i++) {
      const slice = text.slice(i * size, (i + 1) * size);
      if (slice) {
        yield { type: "text" as const, text: slice, raw: {} };
      }
    }
    yield { type: "result" as const, text, raw: {} };
  };
}

async function readResponseBody(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

describe("POST /api/coach (streaming)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetIn: 600000,
    });
    mockAskStream.mockImplementation(makeStreamImpl(coachingResponse) as never);
  });

  it("streams coaching feedback as text/plain on success", async () => {
    mockAskStream.mockImplementation(makeStreamImpl(coachingResponse) as never);
    const res = await POST(createRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const body = await readResponseBody(res);
    expect(body).toContain("GAME SUMMARY");
    expect(body).toContain("LESSON TO FOCUS ON");
  });

  it("returns 400 if PGN is missing", async () => {
    const res = await POST(createRequest({ ...validBody, pgn: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("PGN");
  });

  it("returns 400 if PGN is not a string", async () => {
    const res = await POST(createRequest({ ...validBody, pgn: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if playerColor is invalid", async () => {
    const res = await POST(createRequest({ ...validBody, playerColor: "red" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("playerColor");
  });

  it("returns 400 if playerColor is missing", async () => {
    const { playerColor: _playerColor, ...noColor } = validBody;
    const res = await POST(createRequest(noColor));
    expect(res.status).toBe(400);
  });

  it("returns 400 if analysisSummary is missing", async () => {
    const { analysisSummary: _analysisSummary, ...noSummary } = validBody;
    const res = await POST(createRequest(noSummary));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("analysisSummary");
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

  it("includes mistakes and blunders in the prompt", async () => {
    await POST(
      createRequest({
        ...validBody,
        mistakes: ["Bad knight move"],
        blunders: ["Hung the queen"],
      })
    );

    const promptArg = mockAskStream.mock.calls[0][0] as string;
    expect(promptArg).toContain("Bad knight move");
    expect(promptArg).toContain("Hung the queen");
  });

  it("handles missing mistakes and blunders gracefully", async () => {
    const { mistakes: _mistakes, blunders: _blunders, ...noMistakes } = validBody;
    await POST(createRequest(noMistakes));

    const promptArg = mockAskStream.mock.calls[0][0] as string;
    expect(promptArg).toContain("(none identified)");
  });

  it("includes result reason in the prompt", async () => {
    await POST(createRequest(validBody));

    const promptArg = mockAskStream.mock.calls[0][0] as string;
    expect(promptArg).toContain("win (checkmate)");
  });
});
