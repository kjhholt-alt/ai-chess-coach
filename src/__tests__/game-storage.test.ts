import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCompletedGame,
  getGameHistory,
  getGameById,
  updateGame,
  deleteGame,
  generateGameId,
  saveCurrentGame,
  loadCurrentGame,
  clearCurrentGame,
  getPuzzleStats,
  savePuzzleStats,
  getUserProfile,
  saveUserProfile,
  type SavedGame,
  type InProgressGame,
  type PuzzleStats,
} from "@/lib/game-storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

function createTestGame(id?: string): SavedGame {
  return {
    id: id || generateGameId(),
    pgn: "1. e4 e5 2. Nf3 Nc6",
    moves: [
      {
        san: "e4",
        from: "e2",
        to: "e4",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        piece: "p",
        color: "w",
        flags: "b",
      },
    ],
    metadata: {
      date: new Date().toISOString(),
      playerColor: "white",
      opponentType: "ai",
      aiDifficulty: "beginner",
      result: "white",
      resultReason: "checkmate",
      totalMoves: 20,
      source: "local",
    },
  };
}

describe("game-storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("generateGameId", () => {
    it("generates unique IDs", () => {
      const id1 = generateGameId();
      const id2 = generateGameId();
      expect(id1).not.toBe(id2);
    });

    it("starts with 'game_'", () => {
      const id = generateGameId();
      expect(id.startsWith("game_")).toBe(true);
    });
  });

  describe("saveCompletedGame / getGameHistory", () => {
    it("saves and retrieves a game", () => {
      const game = createTestGame("test-1");
      saveCompletedGame(game);
      const history = getGameHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("test-1");
    });

    it("prevents duplicate saves", () => {
      const game = createTestGame("dup-1");
      saveCompletedGame(game);
      saveCompletedGame(game);
      const history = getGameHistory();
      expect(history).toHaveLength(1);
    });

    it("stores most recent first", () => {
      saveCompletedGame(createTestGame("first"));
      saveCompletedGame(createTestGame("second"));
      const history = getGameHistory();
      expect(history[0].id).toBe("second");
    });

    it("returns empty array when no games saved", () => {
      const history = getGameHistory();
      expect(history).toEqual([]);
    });
  });

  describe("getGameById", () => {
    it("finds game by ID", () => {
      const game = createTestGame("find-me");
      saveCompletedGame(game);
      const found = getGameById("find-me");
      expect(found).toBeTruthy();
      expect(found!.id).toBe("find-me");
    });

    it("returns null for non-existent ID", () => {
      const found = getGameById("nope");
      expect(found).toBeNull();
    });
  });

  describe("updateGame", () => {
    it("updates game properties", () => {
      const game = createTestGame("update-me");
      saveCompletedGame(game);
      updateGame("update-me", { coachingFeedback: "Great game!" });
      const updated = getGameById("update-me");
      expect(updated!.coachingFeedback).toBe("Great game!");
    });

    it("does nothing for non-existent game", () => {
      updateGame("nope", { coachingFeedback: "test" });
      // Should not throw
    });
  });

  describe("deleteGame", () => {
    it("removes game from history", () => {
      saveCompletedGame(createTestGame("del-1"));
      saveCompletedGame(createTestGame("del-2"));
      deleteGame("del-1");
      const history = getGameHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("del-2");
    });
  });

  describe("in-progress game", () => {
    it("saves and loads current game", () => {
      const game: InProgressGame = {
        pgn: "1. e4",
        gameMode: "ai",
        difficulty: "beginner",
        playerColor: "white",
        gameStarted: true,
        timestamp: Date.now(),
      };
      saveCurrentGame(game);
      const loaded = loadCurrentGame();
      expect(loaded).toBeTruthy();
      expect(loaded!.pgn).toBe("1. e4");
    });

    it("returns null when no game saved", () => {
      const loaded = loadCurrentGame();
      expect(loaded).toBeNull();
    });

    it("clears current game", () => {
      const game: InProgressGame = {
        pgn: "",
        gameMode: "pvp",
        difficulty: "beginner",
        playerColor: "white",
        gameStarted: false,
        timestamp: Date.now(),
      };
      saveCurrentGame(game);
      clearCurrentGame();
      const loaded = loadCurrentGame();
      expect(loaded).toBeNull();
    });

    it("expires after 24 hours", () => {
      const game: InProgressGame = {
        pgn: "",
        gameMode: "ai",
        difficulty: "beginner",
        playerColor: "white",
        gameStarted: true,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      saveCurrentGame(game);
      const loaded = loadCurrentGame();
      expect(loaded).toBeNull();
    });
  });

  describe("puzzle stats", () => {
    it("returns default stats when none saved", () => {
      const stats = getPuzzleStats();
      expect(stats.totalAttempted).toBe(0);
      expect(stats.rating).toBe(1000);
    });

    it("saves and retrieves puzzle stats", () => {
      const stats: PuzzleStats = {
        totalAttempted: 10,
        totalSolved: 7,
        rating: 1200,
        currentStreak: 3,
        bestStreak: 5,
        themeAccuracy: { fork: { correct: 5, total: 7 } },
        ratingHistory: [{ date: "2026-02-11", rating: 1200 }],
        lastSessionDate: "2026-02-11",
      };
      savePuzzleStats(stats);
      const loaded = getPuzzleStats();
      expect(loaded.totalAttempted).toBe(10);
      expect(loaded.rating).toBe(1200);
    });
  });

  describe("user profile", () => {
    it("returns default profile when none saved", () => {
      const profile = getUserProfile();
      expect(profile.achievements).toEqual([]);
      expect(profile.weaknessProfile).toEqual({});
    });

    it("saves and retrieves profile", () => {
      const profile = getUserProfile();
      profile.lichessUsername = "testuser";
      profile.experienceLevel = "intermediate";
      saveUserProfile(profile);
      const loaded = getUserProfile();
      expect(loaded.lichessUsername).toBe("testuser");
      expect(loaded.experienceLevel).toBe("intermediate");
    });
  });
});
