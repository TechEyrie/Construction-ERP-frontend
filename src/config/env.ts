import { FrontendEnvSchema, type FrontendEnv } from "./env.schema";

export type { FrontendEnv };

export function parseFrontendEnv(raw?: NodeJS.ProcessEnv): FrontendEnv {
  // Static NEXT_PUBLIC_* access so Next can inline values into the client bundle
  const source = raw ?? {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_CURRENCY_DEFAULT: process.env.NEXT_PUBLIC_CURRENCY_DEFAULT
  };
  const parsed = FrontendEnvSchema.safeParse(source);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid frontend env: ${msg}`);
  }
  return parsed.data;
}
