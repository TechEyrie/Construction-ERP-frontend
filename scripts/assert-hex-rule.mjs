import { writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** AC-02: prove raw hex in .tsx fails lint. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = path.join(root, "src", "__lint_hex_sample.tsx");
writeFileSync(sample, `export const bad = "#B8934A";\n`);
const result = spawnSync(process.execPath, [path.join(root, "node_modules", "eslint", "bin", "eslint.js"), sample], {
  encoding: "utf8",
  cwd: root
});
unlinkSync(sample);
const out = `${result.stdout || ""}${result.stderr || ""}`;
if (result.status === 0) {
  console.error("assert-hex-rule: expected eslint failure for raw hex");
  process.exit(1);
}
if (!out.toLowerCase().includes("hex") && !out.includes("token")) {
  console.error("assert-hex-rule: unexpected eslint output", out);
  process.exit(1);
}
console.log("assert-hex-rule: OK");
