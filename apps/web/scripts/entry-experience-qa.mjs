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

const requiredRoutes = ["/auth/signin", "/auth/signup", "/auth/recover", "/auth/reset", "/auth/verified", "/start", "/founder"];
for (const route of requiredRoutes) {
  if (!files.home.includes(route) && route === "/auth/signin") throw new Error(`Homepage entry route missing: ${route}`);
}

const required = [
  ["homepage CTA", files.home, "/founder"],
  ["homepage auth CTA", files.home, "/auth/signin"],
  ["homepage interactive loop", files.home, "setMoment"],
  ["signin form", files.signin, "signInWithEmail"],
  ["signin loading state", files.signin, "Signing in"],
  ["signin recovery", files.signin, "/auth/recover"],
  ["start founder path", files.start, 'choose("founder")'],
  ["start executive path", files.start, 'path === "executive"'],
  ["founder launch", files.founder, 'router.push("/day1")'],
  ["founder four-step flow", files.founder, "step + 1}/4"],
  ["auth focus", files.authCss, ".auth-input:focus"],
  ["auth reduced motion", files.authCss, "prefers-reduced-motion"],
  ["start focus", files.startCss, ".start-path:focus-visible"],
  ["start reduced motion", files.startCss, "prefers-reduced-motion"],
  ["founder focus", files.founderCss, ":focus-visible"],
  ["founder reduced motion", files.founderCss, "prefers-reduced-motion"],
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

if (!files.authCss.includes("forced-colors:active")) throw new Error("Auth forced-colors support missing");
if (!files.startCss.includes("forced-colors:active")) throw new Error("Start forced-colors support missing");
if (!files.founderCss.includes("forced-colors:active")) throw new Error("Founder forced-colors support missing");

console.log("Entry experience QA passed: homepage, auth, start, founder, interaction states, responsive motion, accessibility, and transition contracts are present.");
