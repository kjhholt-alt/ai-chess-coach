"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Crown,
  Gamepad2,
  Puzzle,
  BarChart3,
  Trophy,
  Flame,
  Swords,
  Brain,
  TrendingUp,
  Calendar,
  Lightbulb,
  ChevronRight,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getGameHistory,
  getPuzzleStats,
  getUserProfile,
  type SavedGame,
} from "@/lib/game-storage";
import {
  checkAchievements,
  getCurrentStreak,
  type Achievement,
} from "@/lib/achievements";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    setGames(getGameHistory());
    // Check achievements on load
    const unlocked = checkAchievements();
    setNewAchievements(unlocked);
  }, []);

  const puzzleStats = getPuzzleStats();
  const profile = getUserProfile();
  const streak = getCurrentStreak();

  // Game stats
  const wins = games.filter(
    (g) => g.metadata.result === g.metadata.playerColor
  ).length;
  const losses = games.filter(
    (g) =>
      g.metadata.result !== g.metadata.playerColor &&
      g.metadata.result !== "draw"
  ).length;
  const draws = games.filter((g) => g.metadata.result === "draw").length;

  // Rating journey (from analyzed games)
  const ratingData = useMemo(() => {
    const analyzedGames = games.filter((g) => g.analysis);
    return analyzedGames.map((g, i) => ({
      game: i + 1,
      accuracy: g.analysis!.summary.accuracy,
      date: new Date(g.metadata.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [games]);

  // Weakness radar data
  const weaknessData = useMemo(() => {
    const themes: Record<string, number> = {};
    for (const game of games) {
      if (!game.analysis) continue;
      game.analysis.evaluations.forEach((ev, i) => {
        if (!ev) return;
        if (
          ev.classification === "mistake" ||
          ev.classification === "blunder" ||
          ev.classification === "inaccuracy"
        ) {
          // Classify by game phase
          const moveNum = i;
          if (moveNum < 20) {
            themes["Opening"] = (themes["Opening"] || 0) + 1;
          } else if (moveNum < 60) {
            themes["Middlegame"] = (themes["Middlegame"] || 0) + 1;
          } else {
            themes["Endgame"] = (themes["Endgame"] || 0) + 1;
          }
        }
      });
    }

    // Also add puzzle theme weaknesses
    const pa = puzzleStats.themeAccuracy;
    if (pa["fork"]) themes["Forks"] = Math.max(0, 100 - (pa["fork"].total > 0 ? (pa["fork"].correct / pa["fork"].total) * 100 : 100));
    if (pa["pin"]) themes["Pins"] = Math.max(0, 100 - (pa["pin"].total > 0 ? (pa["pin"].correct / pa["pin"].total) * 100 : 100));
    if (pa["backRankMate"]) themes["Back Rank"] = Math.max(0, 100 - (pa["backRankMate"].total > 0 ? (pa["backRankMate"].correct / pa["backRankMate"].total) * 100 : 100));
    if (pa["endgame"]) themes["Endgame Puzzles"] = Math.max(0, 100 - (pa["endgame"].total > 0 ? (pa["endgame"].correct / pa["endgame"].total) * 100 : 100));

    return Object.entries(themes)
      .slice(0, 8)
      .map(([name, value]) => ({
        theme: name,
        weakness: Math.min(100, Math.round(value)),
      }));
  }, [games, puzzleStats]);

  // Training streak calendar (last 30 days)
  const streakDays = useMemo(() => {
    const days: { date: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        active: profile.trainingStreak.dates.includes(dateStr),
      });
    }
    return days;
  }, [profile.trainingStreak.dates]);

  // Recent games (last 5)
  const recentGames = games.slice(0, 5);

  // Average accuracy
  const avgAccuracy = useMemo(() => {
    const analyzed = games.filter((g) => g.analysis);
    if (analyzed.length === 0) return 0;
    return Math.round(
      analyzed.reduce((sum, g) => sum + g.analysis!.summary.accuracy, 0) /
        analyzed.length
    );
  }, [games]);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      {/* Achievement toast */}
      {newAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-medium">
              Achievement{newAchievements.length > 1 ? "s" : ""} unlocked!
            </span>
            <div className="flex gap-2">
              {newAchievements.map((a) => (
                <Badge key={a.id} className="bg-primary/20 text-primary border-0">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your chess improvement journey at a glance
        </p>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <Swords className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-2xl font-bold">{games.length}</span>
            <p className="text-xs text-muted-foreground">Games</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-emerald-400 mb-1" />
            <span className="text-2xl font-bold">{avgAccuracy}%</span>
            <p className="text-xs text-muted-foreground">Avg Accuracy</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <Star className="mx-auto h-5 w-5 text-primary mb-1" />
            <span className="text-2xl font-bold">{puzzleStats.rating}</span>
            <p className="text-xs text-muted-foreground">Puzzle Rating</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <Flame className="mx-auto h-5 w-5 text-orange-400 mb-1" />
            <span className="text-2xl font-bold">{streak}</span>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Accuracy Trend */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Accuracy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ratingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={ratingData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow">
                            Game {d.game}: {d.accuracy.toFixed(1)}% accuracy
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Play and analyze games to see trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weakness Radar */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Brain className="h-4 w-4" />
                  Weakness Radar
                </CardTitle>
                <Link href="/dashboard/puzzles">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    Train <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {weaknessData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={weaknessData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="theme"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Radar
                      dataKey="weakness"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Brain className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Analyze games to see weaknesses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Games */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Swords className="h-4 w-4" />
                  Recent Games
                </CardTitle>
                <Link href="/dashboard/history">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    View all <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentGames.length > 0 ? (
                <div className="space-y-2">
                  {recentGames.map((game) => {
                    const isWin = game.metadata.result === game.metadata.playerColor;
                    const isDraw = game.metadata.result === "draw";
                    return (
                      <Link
                        key={game.id}
                        href={`/dashboard/history/${game.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2.5 transition-colors hover:bg-secondary/40"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              isWin ? "bg-emerald-500" : isDraw ? "bg-amber-500" : "bg-red-500"
                            )}
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {isWin ? "Win" : isDraw ? "Draw" : "Loss"}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {game.metadata.totalMoves} moves
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.analysis && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {game.analysis.summary.accuracy.toFixed(0)}%
                            </span>
                          )}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No games yet</p>
                  <Link href="/dashboard/play">
                    <Button size="sm" className="mt-2">
                      Play a Game
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Training Streak */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Training Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{streak}</span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    day{streak !== 1 ? "s" : ""}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Best: {Math.max(streak, ...profile.trainingStreak.dates.length > 0 ? [streak] : [0])} days
                </Badge>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {streakDays.map((day) => (
                  <div
                    key={day.date}
                    title={day.date}
                    className={cn(
                      "aspect-square rounded-sm transition-colors",
                      day.active
                        ? "bg-primary"
                        : "bg-secondary/50"
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp} className="mt-6">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link href="/dashboard/play">
                <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4">
                  <Gamepad2 className="h-5 w-5" />
                  <span className="text-xs">Play a Game</span>
                </Button>
              </Link>
              <Link href="/dashboard/puzzles">
                <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4">
                  <Puzzle className="h-5 w-5" />
                  <span className="text-xs">Daily Puzzles</span>
                </Button>
              </Link>
              {games.length > 0 && (
                <Link href={`/dashboard/history/${games[0].id}`}>
                  <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4">
                    <Brain className="h-5 w-5" />
                    <span className="text-xs">Review Last Game</span>
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/progress">
                <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">View Progress</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Win/Loss Record */}
      {games.length > 0 && (
        <motion.div variants={fadeUp} className="mt-6">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <span className="text-xl font-bold text-emerald-400">{wins}</span>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <Separator orientation="vertical" className="h-8 bg-border/50" />
                <div className="text-center">
                  <span className="text-xl font-bold text-amber-400">{draws}</span>
                  <p className="text-xs text-muted-foreground">Draws</p>
                </div>
                <Separator orientation="vertical" className="h-8 bg-border/50" />
                <div className="text-center">
                  <span className="text-xl font-bold text-red-400">{losses}</span>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
