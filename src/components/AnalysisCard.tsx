import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export default function AnalysisCard({
  title,
  icon: Icon,
  children,
}: AnalysisCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 transition-colors hover:border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
