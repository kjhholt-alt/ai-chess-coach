import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/games/route";
import { NextRequest } from "next/server";

// Mock the lichess module
vi.mock("@/lib/lichess", () => ({
  fetchUserGames: vi.fn(),
}));

// Mock rate limiter to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({
    allowed: true,
    remaining: 29,
    resetIn: 60000,
  }),
}));

import { fetchUserGames } from "@/lib/lichess";
import { checkRateLimit } from "@/lib/rate-limit";

const mockFetchUserGames = vi.mocked(fetchUserGames);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 29,
      resetIn: 60000,
    });
  });

  it("returns 400 if username is missing", async () => {
    const res = await GET(createRequest("/api/games"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Username is required");
  });

  it("returns 400 if username is empty string", async () => {
    const res = await GET(createRequest("/api/games?username="));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Username is required");
  });

  it("returns 400 for invalid username format (special chars)", async () => {
    const res = await GET(createRequest("/api/games?username=<script>alert(1)</script>"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid Lichess username");
  });

  it("returns 400 for username too long", async () => {
    const longName = "a".repeat(25);
    const res = await GET(createRequest(`/api/games?username=${longName}`));
    expect(res.status).toBe(400);
  });

  it("returns 400 for single character username", async () => {
    const res = await GET(createRequest("/api/games?username=a"));
    expect(res.status).toBe(400);
  });

  it("returns games for valid username", async () => {
    mockFetchUserGames.mockResolvedValueOnce([
      {
        id: "game1",
        white: "testuser",
        black: "opponent",
        result: "white",
        opening: "Sicilian",
        pgn: "1. e4 c5",
        moves: ["e4", "c5"],
        timeControl: "5+3",
        date: "2024-01-01",
        userColor: "white",
      },
    ]);

    const res = await GET(createRequest("/api/games?username=testuser"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.games).toHaveLength(1);
    expect(data.username).toBe("testuser");
    expect(data.count).toBe(1);
  });

  it("returns 404 when user not found on Lichess", async () => {
    mockFetchUserGames.mockRejectedValueOnce(
      new Error("Lichess API error: 404 Not Found")
    );

    const res = await GET(createRequest("/api/games?username=nonexistent"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("not found");
  });

  it("returns 429 when rate limited by Lichess", async () => {
    mockFetchUserGames.mockRejectedValueOnce(
      new Error("Lichess API error: 429 Too Many Requests")
    );

    const res = await GET(createRequest("/api/games?username=testuser"));
    expect(res.status).toBe(429);
  });

  it("returns 429 when rate limited by our app", async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 30000,
    });

    const res = await GET(createRequest("/api/games?username=testuser"));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Too many requests");
  });

  it("returns 500 for unexpected errors", async () => {
    mockFetchUserGames.mockRejectedValueOnce(new Error("Network failure"));

    const res = await GET(createRequest("/api/games?username=testuser"));
    expect(res.status).toBe(500);
  });

  it("allows valid usernames with hyphens and underscores", async () => {
    mockFetchUserGames.mockResolvedValueOnce([]);

    const res = await GET(createRequest("/api/games?username=test-user_123"));
    expect(res.status).toBe(200);
  });
});
