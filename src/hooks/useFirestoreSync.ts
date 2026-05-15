'use client';

import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';

// Match store — debounced sync on every broadcastVersion change
export function useMatchFirestoreSync(userId: string | null) {
  const broadcastVersion = useMatchStore(s => s.broadcastVersion);
  const syncReady = useRef(false);

  useEffect(() => {
    syncReady.current = false;
    if (!userId) return;
    // Allow 3s for Firestore data load before enabling outbound sync
    const t = setTimeout(() => { syncReady.current = true; }, 3000);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    if (!userId || !syncReady.current) return;
    const db = getFirebaseFirestore();
    if (!db) return;

    const timer = setTimeout(async () => {
      const { matches, activeMatchId, commentary, broadcastVersion: bv } = useMatchStore.getState();
      try {
        await setDoc(doc(db, 'users', userId, 'data', 'matches'), {
          matches,
          activeMatchId,
          commentary,
          broadcastVersion: bv,
          updatedAt: Date.now(),
        });
      } catch {}
    }, 5000);

    return () => clearTimeout(timer);
  }, [broadcastVersion, userId]);
}

// Tournament store — debounced sync on every version change
export function useTournamentFirestoreSync(userId: string | null) {
  const version = useTournamentStore(s => s.version);
  const syncReady = useRef(false);

  useEffect(() => {
    syncReady.current = false;
    if (!userId) return;
    const t = setTimeout(() => { syncReady.current = true; }, 3000);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    if (!userId || !syncReady.current) return;
    const db = getFirebaseFirestore();
    if (!db) return;

    const timer = setTimeout(async () => {
      const { tournaments, managedTeams, version: v } = useTournamentStore.getState();
      try {
        await setDoc(doc(db, 'users', userId, 'data', 'tournaments'), {
          tournaments,
          managedTeams,
          version: v,
          updatedAt: Date.now(),
        });
      } catch {}
    }, 5000);

    return () => clearTimeout(timer);
  }, [version, userId]);
}
