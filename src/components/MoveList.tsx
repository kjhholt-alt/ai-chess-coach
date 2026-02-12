"use client";

import { ListOrdered } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MoveListProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export default function MoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
}: MoveListProps) {
  const movePairs: { number: number; white: string; black?: string }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ListOrdered className="h-4 w-4" />
          Moves
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[420px] overflow-y-auto">
        <div className="space-y-0.5">
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center text-sm">
              <span className="w-8 font-mono text-xs text-muted-foreground/60">
                {pair.number}.
              </span>
              <button
                onClick={() => onMoveClick((pair.number - 1) * 2)}
                className={cn(
                  "rounded px-2 py-0.5 font-mono text-sm transition-colors",
                  currentMoveIndex === (pair.number - 1) * 2
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {pair.white}
              </button>
              {pair.black && (
                <button
                  onClick={() => onMoveClick((pair.number - 1) * 2 + 1)}
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-sm transition-colors",
                    currentMoveIndex === (pair.number - 1) * 2 + 1
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {pair.black}
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
