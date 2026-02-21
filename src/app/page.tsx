"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Crown,
  Brain,
  Puzzle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Check,
  Swords,
  Mail,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Lazy-load the chess board so SSR doesn't break
const HeroChessBoard = dynamic(
  () => import("@/components/HeroChessBoard").then((m) => m.HeroChessBoard),
  { ssr: false, loading: () => <ChessBoardSkeleton /> }
);

function ChessBoardSkeleton() {
  return (
    <div className="h-[420px] w-[420px] animate-pulse rounded-xl bg-zinc-800/50" />
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Swords,
    title: "Game Import",
    desc: "Import your games directly from Lichess. View them on an interactive board with full move-by-move navigation.",
    accent: "amber",
    border: "hover:border-amber-500/40",
    bg: "group-hover:from-amber-500/10 group-hover:to-amber-500/5",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    desc: "Get deep analysis of your playing patterns, openings, tactics, and endgames powered by Claude AI.",
    accent: "blue",
    border: "hover:border-blue-500/40",
    bg: "group-hover:from-blue-500/10 group-hover:to-blue-500/5",
  },
  {
    icon: Puzzle,
    title: "Puzzle Trainer",
    desc: "Solve puzzles targeted to your weak areas. Track your solve rate and sharpen your tactical vision.",
    accent: "purple",
    border: "hover:border-purple-500/40",
    bg: "group-hover:from-purple-500/10 group-hover:to-purple-500/5",
  },
  {
    icon: TrendingUp,
    title: "Study Plans",
    desc: "Follow a personalized study plan built from your actual games. Know exactly what to work on next.",
    accent: "amber",
    border: "hover:border-amber-500/40",
    bg: "group-hover:from-amber-500/10 group-hover:to-amber-500/5",
  },
];

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
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Chess<span className="text-amber-400">Coach</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/games">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button
                  size="sm"
                  className="bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                >
                  Sign In
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative chess-square grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.025)_1px,transparent_1px)] bg-[size:80px_80px]" />
        {/* Amber glow upper-left */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-amber-500/8 blur-[100px]" />
        {/* Deep glow right */}
        <div className="absolute top-1/3 -right-48 h-[600px] w-[600px] rounded-full bg-amber-700/6 blur-[120px]" />

        {/* Huge decorative chess piece (Unicode) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
          <span className="text-[600px] leading-none">♛</span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-28 sm:pt-24">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left: copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-xl"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <Badge className="mb-6 gap-1.5 border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/15">
                  <Sparkles className="h-3 w-3" />
                  Free during beta — all features unlocked
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl xl:text-7xl"
              >
                Master Chess
                <br />
                <span className="gold-gradient">With AI</span>
                <br />
                <span className="text-white">On Your Side</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-lg leading-relaxed text-zinc-400"
              >
                Import your Lichess games, get AI-powered analysis of your
                strengths and weaknesses, solve targeted puzzles, and follow a
                personalized study plan.
              </motion.p>

              {/* CTA inputs */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 max-w-sm"
              >
                <div className="flex gap-2">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDemo()}
                    placeholder="Your Lichess username"
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/50"
                  />
                  <Button
                    onClick={handleDemo}
                    size="lg"
                    className="h-12 whitespace-nowrap bg-amber-500 px-5 font-semibold text-black hover:bg-amber-400"
                  >
                    Analyze
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-xs text-zinc-600">
                  No sign-up required — see your analysis in seconds
                </p>
              </motion.div>

              {/* Quick benefits */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-10 flex flex-wrap gap-x-5 gap-y-3"
              >
                {[
                  { icon: Zap, text: "Instant game analysis" },
                  { icon: Shield, text: "Free during beta" },
                  { icon: Brain, text: "Powered by Claude AI" },
                  { icon: Puzzle, text: "Targeted puzzles" },
                ].map((b) => (
                  <div
                    key={b.text}
                    className="flex items-center gap-2 text-sm text-zinc-500"
                  >
                    <b.icon className="h-3.5 w-3.5 text-amber-500" />
                    {b.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: animated chess board */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center lg:justify-end"
            >
              <HeroChessBoard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="relative py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 border-amber-500/30 bg-amber-500/10 text-amber-400">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything you need to improve
            </h2>
            <p className="mt-4 text-zinc-400">
              A complete toolkit for chess improvement, powered by AI and built
              around your actual games.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <Card
                  className={`group relative overflow-hidden border border-white/8 bg-white/3 transition-all duration-300 ${feature.border} hover:shadow-lg hover:shadow-black/40`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-all duration-300 ${feature.bg}`}
                  />
                  <CardContent className="relative p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 transition-colors group-hover:bg-amber-500/15">
                      <feature.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-500">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section className="relative border-y border-white/5 bg-black/20 py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 border-amber-500/30 bg-amber-500/10 text-amber-400">
              How it works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Three steps to better chess
            </h2>
          </motion.div>

          <motion.div
            className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              {
                step: "01",
                title: "Import your games",
                desc: "Enter your Lichess username. We fetch and parse your recent games automatically.",
              },
              {
                step: "02",
                title: "Get AI analysis",
                desc: "Claude AI analyzes your patterns, openings, tactics, and generates a coaching report.",
              },
              {
                step: "03",
                title: "Train and improve",
                desc: "Follow your study plan, solve targeted puzzles, and track your progress over time.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute top-6 left-1/2 hidden h-px w-full translate-x-6 bg-gradient-to-r from-amber-500/30 to-transparent md:block" />
                )}
                <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-sm font-bold text-amber-400 shadow-lg shadow-amber-500/10">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Free Beta CTA ───────────────────────────────── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-amber-500/5 blur-[80px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-amber-500/20 bg-white/3 p-px shadow-xl shadow-amber-500/5">
              {/* Shimmer border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 via-transparent to-amber-700/10" />
              <div className="relative rounded-2xl bg-zinc-950/80 p-8 text-center sm:p-12">
                <Badge className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-400">
                  Free During Beta
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  All features. Zero cost.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-zinc-400">
                  Everything is free while we build and improve. Get full access
                  to AI analysis, game import, puzzles, and study plans.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {[
                    "Unlimited AI analysis",
                    "Game import & viewer",
                    "All puzzle themes",
                    "Personalized study plans",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-amber-500" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/games" className="inline-block mt-10">
                  <Button
                    size="lg"
                    className="bg-amber-500 px-10 py-3 text-base font-bold text-black hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40 hover:scale-[1.02]"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Waitlist ────────────────────────────────────── */}
      <section className="relative border-t border-white/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-lg text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Stay in the loop
            </h2>
            <p className="mt-3 text-zinc-400">
              Get notified about new features, updates, and chess improvement tips.
            </p>
            <div className="mt-8 flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                placeholder="your@email.com"
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/50"
              />
              <Button
                onClick={handleWaitlist}
                className="h-11 bg-amber-500 px-5 font-semibold text-black hover:bg-amber-400"
              >
                Subscribe
              </Button>
            </div>
            {waitlistStatus === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-amber-400"
              >
                You are on the list! We will be in touch.
              </motion.p>
            )}
            {waitlistStatus === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-destructive"
              >
                Something went wrong. Please try again.
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Crown className="h-4 w-4 text-amber-500" />
              <span>AI Chess Coach</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
                Privacy
              </Link>
              <span>Powered by Claude AI &amp; Lichess</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
