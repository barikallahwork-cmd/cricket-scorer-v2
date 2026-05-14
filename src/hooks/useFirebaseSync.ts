'use client';

import { useEffect } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';

// Used in scorer page — pushes state to Firebase after every ball
export function useFirebaseSync() {
  const { matches, activeMatchId, commentary, broadcastVersion } = useMatchStore();

  useEffect(() => {
    if (!activeMatchId) return;
    const match = matches[activeMatchId];
    if (!match?.matchCode) return;

    const dbRef = ref(database, `matches/${match.matchCode}`);
    set(dbRef, {
      matches,
      activeMatchId,
      commentary,
      broadcastVersion,
      syncedAt: Date.now(),
    }).catch(() => {});
  }, [broadcastVersion, activeMatchId]);
}

// Used in watch/display page — receives live state from Firebase
export function useFirebaseReceiver(matchCode: string | null) {
  useEffect(() => {
    if (!matchCode) return;

    const dbRef = ref(database, `matches/${matchCode}`);
    const handler = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      useMatchStore.setState({
        matches: data.matches ?? {},
        activeMatchId: data.activeMatchId ?? null,
        commentary: data.commentary ?? [],
        broadcastVersion: data.broadcastVersion ?? 0,
      });
    });

    return () => off(dbRef, 'value', handler);
  }, [matchCode]);
}
