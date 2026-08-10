"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "./auth-provider";

const SAVE_KEY = "enterpriseverse:active-business:v1";

export default function SaveSync() {
  const { mode, authReady, saveBusiness } = useAccount();
  const lastSynced = useRef("");

  useEffect(() => {
    if (!authReady || mode !== "email") return;
    const sync = async () => {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw || raw === lastSynced.current) return;
        await saveBusiness(SAVE_KEY, JSON.parse(raw) as unknown);
        lastSynced.current = raw;
      } catch {
        // A later retry keeps local-first gameplay resilient to transient network failures.
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 5000);
    return () => window.clearInterval(timer);
  }, [authReady, mode, saveBusiness]);

  return null;
}
