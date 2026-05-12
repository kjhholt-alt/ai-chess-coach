# AI Chess Coach

Your AI Chess Coach -- Personalized Improvement from Your Games.

Live at **[chess.buildkit.store](https://chess.buildkit.store)**.

Import your Lichess games, get AI-powered analysis of your strengths and weaknesses, play against an AI opponent, solve targeted puzzles, and follow a personalized study plan.

Free to use -- no payments, no subscriptions.

## Features

- **Playable chess game** -- AI opponent (minimax + alpha-beta), PvP mode, 3 difficulty levels, save/resume
- **Game Import** -- Pull games directly from Lichess by username
- **Interactive Game Viewer** -- Step through games with keyboard navigation + evaluation graph
- **Game Analysis** -- Client-side analysis engine classifies every move (brilliant -> blunder)
- **AI Coaching** -- Claude streams personalized post-game feedback (strengths, mistakes, focus areas)
- **Puzzle Trainer** -- 60 curated puzzles, 3 modes (Daily 5 / Endless / Theme), Elo rating tracking
- **Opening Explorer** -- Lichess opening database with win/draw/loss percentages and AI advice
- **Repertoire Builder** -- Save your lines, drill them in quiz mode, track accuracy
- **Dashboard** -- Stats, accuracy trends, weakness radar, training streaks, 28 achievements
- **Auth** -- Email magic-link authentication via NextAuth.js + Resend

## Tech Stack

- Next.js 16 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion + Lucide icons
- chess.js + react-chessboard
- Claude (via vendored `claudex` -- runs on the Max subscription, no API key)
- NextAuth.js + Resend (magic link auth)
- Lichess API
- Vitest (131 tests across 11 files, 100% pass)
- Vercel deployment + Vercel Web Analytics

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in the values below
3. Install dependencies: `npm install`
4. Run the dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for magic-link emails |
| `NEXTAUTH_SECRET` | NextAuth.js session secret |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |

`claudex` invokes the local Claude CLI (`claude -p`) as a subprocess, so it picks up your existing Max-sub auth -- no `ANTHROPIC_API_KEY` is required for coaching/analysis.

## License

MIT
