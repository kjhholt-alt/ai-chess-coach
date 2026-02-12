"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Bot,
  Users,
  BarChart3,
  Clock,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getGameHistory, type SavedGame } from "@/lib/game-storage";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getResultLabel(
  result: "white" | "black" | "draw",
  playerColor: "white" | "black"
): "Win" | "Loss" | "Draw" {
  if (result === "draw") return "Draw";
  return result === playerColor ? "Win" : "Loss";
}

function getResultBadge(
  result: "white" | "black" | "draw",
  playerColor: "white" | "black"
) {
  const label = getResultLabel(result, playerColor);

  if (label === "Win") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-0 text-xs">
        Win
      </Badge>
    );
  }
  if (label === "Loss") {
    return (
      <Badge className="bg-red-500/15 text-red-400 hover:bg-red-500/20 border-0 text-xs">
        Loss
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/20 border-0 text-xs">
      Draw
    </Badge>
  );
}

function getOpponentLabel(game: SavedGame): string {
  if (game.metadata.opponentType === "ai") {
    const difficulty = game.metadata.aiDifficulty
      ? ` (${game.metadata.aiDifficulty})`
      : "";
    return `AI${difficulty}`;
  }
  return "Human";
}

export default function HistoryPage() {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const history = getGameHistory();
    // Ensure sorted by date descending (most recent first)
    const sorted = [...history].sort(
      (a, b) =>
        new Date(b.metadata.date).getTime() -
        new Date(a.metadata.date).getTime()
    );
    setGames(sorted);
    setLoaded(true);
  }, []);

  const wins = games.filter(
    (g) => getResultLabel(g.metadata.result, g.metadata.playerColor) === "Win"
  ).length;
  const losses = games.filter(
    (g) => getResultLabel(g.metadata.result, g.metadata.playerColor) === "Loss"
  ).length;
  const draws = games.filter(
    (g) => getResultLabel(g.metadata.result, g.metadata.playerColor) === "Draw"
  ).length;

  if (!loaded) {
    return null;
  }

  // Empty state
  if (games.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Game History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your completed games will appear here.
          </p>
        </div>

        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Swords className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No games yet</h3>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Play your first game to start building your history.
            </p>
            <Link href="/dashboard/play">
              <Button className="gap-2">
                <Swords className="h-4 w-4" />
                Play a Game
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Game History</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {games.length} {games.length === 1 ? "game" : "games"} played
          </p>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400 font-medium">{wins}W</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-400 font-medium">{losses}L</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-amber-400 font-medium">{draws}D</span>
          </div>
        </div>
      </div>

      {/* Game list */}
      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {games.map((game) => {
          const accuracy = game.analysis?.summary?.accuracy;
          const resultLabel = getResultLabel(
            game.metadata.result,
            game.metadata.playerColor
          );

          return (
            <motion.div
              key={game.id}
              variants={fadeUp}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Result indicator bar */}
                  <div
                    className={cn(
                      "hidden sm:block w-1 self-stretch rounded-full shrink-0",
                      resultLabel === "Win" && "bg-emerald-500",
                      resultLabel === "Loss" && "bg-red-500",
                      resultLabel === "Draw" && "bg-amber-500"
                    )}
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getResultBadge(
                        game.metadata.result,
                        game.metadata.playerColor
                      )}

                      {/* Opponent */}
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        {game.metadata.opponentType === "ai" ? (
                          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span>{getOpponentLabel(game)}</span>
                      </div>

                      {/* Source badge */}
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal px-1.5 py-0"
                      >
                        {game.metadata.source === "lichess"
                          ? "Lichess"
                          : "Local"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {/* Date */}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(game.metadata.date)}
                      </span>

                      {/* Moves */}
                      <span className="flex items-center gap-1">
                        <Swords className="h-3 w-3" />
                        {game.metadata.totalMoves} moves
                      </span>

                      {/* Result reason */}
                      <span className="capitalize">
                        {game.metadata.resultReason}
                      </span>

                      {/* Opening if available */}
                      {game.metadata.opening && (
                        <span className="hidden md:inline truncate max-w-[180px]">
                          {game.metadata.opening}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: accuracy + analyze button */}
                  <div className="flex items-center gap-3 shrink-0">
                    {accuracy != null && (
                      <div className="hidden sm:flex flex-col items-center">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                          <span
                            className={cn(
                              accuracy >= 90
                                ? "text-emerald-400"
                                : accuracy >= 70
                                  ? "text-amber-400"
                                  : "text-red-400"
                            )}
                          >
                            {accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          accuracy
                        </span>
                      </div>
                    )}

                    <Link href={`/dashboard/analysis/${game.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                      >
                        {game.analysis ? (
                          <>
                            <Trophy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Review</span>
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Analyze</span>
                          </>
                        )}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
