import assert from "node:assert/strict";
import { parseEnvelope, PublicConfigEnvelopeSchema } from "../src/lib/api/parsers.ts";

const ok = parseEnvelope(PublicConfigEnvelopeSchema, {
  success: true,
  data: {
    environment: "development",
    storageDriver: "local",
    defaultCurrency: "QAR",
    defaultLocale: "en",
    maxUploadSizeBytes: 26214400
  },
  meta: { requestId: "a8098c1a-f86e-11da-bd1a-00112444be1e", timestamp: "2026-09-15T16:30:00.000Z" },
  error: null
});
assert.equal(ok.data?.defaultCurrency, "QAR");

let threw = false;
try {
  parseEnvelope(PublicConfigEnvelopeSchema, { success: true, data: null });
} catch {
  threw = true;
}
assert.equal(threw, true);
console.log("parsers self-check: OK");
