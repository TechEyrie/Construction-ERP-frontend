import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sw = readFileSync(path.join(root, "public/sw.js"), "utf8");
assert.match(sw, /\/api\//);
assert.match(sw, /never cache|network-only|Never cache/i);
assert.ok(!/cache\.put\([^\)]*api/i.test(sw), "SW must not put API responses in cache");

for (const f of ["icon-192.png", "icon-512.png", "icon-512-maskable.png"]) {
  assert.ok(existsSync(path.join(root, "public/icons", f)), `missing icon ${f}`);
}

const manifestSrc = readFileSync(path.join(root, "src/app/manifest.ts"), "utf8");
assert.match(manifestSrc, /short_name:\s*"OPC"/);
assert.match(manifestSrc, /display:\s*"standalone"/);
assert.match(manifestSrc, /theme_color:\s*"#0F1E2E"/);

const banner = readFileSync(
  path.join(root, "src/components/feedback/OfflineBanner.tsx"),
  "utf8"
);
assert.match(banner, /You are offline/);

const shell = readFileSync(path.join(root, "src/lib/shell/shellState.ts"), "utf8");
assert.match(shell, /healthz/);

const uiCss = readFileSync(path.join(root, "src/styles/ui.css"), "utf8");
assert.match(uiCss, /\.opc-shell--offline[\s\S]*\.opc-btn--gold/, "offline must disable gold CTAs");

console.log("test-pwa: OK");
