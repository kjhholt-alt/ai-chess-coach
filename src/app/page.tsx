"use client";

import { useState } from "react";
import Link from "next/link";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    icon: Swords,
    title: "Game Import",
    desc: "Import your games directly from Lichess. View them on an interactive board with full move-by-move navigation.",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    desc: "Get deep analysis of your playing patterns, openings, tactics, and endgames powered by Claude AI.",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
  {
    icon: Puzzle,
    title: "Puzzle Trainer",
    desc: "Solve puzzles targeted to your weak areas. Track your solve rate and sharpen your tactical vision.",
    gradient: "from-purple-500/10 to-purple-500/5",
  },
  {
    icon: TrendingUp,
    title: "Study Plans",
    desc: "Follow a personalized study plan built from your actual games. Know exactly what to work on next.",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
];

const benefits = [
  { icon: Zap, text: "Instant game analysis" },
  { icon: Shield, text: "Free during beta" },
  { icon: Brain, text: "AI-powered insights" },
  { icon: Puzzle, text: "Targeted puzzles" },
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
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Crown className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Chess Coach
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/games">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="sm">
                  Sign In
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-20 sm:pt-28">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 px-3 py-1.5 text-xs font-medium"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Free during beta — all features unlocked
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Your AI-Powered
              <br />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Chess Coach
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
            >
              Import your Lichess games, get AI-powered analysis of your
              strengths and weaknesses, solve targeted puzzles, and follow a
              personalized study plan.
            </motion.p>

            {/* Demo Input */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mt-10 max-w-md"
            >
              <div className="flex gap-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDemo()}
                  placeholder="Enter your Lichess username"
                  className="h-12 bg-secondary/50 border-border/50 text-base placeholder:text-muted-foreground/50"
                />
                <Button
                  onClick={handleDemo}
                  size="lg"
                  className="h-12 px-6 whitespace-nowrap"
                >
                  Analyze
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                No sign-up required — see your analysis in seconds
              </p>
            </motion.div>

            {/* Quick benefits */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
            >
              {benefits.map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <b.icon className="h-4 w-4 text-primary" />
                  {b.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to improve
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete toolkit for chess improvement, powered by AI and built
              around your actual games.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2"
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
                <Card className="group relative overflow-hidden border-border/50 bg-card/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <CardContent className="relative p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-y border-border/50 bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4">
              How it works
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Free Beta CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <Card className="relative mx-auto max-w-2xl overflow-hidden border-primary/20 glow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
              <CardContent className="relative p-8 sm:p-12 text-center">
                <Badge className="mb-6">Free During Beta</Badge>
                <h2 className="text-3xl font-bold tracking-tight">
                  All features. Zero cost.
                </h2>
                <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                  Everything is free while we build and improve. Get full
                  access to AI analysis, game import, puzzles, and study plans.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {[
                    "Unlimited AI analysis",
                    "Game import & viewer",
                    "All puzzle themes",
                    "Personalized study plans",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/games" className="inline-block mt-8">
                  <Button size="lg" className="px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-lg text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Stay in the loop
            </h2>
            <p className="mt-3 text-muted-foreground">
              Get notified about new features, updates, and chess improvement
              tips.
            </p>
            <div className="mt-8 flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                placeholder="your@email.com"
                className="h-11 bg-secondary/50 border-border/50"
              />
              <Button onClick={handleWaitlist} className="h-11 px-5">
                Subscribe
              </Button>
            </div>
            {waitlistStatus === "success" && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-primary"
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-primary" />
              <span>AI Chess Coach</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span>Powered by Claude AI & Lichess</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
