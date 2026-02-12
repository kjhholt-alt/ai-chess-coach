"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                Chess Coach
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: February 11, 2026
        </p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p>
              AI Chess Coach collects minimal data. Your game data, puzzle
              statistics, settings, and achievements are stored locally in your
              browser&apos;s localStorage. We do not collect or store this data
              on our servers.
            </p>
            <p>
              If you join our waitlist, we store your email address. We do not
              sell or share email addresses with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p>
              Waitlist emails are used solely to notify you about product
              updates and new features. You can unsubscribe at any time.
            </p>
            <p>
              When you use AI analysis or coaching features, your game data
              (PGN, moves) is sent to the Claude AI API for processing. This
              data is used only to generate your coaching feedback and is not
              stored by us after the response is returned.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Data Storage
            </h2>
            <p>
              All user data (games, stats, settings) is stored in your
              browser&apos;s localStorage. This data stays on your device and is
              not transmitted to our servers. Clearing your browser data will
              remove all stored information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Lichess API</strong> — for
                importing games and opening data. Subject to Lichess&apos;s
                privacy policy.
              </li>
              <li>
                <strong className="text-foreground">
                  Claude AI (Anthropic)
                </strong>{" "}
                — for generating coaching feedback and game analysis. Subject to
                Anthropic&apos;s privacy policy.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — for
                hosting. Subject to Vercel&apos;s privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Cookies
            </h2>
            <p>
              We use essential cookies for authentication (if you sign in). We
              do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Data Retention
            </h2>
            <p>
              Waitlist email addresses are retained until you request removal or
              unsubscribe. localStorage data persists until you clear your
              browser data or use the &ldquo;Clear All Data&rdquo; option in
              Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p>
              You can delete all your locally stored data at any time through
              the Settings page. To request removal of your waitlist email,
              contact us via our GitHub repository.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              8. Security
            </h2>
            <p>
              We implement rate limiting on all API endpoints. All data in
              transit is encrypted via HTTPS. Since user data is stored locally,
              it benefits from your browser&apos;s built-in security model.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              9. Children
            </h2>
            <p>
              AI Chess Coach does not knowingly collect data from children under
              13. If you believe a child has provided personal information,
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. Changes will be
              posted on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              11. Contact
            </h2>
            <p>
              For privacy-related questions, please reach out through our GitHub
              repository.
            </p>
          </section>
        </div>
      </motion.div>

      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex justify-between text-xs text-muted-foreground">
          <span>AI Chess Coach</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
