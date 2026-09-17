import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** README_11 AC-01/02/03: tokens locked + eslint rejects hex + Tailwind colors. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eslintBin = path.join(root, "node_modules", "eslint", "bin", "eslint.js");

function runEslint(file) {
  return spawnSync(process.execPath, [eslintBin, file], { encoding: "utf8", cwd: root });
}

function expectLintFail(code, needle) {
  const sample = path.join(root, "src", `__lint_sample_${Date.now()}.tsx`);
  writeFileSync(sample, code);
  const result = runEslint(sample);
  unlinkSync(sample);
  const out = `${result.stdout || ""}${result.stderr || ""}`;
  if (result.status === 0) {
    console.error("assert-token-lint: expected failure for", needle);
    process.exit(1);
  }
  if (!out.toLowerCase().includes(needle.toLowerCase()) && !out.includes("forbidden")) {
    console.error("assert-token-lint: unexpected output", out);
    process.exit(1);
  }
}

const tokens = readFileSync(path.join(root, "src", "styles", "tokens.css"), "utf8");
const checks = [
  ["--ink-950: #0a1622", /--ink-950:\s*#0a1622/i],
  ["--slate-50: #faf8f4", /--slate-50:\s*#faf8f4/i],
  ["--gold-500: #b8934a", /--gold-500:\s*#b8934a/i]
];
for (const [label, re] of checks) {
  if (!re.test(tokens)) {
    console.error("assert-token-lint: AC-01 fail", label);
    process.exit(1);
  }
}

expectLintFail(`export const bad = "#FF0000";\n`, "hex");
expectLintFail(`export const bad = "text-blue-500";\n`, "Tailwind");
expectLintFail(`export const bad = "bg-gray-100";\n`, "Tailwind");

console.log("assert-token-lint: OK");
