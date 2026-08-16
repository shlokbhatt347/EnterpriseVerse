import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const app = resolve(scriptDir, "..");
const root = resolve(app, "../..");
const routes = [
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

for (const route of routes) {
  const file = join(app, "app", route);
  check(existsSync(file), `Missing canonical route: ${route}`);
  if (!existsSync(file)) continue;
  const source = readFileSync(file, "utf8");
  check(source.includes("CanonicalShell"), `${route} must use CanonicalShell.`);
  check(source.includes("useSimulation"), `${route} must use the canonical simulation adapter.`);
  check(!source.includes("localStorage") && !source.includes("sessionStorage"), `${route} must not own browser simulation persistence.`);
}

const competitionLayout = join(app, "app", "competition", "layout.tsx");
check(existsSync(competitionLayout), "Competition must retain its canonical shell layout.");
if (existsSync(competitionLayout)) {
  const source = readFileSync(competitionLayout, "utf8");
  check(source.includes("CanonicalShell"), "Competition layout must use CanonicalShell.");
  check(!source.includes("sessionStorage") && !source.includes("localStorage"), "Competition shell layout must not duplicate multiplayer persistence.");
  check(source.includes("createCompetitionSimulation"), "Competition shell must retain a deterministic local projection.");
}

check(!existsSync(join(root, ".github", "workflows", "phase24-one-time-fix.yml")), "Obsolete Phase 24 one-time repair workflow must be removed.");

if (failures.length) {
  console.error(`Architecture QA failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Architecture QA passed: ${routes.length} canonical surfaces, Competition shell boundary, and legacy workflow cleanup verified.`);
