import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Chess Coach — Personalized Improvement from Your Games",
    template: "%s | AI Chess Coach",
  },
  description:
    "Get AI-powered analysis of your chess games, custom puzzles, and a personalized study plan to improve faster. Import from Lichess, get Claude AI coaching feedback.",
  keywords: [
    "chess",
    "chess coach",
    "AI chess",
    "chess analysis",
    "chess puzzles",
    "chess improvement",
    "lichess",
    "chess training",
    "opening explorer",
    "chess repertoire",
  ],
  openGraph: {
    title: "AI Chess Coach — Your Personal AI Chess Trainer",
    description:
      "Import your Lichess games, get AI-powered analysis, solve targeted puzzles, and follow a personalized study plan.",
    type: "website",
    siteName: "AI Chess Coach",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chess Coach — Your Personal AI Chess Trainer",
    description:
      "AI-powered chess analysis, puzzles, and coaching. Free during beta.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
