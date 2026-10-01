import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StaffManager } from '@/components/admin/StaffManager';
import { getDb } from '@/db/client';
import { formatDateTime } from '@/lib/dates';
import { levelFromPepins, title } from '@/lib/rules';
import { listEvents, listFiguiers } from '@/server/admin';
import { getPageSession } from '@/server/page-session';
import { listStaff } from '@/server/staff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administration' };

const TYPE_LABEL = {
  stamp: 'Tampon',
  redeem: 'Récompense',
  bonus: 'Bonus pépins',
  perk_given: 'Avantage remis',
} as const;

export default async function AdminPage() {
  const session = await getPageSession('owner');
  if (!session) redirect('/staff/login');
  const db = getDb();
  const [staffRows, figuiers, recent] = await Promise.all([
    listStaff(db),
    listFiguiers(db),
    listEvents(db, 200),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl">Administration KINZ Fidélité</h1>
        <nav className="flex flex-wrap gap-4 text-sm underline">
          <Link href="/staff">Comptoir</Link>
          <Link href="/admin/affiche">Affiche QR</Link>
          <a href="/api/admin/export?type=customers">Export clients (CSV)</a>
          <a href="/api/admin/export?type=events">Export journal (CSV)</a>
        </nav>
      </header>

      <StaffManager
        staff={staffRows.map(({ id, name, role, active }) => ({ id, name, role, active }))}
        selfId={session.staffId}
      />

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          Figuiers et Légendes (niveau 34+) : livraisons avant-première
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper">
                <th className="p-2">Client</th>
                <th className="p-2">Téléphone</th>
                <th className="p-2">Niveau</th>
                <th className="p-2">Adresse</th>
              </tr>
            </thead>
            <tbody>
              {figuiers.length === 0 && (
                <tr>
                  <td className="p-2 text-muted" colSpan={4}>
                    Personne pour l’instant.
                  </td>
                </tr>
              )}
              {figuiers.map((c) => {
                const level = levelFromPepins(c.lifetimePepins);
                return (
                  <tr key={c.id} className="border-b border-paper">
                    <td className="p-2">{c.firstName}</td>
                    <td className="p-2">{c.phone}</td>
                    <td className="p-2">
                      {level}, {title(level)}
                    </td>
                    <td className="p-2">{c.address ?? <em>en attente</em>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Journal (200 dernières actions)</h2>
        <div className="overflow-x-auto rounded-2xl bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper">
                <th className="p-2">Date</th>
                <th className="p-2">Action</th>
                <th className="p-2">Client</th>
                <th className="p-2">Montant</th>
                <th className="p-2">Tampons</th>
                <th className="p-2">Pépins</th>
                <th className="p-2">Détail</th>
                <th className="p-2">Équipe</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="border-b border-paper">
                  <td className="p-2 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                  <td className="p-2">{TYPE_LABEL[e.type]}</td>
                  <td className="p-2">{e.customerName}</td>
                  <td className="p-2">
                    {e.amountTnd ? `${Number(e.amountTnd).toFixed(3)} TND` : ''}
                  </td>
                  <td className="p-2">{e.stampsDelta}</td>
                  <td className="p-2">{e.pepinsDelta}</td>
                  <td className="p-2">{e.detail}</td>
                  <td className="p-2">{e.staffName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
