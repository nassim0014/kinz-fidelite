import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z
    .string()
    .url()
    .transform((u) => u.replace(/\/+$/, '')),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const keys = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variables d'environnement invalides : ${keys}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Validated lazily on first use so `next build` works without runtime secrets. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
