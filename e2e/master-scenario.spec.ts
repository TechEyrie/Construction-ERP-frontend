/**
 * README_33 master scenario — Playwright-shaped entry.
 * Ponytail: no Playwright dependency. Run:
 *   node ../e2e/run-master-acceptance.mjs
 * When @playwright/test is installed later, wrap the same assertions here.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const script = path.join(root, "e2e", "run-master-acceptance.mjs");
const r = spawnSync(process.execPath, [script], { stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
