"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Brain, Puzzle, Gamepad2, History, BarChart3, LayoutDashboard, BookOpen, Download, FolderTree, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/play", label: "Play", icon: Gamepad2 },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/analysis", label: "Analysis", icon: Brain },
  { href: "/dashboard/puzzles", label: "Puzzles", icon: Puzzle },
  { href: "/dashboard/openings", label: "Openings", icon: BookOpen },
  { href: "/dashboard/repertoire", label: "Repertoire", icon: FolderTree },
  { href: "/dashboard/import", label: "Import", icon: Download },
  { href: "/dashboard/progress", label: "Progress", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = (link as any).exact
                ? pathname === link.href
                : pathname.startsWith(link.href) && link.href !== "/dashboard";
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
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/dashboard/settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Settings</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = (link as any).exact
                ? pathname === link.href
                : pathname.startsWith(link.href) && link.href !== "/dashboard";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard/settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
