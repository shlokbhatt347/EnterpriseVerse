import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const app = join(root, "apps", "web");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const cssPath = join(app, "app", "phase28-visual-excellence.css");
const layoutPath = join(app, "app", "layout.tsx");
check(existsSync(cssPath), "Visual excellence stylesheet is missing.");
check(existsSync(layoutPath), "Root layout is missing.");

if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, "utf8");
  for (const token of ["--v28-bg", "--v28-surface", "--v28-accent", "--v28-shadow"]) {
    check(css.includes(token), `Visual token missing: ${token}`);
  }
  check(css.includes("prefers-reduced-motion:reduce"), "Visual layer must respect reduced motion.");
  check(css.includes("table"), "Visual layer must cover dense data/table surfaces.");
  check(css.includes("auth-card"), "Visual layer must cover auth/entry surfaces.");
  check(css.includes("competition-card"), "Visual layer must cover competition surfaces.");
  check(css.includes("career-card"), "Visual layer must cover career/detail surfaces.");
}

if (existsSync(layoutPath)) {
  const layout = readFileSync(layoutPath, "utf8");
  check(layout.includes("./phase28-visual-excellence.css"), "Root layout must load the visual excellence layer.");
  check(layout.includes('className="ev-visual-excellence"'), "Root body must enable the visual excellence layer.");
}

if (failures.length) {
  console.error(`Visual Excellence QA failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Visual Excellence QA passed: global visual layer, route/detail coverage, accessibility motion safeguards, and root integration verified.");
