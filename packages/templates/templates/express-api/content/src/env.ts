import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment contract.
 *
 * Missing variables fall back to the values chosen when the project was
 * generated; invalid values fail fast at boot instead of surfacing as a
 * confusing runtime error later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(Number('{{port}}')),
  CORS_ORIGIN: z.string().min(1).default('{{corsOrigin}}'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
