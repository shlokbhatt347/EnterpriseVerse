import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const app = join(root, "apps", "web", "app");
const required = [
  "ui-foundation.css",
  "core-simulator-premium.css",
  "supporting-experience-premium.css",
  "ui-refinement.css",
  "ui-world-class.css",
  "layout.tsx",
];

const routes = [
  "page.tsx",
  "day1/page.tsx",
  "world/page.tsx",
  "enterprise/page.tsx",
  "intelligence/page.tsx",
  "learning/page.tsx",
  "competition/page.tsx",
  "endgame/page.tsx",
  "strategy/page.tsx",
  "play/page.tsx",
  "company/page.tsx",
  "career/page.tsx",
  "account/page.tsx",
  "auth/signin/page.tsx",
  "auth/signup/page.tsx",
  "auth/recover/page.tsx",
  "auth/reset/page.tsx",
  "auth/verified/page.tsx",
  "start/page.tsx",
  "founder/page.tsx",
];

const failures = [];
for (const file of required) {
  if (!existsSync(join(app, file))) failures.push(`missing shared UI file: ${file}`);
}
for (const route of routes) {
  if (!existsSync(join(app, route))) failures.push(`missing audited route: ${route}`);
}

const layout = readFileSync(join(app, "layout.tsx"), "utf8");
if (!layout.includes('import "./ui-world-class.css";')) {
  failures.push("final polish layer is not loaded by the root layout");
}

const polish = readFileSync(join(app, "ui-world-class.css"), "utf8");
const requiredContracts = [
  "prefers-reduced-motion",
  "forced-colors",
  "focus-visible",
  "touch-action",
  "@media print",
  "min-height: 44px",
];
for (const contract of requiredContracts) {
  if (!polish.includes(contract)) failures.push(`missing final UI contract: ${contract}`);
}

if (/animation\s*:\s*[^;]*infinite/i.test(polish)) {
  failures.push("final polish layer introduces an unbounded animation");
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (!packageJson.scripts?.["qa:world-class-ui"]) {
  failures.push("qa:world-class-ui is not registered in package scripts");
}
if (!packageJson.scripts?.check?.includes("qa:world-class-ui")) {
  failures.push("world-class UI QA is not part of the full check pipeline");
}

if (failures.length) {
  console.error("World-class UI QA FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`World-class UI QA PASSED — ${routes.length} audited routes, shared polish contracts present, and final QA is wired into pnpm check.`);
