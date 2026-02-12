"use client";

import { useState, useMemo, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square, Move } from "chess.js";

interface PlayableChessBoardProps {
  chess: Chess;
  position: string;
  boardOrientation: "white" | "black";
  boardWidth?: number;
  arePiecesDraggable: boolean;
  onMove: (move: Move) => void;
  lastMove: { from: string; to: string } | null;
  isCheck: boolean;
  promotionSquare: string | null;
  onPromotionSelect: (piece: "q" | "r" | "b" | "n") => void;
  onPromotionCancel: () => void;
  pendingPromotion: { from: string; to: string } | null;
}

export default function PlayableChessBoard({
  chess,
  position,
  boardOrientation,
  boardWidth = 480,
  arePiecesDraggable,
  onMove,
  lastMove,
  isCheck,
  promotionSquare,
  onPromotionSelect,
  onPromotionCancel,
  pendingPromotion,
}: PlayableChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);

  // Get legal moves for the selected piece
  const legalMoves = useMemo(() => {
    if (!moveFrom) return [];
    try {
      return chess.moves({ square: moveFrom, verbose: true });
    } catch {
      return [];
    }
  }, [chess, moveFrom]);

  // Build custom square styles
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(255, 255, 0, 0.3)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(255, 255, 0, 0.3)",
      };
    }

    // Highlight selected square
    if (moveFrom) {
      styles[moveFrom] = {
        backgroundColor: "rgba(255, 255, 0, 0.5)",
      };
    }

    // Highlight legal move targets
    for (const move of legalMoves) {
      const isCapture = chess.get(move.to as Square) !== null;
      if (isCapture) {
        styles[move.to] = {
          background:
            "radial-gradient(circle, transparent 55%, rgba(16, 185, 129, 0.4) 55%)",
          borderRadius: "50%",
        };
      } else {
        styles[move.to] = {
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.35) 25%, transparent 25%)",
          borderRadius: "50%",
        };
      }
    }

    // Highlight king in check
    if (isCheck) {
      const kingSquare = findKingSquare(chess);
      if (kingSquare) {
        styles[kingSquare] = {
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderRadius: "50%",
        };
      }
    }

    return styles;
  }, [lastMove, moveFrom, legalMoves, isCheck, chess]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!arePiecesDraggable) return;
      if (pendingPromotion) return; // Don't handle clicks during promotion

      // If we have a selected piece, try to move it
      if (moveFrom) {
        const move = legalMoves.find((m) => m.to === square);
        if (move) {
          // Check if it's a promotion
          if (move.flags.includes("p")) {
            // Will be handled by the promotion dialog
            setMoveFrom(null);
            setSelectedSquare(null);
            onMove(move);
            return;
          }
          try {
            const result = chess.move({
              from: moveFrom,
              to: square,
              promotion: "q",
            });
            if (result) {
              chess.undo(); // Let parent handle the actual move
              onMove(result);
            }
          } catch {
            // Invalid move
          }
          setMoveFrom(null);
          setSelectedSquare(null);
          return;
        }
      }

      // Select a new piece
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setMoveFrom(square);
        setSelectedSquare(square);
      } else {
        setMoveFrom(null);
        setSelectedSquare(null);
      }
    },
    [arePiecesDraggable, moveFrom, legalMoves, chess, onMove, pendingPromotion]
  );

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string): boolean => {
      if (!arePiecesDraggable) return false;

      // Check if this is a pawn promotion
      const isPawnPromotion =
        piece.toLowerCase().endsWith("p") &&
        ((piece.startsWith("w") && targetSquare[1] === "8") ||
          (piece.startsWith("b") && targetSquare[1] === "1"));

      try {
        const move = chess.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion: isPawnPromotion ? "q" : undefined,
        });
        if (move) {
          chess.undo(); // Let parent handle the actual move
          onMove(move);
          setMoveFrom(null);
          setSelectedSquare(null);
          return true;
        }
      } catch {
        // Invalid move
      }

      setMoveFrom(null);
      setSelectedSquare(null);
      return false;
    },
    [arePiecesDraggable, chess, onMove]
  );

  const handlePieceDragBegin = useCallback(
    (_piece: string, sourceSquare: string) => {
      setMoveFrom(sourceSquare as Square);
    },
    []
  );

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-border/50 shadow-2xl shadow-black/20">
        <Chessboard
          id="playable-board"
          position={position}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          onPieceDragBegin={handlePieceDragBegin}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          arePiecesDraggable={arePiecesDraggable}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: "0px",
          }}
          customDarkSquareStyle={{ backgroundColor: "#779952" }}
          customLightSquareStyle={{ backgroundColor: "#edeed1" }}
          customDropSquareStyle={{
            boxShadow: "inset 0 0 1px 6px rgba(16,185,129,0.5)",
          }}
          animationDuration={200}
        />
      </div>

      {/* Promotion Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-xl">
          <div className="rounded-lg border border-border bg-card p-4 shadow-xl">
            <p className="mb-3 text-center text-sm font-medium">
              Promote pawn to:
            </p>
            <div className="flex gap-2">
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => onPromotionSelect(piece)}
                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-2xl transition-colors hover:bg-primary/20 hover:border-primary/50"
                >
                  {getPieceSymbol(
                    piece,
                    chess.turn() === "w" ? "b" : "w" // It's now the opponent's turn after our pawn pushed
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={onPromotionCancel}
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function findKingSquare(chess: Chess): Square | null {
  const turn = chess.turn();
  const board = chess.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "k" && piece.color === turn) {
        const file = String.fromCharCode(97 + col);
        const rank = String(8 - row);
        return `${file}${rank}` as Square;
      }
    }
  }
  return null;
}

function getPieceSymbol(piece: string, color: string): string {
  const symbols: Record<string, Record<string, string>> = {
    w: { q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658" },
    b: { q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E" },
  };
  return symbols[color]?.[piece] || "?";
}
