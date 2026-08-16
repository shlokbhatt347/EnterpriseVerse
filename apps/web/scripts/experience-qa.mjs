import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const app = resolve(scriptDir, "..");
const appRoutes = join(app, "app");

const requiredRoutes = [
  ["/", "page.tsx"],
  ["/auth/signin", "page.tsx"],
  ["/auth/signup", "page.tsx"],
  ["/day1", "page.tsx"],
  ["/world", "page.tsx"],
  ["/intelligence", "page.tsx"],
  ["/learning", "page.tsx"],
  ["/competition", "page.tsx"],
  ["/endgame", "page.tsx"],
];

const canonicalPages = [
  "day1/page.tsx",
  "world/page.tsx",
  "intelligence/page.tsx",
  "learning/page.tsx",
  "endgame/page.tsx",
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const [route, file] of requiredRoutes) {
  check(existsSync(join(appRoutes, route.slice(1), file)), `Missing route entry: ${route}`);
}

const shellPath = join(appRoutes, "experience", "CanonicalShell.tsx");
const shellCssPath = join(appRoutes, "experience", "canonical-shell.css");
check(existsSync(shellPath), "Missing CanonicalShell implementation.");
check(existsSync(shellCssPath), "Missing CanonicalShell stylesheet.");

if (existsSync(shellPath) && existsSync(shellCssPath)) {
  const shell = readFileSync(shellPath, "utf8");
  const shellCss = readFileSync(shellCssPath, "utf8");

  check(shell.includes('aria-current={active(href) ? "page" : undefined}'), "CanonicalShell must expose aria-current on the active navigation item.");
  check(shell.includes("event.key === \"Escape\""), "CanonicalShell must support Escape to close mobile navigation.");
  check(shell.includes("/world"), "CanonicalShell navigation must include World.");
  check(shell.includes("/competition"), "CanonicalShell navigation must include Competition.");
  check(shellCss.includes("@media(max-width:900px)"), "CanonicalShell must define a mobile breakpoint.");
  check(shellCss.includes("prefers-reduced-motion:reduce"), "CanonicalShell must honor reduced-motion preferences.");
}

for (const relativePath of canonicalPages) {
  const file = join(appRoutes, relativePath);
  if (!existsSync(file)) continue;
  const source = readFileSync(file, "utf8");
  check(source.includes("CanonicalShell"), `${relativePath} must render through CanonicalShell.`);
}

const competitionPath = join(appRoutes, "competition", "page.tsx");
if (existsSync(competitionPath)) {
  const competition = readFileSync(competitionPath, "utf8");
  check(competition.includes("competition-browser"), "Competition must retain its multiplayer browser adapter.");
  check(competition.includes("subscribeToCompetitionRoom"), "Competition must retain realtime room synchronization.");
}

if (failures.length) {
  console.error(`Experience QA failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Experience QA passed: ${requiredRoutes.length} route contracts, canonical shell accessibility/mobile checks, ${canonicalPages.length} canonical surfaces, and Competition multiplayer contracts verified.`);
