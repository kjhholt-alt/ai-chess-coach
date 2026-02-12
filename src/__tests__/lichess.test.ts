import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseGameData, fetchUserGames } from "@/lib/lichess";

describe("parseGameData", () => {
  const mockRawGame = {
    id: "abc123",
    players: {
      white: { user: { name: "TestUser" } },
      black: { user: { name: "Opponent" } },
    },
    winner: "white",
    clock: { initial: 300, increment: 3 },
    opening: { name: "Sicilian Defense" },
    pgn: "1. e4 c5 2. Nf3",
    moves: "e4 c5 Nf3",
    createdAt: 1700000000000,
  };

  it("parses a game with white winner correctly", () => {
    const game = parseGameData(mockRawGame, "TestUser");
    expect(game.id).toBe("abc123");
    expect(game.white).toBe("TestUser");
    expect(game.black).toBe("Opponent");
    expect(game.result).toBe("white");
    expect(game.userColor).toBe("white");
    expect(game.opening).toBe("Sicilian Defense");
    expect(game.timeControl).toBe("5+3");
    expect(game.moves).toEqual(["e4", "c5", "Nf3"]);
  });

  it("parses a game with black winner", () => {
    const game = parseGameData({ ...mockRawGame, winner: "black" }, "TestUser");
    expect(game.result).toBe("black");
  });

  it("parses a draw", () => {
    const game = parseGameData({ ...mockRawGame, winner: undefined }, "TestUser");
    expect(game.result).toBe("draw");
  });

  it("detects user color case-insensitively", () => {
    const game = parseGameData(mockRawGame, "testuser");
    expect(game.userColor).toBe("white");
  });

  it("defaults to black when username doesnt match white", () => {
    const game = parseGameData(mockRawGame, "SomeoneElse");
    expect(game.userColor).toBe("black");
  });

  it("handles missing players gracefully", () => {
    const game = parseGameData({ id: "x" }, "TestUser");
    expect(game.white).toBe("Anonymous");
    expect(game.black).toBe("Anonymous");
  });

  it("handles missing opening", () => {
    const game = parseGameData({ id: "x" });
    expect(game.opening).toBe("Unknown Opening");
  });

  it("handles missing clock - falls back to speed", () => {
    const game = parseGameData({ id: "x", speed: "blitz" });
    expect(game.timeControl).toBe("blitz");
  });

  it("handles missing clock and speed - falls back to correspondence", () => {
    const game = parseGameData({ id: "x" });
    expect(game.timeControl).toBe("correspondence");
  });

  it("handles missing moves", () => {
    const game = parseGameData({ id: "x" });
    expect(game.moves).toEqual([]);
  });

  it("generates id from timestamp when missing", () => {
    const game = parseGameData({});
    expect(game.id).toBeDefined();
    expect(typeof game.id).toBe("string");
  });

  it("formats date correctly from createdAt timestamp", () => {
    const game = parseGameData(mockRawGame);
    expect(game.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("fetchUserGames", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(fetchUserGames("nonexistent")).rejects.toThrow(
      "Lichess API error: 404 Not Found"
    );
  });

  it("parses ndjson response correctly", async () => {
    const mockGames = [
      JSON.stringify({
        id: "game1",
        players: {
          white: { user: { name: "testuser" } },
          black: { user: { name: "opponent1" } },
        },
        winner: "white",
        moves: "e4 e5",
      }),
      JSON.stringify({
        id: "game2",
        players: {
          white: { user: { name: "opponent2" } },
          black: { user: { name: "testuser" } },
        },
        winner: "black",
        moves: "d4 d5",
      }),
    ].join("\n");

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockGames),
    } as Response);

    const games = await fetchUserGames("testuser", 2);
    expect(games).toHaveLength(2);
    expect(games[0].id).toBe("game1");
    expect(games[1].id).toBe("game2");
  });

  it("handles empty response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(""),
    } as Response);

    const games = await fetchUserGames("testuser");
    expect(games).toHaveLength(0);
  });

  it("skips malformed JSON lines", async () => {
    const mockResponse = [
      JSON.stringify({ id: "good", players: { white: { user: { name: "a" } }, black: { user: { name: "b" } } }, moves: "e4" }),
      "this is not json",
      JSON.stringify({ id: "alsogood", players: { white: { user: { name: "c" } }, black: { user: { name: "d" } } }, moves: "d4" }),
    ].join("\n");

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockResponse),
    } as Response);

    const games = await fetchUserGames("testuser");
    expect(games).toHaveLength(2);
  });

  it("sends correct headers and URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(""),
    } as Response);

    await fetchUserGames("DrNykterstein", 10);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("DrNykterstein"),
      expect.objectContaining({
        headers: { Accept: "application/x-ndjson" },
      })
    );
    expect(fetchSpy.mock.calls[0][0]).toContain("max=10");
    expect(fetchSpy.mock.calls[0][0]).toContain("pgnInJson=true");
    expect(fetchSpy.mock.calls[0][0]).toContain("opening=true");
  });
});
