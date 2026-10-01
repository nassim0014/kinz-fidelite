'use client';

import { useEffect } from 'react';
import { storeToken } from '@/lib/card-storage';

export function RememberCard({ token }: { token: string }) {
  useEffect(() => storeToken(token), [token]);
  return null;
}
