'use client';

import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { extractToken } from '@/lib/token';

export function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    handled.current = false;
    const scanner = new Html5Qrcode('qr-reader', {
      verbose: false,
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
    const started = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 240 },
      (text) => {
        if (handled.current) return;
        const token = extractToken(text);
        if (!token) {
          setError('QR code non reconnu — ce n’est pas une carte KINZ');
          return;
        }
        handled.current = true;
        onToken(token);
      },
      () => {},
    );
    started.catch(() => setError('Caméra indisponible — utilisez la recherche par téléphone'));
    return () => {
      started
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [onToken]);

  return (
    <div>
      <div id="qr-reader" className="overflow-hidden rounded-xl bg-black/5" />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
