"use client";

import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
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

      // The first move in the solution is the opponent's move (setup)
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
      // Error handled by empty state
    } finally {
      setLoading(false);
    }
  }, [theme]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handlePieceDrop = (sourceSquare: string, targetSquare: string): boolean => {
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
          // Make the opponent's reply
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
        setStats((prev) => ({
          ...prev,
          attempted: prev.attempted + 1,
        }));
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
    return puzzle.moves
      .slice(currentSolutionIndex)
      .join(" ");
  };

  const successRate =
    stats.attempted > 0
      ? Math.round((stats.solved / stats.attempted) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Puzzles</h1>
          <p className="text-gray-400 text-sm mt-1">
            Solve puzzles to sharpen your tactical skills
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-gray-400">Solved: </span>
            <span className="text-chess-accent font-bold">{stats.solved}</span>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <span className="text-gray-400">Rate: </span>
            <span className="text-chess-accent font-bold">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Theme Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              theme === t.value
                ? "bg-chess-accent text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chess-accent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          <div>
            <ChessBoard
              position={position}
              onPieceDrop={handlePieceDrop}
              boardOrientation={orientation}
              boardWidth={480}
              arePiecesDraggable={!solved && !failed}
            />

            {/* Status Messages */}
            <div className="mt-4 text-center">
              {solved && (
                <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                  Puzzle solved! Well done.
                </div>
              )}
              {failed && !showSolution && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  Incorrect move. Try viewing the solution or get a new puzzle.
                </div>
              )}
            </div>
          </div>

          {/* Puzzle Info */}
          <div className="space-y-4">
            {puzzle && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="font-semibold text-white mb-3">Puzzle Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rating</span>
                    <span className="text-white font-mono">
                      {puzzle.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Themes</span>
                    <span className="text-white">
                      {puzzle.themes.length > 0
                        ? puzzle.themes.slice(0, 3).join(", ")
                        : "General"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">To move</span>
                    <span className="text-white">{orientation}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowHint(!showHint)}
                disabled={solved}
                className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg transition-colors border border-gray-700"
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>
              {showHint && !solved && (
                <div className="bg-yellow-900/20 border border-yellow-800/50 text-yellow-300 px-4 py-3 rounded-lg text-sm">
                  {getHintText()}
                </div>
              )}

              <button
                onClick={() => setShowSolution(!showSolution)}
                className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
              >
                {showSolution ? "Hide Solution" : "Show Solution"}
              </button>
              {showSolution && (
                <div className="bg-blue-900/20 border border-blue-800/50 text-blue-300 px-4 py-3 rounded-lg text-sm font-mono">
                  {getSolutionText()}
                </div>
              )}

              <button
                onClick={fetchPuzzle}
                className="w-full px-4 py-2.5 bg-chess-accent hover:bg-chess-accent-hover text-white font-semibold rounded-lg transition-colors"
              >
                New Puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
