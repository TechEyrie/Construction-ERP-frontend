import { z } from "zod";

/** Shared envelope parsers (BR-06 / Rule R4). Input typed as unknown — never any. */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        issue: z.string()
      })
    )
    .optional()
});

export const ApiMetaSchema = z.object({
  requestId: z.string().min(1),
  timestamp: z.string().optional(),
  pagination: z
    .object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      totalRecords: z.number().int().nonnegative(),
      totalPages: z.number().int().positive()
    })
    .optional()
});

export function createEnvelopeParser<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    meta: ApiMetaSchema,
    error: ApiErrorSchema.nullable()
  });
}

export const PublicConfigDataSchema = z.object({
  environment: z.string(),
  storageDriver: z.string(),
  defaultCurrency: z.string(),
  defaultLocale: z.string(),
  maxUploadSizeBytes: z.number().int()
});

export type PublicConfigData = z.infer<typeof PublicConfigDataSchema>;

export const PublicConfigEnvelopeSchema = createEnvelopeParser(PublicConfigDataSchema);

export const SchemaDiffDataSchema = z.object({
  isSynchronized: z.boolean(),
  registeredPathsCount: z.number().int(),
  registeredSchemasCount: z.number().int(),
  specHash: z.string(),
  generatedAt: z.string()
});

export type SchemaDiffData = z.infer<typeof SchemaDiffDataSchema>;

export const SchemaDiffEnvelopeSchema = createEnvelopeParser(SchemaDiffDataSchema);

export function parseEnvelope<S extends z.ZodTypeAny>(schema: S, payload: unknown): z.infer<S> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error("API envelope parse failed", parsed.error.flatten());
    throw new Error("API_RESPONSE_INVALID");
  }
  return parsed.data;
}
