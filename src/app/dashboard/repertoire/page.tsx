"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess, Square } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Play,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Target,
  Brain,
  ArrowLeft,
  FolderTree,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getRepertoire,
  addRepertoireLine,
  updateRepertoireLine,
  deleteRepertoireLine,
  generateRepertoireId,
  getQuizPositions,
  type RepertoireLine,
  type RepertoireMove,
} from "@/lib/repertoire-storage";

const PlayableChessBoard = dynamic(
  () => import("@/components/PlayableChessBoard"),
  { ssr: false }
);

type Mode = "list" | "build" | "quiz";

export default function RepertoirePage() {
  const [repertoire, setRepertoire] = useState<RepertoireLine[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // Build mode state
  const [buildChess] = useState(() => new Chess());
  const [buildPosition, setBuildPosition] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [buildMoveSequence, setBuildMoveSequence] = useState<string[]>([]);
  const [buildLastMove, setBuildLastMove] = useState<{ from: string; to: string } | null>(null);
  const [newLineName, setNewLineName] = useState("");
  const [newLineColor, setNewLineColor] = useState<"white" | "black">("white");

  // Quiz mode state
  const [quizChess] = useState(() => new Chess());
  const [quizPosition, setQuizPosition] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [quizLastMove, setQuizLastMove] = useState<{ from: string; to: string } | null>(null);
  const [quizPositions, setQuizPositions] = useState<{ fenBefore: string; expectedSan: string; fen: string }[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "wrong" | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizCurrentAttempts, setQuizCurrentAttempts] = useState(0);

  useEffect(() => {
    setRepertoire(getRepertoire());
  }, []);

  const selectedLine = useMemo(
    () => repertoire.find((l) => l.id === selectedLineId) || null,
    [repertoire, selectedLineId]
  );

  // --- List Mode ---

  const handleCreateLine = useCallback(() => {
    if (!newLineName.trim()) return;
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const line: RepertoireLine = {
      id: generateRepertoireId(),
      name: newLineName.trim(),
      color: newLineColor,
      moves: {
        san: "root",
        fen: startFen,
        children: [],
      },
      createdAt: new Date().toISOString(),
      quizStats: { attempts: 0, correct: 0, lastQuizzed: null },
    };
    addRepertoireLine(line);
    setRepertoire(getRepertoire());
    setSelectedLineId(line.id);
    setNewLineName("");
    // Start building immediately
    buildChess.reset();
    setBuildPosition(buildChess.fen());
    setBuildMoveSequence([]);
    setBuildLastMove(null);
    setMode("build");
  }, [newLineName, newLineColor, buildChess]);

  const handleDeleteLine = useCallback((id: string) => {
    deleteRepertoireLine(id);
    setRepertoire(getRepertoire());
    if (selectedLineId === id) {
      setSelectedLineId(null);
      setMode("list");
    }
  }, [selectedLineId]);

  // --- Build Mode ---

  const handleBuildMove = useCallback(
    (move: { san: string; from: string; to: string }) => {
      if (!selectedLine) return;

      // The move was already made by PlayableChessBoard validation, but we need to actually make it
      try {
        buildChess.move(move.san);
      } catch {
        return;
      }

      const newFen = buildChess.fen();
      setBuildPosition(newFen);
      const newSequence = [...buildMoveSequence, move.san];
      setBuildMoveSequence(newSequence);
      setBuildLastMove({ from: move.from, to: move.to });

      // Add this move to the repertoire tree
      const updatedLine = { ...selectedLine };
      let currentNode = updatedLine.moves;

      // Walk through existing sequence to find parent node
      const tempChess = new Chess();
      for (let i = 0; i < newSequence.length - 1; i++) {
        tempChess.move(newSequence[i]);
        const fen = tempChess.fen();
        const child = currentNode.children.find((c) => c.fen === fen);
        if (child) {
          currentNode = child;
        }
      }

      // Check if this move already exists
      const existingChild = currentNode.children.find((c) => c.san === move.san);
      if (!existingChild) {
        currentNode.children.push({
          san: move.san,
          fen: newFen,
          children: [],
        });
        updateRepertoireLine(updatedLine.id, { moves: updatedLine.moves });
        setRepertoire(getRepertoire());
      }
    },
    [selectedLine, buildChess, buildMoveSequence]
  );

  const handleBuildUndo = useCallback(() => {
    if (buildMoveSequence.length === 0) return;
    buildChess.undo();
    setBuildPosition(buildChess.fen());
    const newSeq = buildMoveSequence.slice(0, -1);
    setBuildMoveSequence(newSeq);

    if (newSeq.length > 0) {
      const history = buildChess.history({ verbose: true });
      const last = history[history.length - 1];
      setBuildLastMove(last ? { from: last.from, to: last.to } : null);
    } else {
      setBuildLastMove(null);
    }
  }, [buildChess, buildMoveSequence]);

  const handleBuildReset = useCallback(() => {
    buildChess.reset();
    setBuildPosition(buildChess.fen());
    setBuildMoveSequence([]);
    setBuildLastMove(null);
  }, [buildChess]);

  const startBuildMode = useCallback(
    (lineId: string) => {
      setSelectedLineId(lineId);
      buildChess.reset();
      setBuildPosition(buildChess.fen());
      setBuildMoveSequence([]);
      setBuildLastMove(null);
      setMode("build");
    },
    [buildChess]
  );

  // --- Quiz Mode ---

  const startQuiz = useCallback(
    (lineId: string) => {
      const line = repertoire.find((l) => l.id === lineId);
      if (!line) return;

      const positions = getQuizPositions(line);
      if (positions.length === 0) return;

      setSelectedLineId(lineId);
      setQuizPositions(positions);
      setQuizIndex(0);
      setQuizCorrect(0);
      setQuizAttempts(0);
      setQuizComplete(false);
      setQuizFeedback(null);
      setQuizCurrentAttempts(0);

      // Set up first position
      quizChess.load(positions[0].fenBefore);
      setQuizPosition(positions[0].fenBefore);
      setQuizLastMove(null);
      setMode("quiz");
    },
    [repertoire, quizChess]
  );

  const handleQuizMove = useCallback(
    (move: { san: string; from: string; to: string }) => {
      if (quizComplete || quizFeedback) return;

      const expected = quizPositions[quizIndex];
      if (!expected) return;

      if (move.san === expected.expectedSan) {
        // Correct!
        quizChess.move(move.san);
        setQuizPosition(quizChess.fen());
        setQuizLastMove({ from: move.from, to: move.to });
        setQuizFeedback("correct");
        setQuizCorrect((c) => c + 1);
        setQuizAttempts((a) => a + 1);

        // Auto-advance after a delay
        setTimeout(() => {
          setQuizFeedback(null);
          setQuizCurrentAttempts(0);
          const nextIdx = quizIndex + 1;
          if (nextIdx >= quizPositions.length) {
            // Quiz complete
            setQuizComplete(true);
            // Save stats
            if (selectedLine) {
              updateRepertoireLine(selectedLine.id, {
                quizStats: {
                  attempts: selectedLine.quizStats.attempts + quizPositions.length,
                  correct: selectedLine.quizStats.correct + quizCorrect + 1,
                  lastQuizzed: new Date().toISOString(),
                },
              });
              setRepertoire(getRepertoire());
            }
          } else {
            setQuizIndex(nextIdx);
            quizChess.load(quizPositions[nextIdx].fenBefore);
            setQuizPosition(quizPositions[nextIdx].fenBefore);
            setQuizLastMove(null);
          }
        }, 800);
      } else {
        // Wrong
        setQuizFeedback("wrong");
        setQuizCurrentAttempts((a) => a + 1);
        setQuizAttempts((a) => a + 1);

        setTimeout(() => {
          setQuizFeedback(null);
          // Reset position for retry
          quizChess.load(quizPositions[quizIndex].fenBefore);
          setQuizPosition(quizPositions[quizIndex].fenBefore);

          // After 3 wrong attempts, show the answer and move on
          if (quizCurrentAttempts + 1 >= 3) {
            // Show answer briefly
            quizChess.move(expected.expectedSan);
            setQuizPosition(quizChess.fen());
            setQuizFeedback(null);

            setTimeout(() => {
              setQuizCurrentAttempts(0);
              const nextIdx = quizIndex + 1;
              if (nextIdx >= quizPositions.length) {
                setQuizComplete(true);
                if (selectedLine) {
                  updateRepertoireLine(selectedLine.id, {
                    quizStats: {
                      attempts: selectedLine.quizStats.attempts + quizPositions.length,
                      correct: selectedLine.quizStats.correct + quizCorrect,
                      lastQuizzed: new Date().toISOString(),
                    },
                  });
                  setRepertoire(getRepertoire());
                }
              } else {
                setQuizIndex(nextIdx);
                quizChess.load(quizPositions[nextIdx].fenBefore);
                setQuizPosition(quizPositions[nextIdx].fenBefore);
                setQuizLastMove(null);
              }
            }, 1200);
          }
        }, 600);
      }
    },
    [quizChess, quizPositions, quizIndex, quizComplete, quizFeedback, quizCorrect, quizCurrentAttempts, selectedLine]
  );

  // Count total moves in a line tree
  const countMoves = (node: RepertoireMove): number => {
    let count = node.san !== "root" ? 1 : 0;
    for (const child of node.children) {
      count += countMoves(child);
    }
    return count;
  };

  // --- Render ---

  if (mode === "build" && selectedLine) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Building: {selectedLine.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Play moves on the board to add them to your repertoire ({selectedLine.color})
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4 flex flex-wrap items-center gap-1 text-sm">
          <button
            onClick={handleBuildReset}
            className={cn(
              "rounded px-2 py-0.5 transition-colors",
              buildMoveSequence.length === 0
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            Start
          </button>
          {buildMoveSequence.map((move, i) => (
            <div key={i} className="flex items-center">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span
                className={cn(
                  "rounded px-2 py-0.5 font-mono",
                  i === buildMoveSequence.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}
                {move}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
          <div>
            <PlayableChessBoard
              chess={buildChess}
              position={buildPosition}
              boardOrientation={selectedLine.color}
              boardWidth={480}
              arePiecesDraggable={true}
              onMove={(move) => handleBuildMove({ san: move.san, from: move.from, to: move.to })}
              lastMove={buildLastMove}
              isCheck={buildChess.isCheck()}
              promotionSquare={null}
              onPromotionSelect={() => {}}
              onPromotionCancel={() => {}}
              pendingPromotion={null}
            />
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleBuildUndo} disabled={buildMoveSequence.length === 0} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Undo
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBuildReset} className="gap-1">
                Reset
              </Button>
            </div>
          </div>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FolderTree className="h-4 w-4" />
                Move Tree
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoveTree node={selectedLine.moves} depth={0} />
              {selectedLine.moves.children.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Play moves on the board to build your repertoire
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  if (mode === "quiz" && selectedLine) {
    const progress = quizPositions.length > 0 ? ((quizIndex + (quizComplete ? 1 : 0)) / quizPositions.length) * 100 : 0;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Quiz: {selectedLine.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Play the correct move from your repertoire
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Position {Math.min(quizIndex + 1, quizPositions.length)} of {quizPositions.length}</span>
            <span>{quizCorrect} correct</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {quizComplete ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                You got {quizCorrect} out of {quizPositions.length} positions correct
                ({quizPositions.length > 0 ? Math.round((quizCorrect / quizPositions.length) * 100) : 0}%)
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => setMode("list")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to List
                </Button>
                <Button onClick={() => startQuiz(selectedLine.id)} className="gap-1">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
            <div className="relative">
              <PlayableChessBoard
                chess={quizChess}
                position={quizPosition}
                boardOrientation={selectedLine.color}
                boardWidth={480}
                arePiecesDraggable={!quizFeedback}
                onMove={(move) => handleQuizMove({ san: move.san, from: move.from, to: move.to })}
                lastMove={quizLastMove}
                isCheck={quizChess.isCheck()}
                promotionSquare={null}
                onPromotionSelect={() => {}}
                onPromotionCancel={() => {}}
                pendingPromotion={null}
              />

              {/* Feedback overlay */}
              {quizFeedback && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-xl transition-opacity",
                    quizFeedback === "correct" ? "bg-emerald-500/20" : "bg-red-500/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-full",
                      quizFeedback === "correct" ? "bg-emerald-500" : "bg-red-500"
                    )}
                  >
                    {quizFeedback === "correct" ? (
                      <Check className="h-10 w-10 text-white" />
                    ) : (
                      <X className="h-10 w-10 text-white" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-medium">Your Move</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedLine.color === "white" && quizChess.turn() === "w"
                    ? "Play your prepared move as White"
                    : selectedLine.color === "black" && quizChess.turn() === "b"
                      ? "Play your prepared move as Black"
                      : "Waiting for opponent move..."}
                </p>
                {quizCurrentAttempts > 0 && (
                  <p className="text-xs text-amber-400">
                    Attempt {quizCurrentAttempts + 1}/3 — try again!
                  </p>
                )}
                <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Score</span>
                    <span>{quizCorrect}/{quizIndex + (quizFeedback === "correct" ? 1 : 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attempts</span>
                    <span>{quizAttempts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    );
  }

  // --- List Mode ---
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Opening Repertoire</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build and practice your opening lines
        </p>
      </div>

      {/* Create new line */}
      <Card className="mb-6 border-border/50 bg-card/50">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Line Name</label>
              <Input
                placeholder="e.g., Italian Game, Sicilian Najdorf..."
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateLine()}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Play As</label>
              <div className="flex gap-1">
                <Button
                  variant={newLineColor === "white" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setNewLineColor("white")}
                >
                  White
                </Button>
                <Button
                  variant={newLineColor === "black" ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setNewLineColor("black")}
                >
                  Black
                </Button>
              </div>
            </div>
            <Button onClick={handleCreateLine} disabled={!newLineName.trim()} className="gap-1">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Repertoire lines */}
      {repertoire.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No opening lines yet. Create one above to start building your repertoire.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {repertoire.map((line) => {
            const moveCount = countMoves(line.moves);
            const quizPositionCount = getQuizPositions(line).length;
            const quizAccuracy =
              line.quizStats.attempts > 0
                ? Math.round((line.quizStats.correct / line.quizStats.attempts) * 100)
                : null;

            return (
              <Card key={line.id} className="border-border/50 bg-card/50">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{line.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {line.color}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {moveCount} moves
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>Created {new Date(line.createdAt).toLocaleDateString()}</span>
                        {quizAccuracy !== null && (
                          <span>Quiz accuracy: {quizAccuracy}%</span>
                        )}
                        {line.quizStats.lastQuizzed && (
                          <span>Last quizzed: {new Date(line.quizStats.lastQuizzed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startBuildMode(line.id)}
                        className="gap-1 h-7 text-xs"
                      >
                        <FolderTree className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => startQuiz(line.id)}
                        disabled={quizPositionCount === 0}
                        className="gap-1 h-7 text-xs"
                      >
                        <Play className="h-3 w-3" />
                        Quiz
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLine(line.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// --- Move Tree Component ---

function MoveTree({ node, depth }: { node: RepertoireMove; depth: number }) {
  if (node.children.length === 0 && node.san === "root") return null;

  return (
    <div className={cn("text-sm", depth > 0 && "ml-4 border-l border-border/30 pl-3")}>
      {node.san !== "root" && (
        <div className="flex items-center gap-1 py-0.5">
          {depth % 2 === 1 ? (
            <span className="text-[10px] text-muted-foreground w-5">
              {Math.ceil(depth / 2)}.
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground w-5">
              {Math.ceil(depth / 2)}...
            </span>
          )}
          <span className="font-mono font-medium">{node.san}</span>
        </div>
      )}
      {node.children.map((child, i) => (
        <MoveTree key={`${child.san}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
