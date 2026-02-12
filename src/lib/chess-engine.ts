import { Chess, Move } from "chess.js";

export type Difficulty = "beginner" | "intermediate" | "advanced";

interface EngineConfig {
  depth: number;
  minThinkTime: number; // ms - minimum time before returning move
}

const DIFFICULTY_CONFIG: Record<Difficulty, EngineConfig> = {
  beginner: { depth: 2, minThinkTime: 500 },
  intermediate: { depth: 8, minThinkTime: 800 },
  advanced: { depth: 15, minThinkTime: 1000 },
};

// Simple evaluation-based AI that works without external WASM
// Uses material counting + positional bonuses for decent play
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables for positional evaluation
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? -Infinity : Infinity;
  }
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let score = 0;
  const board = chess.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] || 0;
      const tableIndex = row * 8 + col;
      const mirroredIndex = (7 - row) * 8 + col;

      let positional = 0;
      if (piece.type === "p") {
        positional = piece.color === "w" ? PAWN_TABLE[mirroredIndex] : PAWN_TABLE[tableIndex];
      } else if (piece.type === "n") {
        positional = piece.color === "w" ? KNIGHT_TABLE[mirroredIndex] : KNIGHT_TABLE[tableIndex];
      }

      if (piece.color === "w") {
        score += value + positional;
      } else {
        score -= value + positional;
      }
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function findBestMove(chess: Chess, difficulty: Difficulty): string | null {
  const config = DIFFICULTY_CONFIG[difficulty];
  const moves = chess.moves();
  if (moves.length === 0) return null;

  // For beginner, add randomness
  if (difficulty === "beginner") {
    // 40% chance of random move at beginner level
    if (Math.random() < 0.4) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
  }

  const isMaximizing = chess.turn() === "w";
  let bestMove = moves[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const evalScore = minimax(
      chess,
      config.depth - 1,
      -Infinity,
      Infinity,
      !isMaximizing
    );
    chess.undo();

    if (isMaximizing) {
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
    } else {
      if (evalScore < bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

export async function getAIMove(
  fen: string,
  difficulty: Difficulty
): Promise<Move | null> {
  const config = DIFFICULTY_CONFIG[difficulty];
  const startTime = Date.now();

  const chess = new Chess(fen);
  const bestMoveSan = findBestMove(chess, difficulty);
  if (!bestMoveSan) return null;

  // Ensure minimum think time for natural feel
  const elapsed = Date.now() - startTime;
  if (elapsed < config.minThinkTime) {
    await new Promise((resolve) =>
      setTimeout(resolve, config.minThinkTime - elapsed)
    );
  }

  const move = chess.move(bestMoveSan);
  return move;
}

export function getMaterialCount(chess: Chess): { white: number; black: number } {
  const board = chess.board();
  let white = 0;
  let black = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === "k") continue;
      const value = PIECE_VALUES[piece.type] || 0;
      if (piece.color === "w") white += value;
      else black += value;
    }
  }

  return { white, black };
}

export function getCapturedPieces(history: Move[]): {
  white: string[]; // pieces captured BY white (black pieces)
  black: string[]; // pieces captured BY black (white pieces)
} {
  const white: string[] = [];
  const black: string[] = [];

  for (const move of history) {
    if (move.captured) {
      if (move.color === "w") {
        white.push(move.captured);
      } else {
        black.push(move.captured);
      }
    }
  }

  // Sort by value (highest first)
  const sortByValue = (a: string, b: string) =>
    (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0);
  white.sort(sortByValue);
  black.sort(sortByValue);

  return { white, black };
}
