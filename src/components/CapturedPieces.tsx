"use client";

import { cn } from "@/lib/utils";

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { p: "\u2659", n: "\u2658", b: "\u2657", r: "\u2656", q: "\u2655" },
  b: { p: "\u265F", n: "\u265E", b: "\u265D", r: "\u265C", q: "\u265B" },
};

const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

interface CapturedPiecesProps {
  capturedByWhite: string[]; // black pieces captured by white
  capturedByBlack: string[]; // white pieces captured by black
  materialAdvantage: number; // positive = white advantage
}

export default function CapturedPieces({
  capturedByWhite,
  capturedByBlack,
  materialAdvantage,
}: CapturedPiecesProps) {
  return (
    <div className="flex flex-col gap-1.5 text-lg">
      {/* White's captures (black pieces) */}
      <div className="flex items-center gap-1 min-h-[28px]">
        <span className="text-xs text-muted-foreground w-5">W:</span>
        <div className="flex flex-wrap gap-0.5">
          {capturedByWhite.map((piece, i) => (
            <span key={`w-${i}`} className="text-lg leading-none opacity-80">
              {PIECE_UNICODE.b[piece] || "?"}
            </span>
          ))}
        </div>
        {materialAdvantage > 0 && (
          <span className="ml-1 text-xs font-bold text-emerald-400">
            +{materialAdvantage}
          </span>
        )}
      </div>

      {/* Black's captures (white pieces) */}
      <div className="flex items-center gap-1 min-h-[28px]">
        <span className="text-xs text-muted-foreground w-5">B:</span>
        <div className="flex flex-wrap gap-0.5">
          {capturedByBlack.map((piece, i) => (
            <span key={`b-${i}`} className="text-lg leading-none opacity-80">
              {PIECE_UNICODE.w[piece] || "?"}
            </span>
          ))}
        </div>
        {materialAdvantage < 0 && (
          <span className="ml-1 text-xs font-bold text-emerald-400">
            +{Math.abs(materialAdvantage)}
          </span>
        )}
      </div>
    </div>
  );
}
