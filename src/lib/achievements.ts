/**
 * Achievements system - gamification badges for chess improvement.
 */

import { getGameHistory, getPuzzleStats, getUserProfile, saveUserProfile } from "./game-storage";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  category: "games" | "analysis" | "puzzles" | "streak" | "milestone";
  check: () => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Games
  {
    id: "first_game",
    name: "First Steps",
    description: "Play your first game",
    icon: "gamepad",
    category: "games",
    check: () => getGameHistory().length >= 1,
  },
  {
    id: "five_games",
    name: "Getting Started",
    description: "Play 5 games",
    icon: "swords",
    category: "games",
    check: () => getGameHistory().length >= 5,
  },
  {
    id: "ten_games",
    name: "Regular Player",
    description: "Play 10 games",
    icon: "trophy",
    category: "games",
    check: () => getGameHistory().length >= 10,
  },
  {
    id: "twenty_five_games",
    name: "Dedicated Player",
    description: "Play 25 games",
    icon: "crown",
    category: "games",
    check: () => getGameHistory().length >= 25,
  },
  {
    id: "first_win",
    name: "First Victory",
    description: "Win your first game",
    icon: "trophy",
    category: "games",
    check: () => {
      const games = getGameHistory();
      return games.some(
        (g) => g.metadata.result === g.metadata.playerColor
      );
    },
  },
  {
    id: "win_streak_3",
    name: "Hot Streak",
    description: "Win 3 games in a row",
    icon: "flame",
    category: "games",
    check: () => {
      const games = getGameHistory();
      let streak = 0;
      for (const game of games) {
        if (game.metadata.result === game.metadata.playerColor) {
          streak++;
          if (streak >= 3) return true;
        } else {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: "checkmate_win",
    name: "Checkmate Master",
    description: "Win a game by checkmate",
    icon: "target",
    category: "games",
    check: () => {
      const games = getGameHistory();
      return games.some(
        (g) =>
          g.metadata.resultReason === "checkmate" &&
          g.metadata.result === g.metadata.playerColor
      );
    },
  },

  // Analysis
  {
    id: "first_analysis",
    name: "Self-Improvement",
    description: "Analyze your first game",
    icon: "brain",
    category: "analysis",
    check: () => {
      const games = getGameHistory();
      return games.some((g) => g.analysis != null);
    },
  },
  {
    id: "accuracy_90",
    name: "Accuracy King",
    description: "Score 90%+ accuracy in a game",
    icon: "star",
    category: "analysis",
    check: () => {
      const games = getGameHistory();
      return games.some((g) => g.analysis && g.analysis.summary.accuracy >= 90);
    },
  },
  {
    id: "accuracy_95",
    name: "Near Perfect",
    description: "Score 95%+ accuracy in a game",
    icon: "zap",
    category: "analysis",
    check: () => {
      const games = getGameHistory();
      return games.some((g) => g.analysis && g.analysis.summary.accuracy >= 95);
    },
  },
  {
    id: "zero_blunders",
    name: "Blunder Free",
    description: "Play a game with zero blunders",
    icon: "shield",
    category: "analysis",
    check: () => {
      const games = getGameHistory();
      return games.some(
        (g) => g.analysis && g.analysis.summary.blunders === 0 && g.moves.length >= 10
      );
    },
  },
  {
    id: "brilliant_move",
    name: "Brilliant Mind",
    description: "Play a brilliant move",
    icon: "lightbulb",
    category: "analysis",
    check: () => {
      const games = getGameHistory();
      return games.some(
        (g) => g.analysis && g.analysis.summary.brilliant > 0
      );
    },
  },

  // Puzzles
  {
    id: "puzzle_starter",
    name: "Puzzle Starter",
    description: "Solve 10 puzzles",
    icon: "puzzle",
    category: "puzzles",
    check: () => getPuzzleStats().totalSolved >= 10,
  },
  {
    id: "puzzle_addict",
    name: "Puzzle Addict",
    description: "Solve 50 puzzles",
    icon: "puzzle",
    category: "puzzles",
    check: () => getPuzzleStats().totalSolved >= 50,
  },
  {
    id: "puzzle_master",
    name: "Puzzle Master",
    description: "Solve 100 puzzles",
    icon: "puzzle",
    category: "puzzles",
    check: () => getPuzzleStats().totalSolved >= 100,
  },
  {
    id: "fork_specialist",
    name: "Fork Specialist",
    description: "Solve 20 fork puzzles",
    icon: "git-fork",
    category: "puzzles",
    check: () => {
      const stats = getPuzzleStats();
      const forkStats = stats.themeAccuracy["fork"];
      return forkStats ? forkStats.correct >= 20 : false;
    },
  },
  {
    id: "puzzle_streak_5",
    name: "Sharp Eye",
    description: "Solve 5 puzzles in a row",
    icon: "eye",
    category: "puzzles",
    check: () => getPuzzleStats().bestStreak >= 5,
  },
  {
    id: "puzzle_streak_10",
    name: "Unstoppable",
    description: "Solve 10 puzzles in a row",
    icon: "flame",
    category: "puzzles",
    check: () => getPuzzleStats().bestStreak >= 10,
  },
  {
    id: "puzzle_rating_1200",
    name: "Rising Tactician",
    description: "Reach 1200 puzzle rating",
    icon: "trending-up",
    category: "puzzles",
    check: () => getPuzzleStats().rating >= 1200,
  },
  {
    id: "puzzle_rating_1500",
    name: "Tactical Expert",
    description: "Reach 1500 puzzle rating",
    icon: "award",
    category: "puzzles",
    check: () => getPuzzleStats().rating >= 1500,
  },

  // Streaks
  {
    id: "streak_3",
    name: "Committed",
    description: "Train 3 days in a row",
    icon: "calendar",
    category: "streak",
    check: () => getCurrentStreak() >= 3,
  },
  {
    id: "streak_7",
    name: "Streak Master",
    description: "Train 7 days in a row",
    icon: "calendar",
    category: "streak",
    check: () => getCurrentStreak() >= 7,
  },
  {
    id: "streak_14",
    name: "Two Weeks Strong",
    description: "Train 14 days in a row",
    icon: "calendar",
    category: "streak",
    check: () => getCurrentStreak() >= 14,
  },
  {
    id: "streak_30",
    name: "Monthly Champion",
    description: "Train 30 days in a row",
    icon: "medal",
    category: "streak",
    check: () => getCurrentStreak() >= 30,
  },
];

/**
 * Calculate the current consecutive training streak.
 */
export function getCurrentStreak(): number {
  const profile = getUserProfile();
  const dates = profile.trainingStreak.dates.sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // If today or yesterday isn't in the list, streak is 0
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const current = new Date(dates[i - 1]);
    const previous = new Date(dates[i]);
    const diff = (current.getTime() - previous.getTime()) / 86400000;
    if (diff <= 1.5) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Check all achievements and return newly unlocked ones.
 */
export function checkAchievements(): Achievement[] {
  const profile = getUserProfile();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (profile.achievements.includes(achievement.id)) continue;
    try {
      if (achievement.check()) {
        profile.achievements.push(achievement.id);
        newlyUnlocked.push(achievement);
      }
    } catch {
      // Silently skip failed checks
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUserProfile(profile);
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with their unlock status.
 */
export function getAllAchievements(): (Achievement & { unlocked: boolean })[] {
  const profile = getUserProfile();
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: profile.achievements.includes(a.id),
  }));
}
