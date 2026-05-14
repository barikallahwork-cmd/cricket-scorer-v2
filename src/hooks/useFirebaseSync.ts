'use client';

import { useEffect } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
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
