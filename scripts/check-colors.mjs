#!/usr/bin/env node
/**
 * Counts colours that ignore the light/dark theme: hex/rgb literals and
 * fixed-white text/fills outside `dark:` variants. Fails if the count rises
 * above scripts/color-baseline.json. After removing some, run with
 * --update to lower the baseline.
 *
 * Allowed: src/index.css (token source), *.save.jsx (dead), and any line
 * marked `theme-ok` (a colour that is intentionally the same in both themes,
 * e.g. white text on a purple button or on a photo).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const BASELINE = join(ROOT, "scripts", "color-baseline.json");

const PATTERNS = [
  // hex or rgb() literal, but not inside a dark: variant class
  /(?<!dark:[\w:-]*)(?:#[0-9a-fA-F]{3,8}\b|rgba?\()/g,
  // fixed white/black text and white-alpha classes outside dark: variants
  /(?<![\w:/[-])(?:hover:|focus:|group-hover:)?(?:text-white|text-black|bg-white\/\d+|border-white\/\d+)(?![\w-])/g,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name) && !name.includes(".save.")) out.push(p);
  }
  return out;
}

const perFile = {};
let total = 0;
for (const file of walk(SRC)) {
  let n = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.includes("theme-ok")) continue;
    for (const re of PATTERNS) n += (line.match(re) || []).length;
  }
  if (n) perFile[relative(ROOT, file)] = n;
  total += n;
}

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, JSON.stringify({ total }, null, 2) + "\n");
  console.log(`Baseline set to ${total}.`);
  process.exit(0);
}

const top = Object.entries(perFile).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log(`Theme-unaware colours: ${total}`);
for (const [f, n] of top) console.log(`  ${String(n).padStart(4)}  ${f}`);

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")).total : Infinity;
if (total > baseline) {
  console.error(`\nUp from the baseline of ${baseline}. Use theme tokens (text-ink, bg-ps-surface, …) or mark an intentional fixed colour with a theme-ok comment.`);
  process.exit(1);
}
console.log(`Baseline: ${baseline}. OK.`);
