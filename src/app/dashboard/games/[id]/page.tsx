"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
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
        // Error handled by showing empty state
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, username]);

  const goToMove = useCallback(
    (index: number) => {
      chess.reset();
      const validMoves = moveHistory;

      for (let i = 0; i <= index && i < validMoves.length; i++) {
        try {
          chess.move(validMoves[i]);
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
    if (currentMoveIndex < moveHistory.length - 1) {
      goToMove(currentMoveIndex + 1);
    }
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
    if (moveHistory.length > 0) {
      goToMove(moveHistory.length - 1);
    }
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chess-accent"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Game not found</p>
      </div>
    );
  }

  const opponent = game.userColor === "white" ? game.black : game.white;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">vs {opponent}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {game.date} &middot; {game.opening} &middot; {game.timeControl}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <div>
          <ChessBoard
            position={position}
            boardOrientation={game.userColor}
            boardWidth={480}
          />
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={goToStart}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              title="Go to start"
            >
              &#9198;
            </button>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              title="Previous move"
            >
              &#9664;
            </button>
            <button
              onClick={goForward}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              title="Next move"
            >
              &#9654;
            </button>
            <button
              onClick={goToEnd}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              title="Go to end"
            >
              &#9197;
            </button>
          </div>
        </div>

        <MoveList
          moves={moveHistory}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={goToMove}
        />
      </div>
    </div>
  );
}

export default function GameViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chess-accent"></div>
        </div>
      }
    >
      <GameViewerContent />
    </Suspense>
  );
}
