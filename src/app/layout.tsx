import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chess Coach — Personalized Improvement from Your Games",
  description:
    "Get AI-powered analysis of your chess games, custom puzzles, and a personalized study plan to improve faster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-chess-bg text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
