import { describe, it, expect, beforeEach } from "vitest";
import {
  getRepertoire,
  saveRepertoire,
  addRepertoireLine,
  updateRepertoireLine,
  deleteRepertoireLine,
  generateRepertoireId,
  findMoveByFen,
  getQuizPositions,
  type RepertoireLine,
  type RepertoireMove,
} from "@/lib/repertoire-storage";

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

function createTestLine(overrides: Partial<RepertoireLine> = {}): RepertoireLine {
  return {
    id: generateRepertoireId(),
    name: "Italian Game",
    color: "white",
    moves: {
      san: "root",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      children: [
        {
          san: "e4",
          fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
          children: [
            {
              san: "e5",
              fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
              children: [
                {
                  san: "Nf3",
                  fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    createdAt: new Date().toISOString(),
    quizStats: { attempts: 0, correct: 0, lastQuizzed: null },
    ...overrides,
  };
}

describe("repertoire-storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getRepertoire", () => {
    it("returns empty array when nothing saved", () => {
      expect(getRepertoire()).toEqual([]);
    });

    it("returns saved repertoire lines", () => {
      const line = createTestLine();
      localStorageMock.setItem(
        "chess-coach-repertoire",
        JSON.stringify([line])
      );
      const result = getRepertoire();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Italian Game");
    });

    it("returns empty array for invalid JSON", () => {
      localStorageMock.setItem("chess-coach-repertoire", "invalid-json{{{");
      expect(getRepertoire()).toEqual([]);
    });
  });

  describe("saveRepertoire", () => {
    it("saves lines to localStorage", () => {
      const line = createTestLine();
      saveRepertoire([line]);
      const stored = JSON.parse(
        localStorageMock.getItem("chess-coach-repertoire") || "[]"
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Italian Game");
    });

    it("overwrites existing data", () => {
      saveRepertoire([createTestLine({ name: "First" })]);
      saveRepertoire([createTestLine({ name: "Second" })]);
      const stored = JSON.parse(
        localStorageMock.getItem("chess-coach-repertoire") || "[]"
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Second");
    });
  });

  describe("addRepertoireLine", () => {
    it("adds a line to empty repertoire", () => {
      const line = createTestLine();
      addRepertoireLine(line);
      const result = getRepertoire();
      expect(result).toHaveLength(1);
    });

    it("appends to existing repertoire", () => {
      addRepertoireLine(createTestLine({ name: "Line 1" }));
      addRepertoireLine(createTestLine({ name: "Line 2" }));
      const result = getRepertoire();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Line 1");
      expect(result[1].name).toBe("Line 2");
    });
  });

  describe("updateRepertoireLine", () => {
    it("updates existing line", () => {
      const line = createTestLine({ name: "Old Name" });
      addRepertoireLine(line);
      updateRepertoireLine(line.id, { name: "New Name" });
      const result = getRepertoire();
      expect(result[0].name).toBe("New Name");
    });

    it("does nothing for non-existent ID", () => {
      addRepertoireLine(createTestLine({ name: "Keep Me" }));
      updateRepertoireLine("nonexistent", { name: "Changed" });
      const result = getRepertoire();
      expect(result[0].name).toBe("Keep Me");
    });

    it("updates quiz stats", () => {
      const line = createTestLine();
      addRepertoireLine(line);
      updateRepertoireLine(line.id, {
        quizStats: { attempts: 10, correct: 8, lastQuizzed: "2026-02-12" },
      });
      const result = getRepertoire();
      expect(result[0].quizStats.attempts).toBe(10);
      expect(result[0].quizStats.correct).toBe(8);
    });
  });

  describe("deleteRepertoireLine", () => {
    it("removes line by ID", () => {
      const line1 = createTestLine({ name: "Line 1" });
      const line2 = createTestLine({ name: "Line 2" });
      addRepertoireLine(line1);
      addRepertoireLine(line2);
      deleteRepertoireLine(line1.id);
      const result = getRepertoire();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Line 2");
    });

    it("does nothing when ID not found", () => {
      addRepertoireLine(createTestLine());
      deleteRepertoireLine("nonexistent");
      expect(getRepertoire()).toHaveLength(1);
    });
  });

  describe("generateRepertoireId", () => {
    it("generates unique IDs", () => {
      const id1 = generateRepertoireId();
      const id2 = generateRepertoireId();
      expect(id1).not.toBe(id2);
    });

    it("starts with rep_", () => {
      const id = generateRepertoireId();
      expect(id.startsWith("rep_")).toBe(true);
    });
  });

  describe("findMoveByFen", () => {
    it("finds root node by FEN", () => {
      const root: RepertoireMove = {
        san: "root",
        fen: "startpos",
        children: [],
      };
      const found = findMoveByFen(root, "startpos");
      expect(found).toBeTruthy();
      expect(found!.san).toBe("root");
    });

    it("finds deeply nested node", () => {
      const line = createTestLine();
      const targetFen =
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
      const found = findMoveByFen(line.moves, targetFen);
      expect(found).toBeTruthy();
      expect(found!.san).toBe("Nf3");
    });

    it("returns null for non-existent FEN", () => {
      const line = createTestLine();
      const found = findMoveByFen(line.moves, "nonexistent-fen");
      expect(found).toBeNull();
    });

    it("finds first-level child", () => {
      const line = createTestLine();
      const e4Fen =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
      const found = findMoveByFen(line.moves, e4Fen);
      expect(found).toBeTruthy();
      expect(found!.san).toBe("e4");
    });
  });

  describe("getQuizPositions", () => {
    it("returns user's moves for white repertoire", () => {
      // For white: user plays at depth 0, 2, 4...  (e4, Nf3)
      const line = createTestLine({ color: "white" });
      const positions = getQuizPositions(line);

      // e4 at depth 0 (white's move) and Nf3 at depth 2 (white's move)
      expect(positions.length).toBe(2);
      expect(positions[0].expectedSan).toBe("e4");
      expect(positions[1].expectedSan).toBe("Nf3");
    });

    it("returns user's moves for black repertoire", () => {
      // For black: user plays at depth 1, 3, 5... (e5)
      const line = createTestLine({ color: "black" });
      const positions = getQuizPositions(line);

      // e5 at depth 1 (black's move)
      expect(positions.length).toBe(1);
      expect(positions[0].expectedSan).toBe("e5");
    });

    it("returns empty for empty repertoire", () => {
      const emptyLine: RepertoireLine = {
        id: "test",
        name: "Empty",
        color: "white",
        moves: {
          san: "root",
          fen: "startpos",
          children: [],
        },
        createdAt: new Date().toISOString(),
        quizStats: { attempts: 0, correct: 0, lastQuizzed: null },
      };
      expect(getQuizPositions(emptyLine)).toEqual([]);
    });

    it("includes correct fenBefore for each position", () => {
      const line = createTestLine({ color: "white" });
      const positions = getQuizPositions(line);

      // e4's fenBefore should be the starting position (root FEN)
      expect(positions[0].fenBefore).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
    });
  });
});
