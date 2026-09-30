export const MESSAGES = {
  NOT_FOUND: 'Client introuvable',
  INVALID_PHONE: 'Numéro de téléphone invalide (8 chiffres tunisiens)',
  PHONE_TAKEN: 'Ce numéro a déjà une carte — demandez au comptoir de vous la renvoyer',
  INVALID_AMOUNT: 'Montant invalide',
  AMOUNT_TOO_LOW: 'Montant < 40 TND',
  AMOUNT_TOO_HIGH: 'Montant anormalement élevé — vérifiez le ticket',
  ALREADY_STAMPED: "Déjà tamponné aujourd'hui",
  STOP_NOT_REACHED: 'Palier non atteint',
  PERK_LOCKED: 'Avantage pas encore débloqué',
  PERK_NOT_GIVABLE: 'Cet avantage ne se remet pas au comptoir',
  PERK_ALREADY_GIVEN: 'Avantage déjà remis',
  INVALID_ADDRESS: 'Adresse invalide',
  INVALID_CREDENTIALS: 'Nom ou PIN incorrect',
  LOCKED: "Trop d'essais — réessayez dans 10 minutes",
  UNAUTHENTICATED: 'Connexion requise',
  FORBIDDEN: 'Accès réservé au propriétaire',
  NAME_TAKEN: 'Ce nom est déjà utilisé',
  INVALID_PIN: 'Le PIN doit contenir exactement 6 chiffres',
  CANNOT_DEACTIVATE_SELF: 'Vous ne pouvez pas désactiver votre propre compte',
} as const;

export type AppErrorCode = keyof typeof MESSAGES;

export const ERROR_STATUS: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  INVALID_PHONE: 400,
  PHONE_TAKEN: 409,
  INVALID_AMOUNT: 400,
  AMOUNT_TOO_LOW: 400,
  AMOUNT_TOO_HIGH: 400,
  ALREADY_STAMPED: 409,
  STOP_NOT_REACHED: 400,
  PERK_LOCKED: 400,
  PERK_NOT_GIVABLE: 400,
  PERK_ALREADY_GIVEN: 409,
  INVALID_ADDRESS: 400,
  INVALID_CREDENTIALS: 401,
  LOCKED: 429,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NAME_TAKEN: 409,
  INVALID_PIN: 400,
  CANNOT_DEACTIVATE_SELF: 400,
};

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode) {
    super(MESSAGES[code]);
    this.name = 'AppError';
  }
}

/** Postgres unique_violation, whether raw (postgres.js) or wrapped by Drizzle. */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return (err?.code ?? err?.cause?.code) === '23505';
}
