import { z } from "zod";

export const FrontendEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  NEXT_PUBLIC_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Owner Project Control Platform"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default("en"),
  NEXT_PUBLIC_CURRENCY_DEFAULT: z.string().default("QAR")
});

export type FrontendEnv = z.infer<typeof FrontendEnvSchema>;
