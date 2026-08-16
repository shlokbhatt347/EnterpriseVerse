import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const app = resolve(scriptDir, "..");
const css = readFileSync(join(app, "app", "experience", "canonical-shell.css"), "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(css.includes("@media(max-width:900px)"), "Canonical shell must define a mobile breakpoint.");
check(css.includes("@media(max-width:560px)"), "Canonical shell must define a compact-mobile breakpoint.");
check(css.includes("prefers-reduced-motion:reduce"), "Canonical shell must honor reduced-motion preferences.");
check(css.includes("touch-action:manipulation"), "Canonical shell must optimize touch interaction targets.");
check(css.includes("transition:"), "Canonical shell should provide intentional micro-interaction transitions.");
check(css.includes("@keyframes ev-pulse"), "Live simulation state should have a restrained visual pulse.");
check(css.includes("contain:layout style"), "Canonical content should establish a lightweight rendering containment boundary.");
check(!css.includes("transition:all"), "Avoid broad transition:all rules that can cause unnecessary rendering work.");

if (failures.length) {
  console.error(`Polish QA failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Polish QA passed: responsive breakpoints, reduced motion, interaction polish, and rendering safeguards verified.");
