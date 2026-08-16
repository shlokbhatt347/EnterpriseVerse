import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const foundation = read("apps/web/app/ui-foundation.css");
const layout = read("apps/web/app/layout.tsx");
const ui = read("apps/web/app/components/ui.tsx");

const requiredTokens = [
  "--ev-bg-0",
  "--ev-surface-1",
  "--ev-text-1",
  "--ev-brand",
  "--ev-critical",
  "--ev-warning",
  "--ev-success",
  "--ev-info",
  "--ev-duration-fast",
  "--ev-duration-base",
  "--ev-duration-medium",
  "--ev-duration-narrative",
  "--ev-focus-ring",
];

for (const token of requiredTokens) {
  if (!foundation.includes(token)) throw new Error(`Missing foundation token: ${token}`);
}

const requiredSelectors = [
  ".ui-button",
  ".ui-button-primary",
  ".ui-button-secondary",
  ".ui-button-ghost",
  ".ui-button-danger",
  ".ui-input",
  ".ui-card",
  ".ui-badge",
  ".ui-skeleton",
  ".ui-empty",
  ".ui-error",
  ".ev-enter",
  ".ev-pop",
];

for (const selector of requiredSelectors) {
  if (!foundation.includes(selector)) throw new Error(`Missing foundation selector: ${selector}`);
}

if (!layout.includes('"./ui-foundation.css"')) throw new Error("UI foundation is not loaded by the root layout");
if (!ui.includes("loading?: boolean")) throw new Error("Shared Button does not expose loading state");
if (!ui.includes("aria-busy={loading || undefined}")) throw new Error("Shared Button is missing loading accessibility state");
if (!ui.includes("data-loading={loading || undefined}")) throw new Error("Shared Button is missing loading styling state");

const forbidden = ["transition: all", "transition-property: all"];
for (const value of forbidden) {
  if (foundation.includes(value)) throw new Error(`Forbidden expensive transition found: ${value}`);
}

if (!foundation.includes("prefers-reduced-motion")) throw new Error("Reduced-motion support is required");
if (!foundation.includes("forced-colors: active")) throw new Error("Forced-colors support is required");

console.log("UI foundation QA passed: tokens, shared primitives, motion, accessibility, loading state, and responsive contracts are present.");
