"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Move, Square } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Swords,
  Bot,
  Users,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  RotateCcw,
  RefreshCw,
  Flag,
  Loader2,
  ListOrdered,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CapturedPieces from "@/components/CapturedPieces";
import GameOverModal from "@/components/GameOverModal";
import {
  getAIMove,
  getCapturedPieces,
  getMaterialCount,
  type Difficulty,
} from "@/lib/chess-engine";
import {
  saveCurrentGame,
  loadCurrentGame,
  clearCurrentGame,
  saveCompletedGame,
  generateGameId,
  type SavedMove,
} from "@/lib/game-storage";

const PlayableChessBoard = dynamic(
  () => import("@/components/PlayableChessBoard"),
  { ssr: false }
);

type GameMode = "pvp" | "ai";
type GameResult =
  | "checkmate"
  | "stalemate"
  | "draw-insufficient"
  | "draw-repetition"
  | "draw-50move"
  | "resigned"
  | null;

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string }> = {
  beginner: { label: "Beginner", desc: "Depth 1-2" },
  intermediate: { label: "Intermediate", desc: "Depth 5-8" },
  advanced: { label: "Advanced", desc: "Depth 12-15" },
};

export default function PlayPage() {
  // Game state
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [winner, setWinner] = useState<"white" | "black" | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Mode settings
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  // Move tracking
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [viewingMoveIndex, setViewingMoveIndex] = useState(-1);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // AI state
  const [aiThinking, setAiThinking] = useState(false);

  // Promotion
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Board orientation (for flip)
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">(playerColor);

  // Confirm dialog
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const moveListRef = useRef<HTMLDivElement>(null);

  // Save completed game to history
  const saveGameToHistory = useCallback(
    (result: string, winnerColor: "white" | "black" | null) => {
      const verboseHistory = chess.history({ verbose: true });
      const savedMoves: SavedMove[] = [];
      const tempChess = new Chess();

      for (const move of verboseHistory) {
        const fenBefore = tempChess.fen();
        tempChess.move(move.san);
        savedMoves.push({
          san: move.san,
          from: move.from,
          to: move.to,
          fen: tempChess.fen(),
          fenBefore,
          piece: move.piece,
          color: move.color,
          flags: move.flags,
          captured: move.captured,
        });
      }

      saveCompletedGame({
        id: generateGameId(),
        pgn: chess.pgn(),
        moves: savedMoves,
        metadata: {
          date: new Date().toISOString(),
          playerColor,
          opponentType: gameMode === "ai" ? "ai" : "human",
          aiDifficulty: gameMode === "ai" ? difficulty : undefined,
          result: winnerColor || "draw",
          resultReason: result,
          totalMoves: Math.ceil(verboseHistory.length / 2),
          source: "local",
        },
      });
    },
    [chess, playerColor, gameMode, difficulty]
  );

  // Check game state after every move
  const checkGameState = useCallback(() => {
    if (chess.isCheckmate()) {
      const w = chess.turn() === "w" ? "black" : "white";
      setGameOver(true);
      setGameResult("checkmate");
      setWinner(w);
      setShowGameOverModal(true);
      saveGameToHistory("checkmate", w);
      return true;
    }
    if (chess.isStalemate()) {
      setGameOver(true);
      setGameResult("stalemate");
      setWinner(null);
      setShowGameOverModal(true);
      saveGameToHistory("stalemate", null);
      return true;
    }
    if (chess.isInsufficientMaterial()) {
      setGameOver(true);
      setGameResult("draw-insufficient");
      setWinner(null);
      setShowGameOverModal(true);
      saveGameToHistory("draw-insufficient", null);
      return true;
    }
    if (chess.isThreefoldRepetition()) {
      setGameOver(true);
      setGameResult("draw-repetition");
      setWinner(null);
      setShowGameOverModal(true);
      saveGameToHistory("draw-repetition", null);
      return true;
    }
    if (chess.isDraw()) {
      setGameOver(true);
      setGameResult("draw-50move");
      setWinner(null);
      setShowGameOverModal(true);
      saveGameToHistory("draw-50move", null);
      return true;
    }
    return false;
  }, [chess, saveGameToHistory]);

  // Make AI move
  const makeAIMove = useCallback(async () => {
    if (gameOver || aiThinking) return;

    setAiThinking(true);
    try {
      const move = await getAIMove(chess.fen(), difficulty);
      if (move) {
        chess.move(move.san);
        setPosition(chess.fen());
        setMoveHistory([...chess.history({ verbose: true })]);
        setLastMove({ from: move.from, to: move.to });
        setViewingMoveIndex(chess.history().length - 1);
        checkGameState();
      }
    } catch (err) {
      console.error("[play] AI move error:", err);
    } finally {
      setAiThinking(false);
    }
  }, [chess, difficulty, gameOver, aiThinking, checkGameState]);

  // Handle player move
  const handleMove = useCallback(
    (move: Move) => {
      if (gameOver || aiThinking) return;
      if (isViewingHistory) return;

      // Check if it's a pawn promotion
      const isPawnPromotion =
        move.piece === "p" &&
        ((move.color === "w" && move.to[1] === "8") ||
          (move.color === "b" && move.to[1] === "1"));

      if (isPawnPromotion && !move.promotion) {
        setPendingPromotion({ from: move.from, to: move.to });
        return;
      }

      try {
        const result = chess.move({
          from: move.from as Square,
          to: move.to as Square,
          promotion: move.promotion || undefined,
        });
        if (result) {
          setPosition(chess.fen());
          setMoveHistory([...chess.history({ verbose: true })]);
          setLastMove({ from: result.from, to: result.to });
          setViewingMoveIndex(chess.history().length - 1);
          setGameStarted(true);

          if (!checkGameState()) {
            // If playing against AI and it's AI's turn
            if (gameMode === "ai") {
              const aiColor = playerColor === "white" ? "b" : "w";
              if (chess.turn() === aiColor) {
                makeAIMove();
              }
            }
          }
        }
      } catch {
        // Invalid move
      }
    },
    [
      chess,
      gameOver,
      aiThinking,
      isViewingHistory,
      gameMode,
      playerColor,
      makeAIMove,
      checkGameState,
    ]
  );

  // Promotion handlers
  const handlePromotionSelect = useCallback(
    (piece: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion) return;
      try {
        const result = chess.move({
          from: pendingPromotion.from as Square,
          to: pendingPromotion.to as Square,
          promotion: piece,
        });
        if (result) {
          setPosition(chess.fen());
          setMoveHistory([...chess.history({ verbose: true })]);
          setLastMove({ from: result.from, to: result.to });
          setViewingMoveIndex(chess.history().length - 1);
          setGameStarted(true);
          setPendingPromotion(null);

          if (!checkGameState() && gameMode === "ai") {
            const aiColor = playerColor === "white" ? "b" : "w";
            if (chess.turn() === aiColor) {
              makeAIMove();
            }
          }
        }
      } catch {
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, chess, gameMode, playerColor, makeAIMove, checkGameState]
  );

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  // New game
  const startNewGame = useCallback(() => {
    chess.reset();
    setPosition("start");
    setMoveHistory([]);
    setLastMove(null);
    setViewingMoveIndex(-1);
    setIsViewingHistory(false);
    setGameOver(false);
    setGameResult(null);
    setWinner(null);
    setShowGameOverModal(false);
    setShowNewGameConfirm(false);
    setGameStarted(false);
    setAiThinking(false);
    setPendingPromotion(null);

    // If AI plays white, make first move
    if (gameMode === "ai" && playerColor === "black") {
      setTimeout(() => makeAIMove(), 300);
    }
  }, [chess, gameMode, playerColor, makeAIMove]);

  const handleNewGameClick = () => {
    if (gameStarted && !gameOver) {
      setShowNewGameConfirm(true);
    } else {
      startNewGame();
    }
  };

  // Resume a saved game from localStorage
  const handleResumeGame = useCallback(() => {
    const saved = loadCurrentGame();
    if (!saved) {
      setShowResumePrompt(false);
      return;
    }
    try {
      chess.loadPgn(saved.pgn);
      setPosition(chess.fen());
      setMoveHistory([...chess.history({ verbose: true })]);
      setGameMode(saved.gameMode as "pvp" | "ai");
      setDifficulty(saved.difficulty as Difficulty);
      setPlayerColor(saved.playerColor as "white" | "black");
      setBoardOrientation(saved.playerColor as "white" | "black");
      setGameStarted(true);

      const history = chess.history({ verbose: true });
      const lastM = history.length > 0 ? history[history.length - 1] : null;
      setLastMove(lastM ? { from: lastM.from, to: lastM.to } : null);
      setViewingMoveIndex(history.length - 1);
    } catch (err) {
      console.error("[play] Failed to restore game:", err);
    }
    setShowResumePrompt(false);
  }, [chess]);

  const handleDeclineResume = useCallback(() => {
    clearCurrentGame();
    setShowResumePrompt(false);
  }, []);

  // Undo move
  const handleUndo = useCallback(() => {
    if (gameOver || aiThinking || isViewingHistory) return;
    if (moveHistory.length === 0) return;

    if (gameMode === "ai") {
      // Undo both player and AI moves
      chess.undo();
      chess.undo();
    } else {
      chess.undo();
    }

    setPosition(chess.fen());
    setMoveHistory([...chess.history({ verbose: true })]);
    const history = chess.history({ verbose: true });
    const lastM = history.length > 0 ? history[history.length - 1] : null;
    setLastMove(lastM ? { from: lastM.from, to: lastM.to } : null);
    setViewingMoveIndex(history.length - 1);
  }, [chess, gameOver, aiThinking, isViewingHistory, moveHistory, gameMode]);

  // Resign
  const handleResign = useCallback(() => {
    if (gameOver || !gameStarted) return;
    const turn = chess.turn();
    const w = turn === "w" ? "black" : "white";
    setGameOver(true);
    setGameResult("resigned");
    setWinner(w);
    setShowGameOverModal(true);
    saveGameToHistory("resigned", w);
  }, [chess, gameOver, gameStarted, saveGameToHistory]);

  // Move navigation
  const goToMove = useCallback(
    (index: number) => {
      const moves = chess.history();
      if (index < -1 || index >= moves.length) return;

      const tempChess = new Chess();
      for (let i = 0; i <= index; i++) {
        tempChess.move(moves[i]);
      }

      setPosition(tempChess.fen());
      setViewingMoveIndex(index);
      setIsViewingHistory(index < moves.length - 1);

      if (index >= 0) {
        const verboseHistory = tempChess.history({ verbose: true });
        const move = verboseHistory[index];
        setLastMove(move ? { from: move.from, to: move.to } : null);
      } else {
        setLastMove(null);
      }
    },
    [chess]
  );

  const goToStart = useCallback(() => goToMove(-1), [goToMove]);
  const goToEnd = useCallback(() => {
    goToMove(chess.history().length - 1);
    setIsViewingHistory(false);
  }, [chess, goToMove]);
  const goBack = useCallback(() => {
    if (viewingMoveIndex >= 0) goToMove(viewingMoveIndex - 1);
  }, [viewingMoveIndex, goToMove]);
  const goForward = useCallback(() => {
    const maxIndex = chess.history().length - 1;
    if (viewingMoveIndex < maxIndex) goToMove(viewingMoveIndex + 1);
  }, [chess, viewingMoveIndex, goToMove]);

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

  // Auto-scroll move list
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory]);

  // Auto-save game to localStorage after every move
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    saveCurrentGame({
      pgn: chess.pgn(),
      gameMode,
      difficulty,
      playerColor,
      gameStarted,
      timestamp: Date.now(),
    });
  }, [moveHistory, gameStarted, gameOver, chess, gameMode, difficulty, playerColor]);

  // Clear saved game when game ends
  useEffect(() => {
    if (gameOver) {
      clearCurrentGame();
    }
  }, [gameOver]);

  // Load saved game on mount
  useEffect(() => {
    const saved = loadCurrentGame();
    if (saved && saved.pgn) {
      setShowResumePrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync board orientation with playerColor when starting
  useEffect(() => {
    if (!gameStarted) {
      setBoardOrientation(playerColor);
    }
  }, [playerColor, gameStarted]);

  // AI starts if it plays white
  useEffect(() => {
    if (gameMode === "ai" && playerColor === "black" && !gameStarted && moveHistory.length === 0 && !showResumePrompt) {
      makeAIMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResumePrompt]);

  // Computed values
  const capturedPieces = getCapturedPieces(moveHistory);
  const materialCount = getMaterialCount(chess);
  const materialAdvantage = Math.round(
    (materialCount.white - materialCount.black) / 100
  );
  const isCheck = chess.isCheck();
  const isPlayerTurn =
    gameMode === "pvp" ||
    (playerColor === "white" ? chess.turn() === "w" : chess.turn() === "b");
  const canInteract =
    !gameOver && !aiThinking && !isViewingHistory && isPlayerTurn;

  // Build move pairs for display
  const movePairs: { number: number; white: string; black?: string; whiteIdx: number; blackIdx?: number }[] = [];
  const historyMoves = chess.history();
  for (let i = 0; i < historyMoves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: historyMoves[i],
      black: historyMoves[i + 1],
      whiteIdx: i,
      blackIdx: i + 1 < historyMoves.length ? i + 1 : undefined,
    });
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Play Chess</h1>
            {aiThinking && (
              <Badge variant="secondary" className="gap-1.5 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI thinking...
              </Badge>
            )}
            {isCheck && !gameOver && (
              <Badge className="bg-red-500/15 text-red-400 border-0">
                Check!
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {gameMode === "ai"
              ? `Playing vs AI (${DIFFICULTY_LABELS[difficulty].label}) as ${playerColor}`
              : "Local 2-player game"}
          </p>
        </div>
      </div>

      {/* Game setup bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Mode Toggle */}
        <div className="flex gap-1 rounded-lg border border-border/50 bg-secondary/30 p-1">
          <button
            onClick={() => setGameMode("ai")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              gameMode === "ai"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            vs AI
          </button>
          <button
            onClick={() => setGameMode("pvp")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              gameMode === "pvp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Local PvP
          </button>
        </div>

        {/* AI Difficulty */}
        {gameMode === "ai" && (
          <div className="flex gap-1 rounded-lg border border-border/50 bg-secondary/30 p-1">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  difficulty === d
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {DIFFICULTY_LABELS[d].label}
              </button>
            ))}
          </div>
        )}

        {/* Color selection */}
        {gameMode === "ai" && (
          <div className="flex gap-1 rounded-lg border border-border/50 bg-secondary/30 p-1">
            <button
              onClick={() => setPlayerColor("white")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                playerColor === "white"
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              White
            </button>
            <button
              onClick={() => setPlayerColor("black")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                playerColor === "black"
                  ? "bg-zinc-800 text-white border border-zinc-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Black
            </button>
          </div>
        )}
      </div>

      {/* Board + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        {/* Board column */}
        <div>
          {/* Captured pieces (top - opponent) */}
          <div className="mb-2 min-h-[28px]">
            <CapturedPieces
              capturedByWhite={capturedPieces.white}
              capturedByBlack={capturedPieces.black}
              materialAdvantage={materialAdvantage}
            />
          </div>

          <PlayableChessBoard
            chess={chess}
            position={position}
            boardOrientation={boardOrientation}
            boardWidth={480}
            arePiecesDraggable={canInteract}
            onMove={handleMove}
            lastMove={lastMove}
            isCheck={isCheck}
            promotionSquare={null}
            onPromotionSelect={handlePromotionSelect}
            onPromotionCancel={handlePromotionCancel}
            pendingPromotion={pendingPromotion}
          />

          {/* Navigation controls */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToStart} className="h-9 w-9">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goBack} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 min-w-[60px] text-center text-xs text-muted-foreground">
              {viewingMoveIndex < 0
                ? "Start"
                : `${viewingMoveIndex + 1} / ${historyMoves.length}`}
            </span>
            <Button variant="ghost" size="icon" onClick={goForward} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToEnd} className="h-9 w-9">
              <SkipForward className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-border/50" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))}
              className="h-9 w-9"
              title="Flip board"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {isViewingHistory && (
            <p className="mt-1 text-center text-xs text-amber-400">
              Viewing history — click &quot;End&quot; to return to the game
            </p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Move History */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ListOrdered className="h-4 w-4" />
                Moves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={moveListRef} className="max-h-[300px] overflow-y-auto">
                {movePairs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No moves yet. Start playing!
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {movePairs.map((pair) => (
                      <div key={pair.number} className="flex items-center text-sm">
                        <span className="w-8 font-mono text-xs text-muted-foreground/60">
                          {pair.number}.
                        </span>
                        <button
                          onClick={() => goToMove(pair.whiteIdx)}
                          className={cn(
                            "rounded px-2 py-0.5 font-mono text-sm transition-colors",
                            viewingMoveIndex === pair.whiteIdx
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          {pair.white}
                        </button>
                        {pair.black && pair.blackIdx !== undefined && (
                          <button
                            onClick={() => goToMove(pair.blackIdx!)}
                            className={cn(
                              "rounded px-2 py-0.5 font-mono text-sm transition-colors",
                              viewingMoveIndex === pair.blackIdx
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Game Controls */}
          <div className="space-y-2">
            <Button
              onClick={handleNewGameClick}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Game
            </Button>
            <Button
              variant="secondary"
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || gameOver || aiThinking || isViewingHistory}
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Undo Move
            </Button>
            <Button
              variant="secondary"
              onClick={handleResign}
              disabled={!gameStarted || gameOver}
              className="w-full gap-2 text-red-400 hover:text-red-300"
            >
              <Flag className="h-4 w-4" />
              Resign
            </Button>
          </div>

          {/* Turn indicator */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Turn</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    chess.turn() === "w" ? "bg-white/10" : "bg-zinc-800/50"
                  )}
                >
                  {chess.turn() === "w" ? "White" : "Black"}
                </Badge>
              </div>
              <Separator className="my-3 bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-xs font-medium">
                  {gameOver
                    ? "Game Over"
                    : aiThinking
                      ? "AI thinking..."
                      : isViewingHistory
                        ? "Reviewing"
                        : "In progress"}
                </span>
              </div>
              <Separator className="my-3 bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Moves</span>
                <span className="text-xs font-mono font-semibold">
                  {Math.ceil(historyMoves.length / 2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={showGameOverModal}
        result={gameResult}
        winner={winner}
        onNewGame={startNewGame}
        onClose={() => setShowGameOverModal(false)}
      />

      {/* Resume Game Prompt */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Resume game?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You have a game in progress. Would you like to continue where you left off?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={handleDeclineResume}
                className="flex-1"
              >
                New Game
              </Button>
              <Button onClick={handleResumeGame} className="flex-1">
                Resume
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Game Confirmation */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Start new game?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your current game is still in progress. Are you sure?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowNewGameConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={startNewGame} className="flex-1">
                New Game
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
