import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/puzzles/route";
import { NextRequest } from "next/server";

// Mock rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 59,
    resetIn: 60000,
  }),
}));

import { checkRateLimit } from "@/lib/rate-limit";
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const mockDailyPuzzle = {
  game: {
    pgn: "e4 e5 Nf3 Nc6",
  },
  puzzle: {
    id: "daily123",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    solution: ["d7d5", "e4d5"],
    rating: 1200,
    themes: ["opening", "pawnEndgame"],
  },
};

describe("GET /api/puzzles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 59,
      resetIn: 60000,
    });
  });

  it("returns a puzzle on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDailyPuzzle),
    } as Response);

    const res = await GET(createRequest("/api/puzzles"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.puzzle).toBeDefined();
    expect(data.puzzle.id).toBe("daily123");
    expect(data.puzzle.rating).toBe(1200);
    expect(data.puzzle.moves).toEqual(["d7d5", "e4d5"]);
    expect(data.isFallback).toBe(false);
  });

  it("returns fallback puzzle when Lichess API fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const res = await GET(createRequest("/api/puzzles"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.puzzle).toBeDefined();
    expect(data.puzzle.id).toBe("fallback-1");
    expect(data.isFallback).toBe(true);
  });

  it("returns fallback puzzle when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(
      new Error("Network error")
    );

    const res = await GET(createRequest("/api/puzzles"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isFallback).toBe(true);
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 30000,
    });

    const res = await GET(createRequest("/api/puzzles"));
    expect(res.status).toBe(429);
  });

  it("handles missing puzzle data gracefully", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const res = await GET(createRequest("/api/puzzles"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.puzzle).toBeDefined();
    // Should have default values
    expect(data.puzzle.rating).toBe(1500);
    expect(data.puzzle.moves).toEqual([]);
    expect(data.puzzle.themes).toEqual([]);
  });
});
