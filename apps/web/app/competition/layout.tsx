"use client";

import CanonicalShell from "../experience/CanonicalShell";
import { createCompetitionSimulation } from "./competition-sim";
import { getStoredUser } from "../lib/supabase-browser";
import type { SimulationState } from "@enterpriseverse/types";

export default function CompetitionLayout({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user) return <>{children}</>;

  // Competition has its own server-authoritative multiplayer state. The shell
  // only needs a stable local projection for navigation/KPI context; room and
  // round truth remains owned by the competition APIs and realtime channel.
  const state: SimulationState = createCompetitionSimulation("lobby", {
    userId: user.id,
    displayName: user.displayName ?? "Founder",
  });

  return <CanonicalShell state={state} syncStatus="ready">{children}</CanonicalShell>;
}
