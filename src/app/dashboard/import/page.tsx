"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  User,
  Trophy,
  Clock,
  Swords,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  saveCompletedGame,
  getGameHistory,
  getUserProfile,
  saveUserProfile,
  generateGameId,
  type SavedMove,
} from "@/lib/game-storage";
import { Chess } from "chess.js";

interface LichessUser {
  id: string;
  username: string;
  perfs?: {
    rapid?: { rating: number; games: number };
    blitz?: { rating: number; games: number };
    bullet?: { rating: number; games: number };
    classical?: { rating: number; games: number };
  };
  count?: { all: number };
}

interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  status: string;
  players: {
    white: { user?: { name: string; id: string }; rating?: number };
    black: { user?: { name: string; id: string }; rating?: number };
  };
  winner?: string;
  clock?: { initial: number; increment: number };
  opening?: { name: string };
  pgn?: string;
  moves?: string;
  createdAt: number;
}

export default function ImportPage() {
  const [username, setUsername] = useState("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [lichessUser, setLichessUser] = useState<LichessUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Games state
  const [fetchingGames, setFetchingGames] = useState(false);
  const [lichessGames, setLichessGames] = useState<LichessGame[]>([]);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Validate username
  const validateUsername = useCallback(async () => {
    if (!username.trim()) return;
    setValidating(true);
    setError(null);
    setValidated(false);
    setLichessUser(null);
    setLichessGames([]);

    try {
      const res = await fetch(
        `https://lichess.org/api/user/${encodeURIComponent(username.trim())}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`No Lichess account found with username "${username.trim()}"`);
        }
        throw new Error("Failed to validate username");
      }

      const data: LichessUser = await res.json();
      setLichessUser(data);
      setValidated(true);

      // Save to profile
      const profile = getUserProfile();
      profile.lichessUsername = data.username;
      const rapid = data.perfs?.rapid?.rating;
      const blitz = data.perfs?.blitz?.rating;
      profile.lichessRating = rapid || blitz || undefined;
      saveUserProfile(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Validation failed";
      setError(msg);
    } finally {
      setValidating(false);
    }
  }, [username]);

  // Fetch games
  const fetchGames = useCallback(async () => {
    if (!lichessUser) return;
    setFetchingGames(true);
    setError(null);

    try {
      const res = await fetch(
        `https://lichess.org/api/games/user/${encodeURIComponent(
          lichessUser.username
        )}?max=20&pgnInJson=true&opening=true`,
        { headers: { Accept: "application/x-ndjson" } }
      );

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Lichess rate limit reached. Please wait a minute and try again.");
        }
        throw new Error("Failed to fetch games");
      }

      const text = await res.text();
      const lines = text.trim().split("\n").filter(Boolean);
      const games: LichessGame[] = [];

      for (const line of lines) {
        try {
          games.push(JSON.parse(line));
        } catch {
          continue;
        }
      }

      setLichessGames(games);
      // Auto-select all
      setSelectedGames(new Set(games.map((g) => g.id)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch games";
      setError(msg);
    } finally {
      setFetchingGames(false);
    }
  }, [lichessUser]);

  // Toggle game selection
  const toggleGame = useCallback((id: string) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedGames(new Set(lichessGames.map((g) => g.id)));
  }, [lichessGames]);

  const selectNone = useCallback(() => {
    setSelectedGames(new Set());
  }, []);

  // Import selected games
  const importGames = useCallback(async () => {
    if (!lichessUser || selectedGames.size === 0) return;
    setImporting(true);
    setImportedCount(0);

    const existingIds = new Set(
      getGameHistory()
        .filter((g) => g.metadata.lichessId)
        .map((g) => g.metadata.lichessId)
    );

    let imported = 0;
    for (const game of lichessGames) {
      if (!selectedGames.has(game.id)) continue;
      if (existingIds.has(game.id)) continue; // Skip duplicates

      const white = game.players.white.user?.name || "Anonymous";
      const black = game.players.black.user?.name || "Anonymous";
      const isWhite =
        white.toLowerCase() === lichessUser.username.toLowerCase();

      let result: "white" | "black" | "draw" = "draw";
      if (game.winner === "white") result = "white";
      else if (game.winner === "black") result = "black";

      const pgn = game.pgn || "";

      // Parse moves from PGN
      const savedMoves: SavedMove[] = [];
      try {
        const tempChess = new Chess();
        if (pgn) {
          tempChess.loadPgn(pgn);
          const history = tempChess.history({ verbose: true });

          const replayChess = new Chess();
          for (const move of history) {
            const fenBefore = replayChess.fen();
            replayChess.move(move.san);
            savedMoves.push({
              san: move.san,
              from: move.from,
              to: move.to,
              fen: replayChess.fen(),
              fenBefore,
              piece: move.piece,
              color: move.color,
              flags: move.flags,
              captured: move.captured,
            });
          }
        }
      } catch {
        // Skip games with unparseable PGN
        continue;
      }

      const timeControl = game.clock
        ? `${Math.floor(game.clock.initial / 60)}+${game.clock.increment}`
        : game.speed;

      saveCompletedGame({
        id: generateGameId(),
        pgn,
        moves: savedMoves,
        metadata: {
          date: new Date(game.createdAt).toISOString(),
          playerColor: isWhite ? "white" : "black",
          opponentType: "human",
          result,
          resultReason: game.status === "mate" ? "checkmate" : game.status,
          totalMoves: Math.ceil(savedMoves.length / 2),
          source: "lichess",
          lichessId: game.id,
          opening: game.opening?.name,
        },
      });

      imported++;
      setImportedCount(imported);
    }

    setImporting(false);
  }, [lichessUser, selectedGames, lichessGames]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Import from Lichess</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Lichess account and import your games for analysis
        </p>
      </div>

      {/* Username input */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && validateUsername()}
            placeholder="Lichess username"
            className="h-10 pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        <Button
          onClick={validateUsername}
          disabled={validating || !username.trim()}
          className="h-10"
        >
          {validating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <User className="mr-2 h-4 w-4" />
          )}
          {validating ? "Checking..." : "Connect"}
        </Button>
      </div>

      {/* Error */}
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

      {/* User Card */}
      {lichessUser && validated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{lichessUser.username}</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {lichessUser.perfs?.rapid && (
                        <span>Rapid: {lichessUser.perfs.rapid.rating}</span>
                      )}
                      {lichessUser.perfs?.blitz && (
                        <span>Blitz: {lichessUser.perfs.blitz.rating}</span>
                      )}
                      {lichessUser.perfs?.bullet && (
                        <span>Bullet: {lichessUser.perfs.bullet.rating}</span>
                      )}
                      {lichessUser.count && (
                        <span>{lichessUser.count.all} games total</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://lichess.org/@/${lichessUser.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {!lichessGames.length && !fetchingGames && (
                <Button onClick={fetchGames} className="mt-4 w-full gap-2">
                  <Download className="h-4 w-4" />
                  Fetch Recent Games
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading games */}
      {fetchingGames && (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Fetching games from Lichess...</span>
          </CardContent>
        </Card>
      )}

      {/* Games list */}
      {lichessGames.length > 0 && !importing && importedCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lichessGames.length} games found · {selectedGames.size} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs">
                Select None
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {lichessGames.map((game) => {
              const white = game.players.white.user?.name || "Anonymous";
              const black = game.players.black.user?.name || "Anonymous";
              const isWhite =
                lichessUser &&
                white.toLowerCase() === lichessUser.username.toLowerCase();
              const result =
                game.winner === "white"
                  ? isWhite
                    ? "Win"
                    : "Loss"
                  : game.winner === "black"
                    ? isWhite
                      ? "Loss"
                      : "Win"
                    : "Draw";
              const resultColor =
                result === "Win"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : result === "Draw"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-red-500/15 text-red-400";

              const timeControl = game.clock
                ? `${Math.floor(game.clock.initial / 60)}+${game.clock.increment}`
                : game.speed;

              return (
                <button
                  key={game.id}
                  onClick={() => toggleGame(game.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    selectedGames.has(game.id)
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/30 bg-secondary/10"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      selectedGames.has(game.id)
                        ? "border-primary bg-primary"
                        : "border-border"
                    )}
                  >
                    {selectedGames.has(game.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-0 text-xs", resultColor)}>
                        {result}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        vs {isWhite ? black : white}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {game.opening?.name && (
                        <span className="truncate">{game.opening.name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeControl}
                      </span>
                      <span>
                        {new Date(game.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {game.players.white.rating && game.players.black.rating && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {isWhite
                        ? game.players.white.rating
                        : game.players.black.rating}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={importGames}
            disabled={selectedGames.size === 0}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            Import {selectedGames.size} Game{selectedGames.size !== 1 ? "s" : ""}
          </Button>
        </motion.div>
      )}

      {/* Importing */}
      {importing && (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex items-center justify-center gap-2 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">
              Importing... {importedCount} of {selectedGames.size}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Import complete */}
      {importedCount > 0 && !importing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold">
                {importedCount} game{importedCount !== 1 ? "s" : ""} imported!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your Lichess games are now available in Game History for analysis.
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setImportedCount(0);
                    fetchGames();
                  }}
                >
                  Import More
                </Button>
                <Button asChild>
                  <a href="/dashboard/history">View History</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
