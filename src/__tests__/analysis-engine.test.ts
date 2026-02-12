import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { evaluatePosition, analyzeGame } from "@/lib/analysis-engine";
import type { SavedMove } from "@/lib/game-storage";

describe("analysis-engine", () => {
  describe("evaluatePosition", () => {
    it("returns roughly equal for starting position", () => {
      const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const score = evaluatePosition(startFen);
      expect(Math.abs(score)).toBeLessThan(200); // Should be close to 0
    });

    it("returns large positive for white advantage", () => {
      // White has extra queen
      const fen = "rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const score = evaluatePosition(fen);
      expect(score).toBeGreaterThan(500);
    });

    it("returns large negative for black advantage", () => {
      // Black has extra queen
      const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
      const score = evaluatePosition(fen);
      expect(score).toBeLessThan(-500);
    });
  });

  describe("analyzeGame", () => {
    it("analyzes a short game and returns results", async () => {
      // Play a quick 4-move game
      const chess = new Chess();
      const moves: SavedMove[] = [];

      const testMoves = ["e4", "e5", "Nf3", "Nc6"];
      for (const san of testMoves) {
        const fenBefore = chess.fen();
        const move = chess.move(san);
        if (move) {
          moves.push({
            san: move.san,
            from: move.from,
            to: move.to,
            fen: chess.fen(),
            fenBefore,
            piece: move.piece,
            color: move.color,
            flags: move.flags,
            captured: move.captured,
          });
        }
      }

      const result = await analyzeGame(moves, "white");

      expect(result.evaluations).toHaveLength(4);
      expect(result.summary.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.summary.accuracy).toBeLessThanOrEqual(100);
      expect(result.analyzedAt).toBeTruthy();
    }, 30000); // Allow 30s for analysis

    it("only evaluates player moves", async () => {
      const chess = new Chess();
      const moves: SavedMove[] = [];

      const testMoves = ["e4", "e5"];
      for (const san of testMoves) {
        const fenBefore = chess.fen();
        const move = chess.move(san);
        if (move) {
          moves.push({
            san: move.san,
            from: move.from,
            to: move.to,
            fen: chess.fen(),
            fenBefore,
            piece: move.piece,
            color: move.color,
            flags: move.flags,
            captured: move.captured,
          });
        }
      }

      const result = await analyzeGame(moves, "white");

      // Only white's move (e4) should have an evaluation
      expect(result.evaluations[0]).not.toBeNull(); // e4 (white)
      expect(result.evaluations[1]).toBeNull(); // e5 (black) - not evaluated
    }, 15000);

    it("reports progress via callback", async () => {
      const chess = new Chess();
      const moves: SavedMove[] = [];
      const testMoves = ["e4", "e5"];

      for (const san of testMoves) {
        const fenBefore = chess.fen();
        const move = chess.move(san);
        if (move) {
          moves.push({
            san: move.san,
            from: move.from,
            to: move.to,
            fen: chess.fen(),
            fenBefore,
            piece: move.piece,
            color: move.color,
            flags: move.flags,
            captured: move.captured,
          });
        }
      }

      const progressCalls: { current: number; total: number }[] = [];
      await analyzeGame(moves, "white", (current, total) => {
        progressCalls.push({ current, total });
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      // Last call should have current === total
      const last = progressCalls[progressCalls.length - 1];
      expect(last.current).toBe(last.total);
    }, 15000);
  });
});
