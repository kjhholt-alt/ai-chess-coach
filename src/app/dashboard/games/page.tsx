"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Game } from "@/types";

function GamesContent() {
  const searchParams = useSearchParams();
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/games?username=${encodeURIComponent(username.trim())}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch games");
      }
      const data = await res.json();
      setGames(data.games);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUsername) {
      fetchGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getResultDisplay = (game: Game) => {
    if (game.result === "draw") return { text: "Draw", color: "text-gray-400" };
    const userWon =
      (game.userColor === "white" && game.result === "white") ||
      (game.userColor === "black" && game.result === "black");
    return userWon
      ? { text: "Win", color: "text-green-400" }
      : { text: "Loss", color: "text-red-400" };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Import Games</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchGames()}
          placeholder="Lichess username"
          className="w-full sm:w-72 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent"
        />
        <button
          onClick={fetchGames}
          disabled={loading || !username.trim()}
          className="px-6 py-2.5 bg-chess-accent hover:bg-chess-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Importing..." : "Import Games"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {games.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Opponent</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    Opening
                  </th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">
                    Time Control
                  </th>
                  <th className="px-4 py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => {
                  const result = getResultDisplay(game);
                  const opponent =
                    game.userColor === "white" ? game.black : game.white;
                  return (
                    <tr
                      key={game.id}
                      className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                        i % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-300">{game.date}</td>
                      <td className="px-4 py-3 text-white font-medium">
                        {opponent}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${result.color}`}>
                        {result.text}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                        {game.opening}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                        {game.timeControl}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/games/${game.id}?username=${encodeURIComponent(username)}`}
                          className="text-chess-accent hover:text-chess-accent-hover transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && games.length === 0 && !error && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">&#9822;</div>
          <p>Enter a Lichess username to import games</p>
        </div>
      )}
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-chess-accent"></div>
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  );
}
