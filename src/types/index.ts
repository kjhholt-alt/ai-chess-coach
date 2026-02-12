export interface Game {
  id: string;
  white: string;
  black: string;
  result: "white" | "black" | "draw";
  opening: string;
  pgn: string;
  moves: string[];
  timeControl: string;
  date: string;
  userColor: "white" | "black";
}

export interface Analysis {
  overall: string;
  openings: {
    name: string;
    frequency: number;
    winRate: number;
    suggestion: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  topImprovements: {
    area: string;
    description: string;
    example: string;
  }[];
  studyPlan: string[];
}

export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}
