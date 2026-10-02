'use client';

import { useRouter } from 'next/navigation';
import { REMINDER_LABEL, reminderMessage } from '@/lib/reminders';
import { waLink } from '@/lib/whatsapp';
import type { ReminderCandidate } from '@/server/reminders';

/** Customers worth a nudge; the link opens WhatsApp with the message ready, a person sends it. */
export function ReminderList({
  appUrl,
  candidates,
}: {
  appUrl: string;
  candidates: ReminderCandidate[];
}) {
  const router = useRouter();

  async function logReminder(c: ReminderCandidate) {
    await fetch('/api/admin/reminders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customerId: c.customerId, reason: c.reason }),
    }).catch(() => undefined);
    router.refresh();
  }

  if (candidates.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-4 text-sm text-muted">
        Personne à relancer aujourd’hui.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-paper rounded-2xl bg-white">
      {candidates.map((c) => (
        <li key={c.customerId} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="text-sm">
            <p className="font-bold">{c.firstName}</p>
            <p className="text-muted">
              {c.phone}, {REMINDER_LABEL[c.reason]}
            </p>
          </div>
          <a
            href={waLink(
              c.phone,
              reminderMessage(c.reason, {
                firstName: c.firstName,
                cardStamps: c.cardStamps,
                cardUrl: `${appUrl}/c/${c.token}`,
              }),
            )}
            target="_blank"
            rel="noopener"
            aria-label={`Relancer ${c.firstName} par WhatsApp`}
            onClick={() => void logReminder(c)}
            className="rounded-full bg-forest px-4 py-2 text-sm font-bold text-lime"
          >
            Relancer par WhatsApp
          </a>
        </li>
      ))}
    </ul>
  );
}
