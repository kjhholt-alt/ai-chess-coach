"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  Target,
  AlertTriangle,
  Trophy,
  GraduationCap,
  Loader2,
  AlertCircle,
  Sparkles,
  Search,
  Check,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnalysisCard from "@/components/AnalysisCard";
import { Analysis, Game } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function AnalysisPage() {
  const [username, setUsername] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const gamesRes = await fetch(
        `/api/games?username=${encodeURIComponent(username.trim())}`
      );
      if (!gamesRes.ok) throw new Error("Failed to fetch games");
      const gamesData = await gamesRes.json();
      const games: Game[] = gamesData.games;

      if (games.length === 0) throw new Error("No games found for this user");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games, username: username.trim() }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">AI Game Analysis</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Get a comprehensive coaching report from your recent games, powered by
          Claude AI.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
            placeholder="Lichess username"
            className="h-10 pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading || !username.trim()}
          className="h-10"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "Analyze Games"}
        </Button>
      </div>

      {loading && (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="h-14 w-14 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-primary" />
              <Brain className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Analyzing your games</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Claude is reviewing your patterns, openings, and tactics...
            </p>
          </CardContent>
        </Card>
      )}

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

      {analysis && (
        <motion.div
          className="space-y-5"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
            <AnalysisCard title="Overall Assessment" icon={Crown}>
              <p className="text-sm leading-relaxed">{analysis.overall}</p>
            </AnalysisCard>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
            <AnalysisCard title="Opening Repertoire" icon={BookOpen}>
              <div className="space-y-3">
                {analysis.openings.map((opening, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-secondary/30 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {opening.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {opening.frequency}x
                        </Badge>
                        <Badge
                          className={`text-xs border-0 ${
                            opening.winRate >= 0.5
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {Math.round(opening.winRate * 100)}% wins
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {opening.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </AnalysisCard>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
              <AnalysisCard title="Strengths" icon={Trophy}>
                <ul className="space-y-2.5">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </AnalysisCard>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
              <AnalysisCard title="Areas for Improvement" icon={AlertTriangle}>
                <ul className="space-y-2.5">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </AnalysisCard>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
            <AnalysisCard title="Top 3 Areas to Improve" icon={Target}>
              <div className="space-y-4">
                {analysis.topImprovements.map((imp, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <h4 className="mb-1 font-medium text-foreground">
                      {i + 1}. {imp.area}
                    </h4>
                    <p className="mb-2 text-sm">{imp.description}</p>
                    <div className="rounded-md bg-secondary/50 p-2.5 font-mono text-xs text-muted-foreground">
                      Example: {imp.example}
                    </div>
                  </div>
                ))}
              </div>
            </AnalysisCard>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.3 }}>
            <AnalysisCard title="Personalized Study Plan" icon={GraduationCap}>
              <ol className="space-y-2.5">
                {analysis.studyPlan.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </AnalysisCard>
          </motion.div>
        </motion.div>
      )}

      {!loading && !analysis && !error && (
        <Card className="border-border/50 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Ready to analyze</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your Lichess username to get an AI-powered coaching report
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
