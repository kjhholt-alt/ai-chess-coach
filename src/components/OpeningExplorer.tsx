"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpeningMove {
  uci: string;
  san: string;
  averageRating: number;
  white: number;
  draws: number;
  black: number;
  game: null;
}

interface OpeningData {
  white: number;
  draws: number;
  black: number;
  moves: OpeningMove[];
  topGames: any[];
  opening: {
    eco: string;
    name: string;
  } | null;
}

interface OpeningExplorerProps {
  chess: Chess;
  onMoveClick: (san: string) => void;
  disabled?: boolean;
}

export default function OpeningExplorer({
  chess,
  onMoveClick,
  disabled = false,
}: OpeningExplorerProps) {
  const [data, setData] = useState<OpeningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpeningData = async () => {
      setLoading(true);
      setError(null);

      try {
        const fen = chess.fen();
        const response = await fetch(
          `https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000,2200,2500&fen=${encodeURIComponent(
            fen
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch opening data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("[OpeningExplorer] Error:", err);
        setError("Failed to load opening data");
      } finally {
        setLoading(false);
      }
    };

    fetchOpeningData();
  }, [chess]);

  const getTotalGames = (move: OpeningMove) => {
    return move.white + move.draws + move.black;
  };

  const getWinPercentage = (move: OpeningMove) => {
    const total = getTotalGames(move);
    if (total === 0) return 0;
    return Math.round((move.white / total) * 100);
  };

  const getDrawPercentage = (move: OpeningMove) => {
    const total = getTotalGames(move);
    if (total === 0) return 0;
    return Math.round((move.draws / total) * 100);
  };

  const getBlackPercentage = (move: OpeningMove) => {
    const total = getTotalGames(move);
    if (total === 0) return 0;
    return Math.round((move.black / total) * 100);
  };

  const getPopularityPercentage = (move: OpeningMove) => {
    if (!data) return 0;
    const totalAllMoves = data.moves.reduce(
      (sum, m) => sum + getTotalGames(m),
      0
    );
    if (totalAllMoves === 0) return 0;
    return Math.round((getTotalGames(move) / totalAllMoves) * 100);
  };

  const handleMoveClick = (san: string) => {
    if (disabled) return;
    onMoveClick(san);
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Opening Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Opening Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-destructive py-4 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.moves.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Opening Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground py-4 text-center">
            No opening data available for this position
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort moves by popularity
  const sortedMoves = [...data.moves].sort(
    (a, b) => getTotalGames(b) - getTotalGames(a)
  );

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          Opening Explorer
        </CardTitle>
        {data.opening && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {data.opening.eco}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.opening.name}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedMoves.slice(0, 10).map((move, index) => {
            const total = getTotalGames(move);
            const whiteWin = getWinPercentage(move);
            const draw = getDrawPercentage(move);
            const blackWin = getBlackPercentage(move);
            const popularity = getPopularityPercentage(move);

            return (
              <button
                key={move.uci}
                onClick={() => handleMoveClick(move.san)}
                disabled={disabled}
                className={cn(
                  "w-full rounded-lg border border-border/30 bg-secondary/20 p-3 text-left transition-all hover:border-border hover:bg-secondary/40",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {move.san}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {popularity}%
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  {/* Win rate bars */}
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-green-500"
                      style={{ width: `${whiteWin}%` }}
                    />
                    <div
                      className="bg-zinc-500"
                      style={{ width: `${draw}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${blackWin}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">W: {whiteWin}%</span>
                      <span className="text-zinc-400">D: {draw}%</span>
                      <span className="text-blue-400">B: {blackWin}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      <span>{total.toLocaleString()} games</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {sortedMoves.length > 10 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Showing top 10 moves out of {sortedMoves.length} total
          </p>
        )}
      </CardContent>
    </Card>
  );
}
