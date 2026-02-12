"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { signIn } = await import("next-auth/react");
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard/games",
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-md border-border/50 bg-card/50">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
                We sent a magic link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in the email to sign in.
              </p>
              <Link href="/" className="mt-6 inline-block">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email to receive a magic link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="h-11 bg-secondary/50 border-border/50"
              />

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="h-11 w-full">
                Send Magic Link
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
