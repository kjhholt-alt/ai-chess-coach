"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess, Square } from "chess.js";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Puzzle as PuzzleIcon,
  Lightbulb,
  RefreshCw,
  Trophy,
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Tag,
  Brain,
  Flame,
  Zap,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getPuzzlesByTheme,
  getRandomPuzzle,
  calculateNewRating,
  type PuzzleData,
} from "@/lib/puzzle-bank";
import {
  getPuzzleStats,
  savePuzzleStats,
  getUserProfile,
  saveUserProfile,
  type PuzzleStats,
} from "@/lib/game-storage";

const PlayableChessBoard = dynamic(
  () => import("@/components/PlayableChessBoard"),
  { ssr: false }
);

type TrainingMode = "daily" | "endless" | "theme";

interface SessionResult {
  puzzleId: string;
  solved: boolean;
  attempts: number;
  timeMs: number;
  themes: string[];
  rating: number;
}

export default function PuzzlesPage() {
  // Puzzle state
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [puzzleStartTime, setPuzzleStartTime] = useState(0);

  // Training mode
  const [mode, setMode] = useState<TrainingMode>("daily");
  const [dailyQueue, setDailyQueue] = useState<PuzzleData[]>([]);
  const [dailyIndex, setDailyIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  // Stats
  const [stats, setStats] = useState<PuzzleStats>(getPuzzleStats());

  // Load a puzzle onto the board
  const loadPuzzle = useCallback(
    (puzzle: PuzzleData) => {
      setCurrentPuzzle(puzzle);
      setSolved(false);
      setFailed(false);
      setShowHint(false);
      setShowSolution(false);
      setAttempts(0);
      setLastMove(null);
      setPuzzleStartTime(Date.now());

      chess.load(puzzle.fen);

      // If puzzle has an initial opponent move, play it
      if (puzzle.moves.length > 1) {
        const firstMove = puzzle.moves[0];
        try {
          const from = firstMove.substring(0, 2) as Square;
          const to = firstMove.substring(2, 4) as Square;
          const promo = firstMove.length > 4 ? firstMove[4] : undefined;
          chess.move({ from, to, promotion: promo as any });
          setSolutionIndex(1);
        } catch {
          setSolutionIndex(0);
        }
      } else {
        setSolutionIndex(0);
      }

      const turn = chess.turn();
      setOrientation(turn === "w" ? "white" : "black");
      setPosition(chess.fen());
    },
    [chess]
  );

  // Start daily training
  const startDailyTraining = useCallback(() => {
    const profile = getUserProfile();
    const weaknesses = Object.entries(profile.weaknessProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([theme]) => theme);

    // Get rating range based on puzzle rating
    const rating = stats.rating;
    const minRating = Math.max(600, rating - 200);
    const maxRating = rating + 200;

    let puzzles: PuzzleData[];
    if (weaknesses.length > 0) {
      puzzles = getPuzzlesByTheme(weaknesses, minRating, maxRating, 5);
    } else {
      // New user: serve general puzzles
      puzzles = getPuzzlesByTheme([], 600, 1200, 5);
    }

    // If not enough puzzles, pad with random ones
    while (puzzles.length < 5) {
      const random = getRandomPuzzle(minRating, maxRating);
      if (random && !puzzles.find((p) => p.id === random.id)) {
        puzzles.push(random);
      } else {
        break;
      }
    }

    setDailyQueue(puzzles);
    setDailyIndex(0);
    setSessionResults([]);
    setSessionComplete(false);
    setMode("daily");

    if (puzzles.length > 0) {
      loadPuzzle(puzzles[0]);
    }
  }, [stats.rating, loadPuzzle]);

  // Start endless mode
  const startEndless = useCallback(() => {
    setMode("endless");
    setSessionResults([]);
    setSessionComplete(false);
    const rating = stats.rating;
    const puzzle = getRandomPuzzle(
      Math.max(600, rating - 200),
      rating + 200
    );
    if (puzzle) loadPuzzle(puzzle);
  }, [stats.rating, loadPuzzle]);

  // Start theme training
  const startThemeTraining = useCallback(
    (theme: string) => {
      setSelectedTheme(theme);
      setMode("theme");
      setSessionResults([]);
      setSessionComplete(false);
      const puzzles = getPuzzlesByTheme([theme], 600, 2000, 5);
      setDailyQueue(puzzles);
      setDailyIndex(0);
      if (puzzles.length > 0) loadPuzzle(puzzles[0]);
    },
    [loadPuzzle]
  );

  // Initialize on mount
  useEffect(() => {
    startDailyTraining();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record puzzle result and advance
  const recordResult = useCallback(
    (puzzleSolved: boolean) => {
      if (!currentPuzzle) return;

      const timeMs = Date.now() - puzzleStartTime;
      const result: SessionResult = {
        puzzleId: currentPuzzle.id,
        solved: puzzleSolved,
        attempts: attempts + (puzzleSolved ? 0 : 1),
        timeMs,
        themes: currentPuzzle.themes,
        rating: currentPuzzle.rating,
      };

      const newResults = [...sessionResults, result];
      setSessionResults(newResults);

      // Update stats
      const newStats = { ...stats };
      newStats.totalAttempted += 1;
      if (puzzleSolved) {
        newStats.totalSolved += 1;
        newStats.currentStreak += 1;
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak;
        }
      } else {
        newStats.currentStreak = 0;
      }

      // Update rating
      newStats.rating = calculateNewRating(
        newStats.rating,
        currentPuzzle.rating,
        puzzleSolved
      );

      // Update theme accuracy
      for (const theme of currentPuzzle.themes) {
        if (!newStats.themeAccuracy[theme]) {
          newStats.themeAccuracy[theme] = { correct: 0, total: 0 };
        }
        newStats.themeAccuracy[theme].total += 1;
        if (puzzleSolved) {
          newStats.themeAccuracy[theme].correct += 1;
        }
      }

      // Add to rating history
      const today = new Date().toISOString().split("T")[0];
      newStats.ratingHistory.push({ date: today, rating: newStats.rating });
      if (newStats.ratingHistory.length > 100) {
        newStats.ratingHistory = newStats.ratingHistory.slice(-100);
      }
      newStats.lastSessionDate = today;

      setStats(newStats);
      savePuzzleStats(newStats);

      // Update training streak in user profile
      const profile = getUserProfile();
      if (!profile.trainingStreak.dates.includes(today)) {
        profile.trainingStreak.dates.push(today);
        // Keep last 365 days
        if (profile.trainingStreak.dates.length > 365) {
          profile.trainingStreak.dates = profile.trainingStreak.dates.slice(-365);
        }
        saveUserProfile(profile);
      }
    },
    [currentPuzzle, puzzleStartTime, attempts, sessionResults, stats]
  );

  // Handle puzzle solved
  const onPuzzleSolved = useCallback(() => {
    setSolved(true);
    recordResult(true);
  }, [recordResult]);

  // Handle puzzle failed (all attempts used)
  const onPuzzleFailed = useCallback(() => {
    setFailed(true);
    recordResult(false);
  }, [recordResult]);

  // Next puzzle
  const nextPuzzle = useCallback(() => {
    if (mode === "daily" || mode === "theme") {
      const nextIdx = dailyIndex + 1;
      if (nextIdx >= dailyQueue.length) {
        setSessionComplete(true);
        return;
      }
      setDailyIndex(nextIdx);
      loadPuzzle(dailyQueue[nextIdx]);
    } else {
      // Endless: get a new random puzzle
      const rating = stats.rating;
      const puzzle = getRandomPuzzle(
        Math.max(600, rating - 200),
        rating + 200
      );
      if (puzzle) loadPuzzle(puzzle);
    }
  }, [mode, dailyIndex, dailyQueue, stats.rating, loadPuzzle]);

  // Handle player move
  const handleMove = useCallback(
    (move: { from: string; to: string; san: string }) => {
      if (!currentPuzzle || solved || failed) return;

      const expectedUCI = currentPuzzle.moves[solutionIndex];
      if (!expectedUCI) return;

      const expectedFrom = expectedUCI.substring(0, 2);
      const expectedTo = expectedUCI.substring(2, 4);

      const isCorrect =
        move.from === expectedFrom && move.to === expectedTo;

      if (isCorrect) {
        // Apply the move
        try {
          chess.move({ from: move.from as Square, to: move.to as Square, promotion: expectedUCI.length > 4 ? expectedUCI[4] as any : undefined });
        } catch {
          // Already applied by the board
        }
        setPosition(chess.fen());
        setLastMove({ from: move.from, to: move.to });

        const nextIdx = solutionIndex + 1;

        if (nextIdx >= currentPuzzle.moves.length) {
          // Puzzle complete!
          onPuzzleSolved();
          return;
        }

        // Play opponent's response
        const opponentMove = currentPuzzle.moves[nextIdx];
        setTimeout(() => {
          try {
            const oFrom = opponentMove.substring(0, 2) as Square;
            const oTo = opponentMove.substring(2, 4) as Square;
            const oPromo = opponentMove.length > 4 ? opponentMove[4] : undefined;
            chess.move({ from: oFrom, to: oTo, promotion: oPromo as any });
            setPosition(chess.fen());
            setLastMove({ from: oFrom, to: oTo });
            setSolutionIndex(nextIdx + 1);

            // Check if puzzle is now complete
            if (nextIdx + 1 >= currentPuzzle.moves.length) {
              onPuzzleSolved();
            }
          } catch {
            onPuzzleSolved();
          }
        }, 400);
      } else {
        // Wrong move
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          onPuzzleFailed();
        }
        // Undo the incorrect move (board handles it)
      }
    },
    [currentPuzzle, solved, failed, solutionIndex, chess, attempts, maxAttempts, onPuzzleSolved, onPuzzleFailed]
  );

  // Session summary stats
  const sessionSummary = useMemo(() => {
    if (sessionResults.length === 0) return null;
    const correct = sessionResults.filter((r) => r.solved).length;
    const total = sessionResults.length;
    const avgTime = sessionResults.reduce((sum, r) => sum + r.timeMs, 0) / total;
    const themes = Array.from(new Set(sessionResults.flatMap((r) => r.themes)));
    return { correct, total, avgTime, themes };
  }, [sessionResults]);

  // Theme accuracy for display
  const themeAccuracyList = useMemo(() => {
    return Object.entries(stats.themeAccuracy)
      .map(([theme, data]) => ({
        theme,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [stats.themeAccuracy]);

  // Available themes for training
  const themeOptions = [
    "fork",
    "pin",
    "skewer",
    "backRankMate",
    "discoveredAttack",
    "mateIn1",
    "mateIn2",
    "endgame",
    "sacrifice",
    "promotion",
  ];

  // Session complete view
  if (sessionComplete && sessionSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <p className="mt-2 text-muted-foreground">
              You solved {sessionSummary.correct} out of {sessionSummary.total} puzzles
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div>
                <span className="text-2xl font-bold text-primary">
                  {Math.round((sessionSummary.correct / sessionSummary.total) * 100)}%
                </span>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div>
                <span className="text-2xl font-bold">{stats.rating}</span>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {Math.round(sessionSummary.avgTime / 1000)}s
                </span>
                <p className="text-xs text-muted-foreground">Avg Time</p>
              </div>
            </div>

            {sessionSummary.themes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Themes practiced:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {sessionSummary.themes.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs capitalize">
                      {t.replace(/([A-Z])/g, " $1").trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button onClick={startDailyTraining} className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                Train Again
              </Button>
              <Button onClick={startEndless} variant="secondary" className="flex-1 gap-2">
                <Flame className="h-4 w-4" />
                Endless Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Puzzle Trainer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "daily"
              ? `Daily training — Puzzle ${dailyIndex + 1} of ${dailyQueue.length}`
              : mode === "theme"
                ? `${selectedTheme.replace(/([A-Z])/g, " $1").trim()} training — Puzzle ${dailyIndex + 1} of ${dailyQueue.length}`
                : "Endless mode — Keep solving!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="border-border/50 bg-card/50 px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Rating:</span>
              <span className="font-bold font-mono">{stats.rating}</span>
            </div>
          </Card>
          <Card className="border-border/50 bg-card/50 px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-bold">{stats.currentStreak}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Button
          variant={mode === "daily" ? "default" : "secondary"}
          size="sm"
          onClick={startDailyTraining}
          className="h-8 text-xs gap-1"
        >
          <Target className="h-3 w-3" />
          Daily (5)
        </Button>
        <Button
          variant={mode === "endless" ? "default" : "secondary"}
          size="sm"
          onClick={startEndless}
          className="h-8 text-xs gap-1"
        >
          <Flame className="h-3 w-3" />
          Endless
        </Button>
        <div className="mx-1 h-8 w-px bg-border/50" />
        {themeOptions.map((t) => (
          <Button
            key={t}
            variant={mode === "theme" && selectedTheme === t ? "default" : "secondary"}
            size="sm"
            onClick={() => startThemeTraining(t)}
            className={cn(
              "h-8 text-xs capitalize",
              mode === "theme" && selectedTheme === t
                ? ""
                : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
            )}
          >
            {t.replace(/([A-Z])/g, " $1").trim()}
          </Button>
        ))}
      </div>

      {/* Board + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        {/* Board */}
        <div>
          <PlayableChessBoard
            chess={chess}
            position={position}
            boardOrientation={orientation}
            boardWidth={480}
            arePiecesDraggable={!solved && !failed}
            onMove={handleMove as any}
            lastMove={lastMove}
            isCheck={chess.isCheck()}
            promotionSquare={null}
            onPromotionSelect={() => {}}
            onPromotionCancel={() => {}}
            pendingPromotion={null}
          />

          {/* Status messages */}
          <div className="mt-3 space-y-2">
            <AnimatePresence mode="wait">
              {solved && (
                <motion.div
                  key="solved"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Correct!
                    {currentPuzzle?.themes[0] && (
                      <span className="text-emerald-400/70">
                        — {currentPuzzle.themes[0].replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={nextPuzzle} className="gap-1">
                    Next <ArrowRight className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}

              {failed && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <XCircle className="h-4 w-4" />
                      Incorrect — solution shown below
                    </div>
                    <Button size="sm" onClick={nextPuzzle} className="gap-1">
                      Next <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 font-mono text-sm text-blue-300">
                    Solution: {currentPuzzle?.moves.slice(solutionIndex).join(" → ")}
                  </div>
                </motion.div>
              )}

              {!solved && !failed && attempts > 0 && (
                <motion.div
                  key="retry"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400"
                >
                  <XCircle className="h-4 w-4" />
                  Try again ({maxAttempts - attempts} {maxAttempts - attempts === 1 ? "attempt" : "attempts"} left)
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Puzzle Info */}
          {currentPuzzle && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PuzzleIcon className="h-4 w-4 text-primary" />
                  Puzzle Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    Rating
                  </span>
                  <span className="font-mono font-semibold">{currentPuzzle.rating}</span>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Themes
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {currentPuzzle.themes.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs capitalize">
                        {t.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To move</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {orientation}
                  </Badge>
                </div>
                {currentPuzzle.description && (
                  <>
                    <Separator className="bg-border/50" />
                    <p className="text-xs text-muted-foreground italic">
                      {currentPuzzle.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={() => setShowHint(!showHint)}
              disabled={solved || failed}
              className="w-full justify-start gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>
            {showHint && currentPuzzle && !solved && !failed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
              >
                Look for a {currentPuzzle.themes[0]?.replace(/([A-Z])/g, " $1").trim() || "tactic"}. The move starts from{" "}
                {currentPuzzle.moves[solutionIndex]?.substring(0, 2)}...
              </motion.div>
            )}
          </div>

          {/* Session Progress (daily/theme mode) */}
          {(mode === "daily" || mode === "theme") && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Session Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1.5">
                  {dailyQueue.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        i < sessionResults.length
                          ? sessionResults[i]?.solved
                            ? "bg-emerald-500"
                            : "bg-red-500"
                          : i === dailyIndex
                            ? "bg-primary"
                            : "bg-secondary"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {sessionResults.filter((r) => r.solved).length} / {sessionResults.length} solved
                </p>
              </CardContent>
            </Card>
          )}

          {/* Overall Stats */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total solved</span>
                <span className="font-semibold">{stats.totalSolved} / {stats.totalAttempted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overall accuracy</span>
                <span className="font-semibold">
                  {stats.totalAttempted > 0
                    ? Math.round((stats.totalSolved / stats.totalAttempted) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best streak</span>
                <span className="font-semibold">{stats.bestStreak}</span>
              </div>
              <Separator className="bg-border/50" />
              {themeAccuracyList.slice(0, 5).map(({ theme, accuracy, total }) => (
                <div key={theme} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {theme.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          accuracy >= 70 ? "bg-emerald-500" : accuracy >= 40 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-mono">{accuracy}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
