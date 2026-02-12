"use client";

import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Puzzle as PuzzleIcon,
  Lightbulb,
  Eye,
  EyeOff,
  RefreshCw,
  Trophy,
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Puzzle } from "@/types";

const ChessBoard = dynamic(() => import("@/components/ChessBoard"), {
  ssr: false,
});

const THEMES = [
  { value: "", label: "Daily Puzzle" },
  { value: "middlegame", label: "Middlegame" },
  { value: "endgame", label: "Endgame" },
  { value: "short", label: "Short" },
  { value: "long", label: "Long" },
  { value: "mateIn1", label: "Mate in 1" },
  { value: "mateIn2", label: "Mate in 2" },
];

export default function PuzzlesPage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const [position, setPosition] = useState("start");
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ solved: 0, attempted: 0 });
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setSolved(false);
    setFailed(false);
    setShowHint(false);
    setShowSolution(false);
    setCurrentSolutionIndex(0);

    try {
      const url = theme
        ? `/api/puzzles?theme=${encodeURIComponent(theme)}`
        : "/api/puzzles";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch puzzle");
      const data = await res.json();
      const p: Puzzle = data.puzzle;
      setPuzzle(p);

      const game = new Chess();

      if (p.fen) {
        if (p.fen.includes(" ")) {
          game.load(p.fen);
        } else {
          const moves = p.fen.split(" ");
          for (const move of moves) {
            try {
              game.move(move);
            } catch {
              break;
            }
          }
        }
      }

      if (p.moves.length > 0) {
        try {
          game.move(p.moves[0]);
          setCurrentSolutionIndex(1);
        } catch {
          setCurrentSolutionIndex(0);
        }
      }

      const turn = game.turn();
      setOrientation(turn === "w" ? "white" : "black");
      setPosition(game.fen());
      setChess(game);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [theme]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handlePieceDrop = (
    sourceSquare: string,
    targetSquare: string
  ): boolean => {
    if (!chess || !puzzle || solved || failed) return false;

    const expectedMove = puzzle.moves[currentSolutionIndex];
    if (!expectedMove) return false;

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      const moveStr = move.lan;
      const moveAlg = move.san;

      const isCorrect =
        expectedMove === moveStr ||
        expectedMove === moveAlg ||
        expectedMove === `${sourceSquare}${targetSquare}` ||
        expectedMove.startsWith(`${sourceSquare}${targetSquare}`);

      if (isCorrect) {
        setPosition(chess.fen());
        const nextIndex = currentSolutionIndex + 1;

        if (nextIndex >= puzzle.moves.length) {
          setSolved(true);
          setStats((prev) => ({
            solved: prev.solved + 1,
            attempted: prev.attempted + 1,
          }));
        } else {
          setTimeout(() => {
            try {
              chess.move(puzzle.moves[nextIndex]);
              setPosition(chess.fen());
              setCurrentSolutionIndex(nextIndex + 1);
            } catch {
              setSolved(true);
              setStats((prev) => ({
                solved: prev.solved + 1,
                attempted: prev.attempted + 1,
              }));
            }
          }, 300);
        }
        return true;
      } else {
        chess.undo();
        setFailed(true);
        setStats((prev) => ({ ...prev, attempted: prev.attempted + 1 }));
        return false;
      }
    } catch {
      return false;
    }
  };

  const getHintText = () => {
    if (!puzzle || currentSolutionIndex >= puzzle.moves.length) return "";
    const move = puzzle.moves[currentSolutionIndex];
    return `The next move starts with: ${move.substring(0, 2)}...`;
  };

  const getSolutionText = () => {
    if (!puzzle) return "";
    return puzzle.moves.slice(currentSolutionIndex).join(" ");
  };

  const successRate =
    stats.attempted > 0
      ? Math.round((stats.solved / stats.attempted) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Puzzles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sharpen your tactical vision with interactive puzzles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="border-border/50 bg-card/50 px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Solved:</span>
              <span className="font-bold text-primary">{stats.solved}</span>
            </div>
          </Card>
          <Card className="border-border/50 bg-card/50 px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-bold text-primary">{successRate}%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Theme filters */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {THEMES.map((t) => (
          <Button
            key={t.value}
            variant={theme === t.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setTheme(t.value)}
            className={cn(
              "h-8 text-xs",
              theme === t.value
                ? ""
                : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
            )}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <div>
            <ChessBoard
              position={position}
              onPieceDrop={handlePieceDrop}
              boardOrientation={orientation}
              boardWidth={480}
              arePiecesDraggable={!solved && !failed}
            />

            {/* Status */}
            <div className="mt-3">
              {solved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Puzzle solved! Well done.
                </motion.div>
              )}
              {failed && !showSolution && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                  Incorrect move. Try the solution or a new puzzle.
                </motion.div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {puzzle && (
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
                    <span className="font-mono font-semibold">
                      {puzzle.rating}
                    </span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Themes
                    </span>
                    <div className="flex flex-wrap justify-end gap-1">
                      {puzzle.themes.length > 0
                        ? puzzle.themes.slice(0, 3).map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-xs"
                            >
                              {t}
                            </Badge>
                          ))
                        : <Badge variant="secondary" className="text-xs">General</Badge>}
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">To move</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {orientation}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Button
                variant="secondary"
                onClick={() => setShowHint(!showHint)}
                disabled={solved}
                className="w-full justify-start gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              {showHint && !solved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
                >
                  {getHintText()}
                </motion.div>
              )}

              <Button
                variant="secondary"
                onClick={() => setShowSolution(!showSolution)}
                className="w-full justify-start gap-2"
              >
                {showSolution ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showSolution ? "Hide Solution" : "Show Solution"}
              </Button>
              {showSolution && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 font-mono text-sm text-blue-300"
                >
                  {getSolutionText()}
                </motion.div>
              )}

              <Button onClick={fetchPuzzle} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                New Puzzle
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
