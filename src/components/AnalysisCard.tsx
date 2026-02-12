interface AnalysisCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

export default function AnalysisCard({
  title,
  icon,
  children,
}: AnalysisCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-chess-accent/50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
