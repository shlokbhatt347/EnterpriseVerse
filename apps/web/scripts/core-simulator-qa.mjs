import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "apps", "web", "app");
const foundation = fs.readFileSync(path.join(app, "core-simulator-premium.css"), "utf8");

const requiredRoutes = ["day1", "world", "enterprise", "intelligence", "learning", "competition", "endgame"];
const requiredTokens = ["--ev-core-max", "--ev-duration-fast", "--ev-duration-base", "--ev-ease-standard"];
const requiredStates = ["prefers-reduced-motion", ".selected", ":hover", ":focus"];

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

for (const token of requiredTokens) expect(foundation.includes(token), `missing shared token: ${token}`);
for (const state of requiredStates) expect(foundation.includes(state), `missing interaction state contract: ${state}`);
expect(foundation.includes("transition:transform") || foundation.includes("transition:\n    transform"), "core motion must use transform-aware transitions");
expect(!foundation.includes("transition:all"), "core simulator CSS must not use transition: all");
expect(foundation.includes("prefers-reduced-motion: reduce"), "reduced-motion contract is required");

for (const route of requiredRoutes) {
  const page = path.join(app, route, "page.tsx");
  expect(fs.existsSync(page), `missing simulator route: ${route}`);
}

const pageStyles = [
  "day1/day1.css",
  "world/world.css",
  "enterprise/enterprise.css",
  "intelligence/intelligence.css",
  "learning/learning.css",
  "competition/competition.css",
  "endgame/endgame.css",
];
for (const style of pageStyles) expect(fs.existsSync(path.join(app, style)), `missing page stylesheet: ${style}`);

const day1 = fs.readFileSync(path.join(app, "day1", "page.tsx"), "utf8");
expect(day1.includes("commitChoice"), "Day 1 must retain the canonical commit action");
expect(day1.includes("applyChoice"), "Day 1 must retain what-if simulation preview");
expect(day1.includes("buildDecisionDebrief"), "Day 1 must retain decision debrief behavior");

const competition = fs.readFileSync(path.join(app, "competition", "page.tsx"), "utf8");
expect(/server|realtime|room|supabase/i.test(competition), "Competition must retain its realtime/server boundary");

if (failures.length) {
  console.error(`Core simulator QA failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Core simulator QA passed: shared premium layer, required routes, interaction contracts, reduced motion and simulation boundaries are present.");
