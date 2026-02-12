"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  Save,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserProfile, saveUserProfile, type UserProfile } from "@/lib/game-storage";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const experienceLevels = [
  { value: "beginner", label: "Beginner", desc: "Still learning the basics (< 1000 Elo)" },
  { value: "intermediate", label: "Intermediate", desc: "Know tactics, working on strategy (1000-1600)" },
  { value: "advanced", label: "Advanced", desc: "Solid player looking for an edge (1600+)" },
] as const;

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lichessUsername, setLichessUsername] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    setLichessUsername(p.lichessUsername || "");
    setExperienceLevel(p.experienceLevel || "intermediate");
  }, []);

  const handleSave = () => {
    if (!profile) return;
    setSaving(true);

    const updated: UserProfile = {
      ...profile,
      lichessUsername: lichessUsername.trim() || undefined,
      experienceLevel,
    };

    saveUserProfile(updated);
    setProfile(updated);

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 300);
  };

  const handleClearData = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "This will clear all your game history, puzzle stats, and achievements. This cannot be undone. Continue?"
      );
      if (confirmed) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalGames = profile.achievements?.length || 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your chess coaching experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Lichess Username
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Link your Lichess account to import games and track your online rating
              </p>
              <Input
                value={lichessUsername}
                onChange={(e) => setLichessUsername(e.target.value)}
                placeholder="your-lichess-username"
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <Separator className="bg-border/50" />

            <div>
              <label className="text-sm font-medium text-foreground">
                Experience Level
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                This helps tailor puzzle difficulty and coaching feedback
              </p>
              <div className="space-y-2">
                {experienceLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      experienceLevel === level.value
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-border hover:bg-accent/50"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        experienceLevel === level.value
                          ? "border-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {experienceLevel === level.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{level.label}</span>
                      <p className="text-xs text-muted-foreground">
                        {level.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-2xl font-bold">{totalGames}</span>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {profile.trainingStreak?.dates?.length || 0}
                </span>
                <p className="text-xs text-muted-foreground">Training Days</p>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {Object.keys(profile.weaknessProfile || {}).length}
                </span>
                <p className="text-xs text-muted-foreground">Themes Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-400">
              <Shield className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Clear all local data including game history, puzzle stats,
              achievements, and settings. This cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={handleClearData}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pb-8">
          <p>AI Chess Coach — Free Beta</p>
          <p>
            <a
              href="https://lichess.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Powered by Lichess <ExternalLink className="h-3 w-3" />
            </a>
            {" & "}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Claude AI <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
