"use client";

interface MoveListProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export default function MoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
}: MoveListProps) {
  const movePairs: { number: number; white: string; black?: string }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 max-h-[480px] overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Moves
      </h3>
      <div className="space-y-1">
        {movePairs.map((pair) => (
          <div key={pair.number} className="flex items-center text-sm">
            <span className="w-8 text-gray-500 font-mono">{pair.number}.</span>
            <button
              onClick={() => onMoveClick((pair.number - 1) * 2)}
              className={`px-2 py-0.5 rounded font-mono transition-colors ${
                currentMoveIndex === (pair.number - 1) * 2
                  ? "bg-chess-accent text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {pair.white}
            </button>
            {pair.black && (
              <button
                onClick={() => onMoveClick((pair.number - 1) * 2 + 1)}
                className={`px-2 py-0.5 rounded font-mono transition-colors ${
                  currentMoveIndex === (pair.number - 1) * 2 + 1
                    ? "bg-chess-accent text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                {pair.black}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
