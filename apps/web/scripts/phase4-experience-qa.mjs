import fs from "node:fs";

const required = [
  "apps/web/app/phase4/page.tsx",
  "apps/web/app/phase4/phase4.css",
  "packages/simulation/src/phase4-projection.ts",
  "packages/simulation/src/phase4-intelligence.ts",
  "packages/simulation/src/phase4-intelligence.test.ts",
  "docs/phase4-strategic-player-experience.md",
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) { console.error(`Phase 4 experience gate failed: missing ${missing.join(", ")}`); process.exit(1); }
const page = fs.readFileSync("apps/web/app/phase4/page.tsx", "utf8");
const css = fs.readFileSync("apps/web/app/phase4/phase4.css", "utf8");
const projection = fs.readFileSync("packages/simulation/src/phase4-projection.ts", "utf8");
const intelligence = fs.readFileSync("packages/simulation/src/phase4-intelligence.ts", "utf8");
for (const [name, text, tokens] of [
  ["page", page, ["useSimulation", "buildPhase4IntelligenceReport", "buildPhase4StrategicPlan", "DECISION CENTRE"]],
  ["css", css, ["phase4-page", "@media(max-width:640px)", "prefers-reduced-motion"]],
  ["projection", projection, ["projectPhase4State", "Phase4Confidence", "source"]],
  ["intelligence", intelligence, ["buildPhase4IntelligenceReport", "buildPhase4DecisionBriefs", "buildPhase4StrategicPlan", "buildPhase4Timeline"]],
]) {
  const absent = tokens.filter((token) => !text.includes(token));
  if (absent.length) { console.error(`Phase 4 ${name} gate failed: missing ${absent.join(", ")}`); process.exit(1); }
}
console.log("Phase 4 experience gate passed: projection, intelligence, decisions, history and responsive command centre are present.");
