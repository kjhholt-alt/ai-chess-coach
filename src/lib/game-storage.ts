/**
 * Game storage utilities using localStorage.
 * Handles both in-progress game persistence and completed game history.
 */

export interface SavedGame {
  id: string;
  pgn: string;
  moves: SavedMove[];
  metadata: GameMetadata;
  analysis?: GameAnalysis;
  coachingFeedback?: string;
}

export interface SavedMove {
  san: string;
  from: string;
  to: string;
  fen: string; // FEN after the move
  fenBefore: string; // FEN before the move
  piece: string;
  color: "w" | "b";
  flags: string;
  captured?: string;
}

export interface GameMetadata {
  date: string;
  playerColor: "white" | "black";
  opponentType: "human" | "ai";
  aiDifficulty?: string;
  result: "white" | "black" | "draw";
  resultReason: string; // checkmate, stalemate, resigned, etc.
  totalMoves: number;
  source: "local" | "lichess";
  lichessId?: string;
  opening?: string;
}

export interface MoveEvaluation {
  centipawns: number;
  bestMove: string;
  bestLine?: string;
  classification: MoveClassification;
  cpLoss: number;
}

export type MoveClassification =
  | "brilliant"
  | "great"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "book"
  | "forced";

export interface GameAnalysis {
  evaluations: (MoveEvaluation | null)[];
  summary: AnalysisSummary;
  analyzedAt: string;
}

export interface AnalysisSummary {
  accuracy: number;
  brilliant: number;
  great: number;
  good: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
}

// Keys
const CURRENT_GAME_KEY = "chess-coach-current-game";
const GAME_HISTORY_KEY = "chess-coach-game-history";
const PUZZLE_STATS_KEY = "chess-coach-puzzle-stats";
const USER_PROFILE_KEY = "chess-coach-user-profile";

// --- In-progress game (auto-save/restore) ---

export interface InProgressGame {
  pgn: string;
  gameMode: "pvp" | "ai";
  difficulty: string;
  playerColor: "white" | "black";
  gameStarted: boolean;
  timestamp: number;
}

export function saveCurrentGame(game: InProgressGame): void {
  try {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(game));
  } catch {
    console.warn("[game-storage] Failed to save current game");
  }
}

export function loadCurrentGame(): InProgressGame | null {
  try {
    const data = localStorage.getItem(CURRENT_GAME_KEY);
    if (!data) return null;
    const game = JSON.parse(data) as InProgressGame;
    // Expire after 24 hours
    if (Date.now() - game.timestamp > 24 * 60 * 60 * 1000) {
      clearCurrentGame();
      return null;
    }
    return game;
  } catch {
    return null;
  }
}

export function clearCurrentGame(): void {
  try {
    localStorage.removeItem(CURRENT_GAME_KEY);
  } catch {
    // ignore
  }
}

// --- Completed game history ---

export function saveCompletedGame(game: SavedGame): void {
  try {
    const history = getGameHistory();
    // Avoid duplicates
    if (history.some((g) => g.id === game.id)) return;
    history.unshift(game); // Most recent first
    // Keep max 100 games
    if (history.length > 100) history.pop();
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch {
    console.warn("[game-storage] Failed to save completed game");
  }
}

export function getGameHistory(): SavedGame[] {
  try {
    const data = localStorage.getItem(GAME_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedGame[];
  } catch {
    return [];
  }
}

export function getGameById(id: string): SavedGame | null {
  const history = getGameHistory();
  return history.find((g) => g.id === id) || null;
}

export function updateGame(id: string, updates: Partial<SavedGame>): void {
  try {
    const history = getGameHistory();
    const index = history.findIndex((g) => g.id === id);
    if (index === -1) return;
    history[index] = { ...history[index], ...updates };
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch {
    console.warn("[game-storage] Failed to update game");
  }
}

export function deleteGame(id: string): void {
  try {
    const history = getGameHistory().filter((g) => g.id !== id);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch {
    console.warn("[game-storage] Failed to delete game");
  }
}

// --- Puzzle stats ---

export interface PuzzleStats {
  totalAttempted: number;
  totalSolved: number;
  rating: number;
  currentStreak: number;
  bestStreak: number;
  themeAccuracy: Record<string, { correct: number; total: number }>;
  ratingHistory: { date: string; rating: number }[];
  lastSessionDate: string | null;
}

export function getPuzzleStats(): PuzzleStats {
  try {
    const data = localStorage.getItem(PUZZLE_STATS_KEY);
    if (!data) return getDefaultPuzzleStats();
    return JSON.parse(data) as PuzzleStats;
  } catch {
    return getDefaultPuzzleStats();
  }
}

function getDefaultPuzzleStats(): PuzzleStats {
  return {
    totalAttempted: 0,
    totalSolved: 0,
    rating: 1000,
    currentStreak: 0,
    bestStreak: 0,
    themeAccuracy: {},
    ratingHistory: [],
    lastSessionDate: null,
  };
}

export function savePuzzleStats(stats: PuzzleStats): void {
  try {
    localStorage.setItem(PUZZLE_STATS_KEY, JSON.stringify(stats));
  } catch {
    console.warn("[game-storage] Failed to save puzzle stats");
  }
}

// --- User profile ---

export interface UserProfile {
  lichessUsername?: string;
  lichessRating?: number;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  weaknessProfile: Record<string, number>; // theme -> frequency of mistakes
  trainingStreak: { dates: string[] }; // ISO date strings of training days
  achievements: string[]; // IDs of unlocked achievements
}

export function getUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(USER_PROFILE_KEY);
    if (!data) return getDefaultUserProfile();
    return JSON.parse(data) as UserProfile;
  } catch {
    return getDefaultUserProfile();
  }
}

function getDefaultUserProfile(): UserProfile {
  return {
    weaknessProfile: {},
    trainingStreak: { dates: [] },
    achievements: [],
  };
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    console.warn("[game-storage] Failed to save user profile");
  }
}

// --- Utility ---

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
