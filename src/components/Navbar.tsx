"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Swords, Brain, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard/games", label: "Games", icon: Swords },
  { href: "/dashboard/analysis", label: "AI Analysis", icon: Brain },
  { href: "/dashboard/puzzles", label: "Puzzles", icon: Puzzle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Chess Coach
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
