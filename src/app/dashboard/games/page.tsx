"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

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

  const getResultBadge = (game: Game) => {
    if (game.result === "draw") {
      return (
        <Badge variant="secondary" className="text-xs">
          Draw
        </Badge>
      );
    }
    const userWon =
      (game.userColor === "white" && game.result === "white") ||
      (game.userColor === "black" && game.result === "black");
    return userWon ? (
      <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-0 text-xs">
        Win
      </Badge>
    ) : (
      <Badge className="bg-red-500/15 text-red-400 hover:bg-red-500/20 border-0 text-xs">
        Loss
      </Badge>
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Import Games</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fetch your recent games from Lichess to view and analyze them.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchGames()}
            placeholder="Lichess username"
            className="h-10 pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        <Button
          onClick={fetchGames}
          disabled={loading || !username.trim()}
          className="h-10"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? "Importing..." : "Import Games"}
        </Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {games.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Opponent
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Result
                    </th>
                    <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                      Opening
                    </th>
                    <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">
                      Time
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => {
                    const opponent =
                      game.userColor === "white" ? game.black : game.white;
                    return (
                      <tr
                        key={game.id}
                        className="border-b border-border/30 transition-colors hover:bg-accent/50"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {game.date}
                        </td>
                        <td className="px-4 py-3 font-medium">{opponent}</td>
                        <td className="px-4 py-3">{getResultBadge(game)}</td>
                        <td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                          {game.opening}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          <Badge variant="outline" className="text-xs font-normal">
                            {game.timeControl}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/games/${game.id}?username=${encodeURIComponent(username)}`}
                          >
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                              View
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {!loading && games.length === 0 && !error && (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Swords className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No games yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a Lichess username above to import games
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  );
}
