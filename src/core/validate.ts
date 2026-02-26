import type { ZodSchema } from "zod";

export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new Error(`Schema validation failed:\n${parsed.error.toString()}`);
    }
    return parsed.data;
}