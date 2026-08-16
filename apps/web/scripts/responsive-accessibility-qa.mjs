import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const web = join(root, "apps", "web");
const app = join(web, "app");
const refinement = join(app, "ui-refinement.css");

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(existsSync(refinement), "ui-refinement.css must exist");
const css = existsSync(refinement) ? readFileSync(refinement, "utf8") : "";
const layout = readFileSync(join(app, "layout.tsx"), "utf8");

for (const token of [
  "prefers-reduced-motion",
  "forced-colors: active",
  "focus-visible",
  "--ev-touch-target",
  "@media (max-width: 760px)",
  "@media (max-width: 430px)",
  "@media (max-width: 375px)",
  "100dvh",
  "overscroll-behavior-inline",
]) {
  assert(css.includes(token), `responsive/accessibility contract missing: ${token}`);
}

assert(layout.includes('"./ui-refinement.css"'), "root layout must load the UI refinement layer");

for (const file of [
  "ui-foundation.css",
  "core-simulator-premium.css",
  "supporting-experience-premium.css",
]) {
  assert(existsSync(join(app, file)), `shared UI layer missing: ${file}`);
}

const routes = [
  ["day1", "Core simulator"],
  ["world", "Core simulator"],
  ["enterprise", "Core simulator"],
  ["intelligence", "Core simulator"],
  ["learning", "Core simulator"],
  ["competition", "Core simulator"],
  ["endgame", "Core simulator"],
  ["strategy", "Supporting experience"],
  ["play", "Supporting experience"],
  ["company", "Supporting experience"],
  ["career", "Supporting experience"],
  ["auth/signin", "Authentication"],
  ["auth/signup", "Authentication"],
  ["start", "Entry"],
  ["founder", "Entry"],
];

for (const [route, label] of routes) {
  const candidates = [
    join(app, route, "page.tsx"),
    join(app, route, "page.jsx"),
    join(app, route, "page.js"),
  ];
  assert(candidates.some(existsSync), `${label} route missing: /${route}`);
}

if (failures.length) {
  console.error(`Responsive/accessibility QA failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Responsive/accessibility QA passed: shared refinement, responsive breakpoints, focus states, reduced motion, forced colors, viewport-safe overlays, and canonical routes are present.");
