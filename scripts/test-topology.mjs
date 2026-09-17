import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
assert.equal(existsSync(path.join(root, "pnpm-workspace.yaml")), false);
console.log("topology self-check: OK (no pnpm-workspace.yaml)");
