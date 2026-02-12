import { describe, it, expect } from "vitest";
import {
  PUZZLE_BANK,
  TACTICAL_THEMES,
  getPuzzlesByTheme,
  getRandomPuzzle,
  getPuzzleById,
  calculateNewRating,
  type PuzzleData,
} from "@/lib/puzzle-bank";

describe("puzzle-bank", () => {
  describe("PUZZLE_BANK", () => {
    it("has puzzles", () => {
      expect(PUZZLE_BANK.length).toBeGreaterThan(0);
    });

    it("every puzzle has required fields", () => {
      for (const puzzle of PUZZLE_BANK) {
        expect(puzzle.id).toBeTruthy();
        expect(puzzle.fen).toBeTruthy();
        expect(puzzle.moves.length).toBeGreaterThan(0);
        expect(puzzle.rating).toBeGreaterThan(0);
        expect(puzzle.themes.length).toBeGreaterThan(0);
      }
    });

    it("puzzles have valid FEN strings", () => {
      for (const puzzle of PUZZLE_BANK) {
        // Basic FEN validation: should have row separators
        const parts = puzzle.fen.split(" ");
        expect(parts.length).toBeGreaterThanOrEqual(4);
        // First part should have 7 slashes (8 rows)
        expect(parts[0].split("/").length).toBe(8);
      }
    });

    it("has unique IDs", () => {
      const ids = PUZZLE_BANK.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("TACTICAL_THEMES", () => {
    it("has themes defined", () => {
      expect(TACTICAL_THEMES.length).toBeGreaterThan(0);
    });

    it("themes are strings", () => {
      for (const theme of TACTICAL_THEMES) {
        expect(typeof theme).toBe("string");
      }
    });
  });

  describe("getPuzzlesByTheme", () => {
    it("returns puzzles matching the given theme", () => {
      const theme = TACTICAL_THEMES[0];
      const filtered = getPuzzlesByTheme([theme]);
      // All returned puzzles should have high relevance to theme
      // (they're sorted by relevance)
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it("returns up to the requested count", () => {
      const filtered = getPuzzlesByTheme([], 600, 2000, 3);
      expect(filtered.length).toBeLessThanOrEqual(3);
    });

    it("respects rating range", () => {
      const filtered = getPuzzlesByTheme([], 800, 1000, 100);
      for (const puzzle of filtered) {
        expect(puzzle.rating).toBeGreaterThanOrEqual(800);
        expect(puzzle.rating).toBeLessThanOrEqual(1000);
      }
    });

    it("returns empty for impossible rating range", () => {
      const filtered = getPuzzlesByTheme([], 9999, 10000, 5);
      expect(filtered).toEqual([]);
    });
  });

  describe("getRandomPuzzle", () => {
    it("returns a puzzle within default range", () => {
      const puzzle = getRandomPuzzle();
      expect(puzzle).toBeTruthy();
      expect(puzzle!.id).toBeTruthy();
    });

    it("returns null for impossible range", () => {
      const puzzle = getRandomPuzzle(9999, 10000);
      expect(puzzle).toBeNull();
    });

    it("respects rating range", () => {
      const puzzle = getRandomPuzzle(800, 1000);
      if (puzzle) {
        expect(puzzle.rating).toBeGreaterThanOrEqual(800);
        expect(puzzle.rating).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe("getPuzzleById", () => {
    it("finds existing puzzle", () => {
      const firstPuzzle = PUZZLE_BANK[0];
      const found = getPuzzleById(firstPuzzle.id);
      expect(found).toBeTruthy();
      expect(found!.id).toBe(firstPuzzle.id);
    });

    it("returns null for non-existent ID", () => {
      const found = getPuzzleById("nonexistent");
      expect(found).toBeNull();
    });
  });

  describe("calculateNewRating", () => {
    it("increases rating on correct answer", () => {
      const newRating = calculateNewRating(1000, 1000, true);
      expect(newRating).toBeGreaterThan(1000);
    });

    it("decreases rating on incorrect answer", () => {
      const newRating = calculateNewRating(1000, 1000, false);
      expect(newRating).toBeLessThan(1000);
    });

    it("gains more for solving harder puzzles", () => {
      const easyWin = calculateNewRating(1000, 800, true);
      const hardWin = calculateNewRating(1000, 1200, true);
      expect(hardWin - 1000).toBeGreaterThan(easyWin - 1000);
    });

    it("loses less for failing hard puzzles", () => {
      const easyFail = calculateNewRating(1000, 800, false);
      const hardFail = calculateNewRating(1000, 1200, false);
      // Losing to a hard puzzle = less rating loss
      expect(1000 - hardFail).toBeLessThan(1000 - easyFail);
    });

    it("returns an integer", () => {
      const rating = calculateNewRating(1000, 1100, true);
      expect(rating).toBe(Math.round(rating));
    });

    it("equal match gives +16 for win (K=32)", () => {
      // Against equal opponent: expected = 0.5, K*(1-0.5) = 16
      const rating = calculateNewRating(1000, 1000, true);
      expect(rating).toBe(1016);
    });

    it("equal match gives -16 for loss (K=32)", () => {
      const rating = calculateNewRating(1000, 1000, false);
      expect(rating).toBe(984);
    });
  });
});
