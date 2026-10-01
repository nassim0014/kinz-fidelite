'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export interface StaffItem {
  id: string;
  name: string;
  role: 'staff' | 'owner';
  active: boolean;
}

export function StaffManager({ staff, selfId }: { staff: StaffItem[]; selfId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'staff' | 'owner'>('staff');
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function send(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<boolean> {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? 'Erreur');
      return false;
    }
    setMsg(null);
    router.refresh();
    return true;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (await send('/api/admin/staff', 'POST', { name, pin, role })) {
      setName('');
      setPin('');
    }
  }

  const input = 'rounded-lg border border-olive-700/40 bg-white p-2';
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">Équipe</h2>
      {msg && (
        <p role="alert" className="text-sm text-red-800">
          {msg}
        </p>
      )}
      <ul className="divide-y divide-sand rounded-2xl bg-white">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span>
              <strong>{s.name}</strong> · {s.role === 'owner' ? 'propriétaire' : 'équipe'}
              {!s.active && ' · désactivé'}
            </span>
            <span className="flex flex-wrap gap-2">
              {resetFor === s.id ? (
                <>
                  <input
                    aria-label={`Nouveau PIN pour ${s.name}`}
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className={`${input} w-24`}
                  />
                  <button
                    onClick={() =>
                      send(`/api/admin/staff/${s.id}`, 'PATCH', { pin: newPin }).then(
                        (ok) => ok && (setResetFor(null), setNewPin('')),
                      )
                    }
                    className="underline"
                  >
                    OK
                  </button>
                </>
              ) : (
                <button onClick={() => setResetFor(s.id)} className="underline">
                  Nouveau PIN
                </button>
              )}
              {s.id !== selfId && (
                <button
                  onClick={() => send(`/api/admin/staff/${s.id}`, 'PATCH', { active: !s.active })}
                  className="underline"
                >
                  {s.active ? 'Désactiver' : 'Réactiver'}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <form
        onSubmit={create}
        className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-3 text-sm"
      >
        <label className="flex flex-col">
          Nom
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col">
          PIN (6 chiffres)
          <input
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col">
          Rôle
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'staff' | 'owner')}
            className={input}
          >
            <option value="staff">Équipe</option>
            <option value="owner">Propriétaire</option>
          </select>
        </label>
        <button className="rounded-full bg-olive-900 px-4 py-2 font-bold text-white">
          Ajouter
        </button>
      </form>
    </section>
  );
}
