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
    <div className="rounded-lg overflow-hidden shadow-2xl">
      <Chessboard
        id="chess-board"
        position={position}
        onPieceDrop={onPieceDrop}
        boardOrientation={boardOrientation}
        boardWidth={boardWidth || 480}
        arePiecesDraggable={arePiecesDraggable}
        customBoardStyle={{
          borderRadius: "8px",
        }}
        customDarkSquareStyle={{ backgroundColor: "#779952" }}
        customLightSquareStyle={{ backgroundColor: "#edeed1" }}
      />
    </div>
  );
}
