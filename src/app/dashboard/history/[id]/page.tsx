"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import {
  ArrowLeft,
  Brain,
  Loader2,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Zap,
  Star,
  ThumbsUp,
  CircleAlert,
  CircleX,
  Bomb,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getGameById,
  updateGame,
  type SavedGame,
  type MoveEvaluation,
  type MoveClassification,
  type GameAnalysis,
} from "@/lib/game-storage";
import { analyzeGame } from "@/lib/analysis-engine";

const PlayableChessBoard = dynamic(
  () => import("@/components/PlayableChessBoard"),
  { ssr: false }
);

const CLASSIFICATION_ICONS: Record<
  MoveClassification,
  { icon: typeof Check; color: string; label: string }
> = {
  brilliant: { icon: Zap, color: "text-cyan-400", label: "!!" },
  great: { icon: Star, color: "text-blue-400", label: "!" },
  good: { icon: ThumbsUp, color: "text-emerald-400", label: "" },
  inaccuracy: { icon: CircleAlert, color: "text-yellow-400", label: "?!" },
  mistake: { icon: CircleX, color: "text-orange-400", label: "?" },
  blunder: { icon: Bomb, color: "text-red-400", label: "??" },
  book: { icon: Check, color: "text-muted-foreground", label: "" },
  forced: { icon: Check, color: "text-muted-foreground", label: "" },
};

export default function GameAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<SavedGame | null>(null);
  const [loading, setLoading] = useState(true);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);

  // Coaching state
  const [fetchingCoaching, setFetchingCoaching] = useState(false);
  const [coaching, setCoaching] = useState<string | null>(null);
  const [coachingError, setCoachingError] = useState<string | null>(null);

  // Board state for replay
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [viewingIndex, setViewingIndex] = useState(-1);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Load game
  useEffect(() => {
    const g = getGameById(gameId);
    if (g) {
      setGame(g);
      if (g.analysis) {
        setAnalysis(g.analysis);
      }
      if (g.coachingFeedback) {
        setCoaching(g.coachingFeedback);
      }
    }
    setLoading(false);
  }, [gameId]);

  // Navigate to a specific move
  const goToMove = useCallback(
    (index: number) => {
      if (!game) return;
      const tempChess = new Chess();
      for (let i = 0; i <= index; i++) {
        if (game.moves[i]) {
          tempChess.move(game.moves[i].san);
        }
      }
      setPosition(tempChess.fen());
      setViewingIndex(index);
      if (index >= 0 && game.moves[index]) {
        setLastMove({ from: game.moves[index].from, to: game.moves[index].to });
      } else {
        setLastMove(null);
      }
    },
    [game]
  );

  const goToStart = useCallback(() => goToMove(-1), [goToMove]);
  const goToEnd = useCallback(
    () => game && goToMove(game.moves.length - 1),
    [game, goToMove]
  );
  const goBack = useCallback(
    () => viewingIndex >= 0 && goToMove(viewingIndex - 1),
    [viewingIndex, goToMove]
  );
  const goForward = useCallback(
    () => game && viewingIndex < game.moves.length - 1 && goToMove(viewingIndex + 1),
    [game, viewingIndex, goToMove]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goBack();
      else if (e.key === "ArrowRight") goForward();
      else if (e.key === "Home") goToStart();
      else if (e.key === "End") goToEnd();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goForward, goToStart, goToEnd]);

  // Run analysis
  const handleAnalyze = useCallback(async () => {
    if (!game || analyzing) return;
    setAnalyzing(true);
    setAnalysisProgress({ current: 0, total: game.moves.length });

    try {
      const result = await analyzeGame(
        game.moves,
        game.metadata.playerColor,
        (current, total) => setAnalysisProgress({ current, total })
      );
      setAnalysis(result);
      // Save to storage
      updateGame(game.id, { analysis: result });
      setGame({ ...game, analysis: result });
    } catch (err) {
      console.error("[analysis] Failed:", err);
    } finally {
      setAnalyzing(false);
    }
  }, [game, analyzing]);

  // Get AI coaching
  const handleGetCoaching = useCallback(async () => {
    if (!game || !analysis || fetchingCoaching) return;
    setFetchingCoaching(true);
    setCoachingError(null);

    // Build mistake/blunder descriptions
    const mistakes: string[] = [];
    const blunders: string[] = [];
    analysis.evaluations.forEach((ev, i) => {
      if (!ev) return;
      const moveNum = Math.floor(i / 2) + 1;
      const side = i % 2 === 0 ? "" : "...";
      const san = game.moves[i]?.san || "";
      if (ev.classification === "mistake") {
        mistakes.push(
          `Move ${moveNum}${side} ${san} (lost ${ev.cpLoss}cp, best was ${ev.bestMove})`
        );
      } else if (ev.classification === "blunder") {
        blunders.push(
          `Move ${moveNum}${side} ${san} (lost ${ev.cpLoss}cp, best was ${ev.bestMove})`
        );
      }
    });

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgn: game.pgn,
          playerColor: game.metadata.playerColor,
          result: game.metadata.result,
          resultReason: game.metadata.resultReason,
          analysisSummary: analysis.summary,
          mistakes: mistakes.slice(0, 5),
          blunders: blunders.slice(0, 5),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get coaching feedback");
      }

      const data = await res.json();
      setCoaching(data.coaching);
      // Cache coaching
      updateGame(game.id, { coachingFeedback: data.coaching });
      setGame({ ...game, coachingFeedback: data.coaching });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get coaching";
      setCoachingError(msg);
    } finally {
      setFetchingCoaching(false);
    }
  }, [game, analysis, fetchingCoaching]);

  // Build evaluation chart data
  const chartData = useMemo(() => {
    if (!analysis) return [];
    return analysis.evaluations.map((ev, i) => ({
      move: i + 1,
      eval: ev ? ev.centipawns / 100 : null,
      classification: ev?.classification || null,
    }));
  }, [analysis]);

  // Build move pairs for display
  const movePairs = useMemo(() => {
    if (!game) return [];
    const pairs: {
      number: number;
      white: { san: string; idx: number; eval?: MoveEvaluation | null };
      black?: { san: string; idx: number; eval?: MoveEvaluation | null };
    }[] = [];

    for (let i = 0; i < game.moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: {
          san: game.moves[i].san,
          idx: i,
          eval: analysis?.evaluations[i],
        },
        black:
          i + 1 < game.moves.length
            ? {
                san: game.moves[i + 1].san,
                idx: i + 1,
                eval: analysis?.evaluations[i + 1],
              }
            : undefined,
      });
    }
    return pairs;
  }, [game, analysis]);

  // Current move evaluation
  const currentEval = useMemo(() => {
    if (!analysis || viewingIndex < 0) return null;
    return analysis.evaluations[viewingIndex];
  }, [analysis, viewingIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold">Game not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This game may have been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard/history")} className="mt-4">
          Back to History
        </Button>
      </div>
    );
  }

  const resultLabel =
    game.metadata.result === game.metadata.playerColor
      ? "Win"
      : game.metadata.result === "draw"
        ? "Draw"
        : "Loss";
  const resultColor =
    resultLabel === "Win"
      ? "bg-emerald-500/15 text-emerald-400"
      : resultLabel === "Draw"
        ? "bg-amber-500/15 text-amber-400"
        : "bg-red-500/15 text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard/history")}
            className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to History
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Game Analysis</h1>
            <Badge className={cn("border-0", resultColor)}>{resultLabel}</Badge>
            {analysis && (
              <Badge variant="secondary" className="gap-1">
                {analysis.summary.accuracy.toFixed(1)}% accuracy
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {game.metadata.opponentType === "ai"
              ? `vs AI (${game.metadata.aiDifficulty})`
              : "vs Human"}{" "}
            &middot; {game.metadata.totalMoves} moves &middot;{" "}
            {new Date(game.metadata.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        {/* Board Column */}
        <div>
          {/* Evaluation bar */}
          {analysis && (
            <div className="mb-2 flex items-center gap-2">
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      5,
                      Math.min(95, 50 + (currentEval ? currentEval.centipawns / 100 : 0) * 5)
                    )}%`,
                  }}
                />
              </div>
              <span className="min-w-[48px] text-right font-mono text-xs text-muted-foreground">
                {currentEval
                  ? `${currentEval.centipawns >= 0 ? "+" : ""}${(
                      currentEval.centipawns / 100
                    ).toFixed(1)}`
                  : "0.0"}
              </span>
            </div>
          )}

          <PlayableChessBoard
            chess={chess}
            position={position}
            boardOrientation={game.metadata.playerColor}
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

          {/* Navigation */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToStart} className="h-9 w-9">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goBack} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 min-w-[60px] text-center text-xs text-muted-foreground">
              {viewingIndex < 0 ? "Start" : `${viewingIndex + 1} / ${game.moves.length}`}
            </span>
            <Button variant="ghost" size="icon" onClick={goForward} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToEnd} className="h-9 w-9">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Current move info */}
          {currentEval && viewingIndex >= 0 && (
            <Card className="mt-3 border-border/50 bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = CLASSIFICATION_ICONS[currentEval.classification];
                      const Icon = cfg.icon;
                      return (
                        <>
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                          <span className="text-sm font-medium capitalize">
                            {currentEval.classification}
                          </span>
                          {cfg.label && (
                            <span className={cn("font-mono text-xs", cfg.color)}>
                              {cfg.label}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {currentEval.cpLoss > 0 && (
                    <span className="text-xs text-muted-foreground">
                      -{currentEval.cpLoss}cp
                    </span>
                  )}
                </div>
                {currentEval.bestMove && currentEval.classification !== "good" && currentEval.classification !== "great" && currentEval.classification !== "brilliant" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Best was: <span className="font-mono">{currentEval.bestMove}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Analysis Controls */}
          {!analysis && !analyzing && (
            <Button onClick={handleAnalyze} className="w-full gap-2">
              <Brain className="h-4 w-4" />
              Analyze Game
            </Button>
          )}

          {analyzing && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analyzing...</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{
                      width:
                        analysisProgress.total > 0
                          ? `${(analysisProgress.current / analysisProgress.total) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Move {analysisProgress.current} of {analysisProgress.total}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Analysis Summary */}
          {analysis && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-center">
                  <span className="text-3xl font-bold">
                    {analysis.summary.accuracy.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <Separator className="mb-3 bg-border/50" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  {analysis.summary.brilliant > 0 && (
                    <div>
                      <Zap className="mx-auto h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-bold">{analysis.summary.brilliant}</span>
                      <p className="text-[10px] text-muted-foreground">Brilliant</p>
                    </div>
                  )}
                  {analysis.summary.great > 0 && (
                    <div>
                      <Star className="mx-auto h-4 w-4 text-blue-400" />
                      <span className="text-sm font-bold">{analysis.summary.great}</span>
                      <p className="text-[10px] text-muted-foreground">Great</p>
                    </div>
                  )}
                  <div>
                    <ThumbsUp className="mx-auto h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold">{analysis.summary.good}</span>
                    <p className="text-[10px] text-muted-foreground">Good</p>
                  </div>
                  <div>
                    <CircleAlert className="mx-auto h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-bold">{analysis.summary.inaccuracies}</span>
                    <p className="text-[10px] text-muted-foreground">Inaccuracy</p>
                  </div>
                  <div>
                    <CircleX className="mx-auto h-4 w-4 text-orange-400" />
                    <span className="text-sm font-bold">{analysis.summary.mistakes}</span>
                    <p className="text-[10px] text-muted-foreground">Mistake</p>
                  </div>
                  <div>
                    <Bomb className="mx-auto h-4 w-4 text-red-400" />
                    <span className="text-sm font-bold">{analysis.summary.blunders}</span>
                    <p className="text-[10px] text-muted-foreground">Blunder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluation Graph */}
          {analysis && chartData.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    onClick={(e: any) => {
                      if (e?.activePayload?.[0]?.payload) {
                        const moveIdx = e.activePayload[0].payload.move - 1;
                        goToMove(moveIdx);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="white" stopOpacity={0} />
                        <stop offset="50%" stopColor="black" stopOpacity={0} />
                        <stop offset="100%" stopColor="black" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="move"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[-5, 5]}
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow">
                            <span>Move {d.move}: </span>
                            <span className="font-mono">
                              {d.eval !== null
                                ? `${d.eval >= 0 ? "+" : ""}${d.eval.toFixed(1)}`
                                : "—"}
                            </span>
                            {d.classification && (
                              <span className="ml-1 capitalize text-muted-foreground">
                                ({d.classification})
                              </span>
                            )}
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    {viewingIndex >= 0 && (
                      <ReferenceLine
                        x={viewingIndex + 1}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="eval"
                      stroke="hsl(var(--primary))"
                      fill="url(#evalGradient)"
                      strokeWidth={1.5}
                      connectNulls
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Move List */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                {movePairs.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No moves
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {movePairs.map((pair) => (
                      <div key={pair.number} className="flex items-center text-sm">
                        <span className="w-8 font-mono text-xs text-muted-foreground/60">
                          {pair.number}.
                        </span>
                        <MoveButton
                          san={pair.white.san}
                          idx={pair.white.idx}
                          evaluation={pair.white.eval}
                          isActive={viewingIndex === pair.white.idx}
                          onClick={() => goToMove(pair.white.idx)}
                        />
                        {pair.black && (
                          <MoveButton
                            san={pair.black.san}
                            idx={pair.black.idx}
                            evaluation={pair.black.eval}
                            isActive={viewingIndex === pair.black.idx}
                            onClick={() => goToMove(pair.black!.idx)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coaching */}
          {analysis && !coaching && !fetchingCoaching && (
            <Button
              onClick={handleGetCoaching}
              variant="secondary"
              className="w-full gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Get AI Coach Feedback
            </Button>
          )}

          {fetchingCoaching && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex items-center gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Getting coaching feedback...</span>
              </CardContent>
            </Card>
          )}

          {coachingError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {coachingError}
            </div>
          )}

          {coaching && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Coach Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {coaching}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Move button component with classification indicator
function MoveButton({
  san,
  idx,
  evaluation,
  isActive,
  onClick,
}: {
  san: string;
  idx: number;
  evaluation?: MoveEvaluation | null;
  isActive: boolean;
  onClick: () => void;
}) {
  const cfg = evaluation
    ? CLASSIFICATION_ICONS[evaluation.classification]
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-0.5 rounded px-2 py-0.5 font-mono text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-accent"
      )}
    >
      {san}
      {cfg && cfg.label && (
        <span className={cn("text-[10px] font-bold", isActive ? "" : cfg.color)}>
          {cfg.label}
        </span>
      )}
    </button>
  );
}
