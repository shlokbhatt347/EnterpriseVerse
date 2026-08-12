"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "./command-palette.css";

type Command = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Navigate" | "Act";
  keywords: string;
};

const commands: Command[] = [
  { id: "home", title: "Executive home", subtitle: "Your personal EnterpriseVerse command center", href: "/", group: "Navigate", keywords: "home dashboard overview simulator" },
  { id: "company", title: "Company workspace", subtitle: "Teams, approvals, departments and company history", href: "/company", group: "Navigate", keywords: "company team approvals finance marketing operations" },
  { id: "world", title: "Executive world", subtitle: "Market pulse, risks, competitors and decisions", href: "/world", group: "Navigate", keywords: "world market competitors economy crisis" },
  { id: "career", title: "Career center", subtitle: "Profile, reputation, recruitment and opportunities", href: "/career", group: "Navigate", keywords: "career profile jobs recruiting reputation skills" },
  { id: "strategy", title: "Strategy", subtitle: "Funding, investors, governance and corporate moves", href: "/strategy", group: "Navigate", keywords: "strategy funding investor board acquisition merger" },
  { id: "competition", title: "Competition", subtitle: "Create or join a live multiplayer competition", href: "/competition", group: "Navigate", keywords: "competition room multiplayer leaderboard friends" },
  { id: "learning", title: "Learning", subtitle: "Turn company decisions into learning insights", href: "/learning", group: "Navigate", keywords: "learning education lessons insight" },
  { id: "endgame", title: "Legacy & endgame", subtitle: "Season, rankings, achievements and company legacy", href: "/endgame", group: "Navigate", keywords: "endgame legacy season rankings hall fame" },
  { id: "intelligence", title: "Enterprise intelligence", subtitle: "AI-assisted business intelligence and explanation", href: "/intelligence", group: "Navigate", keywords: "ai intelligence advisor analytics why" },
  { id: "account", title: "Profile & settings", subtitle: "Account, privacy and preferences", href: "/account", group: "Navigate", keywords: "profile settings privacy security" },
  { id: "enterprise", title: "Build or join a business", subtitle: "Founder and executive paths", href: "/enterprise", group: "Act", keywords: "build business join company founder executive" },
  { id: "start", title: "Choose how to play", subtitle: "Founder, executive or explore", href: "/start", group: "Act", keywords: "onboarding founder ceo executive explore" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands
      .filter((command) => `${command.title} ${command.subtitle} ${command.keywords}`.toLowerCase().includes(value))
      .sort((a, b) => {
        const aTitle = a.title.toLowerCase().startsWith(value) ? 0 : 1;
        const bTitle = b.title.toLowerCase().startsWith(value) ? 0 : 1;
        return aTitle - bTitle;
      });
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
      if (shortcut || slash) {
        event.preventDefault();
        setOpen(true);
        setSelectedIndex(0);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter" && results[selectedIndex]) {
        event.preventDefault();
        window.location.assign(results[selectedIndex].href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [query, open]);

  return (
    <>
      <button
        type="button"
        className="command-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open EnterpriseVerse command palette"
      >
        <span>⌘K</span>
        <span>Search EnterpriseVerse</span>
      </button>

      {open && (
        <div className="command-overlay" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="command-panel" role="dialog" aria-modal="true" aria-label="EnterpriseVerse command palette" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-search-row">
              <span aria-hidden="true">⌕</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, career, simulation, competition…"
                aria-label="Search EnterpriseVerse"
              />
              <button type="button" className="command-escape" onClick={() => setOpen(false)} aria-label="Close command palette">Esc</button>
            </div>

            <div className="command-results" role="listbox" aria-label="EnterpriseVerse actions">
              {results.length ? (
                <>
                  {(["Navigate", "Act"] as const).map((group) => {
                    const groupResults = results.filter((item) => item.group === group);
                    if (!groupResults.length) return null;
                    return (
                      <div key={group} className="command-group">
                        <div className="command-group-label">{group}</div>
                        {groupResults.map((item) => {
                          const globalIndex = results.indexOf(item);
                          const active = globalIndex === selectedIndex;
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={`command-result ${active ? "active" : ""}`}
                              role="option"
                              aria-selected={active}
                              onClick={() => setOpen(false)}
                            >
                              <span className="command-result-icon" aria-hidden="true">{group === "Act" ? "＋" : "→"}</span>
                              <span className="command-result-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                              <span className="command-result-arrow" aria-hidden="true">↵</span>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="command-empty">
                  <strong>No matching destination</strong>
                  <span>Try “company”, “CFO”, “competition”, “career” or “market”.</span>
                </div>
              )}
            </div>

            <footer className="command-footer">
              <span><b>↑↓</b> navigate</span>
              <span><b>Enter</b> open</span>
              <span><b>Esc</b> close</span>
              <span><b>⌘K</b> anywhere</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
