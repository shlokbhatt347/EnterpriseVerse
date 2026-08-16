"use client";

import { useEffect, useMemo, useState } from "react";
import CanonicalShell from "../experience/CanonicalShell";
import { createCompetitionSimulation } from "./competition-sim";
import { getStoredUser } from "../lib/supabase-browser";
import type { SimulationState } from "@enterpriseverse/types";

const STORAGE_PREFIX = "enterpriseverse:competition-sim:v2:";

function readCompetitionState(userId: string, fallbackName: string): SimulationState {
  try {
    const keys = Object.keys(sessionStorage).filter((key) => key.startsWith(`${STORAGE_PREFIX}`) && key.endsWith(`:${userId}`));
    const latest = keys[keys.length - 1];
    if (latest) {
      const raw = sessionStorage.getItem(latest);
      if (raw) return JSON.parse(raw) as SimulationState;
    }
  } catch {
    // The canonical shell can safely fall back to a fresh local competition state.
  }
  return createCompetitionSimulation("lobby", { userId, displayName: fallbackName });
}

export default function CompetitionLayout({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  const userId = user?.id ?? "anonymous";
  const displayName = user?.displayName ?? "Founder";
  const [state, setState] = useState<SimulationState>(() => createCompetitionSimulation("lobby", { userId, displayName }));

  useEffect(() => {
    if (!user) return;
    const sync = () => setState(readCompetitionState(user.id, user.displayName ?? "Founder"));
    sync();
    window.addEventListener("enterpriseverse:competition-simulation", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("enterpriseverse:competition-simulation", sync);
      window.removeEventListener("storage", sync);
    };
  }, [user]);

  const syncStatus = useMemo(() => user ? "ready" as const : "error" as const, [user]);

  if (!user) return <>{children}</>;

  return <CanonicalShell state={state} syncStatus={syncStatus}>{children}</CanonicalShell>;
}
