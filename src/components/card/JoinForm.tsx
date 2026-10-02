'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { readStoredToken, storeToken } from '@/lib/card-storage';
import { errorText, getCopy, type Locale } from '@/lib/copy';
import { formatDateTyping, isoToDayMonthYear, parseDayMonthYear } from '@/lib/dates';

export function JoinForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const copy = getCopy(locale);
  const t = copy.join;
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = readStoredToken();
    if (stored && !window.location.search.includes('nouveau')) router.replace(`/c/${stored}`);
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const birthdayIso = birthday.trim() ? parseDayMonthYear(birthday) : undefined;
    if (birthdayIso === null) {
      setError(copy.errors.INVALID_BIRTHDAY);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName, phone, birthday: birthdayIso, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(errorText(copy, data.code));
        return;
      }
      storeToken(data.token);
      router.push(`/c/${data.token}`);
    } catch {
      setError(copy.errors.NETWORK);
    } finally {
      setBusy(false);
    }
  }

  const input =
    'mt-1 w-full rounded-xl border border-forest/25 bg-white p-3 text-base focus:border-forest';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-bold text-forest">
          {t.firstName}
        </label>
        <input
          id="firstName"
          required
          maxLength={40}
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-forest">
          {t.phone}
        </label>
        <input
          id="phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="22 123 456"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="birthday" className="block text-sm font-bold text-forest">
          {t.birthday} <span className="font-normal text-muted">{t.optional}</span>
        </label>
        {/* Dates read left to right in every language, so the whole control does too. */}
        <div dir="ltr" className="relative">
          <input
            id="birthday"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            maxLength={10}
            placeholder={t.birthdayPlaceholder}
            value={birthday}
            onChange={(e) => setBirthday(formatDateTyping(e.target.value))}
            className={`${input} pe-14`}
          />
          {/* The phone's own calendar, laid invisibly over the icon: tapping the icon opens it. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 mt-1 flex w-12 items-center justify-center text-forest"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="date"
            aria-label={t.pickDate}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthday(isoToDayMonthYear(e.target.value))}
            className="absolute inset-y-0 end-0 mt-1 w-12 cursor-pointer opacity-0"
          />
        </div>
        <p className="mt-1 text-xs text-muted">{t.birthdayHint}</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-full bg-forest py-3.5 font-bold text-lime disabled:opacity-50"
      >
        {busy ? t.submitting : t.submit}
      </button>
    </form>
  );
}
