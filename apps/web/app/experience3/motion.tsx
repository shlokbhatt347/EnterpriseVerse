'use client';

import type { ReactNode } from 'react';

export const evMotion = {
  duration: { instant: 80, fast: 140, base: 220, deliberate: 360, emphasis: 520 },
  easing: { standard: 'cubic-bezier(0.2, 0, 0, 1)', entrance: 'cubic-bezier(0.16, 1, 0.3, 1)', exit: 'cubic-bezier(0.7, 0, 0.84, 0)' },
} as const;

export function MotionReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`ev-motion-reveal ${className}`}>{children}</div>;
}

export function Pressable({ children, className = '', disabled = false, onClick }: { children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" className={`ev-pressable ${className}`} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function StateTransition({ state, children }: { state: 'idle' | 'loading' | 'success' | 'warning' | 'error'; children: ReactNode }) {
  return <div data-state={state} className="ev-state-transition" aria-live={state === 'success' || state === 'error' ? 'polite' : undefined}>{children}</div>;
}
