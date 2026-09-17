import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const out = path.join(root, "src/lib/api/schema.d.ts");
const artifactCopy = path.join(root, "openapi/openapi-latest.json");
const siblingArtifact = path.resolve(root, "../opc-api/openapi/openapi-latest.json");
const openApiUrl = process.env.OPENAPI_URL || process.env.OPC_API_OPENAPI_URL || "http://127.0.0.1:4000/openapi.json";

async function loadSpec() {
  try {
    const res = await fetch(openApiUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { spec: await res.json(), source: openApiUrl };
  } catch (err) {
    if (existsSync(siblingArtifact)) {
      return { spec: JSON.parse(readFileSync(siblingArtifact, "utf8")), source: siblingArtifact };
    }
    if (existsSync(artifactCopy)) {
      return { spec: JSON.parse(readFileSync(artifactCopy, "utf8")), source: artifactCopy };
    }
    console.error(
      `Unable to connect to ${openApiUrl}. Ensure opc-api is running or set OPENAPI_URL. Existing schema.d.ts preserved.`
    );
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

async function main() {
  const prev = existsSync(out) ? readFileSync(out, "utf8") : null;
  const { spec, source } = await loadSpec();
  if (!spec?.openapi || !String(spec.openapi).startsWith("3.")) {
    console.error("Invalid OpenAPI document (expected 3.x)");
    process.exit(1);
  }

  mkdirSync(path.dirname(artifactCopy), { recursive: true });
  writeFileSync(artifactCopy, `${JSON.stringify(spec, null, 2)}\n`);

  const tmpSpec = path.join(root, "openapi/openapi-latest.json");
  const require = createRequire(import.meta.url);
  const pkgDir = path.dirname(require.resolve("openapi-typescript/package.json"));
  const bin = path.join(pkgDir, "bin/cli.js");
  const result = spawnSync(process.execPath, [bin, tmpSpec, "-o", out], {
    encoding: "utf8",
    cwd: root
  });
  if (result.status !== 0) {
    if (prev !== null) writeFileSync(out, prev);
    console.error(result.stderr || result.stdout || "openapi-typescript failed");
    process.exit(1);
  }

  // drop stamp; types are the contract now
  const stamp = path.join(root, "src/lib/api/openapi.stamp.json");
  if (existsSync(stamp)) {
    writeFileSync(stamp, JSON.stringify({ note: "deprecated — use schema.d.ts from openapi-typescript", source }, null, 2));
  }

  console.log(`sync-api: OK from ${source} → ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
