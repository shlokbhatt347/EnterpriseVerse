import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const required = [
  "apps/web/app/supporting-experience-premium.css",
  "apps/web/app/layout.tsx",
  "apps/web/app/strategy/page.tsx",
  "apps/web/app/play/page.tsx",
  "apps/web/app/company/page.tsx",
  "apps/web/app/career/page.tsx",
  "apps/web/app/command-palette.tsx",
  "apps/web/app/account-menu.css",
  "apps/web/app/notification-center.css",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing supporting UI asset: ${file}`);
}

const css = fs.readFileSync(path.join(root, "apps/web/app/supporting-experience-premium.css"), "utf8");
const contracts = [
  ["shared premium tokens", /--ui4-bg:|--ui4-accent:/],
  ["button interaction states", /:hover\{|:active\{|:focus-visible\{/],
  ["strategy polish", /\.strategy-shell|\.strategy-card/],
  ["company polish", /\.company-shell|\.company-card/],
  ["career polish", /\.career-shell|\.career-card/],
  ["play polish", /\.play-shell|\.decision-option/],
  ["command palette polish", /\.command-panel|\.command-result/],
  ["account utility polish", /\.account-popover|\.account-action/],
  ["notification utility polish", /\.notification-panel|\.notification-item/],
  ["responsive contract", /@media\(max-width:900px\)|@media\(max-width:620px\)/],
  ["reduced motion", /prefers-reduced-motion/],
];

for (const [name, pattern] of contracts) {
  if (!pattern.test(css)) throw new Error(`Missing UI Build 4 contract: ${name}`);
}

const layout = fs.readFileSync(path.join(root, "apps/web/app/layout.tsx"), "utf8");
if (!layout.includes('"./supporting-experience-premium.css"')) {
  throw new Error("Supporting premium layer is not loaded by the root layout.");
}

console.log(`Supporting experience QA passed: ${required.length} assets and ${contracts.length} UI contracts verified.`);
