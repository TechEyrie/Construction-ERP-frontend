import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/** AC-07: fail if backend secrets leak into client chunks. */
const BANNED = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(js|json|html)$/.test(name)) out.push(full);
  }
  return out;
}

const root = path.resolve(".next");
const files = walk(root);
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const token of BANNED) {
    if (text.includes(token)) {
      console.error(`check-bundle-secrets: found ${token} in ${file}`);
      process.exit(1);
    }
  }
}
console.log(`check-bundle-secrets: OK (${files.length} files)`);
