"use client";

import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  position?: string;
  onPieceDrop?: (source: string, target: string) => boolean;
  boardOrientation?: "white" | "black";
  boardWidth?: number;
  arePiecesDraggable?: boolean;
}

export default function ChessBoard({
  position = "start",
  onPieceDrop,
  boardOrientation = "white",
  boardWidth,
  arePiecesDraggable = false,
}: ChessBoardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 shadow-2xl shadow-black/20">
      <Chessboard
        id="chess-board"
        position={position}
        onPieceDrop={onPieceDrop}
        boardOrientation={boardOrientation}
        boardWidth={boardWidth || 480}
        arePiecesDraggable={arePiecesDraggable}
        customBoardStyle={{
          borderRadius: "0px",
        }}
        customDarkSquareStyle={{ backgroundColor: "#779952" }}
        customLightSquareStyle={{ backgroundColor: "#edeed1" }}
        customDropSquareStyle={{ boxShadow: "inset 0 0 1px 6px rgba(16,185,129,0.5)" }}
      />
    </div>
  );
}
