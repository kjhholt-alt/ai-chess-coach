import { describe, it, expect, beforeEach } from "vitest";
import {
  ACHIEVEMENTS,
  getCurrentStreak,
  checkAchievements,
  getAllAchievements,
} from "@/lib/achievements";

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

// Keys must match game-storage.ts exactly
const GAME_HISTORY_KEY = "chess-coach-game-history";
const PUZZLE_STATS_KEY = "chess-coach-puzzle-stats";
const USER_PROFILE_KEY = "chess-coach-user-profile";

function seedGameHistory(games: Array<Record<string, unknown>>) {
  localStorageMock.setItem(GAME_HISTORY_KEY, JSON.stringify(games));
}

function seedPuzzleStats(stats: Record<string, unknown>) {
  localStorageMock.setItem(PUZZLE_STATS_KEY, JSON.stringify(stats));
}

function seedUserProfile(profile: Record<string, unknown>) {
  localStorageMock.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

function makeGame(overrides: Record<string, unknown> = {}) {
  return {
    id: `game_${Date.now()}_${Math.random()}`,
    pgn: "1. e4 e5",
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
      ...overrides,
    },
  };
}

function defaultProfile(overrides: Record<string, unknown> = {}) {
  return {
    weaknessProfile: {},
    trainingStreak: { dates: [] },
    achievements: [],
    ...overrides,
  };
}

function defaultPuzzleStats(overrides: Record<string, unknown> = {}) {
  return {
    totalAttempted: 0,
    totalSolved: 0,
    rating: 1000,
    currentStreak: 0,
    bestStreak: 0,
    themeAccuracy: {},
    ratingHistory: [],
    lastSessionDate: null,
    ...overrides,
  };
}

describe("achievements", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("ACHIEVEMENTS constant", () => {
    it("has 24+ achievements defined", () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(24);
    });

    it("every achievement has required fields", () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
        expect(a.icon).toBeTruthy();
        expect(["games", "analysis", "puzzles", "streak", "milestone"]).toContain(
          a.category
        );
        expect(typeof a.check).toBe("function");
      }
    });

    it("has unique IDs", () => {
      const ids = ACHIEVEMENTS.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("covers all categories", () => {
      const categories = new Set(ACHIEVEMENTS.map((a) => a.category));
      expect(categories.has("games")).toBe(true);
      expect(categories.has("analysis")).toBe(true);
      expect(categories.has("puzzles")).toBe(true);
      expect(categories.has("streak")).toBe(true);
    });
  });

  describe("getCurrentStreak", () => {
    it("returns 0 when no training dates", () => {
      seedUserProfile(defaultProfile());
      expect(getCurrentStreak()).toBe(0);
    });

    it("returns 1 for training today only", () => {
      const today = new Date().toISOString().split("T")[0];
      seedUserProfile(
        defaultProfile({ trainingStreak: { dates: [today] } })
      );
      expect(getCurrentStreak()).toBe(1);
    });

    it("returns 1 for training yesterday only", () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      seedUserProfile(
        defaultProfile({ trainingStreak: { dates: [yesterday] } })
      );
      expect(getCurrentStreak()).toBe(1);
    });

    it("counts consecutive days", () => {
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - i * 86400000);
        dates.push(d.toISOString().split("T")[0]);
      }
      seedUserProfile(
        defaultProfile({ trainingStreak: { dates } })
      );
      expect(getCurrentStreak()).toBe(5);
    });

    it("breaks on gap days", () => {
      const today = new Date();
      const dates = [
        today.toISOString().split("T")[0],
        new Date(today.getTime() - 86400000).toISOString().split("T")[0],
        // Skip a day
        new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0],
      ];
      seedUserProfile(
        defaultProfile({ trainingStreak: { dates } })
      );
      expect(getCurrentStreak()).toBe(2);
    });

    it("returns 0 if last training was 2+ days ago", () => {
      const old = new Date(Date.now() - 3 * 86400000)
        .toISOString()
        .split("T")[0];
      seedUserProfile(
        defaultProfile({ trainingStreak: { dates: [old] } })
      );
      expect(getCurrentStreak()).toBe(0);
    });
  });

  describe("checkAchievements", () => {
    it("returns empty array when no achievements met", () => {
      seedUserProfile(defaultProfile());
      seedGameHistory([]);
      seedPuzzleStats(defaultPuzzleStats());

      const newlyUnlocked = checkAchievements();
      expect(newlyUnlocked).toEqual([]);
    });

    it("unlocks first_game when 1 game played", () => {
      seedUserProfile(defaultProfile());
      seedGameHistory([makeGame()]);
      seedPuzzleStats(defaultPuzzleStats());

      const newlyUnlocked = checkAchievements();
      const ids = newlyUnlocked.map((a) => a.id);
      expect(ids).toContain("first_game");
    });

    it("unlocks first_win when a won game exists", () => {
      seedUserProfile(defaultProfile());
      seedGameHistory([
        makeGame({ playerColor: "white", result: "white", resultReason: "checkmate" }),
      ]);
      seedPuzzleStats(defaultPuzzleStats());

      const newlyUnlocked = checkAchievements();
      const ids = newlyUnlocked.map((a) => a.id);
      expect(ids).toContain("first_win");
      expect(ids).toContain("checkmate_win");
    });

    it("does not unlock already-unlocked achievements", () => {
      seedUserProfile(
        defaultProfile({
          achievements: ["first_game", "first_win", "checkmate_win"],
        })
      );
      seedGameHistory([makeGame()]);
      seedPuzzleStats(defaultPuzzleStats());

      const newlyUnlocked = checkAchievements();
      const ids = newlyUnlocked.map((a) => a.id);
      expect(ids).not.toContain("first_game");
      expect(ids).not.toContain("first_win");
    });

    it("saves newly unlocked achievements to profile", () => {
      seedUserProfile(defaultProfile());
      seedGameHistory([makeGame()]);
      seedPuzzleStats(defaultPuzzleStats());

      checkAchievements();

      // Check profile was updated
      const profile = JSON.parse(
        localStorageMock.getItem(USER_PROFILE_KEY) || "{}"
      );
      expect(profile.achievements).toContain("first_game");
    });

    it("unlocks puzzle achievements when stats qualify", () => {
      seedUserProfile(defaultProfile());
      seedGameHistory([]);
      seedPuzzleStats(
        defaultPuzzleStats({
          totalAttempted: 60,
          totalSolved: 55,
          rating: 1250,
          currentStreak: 6,
          bestStreak: 6,
        })
      );

      const newlyUnlocked = checkAchievements();
      const ids = newlyUnlocked.map((a) => a.id);
      expect(ids).toContain("puzzle_starter"); // 55 >= 10
      expect(ids).toContain("puzzle_addict"); // 55 >= 50
      expect(ids).toContain("puzzle_streak_5"); // bestStreak 6 >= 5
      expect(ids).toContain("puzzle_rating_1200"); // 1250 >= 1200
    });
  });

  describe("getAllAchievements", () => {
    it("returns all achievements with unlocked status", () => {
      seedUserProfile(defaultProfile({ achievements: ["first_game"] }));

      const all = getAllAchievements();
      expect(all.length).toBe(ACHIEVEMENTS.length);

      const firstGame = all.find((a) => a.id === "first_game");
      expect(firstGame?.unlocked).toBe(true);

      const fiveGames = all.find((a) => a.id === "five_games");
      expect(fiveGames?.unlocked).toBe(false);
    });

    it("marks no achievements unlocked for fresh profile", () => {
      seedUserProfile(defaultProfile());

      const all = getAllAchievements();
      expect(all.every((a) => a.unlocked === false)).toBe(true);
    });
  });
});
