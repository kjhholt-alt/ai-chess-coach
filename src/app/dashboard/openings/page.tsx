"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess, Square } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  Brain,
  BarChart3,
  ArrowRight,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getGameHistory } from "@/lib/game-storage";

const PlayableChessBoard = dynamic(
  () => import("@/components/PlayableChessBoard"),
  { ssr: false }
);

interface ExplorerMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
}

interface ExplorerData {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
  opening?: { eco: string; name: string };
}

export default function OpeningsPage() {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(chess.fen());
  const [moveSequence, setMoveSequence] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Explorer data
  const [explorerData, setExplorerData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI coaching
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  // Personal stats from games
  const personalStats = useMemo(() => {
    const games = getGameHistory();
    const stats: Record<
      string,
      { games: number; wins: number; losses: number; draws: number }
    > = {};

    for (const game of games) {
      if (!game.metadata.opening) continue;
      const opening = game.metadata.opening;
      if (!stats[opening]) {
        stats[opening] = { games: 0, wins: 0, losses: 0, draws: 0 };
      }
      stats[opening].games++;
      if (game.metadata.result === game.metadata.playerColor) {
        stats[opening].wins++;
      } else if (game.metadata.result === "draw") {
        stats[opening].draws++;
      } else {
        stats[opening].losses++;
      }
    }

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        ...data,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
      }))
      .sort((a, b) => b.games - a.games);
  }, []);

  // Fetch explorer data for current position
  const fetchExplorer = useCallback(async (fen: string) => {
    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const res = await fetch(
        `https://explorer.lichess.ovh/lichess?variant=standard&speeds=rapid,classical,blitz&ratings=1600,1800,2000&fen=${encodeURIComponent(fen)}`
      );

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Rate limited. Please wait a moment.");
        }
        throw new Error("Failed to fetch opening data");
      }

      const data: ExplorerData = await res.json();
      setExplorerData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchExplorer(chess.fen());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play a move from the explorer
  const playMove = useCallback(
    (san: string) => {
      try {
        const move = chess.move(san);
        if (move) {
          setPosition(chess.fen());
          setMoveSequence([...moveSequence, san]);
          setLastMove({ from: move.from, to: move.to });
          fetchExplorer(chess.fen());
        }
      } catch {
        // Invalid move
      }
    },
    [chess, moveSequence, fetchExplorer]
  );

  // Go back to a specific point in the sequence
  const goToMove = useCallback(
    (index: number) => {
      chess.reset();
      const newSequence: string[] = [];
      for (let i = 0; i <= index; i++) {
        chess.move(moveSequence[i]);
        newSequence.push(moveSequence[i]);
      }
      setPosition(chess.fen());
      setMoveSequence(newSequence);

      if (index >= 0) {
        const history = chess.history({ verbose: true });
        const last = history[history.length - 1];
        setLastMove(last ? { from: last.from, to: last.to } : null);
      } else {
        setLastMove(null);
      }
      fetchExplorer(chess.fen());
    },
    [chess, moveSequence, fetchExplorer]
  );

  // Reset to start
  const resetBoard = useCallback(() => {
    chess.reset();
    setPosition(chess.fen());
    setMoveSequence([]);
    setLastMove(null);
    setAdvice(null);
    fetchExplorer(chess.fen());
  }, [chess, fetchExplorer]);

  // Get AI advice
  const getOpeningAdvice = useCallback(async () => {
    if (!explorerData || fetchingAdvice) return;
    setFetchingAdvice(true);

    const sequence = moveSequence.join(" ") || "starting position";
    const openingName = explorerData.opening?.name || "Unknown";
    const total = explorerData.white + explorerData.draws + explorerData.black;
    const whiteWin = total > 0 ? ((explorerData.white / total) * 100).toFixed(1) : "0";
    const blackWin = total > 0 ? ((explorerData.black / total) * 100).toFixed(1) : "0";
    const drawPct = total > 0 ? ((explorerData.draws / total) * 100).toFixed(1) : "0";

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgn: sequence,
          playerColor: "white",
          result: "draw",
          resultReason: "opening-advice",
          analysisSummary: {
            accuracy: 0,
            brilliant: 0,
            great: 0,
            good: 0,
            inaccuracies: 0,
            mistakes: 0,
            blunders: 0,
          },
          mistakes: [],
          blunders: [],
          // Add custom context
          openingContext: `This is an opening explorer query, not a game analysis.
            Position after: ${sequence}
            Opening name: ${openingName}
            Database stats: White wins ${whiteWin}%, Draws ${drawPct}%, Black wins ${blackWin}%
            Total games: ${total}
            Top moves from here: ${explorerData.moves
              .slice(0, 5)
              .map((m) => `${m.san} (${m.white + m.draws + m.black} games)`)
              .join(", ")}

            Instead of game analysis, provide:
            1. Name and brief history of this opening
            2. The KEY IDEA for both sides (2-3 sentences)
            3. Common traps to watch for
            4. A simple plan for the next 3-5 moves
            5. Which side benefits more from this position`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdvice(data.coaching);
      } else {
        setAdvice("Unable to get advice right now. Try again later.");
      }
    } catch {
      setAdvice("Failed to get advice. Check your connection.");
    } finally {
      setFetchingAdvice(false);
    }
  }, [explorerData, fetchingAdvice, moveSequence]);

  // Total games for current position
  const totalGames = explorerData
    ? explorerData.white + explorerData.draws + explorerData.black
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Opening Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse openings with statistics from millions of Lichess games
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={resetBoard}
          className={cn(
            "rounded px-2 py-0.5 transition-colors",
            moveSequence.length === 0
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          Start
        </button>
        {moveSequence.map((move, i) => (
          <div key={i} className="flex items-center">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <button
              onClick={() => goToMove(i)}
              className={cn(
                "rounded px-2 py-0.5 font-mono transition-colors",
                i === moveSequence.length - 1
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}{move}
            </button>
          </div>
        ))}
        {moveSequence.length > 0 && (
          <Button variant="ghost" size="sm" onClick={resetBoard} className="ml-2 h-6 text-xs gap-1">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Opening name */}
      {explorerData?.opening && (
        <div className="mb-4">
          <Badge variant="secondary" className="gap-1.5">
            <BookOpen className="h-3 w-3" />
            {explorerData.opening.eco} — {explorerData.opening.name}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        {/* Board */}
        <div>
          <PlayableChessBoard
            chess={chess}
            position={position}
            boardOrientation="white"
            boardWidth={480}
            arePiecesDraggable={false}
            onMove={() => {}}
            lastMove={lastMove}
            isCheck={false}
            promotionSquare={null}
            onPromotionSelect={() => {}}
            onPromotionCancel={() => {}}
            pendingPromotion={null}
          />

          {/* Position stats bar */}
          {totalGames > 0 && (
            <div className="mt-3">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div
                  className="bg-white"
                  style={{
                    width: `${(explorerData!.white / totalGames) * 100}%`,
                  }}
                />
                <div
                  className="bg-zinc-400"
                  style={{
                    width: `${(explorerData!.draws / totalGames) * 100}%`,
                  }}
                />
                <div
                  className="bg-zinc-800"
                  style={{
                    width: `${(explorerData!.black / totalGames) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>
                  White {((explorerData!.white / totalGames) * 100).toFixed(0)}%
                </span>
                <span>
                  Draw {((explorerData!.draws / totalGames) * 100).toFixed(0)}%
                </span>
                <span>
                  Black {((explorerData!.black / totalGames) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                {totalGames.toLocaleString()} games in database
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Move table */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Popular Moves
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : explorerData && explorerData.moves.length > 0 ? (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="flex items-center text-[10px] text-muted-foreground/70 px-2 pb-1">
                    <span className="w-12">Move</span>
                    <span className="w-16 text-right">Games</span>
                    <span className="flex-1 text-right">White / Draw / Black</span>
                  </div>
                  {explorerData.moves.map((move) => {
                    const moveTotal = move.white + move.draws + move.black;
                    const whiteWin = moveTotal > 0 ? (move.white / moveTotal) * 100 : 0;
                    const drawPct = moveTotal > 0 ? (move.draws / moveTotal) * 100 : 0;
                    const blackWin = moveTotal > 0 ? (move.black / moveTotal) * 100 : 0;
                    return (
                      <button
                        key={move.uci}
                        onClick={() => playMove(move.san)}
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent group"
                      >
                        <span className="w-12 font-mono font-semibold text-primary group-hover:text-primary">
                          {move.san}
                        </span>
                        <span className="w-16 text-right text-xs text-muted-foreground">
                          {moveTotal.toLocaleString()}
                        </span>
                        <div className="flex-1 ml-3">
                          <div className="flex h-2 overflow-hidden rounded-full">
                            <div className="bg-white" style={{ width: `${whiteWin}%` }} />
                            <div className="bg-zinc-400" style={{ width: `${drawPct}%` }} />
                            <div className="bg-zinc-700" style={{ width: `${blackWin}%` }} />
                          </div>
                        </div>
                        <ArrowRight className="ml-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data available for this position
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Opening Advice */}
          {!advice && (
            <Button
              onClick={getOpeningAdvice}
              disabled={fetchingAdvice || !explorerData}
              variant="secondary"
              className="w-full gap-2"
            >
              {fetchingAdvice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {fetchingAdvice ? "Getting advice..." : "Get Opening Advice"}
            </Button>
          )}

          {advice && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Opening Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {advice}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Opening Stats */}
          {personalStats.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Your Opening Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {personalStats.slice(0, 8).map(({ name, games, wins, losses, draws, winRate }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium truncate block">
                          {name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {games}g · {wins}W {draws}D {losses}L
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {winRate >= 60 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : winRate <= 40 ? (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        ) : (
                          <Minus className="h-3 w-3 text-amber-400" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-mono",
                            winRate >= 60
                              ? "text-emerald-400"
                              : winRate <= 40
                                ? "text-red-400"
                                : "text-amber-400"
                          )}
                        >
                          {winRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
