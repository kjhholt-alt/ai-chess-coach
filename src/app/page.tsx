"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);

  const handleDemo = () => {
    if (username.trim()) {
      window.location.href = `/dashboard/games?username=${encodeURIComponent(username.trim())}`;
    }
  };

  const handleWaitlist = async () => {
    if (!email.trim()) return;
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setWaitlistStatus("success");
        setEmail("");
      } else {
        setWaitlistStatus("error");
      }
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <div className="min-h-screen chess-gradient">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#9822;</span>
            <span className="font-bold text-lg text-white">AI Chess Coach</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/games"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/auth/signin"
              className="text-sm bg-chess-accent hover:bg-chess-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-6xl mb-6">&#9812; &#9819;</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Your AI Chess Coach
            <br />
            <span className="text-chess-accent">
              Personalized Improvement from Your Games
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Import your Lichess games, get AI-powered analysis of your
            strengths and weaknesses, solve targeted puzzles, and follow a
            personalized study plan.
          </p>

          {/* Demo Input */}
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDemo()}
              placeholder="Enter your Lichess username"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent"
            />
            <button
              onClick={handleDemo}
              className="w-full sm:w-auto px-6 py-3 bg-chess-accent hover:bg-chess-accent-hover text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Try Free Demo
            </button>
          </div>
          <p className="text-sm text-gray-500">
            No sign-up required for a quick game analysis
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Everything You Need to Improve
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "&#9813;",
              title: "Game Import",
              desc: "Import your games directly from Lichess. View them on an interactive board with full move navigation.",
            },
            {
              icon: "&#9818;",
              title: "AI Analysis",
              desc: "Get deep analysis of your playing patterns, openings, tactics, and endgames powered by Claude AI.",
            },
            {
              icon: "&#9816;",
              title: "Custom Puzzles",
              desc: "Solve puzzles targeted to your weak areas. Track your solve rate and improve systematically.",
            },
            {
              icon: "&#9814;",
              title: "Progress Tracking",
              desc: "Follow a personalized study plan. Track your improvement over time with clear metrics.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-chess-accent/50 transition-all hover:transform hover:-translate-y-1"
            >
              <div
                className="text-3xl mb-4"
                dangerouslySetInnerHTML={{ __html: feature.icon }}
              />
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free Beta Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gray-800 border-2 border-chess-accent rounded-2xl p-12 text-center max-w-2xl mx-auto">
          <div className="inline-block bg-chess-accent/20 text-chess-accent text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            FREE DURING BETA
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            All Features. No Cost.
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            We are in early beta and everything is free while we build and improve.
            Get full access to AI analysis, game import, puzzles, and study plans.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-300 mb-8">
            <li className="flex items-center gap-2">
              <span className="text-chess-accent">&#10003;</span> Unlimited AI analysis
            </li>
            <li className="flex items-center gap-2">
              <span className="text-chess-accent">&#10003;</span> Game import & viewer
            </li>
            <li className="flex items-center gap-2">
              <span className="text-chess-accent">&#10003;</span> All puzzle themes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-chess-accent">&#10003;</span> Personalized study plans
            </li>
          </ul>
          <Link
            href="/dashboard/games"
            className="inline-block px-8 py-3 bg-chess-accent hover:bg-chess-accent-hover text-white font-semibold rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Waitlist / CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Improve Your Chess?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Join the waitlist for early access and updates on new features.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent"
            />
            <button
              onClick={handleWaitlist}
              className="w-full sm:w-auto px-6 py-3 bg-chess-accent hover:bg-chess-accent-hover text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Join Waitlist
            </button>
          </div>
          {waitlistStatus === "success" && (
            <p className="text-chess-accent text-sm mt-3">
              You are on the list! We will be in touch.
            </p>
          )}
          {waitlistStatus === "error" && (
            <p className="text-red-400 text-sm mt-3">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>AI Chess Coach &mdash; Powered by Claude AI and Lichess</p>
        </div>
      </footer>
    </div>
  );
}
