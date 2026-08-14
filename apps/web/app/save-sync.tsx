"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "./auth-provider";

const SAVE_KEY = "enterpriseverse:active-business:v1";
const BACKGROUND_SYNC_INTERVAL_MS = 15_000;

export default function SaveSync() {
  const { mode, authReady, cloudReady, saveBusiness } = useAccount();
  const lastSynced = useRef("");

  useEffect(() => {
    if (!authReady || mode !== "email" || !cloudReady) return;
    let active = true;
    const sync = async () => {
      if (!active) return;
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
    const timer = window.setInterval(() => void sync(), BACKGROUND_SYNC_INTERVAL_MS);
    const onPageHide = () => { void sync(); };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [authReady, cloudReady, mode, saveBusiness]);

  return null;
}
