"use client";

import { useState } from "react";
import AnalysisCard from "@/components/AnalysisCard";
import { Analysis, Game } from "@/types";

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
      if (!gamesRes.ok) {
        throw new Error("Failed to fetch games");
      }
      const gamesData = await gamesRes.json();
      const games: Game[] = gamesData.games;

      if (games.length === 0) {
        throw new Error("No games found for this user");
      }

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
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">AI Game Analysis</h1>
      <p className="text-gray-400 mb-6">
        Get a comprehensive analysis of your recent games powered by Claude AI.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
          placeholder="Lichess username"
          className="w-full sm:w-72 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent"
        />
        <button
          onClick={runAnalysis}
          disabled={loading || !username.trim()}
          className="px-6 py-2.5 bg-chess-accent hover:bg-chess-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Games"}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-chess-accent mb-4"></div>
          <p className="text-gray-400">
            Analyzing your games... This may take a moment.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overall Assessment */}
          <AnalysisCard title="Overall Assessment" icon="&#9812;">
            <p className="text-base">{analysis.overall}</p>
          </AnalysisCard>

          {/* Opening Repertoire */}
          <AnalysisCard title="Opening Repertoire" icon="&#9813;">
            <div className="space-y-3">
              {analysis.openings.map((opening, i) => (
                <div
                  key={i}
                  className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">
                      {opening.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Played {opening.frequency}x &middot;{" "}
                      {Math.round(opening.winRate * 100)}% win rate
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{opening.suggestion}</p>
                </div>
              ))}
            </div>
          </AnalysisCard>

          {/* Strengths */}
          <AnalysisCard title="Strengths" icon="&#9816;">
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-chess-accent mt-0.5">&#10003;</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </AnalysisCard>

          {/* Weaknesses */}
          <AnalysisCard title="Areas for Improvement" icon="&#9814;">
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">&#9888;</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </AnalysisCard>

          {/* Top Improvements */}
          <AnalysisCard title="Top 3 Areas to Improve" icon="&#9819;">
            <div className="space-y-4">
              {analysis.topImprovements.map((imp, i) => (
                <div key={i} className="border-l-2 border-chess-accent pl-4">
                  <h4 className="font-medium text-white mb-1">
                    {i + 1}. {imp.area}
                  </h4>
                  <p className="mb-2">{imp.description}</p>
                  <div className="bg-gray-900/50 rounded p-2 text-xs font-mono text-gray-400">
                    Example: {imp.example}
                  </div>
                </div>
              ))}
            </div>
          </AnalysisCard>

          {/* Study Plan */}
          <AnalysisCard title="Personalized Study Plan" icon="&#9815;">
            <ol className="space-y-2 list-decimal list-inside">
              {analysis.studyPlan.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </AnalysisCard>
        </div>
      )}

      {!loading && !analysis && !error && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">&#9818;</div>
          <p>Enter your Lichess username to get AI-powered analysis</p>
        </div>
      )}
    </div>
  );
}
