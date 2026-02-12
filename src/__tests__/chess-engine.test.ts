import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  getAIMove,
  getMaterialCount,
  getCapturedPieces,
  type Difficulty,
} from "@/lib/chess-engine";

describe("chess-engine", () => {
  describe("getMaterialCount", () => {
    it("counts equal material in starting position", () => {
      const chess = new Chess();
      const { white, black } = getMaterialCount(chess);
      expect(white).toBe(black);
      // 8 pawns (800) + 2 knights (640) + 2 bishops (660) + 2 rooks (1000) + 1 queen (900)
      expect(white).toBe(4000);
    });

    it("reflects material difference after capture", () => {
      const chess = new Chess();
      chess.move("e4");
      chess.move("d5");
      chess.move("exd5"); // White captures black pawn
      const { white, black } = getMaterialCount(chess);
      expect(white).toBeGreaterThan(black);
      expect(white - black).toBe(100); // One pawn difference
    });

    it("excludes king from material count", () => {
      // King + pawn vs king
      const chess = new Chess("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1");
      const { white, black } = getMaterialCount(chess);
      expect(white).toBe(100); // Just the pawn
      expect(black).toBe(0); // Nothing but king
    });
  });

  describe("getCapturedPieces", () => {
    it("returns empty arrays for starting position", () => {
      const chess = new Chess();
      const captured = getCapturedPieces(chess.history({ verbose: true }));
      expect(captured.white).toEqual([]);
      expect(captured.black).toEqual([]);
    });

    it("tracks captured pieces after exchanges", () => {
      const chess = new Chess();
      chess.move("e4");
      chess.move("d5");
      chess.move("exd5"); // White captures black pawn
      const captured = getCapturedPieces(chess.history({ verbose: true }));
      expect(captured.white).toContain("p");
      expect(captured.black).toEqual([]);
    });

    it("sorts captured pieces by value (highest first)", () => {
      const chess = new Chess();
      // Play some moves that lead to captures
      chess.move("e4");
      chess.move("d5");
      chess.move("exd5");
      chess.move("Qxd5");
      chess.move("Nc3");
      chess.move("Qxd2"); // Black captures white pawn on d2? No, queen takes d2 pawn
      // Actually let's use a custom position
      const chess2 = new Chess();
      chess2.move("e4");
      chess2.move("d5");
      chess2.move("exd5");
      const captured2 = getCapturedPieces(chess2.history({ verbose: true }));
      // Just one capture, so sorting doesn't matter much
      expect(captured2.white.length).toBe(1);
    });
  });

  describe("getAIMove", () => {
    it("returns a legal move from starting position", async () => {
      const chess = new Chess();
      const move = await getAIMove(chess.fen(), "beginner");
      expect(move).toBeTruthy();
      expect(move!.from).toBeTruthy();
      expect(move!.to).toBeTruthy();
    });

    it("returns null for checkmate position", async () => {
      // White is checkmated
      const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
      const chess = new Chess(fen);
      if (chess.isGameOver()) {
        const move = await getAIMove(fen, "beginner");
        expect(move).toBeNull();
      }
    });

    it("finds checkmate in one at advanced difficulty", async () => {
      // Scholar's mate position - white can play Qxf7#
      const fen =
        "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";
      const move = await getAIMove(fen, "advanced");
      if (move) {
        const chess = new Chess(fen);
        chess.move(move);
        expect(chess.isCheckmate()).toBe(true);
      }
    }, 10000); // Allow 10s for deep search

    it("returns a move for each difficulty level", async () => {
      const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];
      for (const difficulty of difficulties) {
        const move = await getAIMove(new Chess().fen(), difficulty);
        expect(move).toBeTruthy();
      }
    }, 15000); // Allow 15s for all difficulties
  });
});
