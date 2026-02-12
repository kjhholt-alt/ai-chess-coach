"use client";

import { useState } from "react";
import Link from "next/link";

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
      <div className="min-h-screen flex items-center justify-center bg-chess-bg px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <div className="text-4xl mb-4">&#9993;</div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Check Your Email
          </h1>
          <p className="text-gray-400 mb-6">
            We sent a magic link to <strong className="text-white">{email}</strong>.
            Click the link in the email to sign in.
          </p>
          <Link
            href="/"
            className="text-chess-accent hover:text-chess-accent-hover transition-colors text-sm"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-chess-bg px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">&#9822;</div>
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Enter your email to receive a magic link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-chess-accent focus:ring-1 focus:ring-chess-accent"
          />

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 bg-chess-accent hover:bg-chess-accent-hover text-white font-semibold rounded-lg transition-colors"
          >
            Send Magic Link
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
