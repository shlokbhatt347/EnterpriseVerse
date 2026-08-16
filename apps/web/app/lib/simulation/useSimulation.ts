"use client";

import { useCallback, useEffect, useState } from "react";
import { advanceDay, applyChoice, createBusiness } from "@enterpriseverse/simulation";
import type { BusinessStructure, SimulationChoice, SimulationState } from "@enterpriseverse/types";
import { useAccount } from "../../auth-provider";

export const ACTIVE_SAVE_KEY = "enterpriseverse:active-business:v1";

export type SimulationStatus = "loading" | "ready" | "saving" | "error";

export function useSimulation() {
  const { authReady, loadBusiness, saveBusiness } = useAccount();
  const [state, setState] = useState<SimulationState | null>(null);
  const [status, setStatus] = useState<SimulationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    setStatus("loading");
    void loadBusiness<SimulationState>(ACTIVE_SAVE_KEY)
      .then((saved) => {
        if (!active) return;
        setState(saved);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setError("Your enterprise could not be loaded. Try again.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [authReady, loadBusiness]);

  const persist = useCallback(async (next: SimulationState) => {
    setState(next);
    setStatus("saving");
    setError(null);
    try {
      await saveBusiness(ACTIVE_SAVE_KEY, next);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Your latest change could not be synced. Local progress is preserved.");
    }
  }, [saveBusiness]);

  const start = useCallback(async (input: {
    name: string;
    idea: string;
    industry: string;
    structure: BusinessStructure;
    founderNames: string[];
  }) => {
    const next = createBusiness(input);
    await persist(next);
    return next;
  }, [persist]);

  const commitChoice = useCallback(async (choice: SimulationChoice) => {
    if (!state) return null;
    const next = applyChoice(state, choice);
    await persist(next);
    return next;
  }, [persist, state]);

  const endDay = useCallback(async () => {
    if (!state) return null;
    const next = advanceDay(state);
    await persist(next);
    return next;
  }, [persist, state]);

  return { state, status, error, start, commitChoice, endDay };
}
