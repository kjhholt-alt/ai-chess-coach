# AI Chess Coach

Your AI Chess Coach -- Personalized Improvement from Your Games.

Import your Lichess games, get AI-powered analysis of your strengths and weaknesses, solve targeted puzzles, and follow a personalized study plan.

**Free during beta** -- all features available at no cost.

## Features

- **Game Import** -- Import games directly from Lichess by username
- **Interactive Game Viewer** -- Step through games on a chess board with move navigation
- **AI Analysis** -- Claude-powered deep analysis of your playing patterns
- **Puzzle Trainer** -- Solve puzzles from Lichess with hint and solution support
- **Auth** -- Email magic link authentication via NextAuth.js + Resend

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- chess.js + react-chessboard
- Anthropic Claude API
- NextAuth.js + Resend
- Lichess API

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your API keys
3. Install dependencies: `npm install`
4. Run the dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `RESEND_API_KEY` | Resend API key for magic links |
| `NEXTAUTH_SECRET` | NextAuth.js session secret |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |

## License

MIT
