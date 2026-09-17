import { getApiBaseUrl } from "@/lib/api/baseUrl";
import {
  parseEnvelope,
  PublicConfigEnvelopeSchema,
  SchemaDiffEnvelopeSchema,
  type PublicConfigData,
  type SchemaDiffData
} from "./parsers";

export async function fetchPublicConfig(): Promise<PublicConfigData> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/config/public`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error(`config/public HTTP ${res.status}`);
  const json: unknown = await res.json();
  const envelope = parseEnvelope(PublicConfigEnvelopeSchema, json);
  if (!envelope.success || envelope.data === null) throw new Error("config/public unsuccessful");
  return envelope.data;
}

export async function fetchSchemaDiff(token: string): Promise<SchemaDiffData> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/schemas/diff`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`schemas/diff HTTP ${res.status}`);
  const json: unknown = await res.json();
  const envelope = parseEnvelope(SchemaDiffEnvelopeSchema, json);
  if (!envelope.success || envelope.data === null) throw new Error("schemas/diff unsuccessful");
  return envelope.data;
}
