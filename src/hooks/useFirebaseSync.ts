'use client';

import { useEffect } from 'react';
import { ref, set, get, onValue, off } from 'firebase/database';
import { getFirebaseDB } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';

export function useFirebaseSync() {
  const { matches, activeMatchId, commentary, broadcastVersion } = useMatchStore();

  useEffect(() => {
    const db = getFirebaseDB();
    if (!db || !activeMatchId) return;
    const match = matches[activeMatchId];
    if (!match?.matchCode) return;

    try {
      const dbRef = ref(db, `matches/${match.matchCode}`);
      set(dbRef, {
        payload: JSON.stringify({ matches, activeMatchId, commentary, broadcastVersion }),
        syncedAt: Date.now(),
      }).catch(() => {});

      // Write code index so SCR/ADM codes can be looked up
      if (match.scorerCode) {
        set(ref(db, `codes/${match.scorerCode}`), match.matchCode).catch(() => {});
      }
      if (match.adminCode) {
        set(ref(db, `codes/${match.adminCode}`), match.matchCode).catch(() => {});
      }
    } catch {}
  }, [broadcastVersion, activeMatchId]);
}

export function useFirebaseReceiver(matchCode: string | null) {
  useEffect(() => {
    const db = getFirebaseDB();
    if (!db || !matchCode) return;

    try {
      const dbRef = ref(db, `matches/${matchCode}`);
      const handler = onValue(dbRef, (snapshot) => {
        try {
          const raw = snapshot.val();
          if (!raw?.payload) return;
          const data = JSON.parse(raw.payload);
          useMatchStore.setState({
            matches: data.matches ?? {},
            activeMatchId: data.activeMatchId ?? null,
            commentary: data.commentary ?? [],
            broadcastVersion: data.broadcastVersion ?? 0,
          });
        } catch {}
      });
      return () => off(dbRef, 'value', handler);
    } catch {}
  }, [matchCode]);
}

// Resolve any code (CRK/SCR/ADM) to { matchCode, role }
export async function resolveCode(
  code: string
): Promise<{ matchCode: string; role: 'viewer' | 'scorer' | 'admin' } | null> {
  const upper = code.trim().toUpperCase();
  if (upper.startsWith('CRK')) return { matchCode: upper, role: 'viewer' };

  const db = getFirebaseDB();
  if (!db) return null;

  try {
    const snapshot = await get(ref(db, `codes/${upper}`));
    const matchCode = snapshot.val() as string | null;
    if (!matchCode) return null;
    const role = upper.startsWith('SCR') ? 'scorer' : 'admin';
    return { matchCode, role };
  } catch {
    return null;
  }
}

// Subscribe to all active matches (used by grounds dashboard)
export function useAllMatches(
  onUpdate: (entries: { matchCode: string; payload: string; syncedAt: number }[]) => void
) {
  useEffect(() => {
    const db = getFirebaseDB();
    if (!db) return;

    try {
      const dbRef = ref(db, 'matches');
      const handler = onValue(dbRef, (snapshot) => {
        try {
          const val = snapshot.val();
          if (!val) { onUpdate([]); return; }
          const entries = Object.entries(val).map(([matchCode, v]: [string, any]) => ({
            matchCode,
            payload: v.payload ?? '',
            syncedAt: v.syncedAt ?? 0,
          }));
          onUpdate(entries);
        } catch {}
      });
      return () => off(dbRef, 'value', handler);
    } catch {}
  }, []);
}
