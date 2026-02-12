/**
 * Game Analysis Engine
 *
 * Evaluates each move in a completed chess game using a minimax search,
 * computes centipawn loss per move, classifies move quality, and produces
 * an overall accuracy summary.
 */

import { Chess, Move } from "chess.js";
import type {
  MoveEvaluation,
  MoveClassification,
  GameAnalysis,
  AnalysisSummary,
  SavedMove,
} from "./game-storage";

// ---------------------------------------------------------------------------
// Piece values & positional tables (duplicated from chess-engine.ts so the
// analysis module is self-contained and doesn't depend on runtime exports
// that may change with difficulty settings).
// ---------------------------------------------------------------------------

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

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

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MIDDLE_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

// ---------------------------------------------------------------------------
// Positional table lookup
// ---------------------------------------------------------------------------

function getPieceSquareValue(
  pieceType: string,
  color: "w" | "b",
  row: number,
  col: number
): number {
  const tableIndex = row * 8 + col;
  const mirroredIndex = (7 - row) * 8 + col;
  const idx = color === "w" ? mirroredIndex : tableIndex;

  switch (pieceType) {
    case "p":
      return PAWN_TABLE[idx];
    case "n":
      return KNIGHT_TABLE[idx];
    case "b":
      return BISHOP_TABLE[idx];
    case "r":
      return ROOK_TABLE[idx];
    case "q":
      return QUEEN_TABLE[idx];
    case "k":
      return KING_MIDDLE_TABLE[idx];
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Board evaluation (returns centipawns from white's perspective)
// ---------------------------------------------------------------------------

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

      const material = PIECE_VALUES[piece.type] || 0;
      const positional = getPieceSquareValue(piece.type, piece.color, row, col);

      if (piece.color === "w") {
        score += material + positional;
      } else {
        score -= material + positional;
      }
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Minimax with alpha-beta pruning
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public: evaluate a single position
// ---------------------------------------------------------------------------

const ANALYSIS_DEPTH = 4;

/**
 * Evaluate a position from a FEN string.
 * Returns centipawns from white's perspective.
 * Positive = white is better, negative = black is better.
 */
export function evaluatePosition(fen: string): number {
  const chess = new Chess(fen);

  if (chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  // Run minimax from the current side to move
  const isMaximizing = chess.turn() === "w";
  return minimax(chess, ANALYSIS_DEPTH, -Infinity, Infinity, isMaximizing);
}

// ---------------------------------------------------------------------------
// Find the best move and its evaluation for a given position
// ---------------------------------------------------------------------------

interface BestMoveResult {
  bestMoveSan: string;
  bestEval: number; // centipawns from white's perspective
}

function findBestMoveAndEval(fen: string): BestMoveResult | null {
  const chess = new Chess(fen);
  const moves = chess.moves();
  if (moves.length === 0) return null;

  const isMaximizing = chess.turn() === "w";
  let bestMove = moves[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const evalScore = minimax(
      chess,
      ANALYSIS_DEPTH - 1,
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

  return { bestMoveSan: bestMove, bestEval };
}

// ---------------------------------------------------------------------------
// Move classification
// ---------------------------------------------------------------------------

/**
 * Classify a move based on centipawn loss and whether the move was
 * non-obvious (for "brilliant" detection).
 *
 * @param cpLoss        - How many centipawns were lost vs the best move (>= 0)
 * @param isBestMove    - True if the player played the engine's top choice
 * @param isOnlyLegal   - True if there was only one legal move
 * @param cpGain        - Centipawn swing in the player's favour (for brilliant detection)
 * @param isSacrifice   - True if the move sacrificed material
 */
function classifyMove(
  cpLoss: number,
  isBestMove: boolean,
  isOnlyLegal: boolean,
  cpGain: number,
  isSacrifice: boolean
): MoveClassification {
  // Only one legal move — forced
  if (isOnlyLegal) return "forced";

  // Brilliant: a sacrifice or non-obvious move that gains 50+ cp and is
  // the best (or near-best) move
  if (isSacrifice && cpGain >= 50 && cpLoss <= 10) return "brilliant";

  // Great: best move or within 10cp of the best
  if (cpLoss <= 10) return "great";

  // Good: within 30cp
  if (cpLoss <= 30) return "good";

  // Inaccuracy: 30-80cp loss
  if (cpLoss <= 80) return "inaccuracy";

  // Mistake: 80-200cp loss
  if (cpLoss <= 200) return "mistake";

  // Blunder: 200+ cp loss
  return "blunder";
}

// ---------------------------------------------------------------------------
// Detect material sacrifice
// ---------------------------------------------------------------------------

function isSacrificingMaterial(move: SavedMove): boolean {
  // A move that gives up material (captured piece value < moved piece value
  // on a capture square, or simply moves a piece to a square it can be
  // captured). As a simple heuristic: it's a sacrifice if the piece is
  // captured on the next move or if it moves without taking a higher-value
  // piece.
  if (!move.captured) {
    // Non-capture moves can be sacrifices (e.g., placing a piece where it
    // can be taken). We approximate this as any non-pawn piece move to a
    // potentially attacked square, but for simplicity at depth-4 analysis
    // we only flag captures where value is lost.
    return false;
  }

  const movedValue = PIECE_VALUES[move.piece] || 0;
  const capturedValue = PIECE_VALUES[move.captured] || 0;

  // Sacrificing if you trade down (e.g., queen takes pawn in a position
  // where the queen can be recaptured)
  return movedValue > capturedValue + 100;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Analyse every move in a completed game.
 *
 * @param moves       - Array of SavedMove from the game
 * @param playerColor - Which colour the player was ("white" | "black")
 * @param onProgress  - Optional callback (currentMove, totalMoves) for UI
 * @returns           - Full GameAnalysis object
 */
export async function analyzeGame(
  moves: SavedMove[],
  playerColor: "white" | "black",
  onProgress?: (current: number, total: number) => void
): Promise<GameAnalysis> {
  const evaluations: (MoveEvaluation | null)[] = [];
  const playerColorCode: "w" | "b" = playerColor === "white" ? "w" : "b";

  let totalCpLoss = 0;
  let playerMoveCount = 0;

  // Classification counters
  let brilliant = 0;
  let great = 0;
  let good = 0;
  let inaccuracies = 0;
  let mistakes = 0;
  let blunders = 0;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    // Yield to the UI every 5 moves so the browser stays responsive
    if (i > 0 && i % 5 === 0) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, moves.length);
    }

    // We only deeply evaluate the player's moves. Opponent moves get a
    // null evaluation (we still need the position eval for context).
    if (move.color !== playerColorCode) {
      evaluations.push(null);
      continue;
    }

    playerMoveCount++;

    // --- Evaluate the position BEFORE the player moved ---
    const bestResult = findBestMoveAndEval(move.fenBefore);

    if (!bestResult) {
      // No legal moves (shouldn't happen if the game record is valid)
      evaluations.push(null);
      continue;
    }

    const bestEvalBefore = bestResult.bestEval;
    const bestMoveSan = bestResult.bestMoveSan;

    // --- Evaluate the position AFTER the player's move ---
    const evalAfter = evaluatePosition(move.fen);

    // --- Compute centipawn loss ---
    // From the player's perspective: how much worse is the position after
    // their move compared to what the best move would have achieved?
    //
    // bestEvalBefore is the evaluation assuming the best move is played.
    // evalAfter is the evaluation of the position the player actually
    // reached.
    //
    // For white: higher eval is better  -> cpLoss = bestEvalBefore - evalAfter
    // For black: lower eval is better   -> cpLoss = evalAfter - bestEvalBefore
    let cpLoss: number;
    if (playerColorCode === "w") {
      cpLoss = bestEvalBefore - evalAfter;
    } else {
      cpLoss = evalAfter - bestEvalBefore;
    }

    // Clamp: if the player somehow did better than the engine's best
    // (can happen with horizon effects), treat as 0 loss.
    cpLoss = Math.max(0, cpLoss);

    // Cap infinite evals (checkmate) for classification purposes
    if (!isFinite(cpLoss)) {
      cpLoss = cpLoss > 0 ? 9999 : 0;
    }

    totalCpLoss += cpLoss;

    // --- Check how many legal moves existed ---
    const tempChess = new Chess(move.fenBefore);
    const legalMoves = tempChess.moves();
    const isOnlyLegal = legalMoves.length === 1;
    const isBestMove = move.san === bestMoveSan;

    // --- Compute centipawn gain (for brilliant detection) ---
    // How much better is the position now compared to before the move,
    // from the player's perspective?
    const evalBefore = evaluatePosition(move.fenBefore);
    let cpGain: number;
    if (playerColorCode === "w") {
      cpGain = evalAfter - evalBefore;
    } else {
      cpGain = evalBefore - evalAfter;
    }
    cpGain = Math.max(0, cpGain);

    const sacrifice = isSacrificingMaterial(move);

    // --- Classify ---
    const classification = classifyMove(
      cpLoss,
      isBestMove,
      isOnlyLegal,
      cpGain,
      sacrifice
    );

    // Update counters
    switch (classification) {
      case "brilliant":
        brilliant++;
        break;
      case "great":
        great++;
        break;
      case "good":
        good++;
        break;
      case "inaccuracy":
        inaccuracies++;
        break;
      case "mistake":
        mistakes++;
        break;
      case "blunder":
        blunders++;
        break;
      // "forced" and "book" don't count towards classifications
    }

    evaluations.push({
      centipawns: evalAfter,
      bestMove: bestMoveSan,
      classification,
      cpLoss: Math.round(cpLoss),
    });
  }

  // --- Compute accuracy ---
  // Formula: 100 * (1 - totalCpLoss / (numberOfPlayerMoves * 50))
  // Bounded between 0 and 100.
  const accuracy =
    playerMoveCount > 0
      ? Math.max(
          0,
          Math.min(100, 100 * (1 - totalCpLoss / (playerMoveCount * 50)))
        )
      : 100;

  const summary: AnalysisSummary = {
    accuracy: Math.round(accuracy * 10) / 10, // one decimal place
    brilliant,
    great,
    good,
    inaccuracies,
    mistakes,
    blunders,
  };

  return {
    evaluations,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
