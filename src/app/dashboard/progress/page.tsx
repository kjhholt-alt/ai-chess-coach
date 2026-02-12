"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Lock,
  Award,
  Brain,
  Target,
  Flame,
  Star,
  Zap,
  Shield,
  Eye,
  Calendar,
  Puzzle,
  Gamepad2,
  Swords,
  Crown,
  Medal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getGameHistory,
  getPuzzleStats,
  type SavedGame,
} from "@/lib/game-storage";
import {
  getAllAchievements,
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

// Map achievement icon strings to Lucide components
const ICON_MAP: Record<string, typeof Trophy> = {
  gamepad: Gamepad2,
  swords: Swords,
  trophy: Trophy,
  crown: Crown,
  flame: Flame,
  target: Target,
  brain: Brain,
  star: Star,
  zap: Zap,
  shield: Shield,
  lightbulb: Zap,
  puzzle: Puzzle,
  "git-fork": Swords,
  eye: Eye,
  "trending-up": TrendingUp,
  award: Award,
  calendar: Calendar,
  medal: Medal,
};

export default function ProgressPage() {
  const [games, setGames] = useState<SavedGame[]>([]);
  const achievements = getAllAchievements();
  const puzzleStats = getPuzzleStats();
  const streak = getCurrentStreak();

  useEffect(() => {
    setGames(getGameHistory());
  }, []);

  // Accuracy trend data
  const accuracyTrend = useMemo(() => {
    return games
      .filter((g) => g.analysis)
      .reverse() // chronological order
      .map((g, i) => {
        const moveCount = g.moves.length;
        // Classify by game phase accuracy (simplified)
        const evals = g.analysis!.evaluations;
        const openingErrors = evals
          .slice(0, 20)
          .filter((e) => e && (e.classification === "mistake" || e.classification === "blunder")).length;
        const middleErrors = evals
          .slice(20, 60)
          .filter((e) => e && (e.classification === "mistake" || e.classification === "blunder")).length;
        const endErrors = evals
          .slice(60)
          .filter((e) => e && (e.classification === "mistake" || e.classification === "blunder")).length;

        return {
          game: i + 1,
          accuracy: g.analysis!.summary.accuracy,
          openingErrors,
          middleErrors,
          endErrors,
          date: new Date(g.metadata.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      });
  }, [games]);

  // Blunders per game trend
  const blunderTrend = useMemo(() => {
    return games
      .filter((g) => g.analysis)
      .reverse()
      .map((g, i) => ({
        game: i + 1,
        blunders: g.analysis!.summary.blunders,
        mistakes: g.analysis!.summary.mistakes,
        date: new Date(g.metadata.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [games]);

  // Theme mastery
  const themeMastery = useMemo(() => {
    return Object.entries(puzzleStats.themeAccuracy)
      .map(([theme, data]) => ({
        theme: theme.replace(/([A-Z])/g, " $1").trim(),
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total,
        correct: data.correct,
      }))
      .sort((a, b) => b.total - a.total);
  }, [puzzleStats]);

  // Puzzle rating history
  const ratingHistory = useMemo(() => {
    return puzzleStats.ratingHistory.map((entry, i) => ({
      index: i + 1,
      rating: entry.rating,
      date: entry.date,
    }));
  }, [puzzleStats]);

  // Stats summary
  const analyzedCount = games.filter((g) => g.analysis).length;
  const avgAccuracy =
    analyzedCount > 0
      ? Math.round(
          games
            .filter((g) => g.analysis)
            .reduce((sum, g) => sum + g.analysis!.summary.accuracy, 0) /
            analyzedCount
        )
      : 0;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed stats and achievements for your chess journey
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold">{games.length}</span>
            <p className="text-[10px] text-muted-foreground">Games Played</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold">{avgAccuracy}%</span>
            <p className="text-[10px] text-muted-foreground">Avg Accuracy</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold">{puzzleStats.totalSolved}</span>
            <p className="text-[10px] text-muted-foreground">Puzzles Solved</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold">{puzzleStats.rating}</span>
            <p className="text-[10px] text-muted-foreground">Puzzle Rating</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-3 text-center">
            <span className="text-xl font-bold">{unlockedCount}/{achievements.length}</span>
            <p className="text-[10px] text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Accuracy Trend */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Accuracy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accuracyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={accuracyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow">
                            Game {d.game}: {d.accuracy.toFixed(1)}%
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Analyze games to see accuracy trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mistake Reduction */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Mistakes Per Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blunderTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={blunderTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow">
                            Game {d.game}: {d.mistakes} mistakes, {d.blunders} blunders
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="mistakes" fill="hsl(35, 90%, 50%)" stackId="errors" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="blunders" fill="hsl(0, 80%, 55%)" stackId="errors" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Analyze games to track mistakes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Theme Mastery */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                Theme Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              {themeMastery.length > 0 ? (
                <div className="space-y-3">
                  {themeMastery.map(({ theme, accuracy, total, correct }) => (
                    <div key={theme}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs capitalize">{theme}</span>
                        <span className="text-xs text-muted-foreground">
                          {correct}/{total} ({accuracy}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            accuracy >= 70
                              ? "bg-emerald-500"
                              : accuracy >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Puzzle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Solve puzzles to track theme mastery</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Puzzle Rating History */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" />
                Puzzle Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ratingHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={ratingHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-border bg-card px-2 py-1 text-xs shadow">
                            Rating: {d.rating}
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Star className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Solve puzzles to track rating</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div variants={fadeUp} className="mt-6">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Award className="h-4 w-4" />
                Achievements
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {unlockedCount} / {achievements.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {achievements.map((achievement) => {
                const IconComponent = ICON_MAP[achievement.icon] || Trophy;
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "group relative flex flex-col items-center rounded-lg border p-3 text-center transition-colors",
                      achievement.unlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/30 bg-secondary/10 opacity-50"
                    )}
                    title={achievement.description}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full mb-2",
                        achievement.unlocked
                          ? "bg-primary/15"
                          : "bg-secondary/30"
                      )}
                    >
                      {achievement.unlocked ? (
                        <IconComponent className="h-5 w-5 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {achievement.name}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                      {achievement.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
