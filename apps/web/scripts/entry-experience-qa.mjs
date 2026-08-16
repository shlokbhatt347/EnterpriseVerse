import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const files = {
  home: read("apps/web/app/page.tsx"),
  homeCss: read("apps/web/app/homepage.css"),
  authCss: read("apps/web/app/auth/auth-shell.css"),
  signin: read("apps/web/app/auth/signin/page.tsx"),
  start: read("apps/web/app/start/page.tsx"),
  startCss: read("apps/web/app/start/start.css"),
  founder: read("apps/web/app/founder/page.tsx"),
  founderCss: read("apps/web/app/founder/founder.css"),
};

const required = [
  ["homepage founder CTA", files.home, "/founder"],
  ["homepage sign-in CTA", files.home, "/auth/signin"],
  ["homepage interactive loop", files.home, "setMoment"],
  ["signin authentication", files.signin, "signInWithEmail"],
  ["signin loading state", files.signin, "Signing in"],
  ["signin recovery", files.signin, "/auth/recover"],
  ["start founder path", files.start, 'choose("founder")'],
  ["start executive path", files.start, 'path === "executive"'],
  ["founder launch", files.founder, 'router.push("/day1")'],
  ["founder four-step flow", files.founder, "step + 1}/4"],
  ["auth focus", files.authCss, ".auth-input:focus"],
  ["auth reduced motion", files.authCss, "prefers-reduced-motion"],
  ["auth forced colors", files.authCss, "forced-colors:active"],
  ["start focus", files.startCss, ".start-path:focus-visible"],
  ["start reduced motion", files.startCss, "prefers-reduced-motion"],
  ["start forced colors", files.startCss, "forced-colors:active"],
  ["founder focus", files.founderCss, ":focus-visible"],
  ["founder reduced motion", files.founderCss, "prefers-reduced-motion"],
  ["founder forced colors", files.founderCss, "forced-colors:active"],
  ["homepage reduced motion", files.homeCss, "prefers-reduced-motion"],
];

for (const [label, content, needle] of required) {
  if (!content.includes(needle)) throw new Error(`Entry experience contract missing: ${label}`);
}

for (const [label, content] of Object.entries(files)) {
  if (content.includes("transition: all") || content.includes("transition-property: all")) {
    throw new Error(`Forbidden expensive transition found in ${label}`);
  }
}

console.log("Entry experience QA passed: homepage, auth, start, founder, interaction states, responsive motion, accessibility, and transition contracts are present.");
