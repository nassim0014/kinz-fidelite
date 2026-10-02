import type { Copy } from '@/lib/copy';

/** Plain-language summary of the rules in src/lib/rules.ts, for customers. */
export function HowItWorks({ copy }: { copy: Copy }) {
  return (
    <details className="group rounded-3xl border border-forest/15 px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-xl text-forest">
        {copy.how.heading}
        <span
          aria-hidden
          className="text-2xl leading-none transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <dl className="mt-4 space-y-4 text-sm">
        {copy.how.items.map((item) => (
          <div key={item.term}>
            <dt className="font-bold text-forest">{item.term}</dt>
            <dd className="mt-1 text-muted">{item.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
