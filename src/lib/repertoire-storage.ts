/**
 * Repertoire storage utilities.
 * Manages saved opening lines and quiz progress.
 */

export interface RepertoireMove {
  san: string;
  fen: string; // FEN after this move
  children: RepertoireMove[];
  annotation?: string;
}

export interface RepertoireLine {
  id: string;
  name: string;
  color: "white" | "black"; // Which color the user plays
  moves: RepertoireMove; // Tree root (dummy node, children are first moves)
  createdAt: string;
  quizStats: {
    attempts: number;
    correct: number;
    lastQuizzed: string | null;
  };
}

const REPERTOIRE_KEY = "chess-coach-repertoire";

export function getRepertoire(): RepertoireLine[] {
  try {
    const data = localStorage.getItem(REPERTOIRE_KEY);
    if (!data) return [];
    return JSON.parse(data) as RepertoireLine[];
  } catch {
    return [];
  }
}

export function saveRepertoire(lines: RepertoireLine[]): void {
  try {
    localStorage.setItem(REPERTOIRE_KEY, JSON.stringify(lines));
  } catch {
    console.warn("[repertoire] Failed to save");
  }
}

export function addRepertoireLine(line: RepertoireLine): void {
  const lines = getRepertoire();
  lines.push(line);
  saveRepertoire(lines);
}

export function updateRepertoireLine(id: string, updates: Partial<RepertoireLine>): void {
  const lines = getRepertoire();
  const index = lines.findIndex((l) => l.id === id);
  if (index === -1) return;
  lines[index] = { ...lines[index], ...updates };
  saveRepertoire(lines);
}

export function deleteRepertoireLine(id: string): void {
  const lines = getRepertoire().filter((l) => l.id !== id);
  saveRepertoire(lines);
}

export function generateRepertoireId(): string {
  return `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Find a move node in the tree matching a specific FEN.
 * Returns the node and its path.
 */
export function findMoveByFen(
  root: RepertoireMove,
  targetFen: string
): RepertoireMove | null {
  if (root.fen === targetFen) return root;
  for (const child of root.children) {
    const found = findMoveByFen(child, targetFen);
    if (found) return found;
  }
  return null;
}

/**
 * Get a flat list of all positions where the user should play.
 * Used for quiz mode.
 */
export function getQuizPositions(
  line: RepertoireLine
): { fenBefore: string; expectedSan: string; fen: string }[] {
  const positions: { fenBefore: string; expectedSan: string; fen: string }[] = [];
  const isUserTurn = (depth: number) =>
    line.color === "white" ? depth % 2 === 0 : depth % 2 === 1;

  function walk(node: RepertoireMove, depth: number, parentFen: string) {
    // If this move is at a depth where the user should play, add it
    if (isUserTurn(depth) && node.san !== "root") {
      positions.push({
        fenBefore: parentFen,
        expectedSan: node.san,
        fen: node.fen,
      });
    }
    for (const child of node.children) {
      walk(child, depth + 1, node.fen);
    }
  }

  for (const child of line.moves.children) {
    walk(child, 0, line.moves.fen);
  }

  return positions;
}
