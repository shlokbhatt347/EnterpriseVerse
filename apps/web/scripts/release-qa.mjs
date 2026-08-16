import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const app = resolve(scriptDir, "..");
const root = resolve(app, "../..");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const requiredFiles = [
  "app/page.tsx",
  "app/loading.tsx",
  "app/error.tsx",
  "app/not-found.tsx",
  "app/auth/signin/page.tsx",
  "app/auth/signup/page.tsx",
  "app/auth/recover/page.tsx",
  "app/start/page.tsx",
  "app/founder/page.tsx",
  "app/day1/page.tsx",
  "app/world/page.tsx",
  "app/intelligence/page.tsx",
  "app/learning/page.tsx",
  "app/competition/page.tsx",
  "app/competition/layout.tsx",
  "app/endgame/page.tsx",
  "app/experience/CanonicalShell.tsx",
  "app/experience/canonical-shell.css",
  "scripts/experience-qa.mjs",
  "scripts/architecture-qa.mjs",
  "scripts/polish-qa.mjs",
];

for (const relative of requiredFiles) check(existsSync(join(app, relative)), `Release-critical file is missing: ${relative}`);

const packagePath = join(root, "package.json");
check(existsSync(packagePath), "Root package manifest is missing.");
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  const scripts = pkg.scripts ?? {};
  for (const script of ["test:simulation", "typecheck:simulation", "typecheck:web", "check:api", "qa:experience", "qa:architecture", "qa:polish", "build:web"]) {
    check(typeof scripts[script] === "string", `Release check is missing package script: ${script}`);
  }
  check(typeof scripts.check === "string" && scripts.check.includes("qa:polish"), "Root check must include the complete Build 4 quality gate.");
}

const shell = readFileSync(join(app, "app", "experience", "CanonicalShell.tsx"), "utf8");
const shellCss = readFileSync(join(app, "app", "experience", "canonical-shell.css"), "utf8");
check(shell.includes("aria-current"), "Canonical navigation must expose active-page semantics.");
check(shell.includes("event.key === \"Escape\""), "Canonical navigation must support keyboard dismissal.");
check(shellCss.includes("prefers-reduced-motion:reduce"), "Canonical shell must respect reduced motion.");
check(!shellCss.includes("transition:all"), "Release build must not contain broad transition:all rendering rules.");

const competition = readFileSync(join(app, "app", "competition", "layout.tsx"), "utf8");
check(competition.includes("createCompetitionSimulation"), "Competition must retain its deterministic local projection boundary.");
check(competition.includes("server-authoritative") || competition.includes("server authoritative"), "Competition boundary must remain explicitly server-authoritative.");

const obsoleteWorkflow = join(root, ".github", "workflows", "phase24-one-time-fix.yml");
check(!existsSync(obsoleteWorkflow), "Obsolete Phase 24 repair workflow must remain removed.");

const errorBoundary = readFileSync(join(app, "app", "error.tsx"), "utf8");
const loadingBoundary = readFileSync(join(app, "app", "loading.tsx"), "utf8");
const notFound = readFileSync(join(app, "app", "not-found.tsx"), "utf8");
check(errorBoundary.includes("reset"), "Global error boundary must expose recovery.");
check(errorBoundary.includes("Return home"), "Global error boundary must expose a safe home path.");
check(loadingBoundary.includes("aria-busy=\"true\""), "Global loading state must expose busy semantics.");
check(notFound.includes("Return to EnterpriseVerse"), "Global not-found state must expose a recovery path.");

if (failures.length) {
  console.error(`Release QA failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Release QA passed: ${requiredFiles.length} release-critical files, package quality gate, canonical UX safeguards, Competition boundary, recovery states, and legacy workflow cleanup verified.`);
