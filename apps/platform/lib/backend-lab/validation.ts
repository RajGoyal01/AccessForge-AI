import { z } from "zod";
import { AppError } from "@/lib/errors";

const MAX_CONTRACT_BYTES = 12_000;
const safePathPattern = /^\/[a-z0-9][a-z0-9/_-]{0,119}$/i;

export const temporaryEndpointSchema = z.object({
  method: z.enum(["GET", "POST"]),
  path: z.string().trim().refine(
    (path) => safePathPattern.test(path) && !path.includes("//") && !path.includes(".."),
    "Endpoint paths must begin with / and use only letters, numbers, dashes, underscores, and slashes.",
  ),
  status: z.number().int().min(200).max(299).default(200),
  body: z.unknown().refine(
    (body) => JSON.stringify(body) !== undefined,
    "Endpoint responses must be JSON-serializable.",
  ),
}).strict();

export const temporaryBackendContractSchema = z.object({
  version: z.literal(1),
  endpoints: z.array(temporaryEndpointSchema).min(1).max(6),
}).strict().superRefine((value, context) => {
  const endpointKeys = new Set<string>();
  for (const [index, endpoint] of value.endpoints.entries()) {
    const key = `${endpoint.method} ${endpoint.path}`;
    if (endpointKeys.has(key)) {
      context.addIssue({ code: "custom", path: ["endpoints", index], message: "Each method and path pair must be unique." });
    }
    endpointKeys.add(key);
  }
});

export const createTemporaryBackendSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  ttlMinutes: z.union([z.literal(30), z.literal(60), z.literal(180)]),
  contract: temporaryBackendContractSchema,
}).strict();

export type TemporaryBackendContract = z.infer<typeof temporaryBackendContractSchema>;
export type CreateTemporaryBackendInput = z.infer<typeof createTemporaryBackendSchema>;

export function parseTemporaryBackendInput(input: unknown) {
  const parsed = createTemporaryBackendSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Enter a valid temporary API contract.");
  }
  const serialized = JSON.stringify(parsed.data.contract);
  if (!serialized || serialized.length > MAX_CONTRACT_BYTES) {
    throw new AppError("VALIDATION_ERROR", "The temporary API contract is too large. Keep it under 12 KB.");
  }
  try {
    JSON.parse(serialized);
  } catch {
    throw new AppError("VALIDATION_ERROR", "Endpoint responses must be JSON-serializable.");
  }
  return { ...parsed.data, contractJson: serialized };
}

export function parseStoredContract(contractJson: string) {
  try {
    const parsed = temporaryBackendContractSchema.safeParse(JSON.parse(contractJson));
    if (parsed.success) return parsed.data;
  } catch {
    // Stored contracts are treated as untrusted until validated below.
  }
  throw new AppError("CONFLICT", "This temporary backend has an invalid stored contract.", 409);
}
