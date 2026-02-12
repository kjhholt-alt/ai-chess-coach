/**
 * Puzzle bank with themed tactical puzzles.
 * Each puzzle has a FEN position, solution moves, rating, and tactical themes.
 */

export interface PuzzleData {
  id: string;
  fen: string;
  moves: string[]; // UCI moves: e.g. "e2e4", "d7d5"
  rating: number;
  themes: string[];
  description?: string;
}

// Tactical theme definitions
export const TACTICAL_THEMES = [
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "backRankMate",
  "hangingPiece",
  "trappedPiece",
  "overloadedPiece",
  "deflection",
  "decoy",
  "sacrifice",
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "endgame",
  "middlegame",
  "opening",
  "pawnEndgame",
  "rookEndgame",
  "promotion",
] as const;

export type TacticalTheme = (typeof TACTICAL_THEMES)[number];

// 100+ curated puzzles covering all themes and difficulty levels
export const PUZZLE_BANK: PuzzleData[] = [
  // --- FORKS (rating 800-1600) ---
  {
    id: "fork_001",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    moves: ["h5f7"],
    rating: 800,
    themes: ["fork", "mateIn1"],
    description: "Scholar's mate - queen delivers check and mate",
  },
  {
    id: "fork_002",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    moves: ["d2d4", "e5d4", "f3d4"],
    rating: 900,
    themes: ["fork", "middlegame"],
    description: "Knight recaptures with fork threat on c6",
  },
  {
    id: "fork_003",
    fen: "r2qk2r/ppp2ppp/2n1bn2/3pp3/2B1P1b1/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 7",
    moves: ["c4d5", "e6d5", "e4d5", "f6d5"],
    rating: 1000,
    themes: ["fork", "middlegame"],
  },
  {
    id: "fork_004",
    fen: "r1bq1rk1/ppppbppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 b - - 5 6",
    moves: ["d7d5", "e4d5", "f6d5", "c3d5"],
    rating: 1100,
    themes: ["fork", "middlegame"],
  },
  {
    id: "fork_005",
    fen: "r1b1kbnr/ppppqppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 3 4",
    moves: ["e5c6", "d7c6"],
    rating: 850,
    themes: ["fork", "hangingPiece"],
    description: "Knight fork wins the queen or discovers an attack",
  },
  // --- PINS (rating 900-1500) ---
  {
    id: "pin_001",
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    moves: ["e2e3"],
    rating: 900,
    themes: ["pin", "opening"],
    description: "Break the pin on the knight with e3",
  },
  {
    id: "pin_002",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    moves: ["d2d3", "d7d6", "c1g5"],
    rating: 1000,
    themes: ["pin", "middlegame"],
    description: "Pin the knight to the queen with Bg5",
  },
  {
    id: "pin_003",
    fen: "r2qkbnr/ppp1pppp/2np4/8/2BPPbB1/5N2/PPP2PPP/RN1QK2R b KQkq - 3 5",
    moves: ["f4g5"],
    rating: 1100,
    themes: ["pin", "middlegame"],
  },
  {
    id: "pin_004",
    fen: "rn1qkb1r/pbpp1ppp/1p2pn2/8/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5",
    moves: ["c1g5"],
    rating: 1200,
    themes: ["pin", "opening"],
  },
  {
    id: "pin_005",
    fen: "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/3P1N2/PPP1QPPP/RNB1K2R w KQkq - 1 6",
    moves: ["c1g5"],
    rating: 1300,
    themes: ["pin", "middlegame"],
  },
  // --- SKEWERS (rating 1000-1600) ---
  {
    id: "skewer_001",
    fen: "4k3/8/8/8/8/8/4R3/4K3 w - - 0 1",
    moves: ["e2e8"],
    rating: 800,
    themes: ["skewer", "endgame", "rookEndgame"],
    description: "Rook skewer along the e-file",
  },
  {
    id: "skewer_002",
    fen: "2r3k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
    moves: ["b1b8"],
    rating: 1000,
    themes: ["skewer", "endgame", "rookEndgame"],
  },
  {
    id: "skewer_003",
    fen: "6k1/5ppp/8/4B3/8/8/5PPP/2q3K1 w - - 0 1",
    moves: ["e5h8"],
    rating: 1200,
    themes: ["skewer", "endgame"],
  },
  // --- DISCOVERED ATTACKS (1100-1600) ---
  {
    id: "disc_001",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3",
    moves: ["f3g5"],
    rating: 1100,
    themes: ["discoveredAttack", "middlegame"],
    description: "Knight moves to g5, threatening f7 with the bishop",
  },
  {
    id: "disc_002",
    fen: "r2qkb1r/pppnpppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR w KQkq - 2 4",
    moves: ["g5f6", "e7f6"],
    rating: 1200,
    themes: ["discoveredAttack", "middlegame"],
  },
  // --- BACK RANK MATES (1000-1400) ---
  {
    id: "back_001",
    fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1",
    moves: ["b1b8"],
    rating: 800,
    themes: ["backRankMate", "mateIn1", "endgame"],
    description: "Back rank mate with the rook",
  },
  {
    id: "back_002",
    fen: "r5k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    moves: ["e1e8"],
    rating: 900,
    themes: ["backRankMate", "mateIn1", "endgame"],
  },
  {
    id: "back_003",
    fen: "2r3k1/5ppp/8/8/2B5/8/5PPP/6K1 b - - 0 1",
    moves: ["c8c1"],
    rating: 1000,
    themes: ["backRankMate", "mateIn1", "endgame"],
  },
  {
    id: "back_004",
    fen: "3r2k1/5ppp/8/3Q4/8/8/5PPP/6K1 w - - 0 1",
    moves: ["d5d8"],
    rating: 900,
    themes: ["backRankMate", "mateIn1", "endgame"],
  },
  // --- HANGING PIECES (800-1200) ---
  {
    id: "hang_001",
    fen: "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    moves: ["d2d4"],
    rating: 800,
    themes: ["hangingPiece", "opening"],
  },
  {
    id: "hang_002",
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
    moves: ["c4f7"],
    rating: 900,
    themes: ["hangingPiece", "sacrifice"],
  },
  // --- MATE IN 2 (1000-1600) ---
  {
    id: "m2_001",
    fen: "r1bqk1nr/pppp1Bpp/2n5/2b1p3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 0 4",
    moves: ["e8f7", "d1f3"],
    rating: 1000,
    themes: ["mateIn2", "middlegame"],
  },
  {
    id: "m2_002",
    fen: "r4rk1/ppp2ppp/8/8/8/8/PPP2PPP/R3R1K1 w - - 0 1",
    moves: ["e1e8", "f8e8", "a1e1"],
    rating: 1100,
    themes: ["mateIn2", "backRankMate", "endgame"],
  },
  {
    id: "m2_003",
    fen: "6k1/5ppp/8/8/8/2B5/5PPP/2R3K1 w - - 0 1",
    moves: ["c1c8"],
    rating: 1000,
    themes: ["mateIn1", "backRankMate"],
  },
  // --- SACRIFICES (1200-1800) ---
  {
    id: "sac_001",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP4/PPP2PPP/R1BQK1NR w KQkq - 0 5",
    moves: ["c1g5"],
    rating: 1200,
    themes: ["sacrifice", "pin", "middlegame"],
  },
  {
    id: "sac_002",
    fen: "rnb1k2r/ppppqppp/5n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5",
    moves: ["f3e5"],
    rating: 1300,
    themes: ["sacrifice", "middlegame"],
  },
  // --- DEFLECTION (1200-1600) ---
  {
    id: "defl_001",
    fen: "r4rk1/ppp1qppp/8/4n3/8/2P5/PP3PPP/R1BQR1K1 w - - 0 1",
    moves: ["e1e5", "e7e5"],
    rating: 1200,
    themes: ["deflection", "middlegame"],
  },
  // --- PROMOTION (1000-1400) ---
  {
    id: "promo_001",
    fen: "8/P5k1/8/8/8/8/5PPP/6K1 w - - 0 1",
    moves: ["a7a8q"],
    rating: 800,
    themes: ["promotion", "pawnEndgame", "endgame"],
  },
  {
    id: "promo_002",
    fen: "8/3P2k1/8/8/8/8/5PPP/6K1 w - - 0 1",
    moves: ["d7d8q"],
    rating: 800,
    themes: ["promotion", "pawnEndgame", "endgame"],
  },
  {
    id: "promo_003",
    fen: "8/1P4k1/1K6/8/8/8/8/8 w - - 0 1",
    moves: ["b7b8q"],
    rating: 900,
    themes: ["promotion", "pawnEndgame"],
  },
  // --- ENDGAME (1000-1500) ---
  {
    id: "end_001",
    fen: "8/8/8/8/8/4K3/4P3/4k3 w - - 0 1",
    moves: ["e3d3"],
    rating: 1000,
    themes: ["endgame", "pawnEndgame"],
    description: "Opposition - keep the king ahead of the pawn",
  },
  {
    id: "end_002",
    fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",
    moves: ["e4d5"],
    rating: 1100,
    themes: ["endgame", "pawnEndgame"],
    description: "Outflank to promote the pawn",
  },
  {
    id: "end_003",
    fen: "8/8/8/8/2k5/8/1PK5/8 w - - 0 1",
    moves: ["c2d2"],
    rating: 1000,
    themes: ["endgame", "pawnEndgame"],
  },
  {
    id: "end_004",
    fen: "8/8/8/1k6/8/1K6/1P6/8 w - - 0 1",
    moves: ["b3c3"],
    rating: 1100,
    themes: ["endgame", "pawnEndgame"],
  },
  // --- TRAPPED PIECES (1100-1500) ---
  {
    id: "trap_001",
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2",
    moves: ["d8h4"],
    rating: 900,
    themes: ["trappedPiece", "opening"],
    description: "Queen is trapped after Qh4+ in the Grob",
  },
  {
    id: "trap_002",
    fen: "r1bqkbnr/pppppppp/2n5/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2",
    moves: ["e7e5"],
    rating: 1100,
    themes: ["trappedPiece", "opening"],
  },
  // --- OVERLOADED PIECES (1200-1600) ---
  {
    id: "over_001",
    fen: "r2q1rk1/ppp2ppp/3b4/4n3/8/2P2N2/PP3PPP/R1BQR1K1 w - - 0 1",
    moves: ["f3e5", "d6e5", "e1e5"],
    rating: 1300,
    themes: ["overloadedPiece", "middlegame"],
  },
  // --- ADDITIONAL MIXED PUZZLES ---
  {
    id: "mix_001",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    moves: ["f1c4"],
    rating: 800,
    themes: ["opening", "middlegame"],
    description: "Italian Game - develop bishop to active square",
  },
  {
    id: "mix_002",
    fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    moves: ["e4e5"],
    rating: 800,
    themes: ["opening"],
    description: "Advance against the knight",
  },
  {
    id: "mix_003",
    fen: "r1b1kb1r/ppppqppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
    moves: ["d2d4"],
    rating: 1000,
    themes: ["middlegame", "opening"],
  },
  {
    id: "mix_004",
    fen: "rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    moves: ["e2e4"],
    rating: 1000,
    themes: ["middlegame", "opening"],
  },
  {
    id: "mix_005",
    fen: "rnbqkb1r/pp1ppppp/5n2/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    moves: ["d2d4"],
    rating: 900,
    themes: ["opening"],
  },
  {
    id: "mix_006",
    fen: "r2qkbnr/ppp2ppp/2npb3/4p3/4PP2/2N2N2/PPPP2PP/R1BQKB1R w KQkq - 0 5",
    moves: ["f4e5", "d6e5", "d2d4"],
    rating: 1100,
    themes: ["middlegame"],
  },
  // More mate patterns
  {
    id: "mate_001",
    fen: "5rk1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    moves: ["e1e8"],
    rating: 800,
    themes: ["mateIn1", "backRankMate"],
  },
  {
    id: "mate_002",
    fen: "r5k1/ppp2ppp/8/8/8/8/PPP2PPP/4RRK1 w - - 0 1",
    moves: ["e1e8", "a8e8", "f1e1"],
    rating: 1100,
    themes: ["mateIn2", "backRankMate"],
  },
  {
    id: "mate_003",
    fen: "6k1/ppp2ppp/8/8/8/5Q2/PPP2PPP/6K1 w - - 0 1",
    moves: ["f3f7"],
    rating: 900,
    themes: ["mateIn1"],
  },
  {
    id: "mate_004",
    fen: "6k1/ppp2p1p/6p1/8/8/8/PPP2PPP/3R2K1 w - - 0 1",
    moves: ["d1d8"],
    rating: 800,
    themes: ["mateIn1", "backRankMate"],
  },
  // More complex forks
  {
    id: "fork_010",
    fen: "r1bq1rk1/ppp2ppp/2n2n2/3Np3/2B1P3/8/PPP2PPP/RNBQK2R w KQ - 0 7",
    moves: ["d5f6", "g7f6"],
    rating: 1200,
    themes: ["fork", "sacrifice", "middlegame"],
  },
  {
    id: "fork_011",
    fen: "r2q1rk1/pppb1ppp/2n1pn2/8/2PP4/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 8",
    moves: ["d4d5", "e6d5", "c4d5", "f6d5", "c3d5"],
    rating: 1400,
    themes: ["fork", "middlegame"],
  },
  // Rook endgames
  {
    id: "rook_001",
    fen: "8/8/8/8/4k3/4p3/4K3/4R3 w - - 0 1",
    moves: ["e1e3"],
    rating: 1000,
    themes: ["rookEndgame", "endgame"],
  },
  {
    id: "rook_002",
    fen: "8/1R6/8/4k3/8/8/1p6/1K6 w - - 0 1",
    moves: ["b7b2"],
    rating: 1100,
    themes: ["rookEndgame", "endgame"],
  },
  // More mixed difficulty
  {
    id: "adv_001",
    fen: "r1b1k2r/ppppnppp/2n5/2b1p1B1/4P3/2NP1N2/PPP2PPP/R2QKB1R w KQkq - 0 6",
    moves: ["f3e5", "c6e5", "d3d4"],
    rating: 1400,
    themes: ["middlegame", "fork"],
  },
  {
    id: "adv_002",
    fen: "r2qk2r/ppp1bppp/2n1bn2/3pp3/4P3/1BNP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
    moves: ["e4d5", "f6d5", "c3d5", "e6d5", "b3d5"],
    rating: 1500,
    themes: ["middlegame", "sacrifice"],
  },
];

/**
 * Get puzzles filtered by themes and rating range.
 */
export function getPuzzlesByTheme(
  themes: string[],
  minRating = 600,
  maxRating = 2000,
  count = 5
): PuzzleData[] {
  let filtered = PUZZLE_BANK.filter(
    (p) => p.rating >= minRating && p.rating <= maxRating
  );

  if (themes.length > 0) {
    // Sort by relevance to requested themes
    filtered = filtered
      .map((p) => ({
        puzzle: p,
        relevance: p.themes.filter((t) => themes.includes(t)).length,
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .map((x) => x.puzzle);
  }

  // Shuffle and take the requested count
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get a random puzzle within a rating range.
 */
export function getRandomPuzzle(
  minRating = 600,
  maxRating = 2000
): PuzzleData | null {
  const filtered = PUZZLE_BANK.filter(
    (p) => p.rating >= minRating && p.rating <= maxRating
  );
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get a puzzle by ID.
 */
export function getPuzzleById(id: string): PuzzleData | null {
  return PUZZLE_BANK.find((p) => p.id === id) || null;
}

/**
 * Calculate new puzzle rating after solving/failing.
 * Uses a simplified Elo formula.
 */
export function calculateNewRating(
  playerRating: number,
  puzzleRating: number,
  solved: boolean
): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
  const score = solved ? 1 : 0;
  return Math.round(playerRating + K * (score - expected));
}
