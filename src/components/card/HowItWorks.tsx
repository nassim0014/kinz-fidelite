/** Plain-language summary of the rules in src/lib/rules.ts, for customers. */
export function HowItWorks() {
  return (
    <details className="group rounded-3xl border border-forest/15 px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl text-forest">
        Comment ça marche ?
        <span
          aria-hidden
          className="text-2xl leading-none transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="font-bold text-forest">Les tampons</dt>
          <dd className="mt-1 text-muted">
            1 tampon dès 40 TND d’achat, 2 dès 120 TND, 3 dès 300 TND. Une visite tamponnée par
            jour.
          </dd>
        </div>
        <div>
          <dt className="font-bold text-forest">Les récompenses</dt>
          <dd className="mt-1 text-muted">
            Sur la carte, à 3, 5, 7, 11 et 13 tampons. Utilisez-en une tout de suite, ou attendez la
            suivante, plus généreuse. D’autres vous attendent au fil des niveaux.
          </dd>
        </div>
        <div>
          <dt className="font-bold text-forest">Les pépins</dt>
          <dd className="mt-1 text-muted">
            Chaque tranche de 40 TND vous rapporte 1 pépin. Les pépins ne s’effacent jamais et font
            monter votre niveau : passer au niveau suivant coûte autant de pépins que votre niveau
            actuel.
          </dd>
        </div>
        <div>
          <dt className="font-bold text-forest">Les multiplicateurs</dt>
          <dd className="mt-1 text-muted">
            Aux niveaux 13, 21 et 34, vos pépins sont multipliés par 2, 3 puis 5.
          </dd>
        </div>
      </dl>
    </details>
  );
}
