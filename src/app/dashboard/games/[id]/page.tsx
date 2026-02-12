"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Loader2,
  Swords,
  Calendar,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MoveList from "@/components/MoveList";
import { Game } from "@/types";

const ChessBoard = dynamic(() => import("@/components/ChessBoard"), {
  ssr: false,
});

function GameViewerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const username = searchParams.get("username") || "";

  const [game, setGame] = useState<Game | null>(null);
  const [chess] = useState(new Chess());
  const [position, setPosition] = useState("start");
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(
          `/api/games?username=${encodeURIComponent(username)}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const found = data.games.find((g: Game) => g.id === gameId);
        if (found) {
          setGame(found);
          setMoveHistory(
            found.moves.filter((m: string) => m && !m.includes("."))
          );
        }
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, username]);

  const goToMove = useCallback(
    (index: number) => {
      chess.reset();
      for (let i = 0; i <= index && i < moveHistory.length; i++) {
        try {
          chess.move(moveHistory[i]);
        } catch {
          break;
        }
      }
      setPosition(chess.fen());
      setCurrentMoveIndex(index);
    },
    [chess, moveHistory]
  );

  const goForward = useCallback(() => {
    if (currentMoveIndex < moveHistory.length - 1) goToMove(currentMoveIndex + 1);
  }, [currentMoveIndex, moveHistory.length, goToMove]);

  const goBack = useCallback(() => {
    if (currentMoveIndex >= 0) {
      if (currentMoveIndex === 0) {
        chess.reset();
        setPosition("start");
        setCurrentMoveIndex(-1);
      } else {
        goToMove(currentMoveIndex - 1);
      }
    }
  }, [currentMoveIndex, chess, goToMove]);

  const goToStart = useCallback(() => {
    chess.reset();
    setPosition("start");
    setCurrentMoveIndex(-1);
  }, [chess]);

  const goToEnd = useCallback(() => {
    if (moveHistory.length > 0) goToMove(moveHistory.length - 1);
  }, [moveHistory.length, goToMove]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="border-border/50 bg-card/30">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Swords className="mb-4 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">Game not found</p>
        </CardContent>
      </Card>
    );
  }

  const opponent = game.userColor === "white" ? game.black : game.white;
  const userWon =
    (game.userColor === "white" && game.result === "white") ||
    (game.userColor === "black" && game.result === "black");
  const resultText =
    game.result === "draw" ? "Draw" : userWon ? "Win" : "Loss";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">vs {opponent}</h1>
          <Badge
            className={
              game.result === "draw"
                ? ""
                : userWon
                  ? "bg-emerald-500/15 text-emerald-400 border-0"
                  : "bg-red-500/15 text-red-400 border-0"
            }
            variant={game.result === "draw" ? "secondary" : "default"}
          >
            {resultText}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {game.date}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {game.opening}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {game.timeControl}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div>
          <ChessBoard
            position={position}
            boardOrientation={game.userColor}
            boardWidth={480}
          />
          <div className="mt-3 flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToStart}
              className="h-9 w-9"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 min-w-[60px] text-center text-xs text-muted-foreground">
              {currentMoveIndex < 0
                ? "Start"
                : `${currentMoveIndex + 1} / ${moveHistory.length}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goForward}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToEnd}
              className="h-9 w-9"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <MoveList
          moves={moveHistory}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={goToMove}
        />
      </div>
    </motion.div>
  );
}

export default function GameViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <GameViewerContent />
    </Suspense>
  );
}
