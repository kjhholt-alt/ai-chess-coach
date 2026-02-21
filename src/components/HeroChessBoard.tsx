"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion, AnimatePresence } from "framer-motion";

// The Immortal Game — Anderssen vs Kieseritzky, London 1851
const IMMORTAL_MOVES = [
  "e4", "e5", "f4", "exf4", "Bc4", "Qh4+", "Kf1", "b5",
  "Bxb5", "Nf6", "Nf3", "Qh6", "d3", "Nh5", "Nh4", "Qg5",
  "Nf5", "c6", "g4", "Nf6", "Rg1", "cxb5", "h4", "Qg6",
  "h5", "Qg5", "Qf3", "Ng8", "Bxf4", "Qf6", "Nc3", "Bc5",
  "Nd5", "Qxb2", "Bd6", "Bxg1", "e5", "Qxa1+", "Ke2", "Na6",
  "Nxg7+", "Kd8", "Qf6+", "Nxf6", "Be7#",
];

const ANNOTATIONS: Record<number, string> = {
  5:  "Queen checks the King — chaos begins",
  8:  "Anderssen sacrifices his bishop for initiative",
  20: "The rook sacrifice — pure brilliance",
  33: "Another piece offered — the king is trapped",
  35: "The queen sacrifice heard round the world",
  44: "Be7# — a legendary checkmate",
};

export function HeroChessBoard() {
  const [fen, setFen] = useState(new Chess().fen());
  const [moveIndex, setMoveIndex] = useState(0);
  const [annotation, setAnnotation] = useState<string | null>(null);
  const [annotationKey, setAnnotationKey] = useState(0);
  const gameRef = useRef(new Chess());

  useEffect(() => {
    const interval = setInterval(() => {
      setMoveIndex((prev) => {
        const next = prev + 1;

        // Reset after a pause at the end
        if (prev >= IMMORTAL_MOVES.length) {
          gameRef.current = new Chess();
          setFen(gameRef.current.fen());
          setAnnotation(null);
          return 0;
        }

        try {
          gameRef.current.move(IMMORTAL_MOVES[prev]);
          setFen(gameRef.current.fen());
        } catch {
          // skip invalid move in sequence
        }

        if (ANNOTATIONS[prev]) {
          setAnnotation(ANNOTATIONS[prev]);
          setAnnotationKey((k) => k + 1);
        }

        return next;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  const moveNum = Math.floor(moveIndex / 2) + 1;
  const isWhite = moveIndex % 2 === 0;

  return (
    <div className="relative select-none">
      {/* Ambient glow behind board */}
      <div className="absolute -inset-6 rounded-2xl bg-amber-500/10 blur-2xl" />

      {/* Board wrapper */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-amber-500/20">
        <Chessboard
          position={fen}
          arePiecesDraggable={false}
          boardWidth={420}
          customDarkSquareStyle={{ backgroundColor: "#1a120b" }}
          customLightSquareStyle={{ backgroundColor: "#3d2b1f" }}
          customBoardStyle={{
            borderRadius: "0.75rem",
          }}
        />
      </div>

      {/* Move counter badge */}
      <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-black shadow-lg shadow-amber-500/30">
        <span>Move {moveIndex > 0 ? moveIndex : "—"}</span>
        {moveIndex > 0 && (
          <span className="opacity-60">· {isWhite ? "White" : "Black"}</span>
        )}
      </div>

      {/* Annotation overlay */}
      <AnimatePresence mode="wait">
        {annotation && (
          <motion.div
            key={annotationKey}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="absolute -bottom-14 left-0 right-0 mx-auto w-fit max-w-xs rounded-xl border border-amber-500/30 bg-black/80 px-4 py-2.5 text-center backdrop-blur-md"
          >
            <p className="text-xs font-medium text-amber-400">✦ {annotation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game label */}
      <p className="mt-16 text-center text-xs text-zinc-600">
        Anderssen vs Kieseritzky · London 1851 · &quot;The Immortal Game&quot;
      </p>
    </div>
  );
}
