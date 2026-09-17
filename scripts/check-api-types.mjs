import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "src/lib/api/schema.d.ts");
const localArtifact = path.join(root, "openapi/openapi-latest.json");
const siblingArtifact = path.resolve(root, "../opc-api/openapi/openapi-latest.json");

function resolveArtifact() {
  if (existsSync(localArtifact)) return localArtifact;
  if (existsSync(siblingArtifact)) return siblingArtifact;
  return null;
}

function main() {
  const artifact = resolveArtifact();
  if (!artifact) {
    console.error("API contract out of sync. Run 'pnpm run sync-api' and commit changes. (missing openapi-latest.json)");
    process.exit(1);
  }
  if (!existsSync(schemaPath)) {
    console.error("API contract out of sync. Run 'pnpm run sync-api' and commit changes.");
    process.exit(1);
  }

  const tmp = mkdtempSync(path.join(tmpdir(), "opc-check-types-"));
  const out = path.join(tmp, "schema.d.ts");
  const require = createRequire(import.meta.url);
  const pkgDir = path.dirname(require.resolve("openapi-typescript/package.json"));
  const bin = path.join(pkgDir, "bin/cli.js");
  const result = spawnSync(process.execPath, [bin, artifact, "-o", out], {
    encoding: "utf8",
    cwd: root
  });
  //  Good
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    rmSync(tmp, { recursive: true, force: true });
    process.exit(1);
  }

  const committed = readFileSync(schemaPath, "utf8").replace(/\r\n/g, "\n").trim();
  const generated = readFileSync(out, "utf8").replace(/\r\n/g, "\n").trim();
  rmSync(tmp, { recursive: true, force: true });

  if (committed !== generated) {
    console.error("API contract out of sync. Run 'pnpm run sync-api' and commit changes.");
    process.exit(1);
  }
  console.log("check-api-types: OK");
}

main();
