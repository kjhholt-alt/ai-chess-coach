"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Handshake, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameOverModalProps {
  isOpen: boolean;
  result: "checkmate" | "stalemate" | "draw-insufficient" | "draw-repetition" | "draw-50move" | "resigned" | null;
  winner: "white" | "black" | null;
  onNewGame: () => void;
  onClose: () => void;
}

export default function GameOverModal({
  isOpen,
  result,
  winner,
  onNewGame,
  onClose,
}: GameOverModalProps) {
  if (!isOpen || !result) return null;

  const getTitle = () => {
    switch (result) {
      case "checkmate":
        return `Checkmate! ${winner === "white" ? "White" : "Black"} wins!`;
      case "stalemate":
        return "Stalemate — Draw!";
      case "draw-insufficient":
        return "Draw — Insufficient Material";
      case "draw-repetition":
        return "Draw — Threefold Repetition";
      case "draw-50move":
        return "Draw — 50-Move Rule";
      case "resigned":
        return `${winner === "white" ? "Black" : "White"} Resigned. ${winner === "white" ? "White" : "Black"} wins!`;
      default:
        return "Game Over";
    }
  };

  const isDraw = result.startsWith("draw") || result === "stalemate";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-xl border border-border/50 bg-card p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isDraw ? (
              <Handshake className="h-7 w-7 text-primary" />
            ) : (
              <Trophy className="h-7 w-7 text-primary" />
            )}
          </div>

          <h2 className="text-xl font-bold">{getTitle()}</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {isDraw
              ? "The game ended in a draw."
              : `Great game! ${winner === "white" ? "White" : "Black"} played well.`}
          </p>

          <div className="mt-6 flex gap-3">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Review
            </Button>
            <Button onClick={onNewGame} className="flex-1 gap-2">
              <RefreshCw className="h-4 w-4" />
              New Game
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
