export interface MigrateDecision {
  run: boolean;
  reason: string;
}

/** Decides whether `npm run db:migrate` may touch the database in this environment. */
export function shouldMigrate(env: Record<string, string | undefined>): MigrateDecision {
  if (!env.VERCEL) return { run: true, reason: 'Exécution hors Vercel' };
  if (env.VERCEL_ENV === 'production') return { run: true, reason: 'Déploiement de production' };
  if (env.ALLOW_PREVIEW_MIGRATIONS === '1') {
    return { run: true, reason: 'Migrations de prévisualisation autorisées' };
  }
  return {
    run: false,
    reason: `Migrations ignorées : environnement Vercel "${env.VERCEL_ENV ?? 'inconnu'}" (définir ALLOW_PREVIEW_MIGRATIONS=1 pour une base de prévisualisation séparée)`,
  };
}
