"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "./auth-provider";

const SAVE_KEY = "enterpriseverse:active-business:v1";

export default function SaveSync() {
  const { mode, saveBusiness } = useAccount();
  const lastSynced = useRef("");

  useEffect(() => {
    if (mode !== "google") return;
    const sync = async () => {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw || raw === lastSynced.current) return;
        const value = JSON.parse(raw) as unknown;
        await saveBusiness(SAVE_KEY, value);
        lastSynced.current = raw;
      } catch {
        // Keep local-first behavior. A later interval retries automatically.
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 1500);
    return () => window.clearInterval(timer);
  }, [mode, saveBusiness]);

  return null;
}
