'use client';

import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';

async function syncMatches(userId: string) {
  const db = getFirebaseFirestore();
  if (!db) return;
  const { matches, activeMatchId, commentary, broadcastVersion } = useMatchStore.getState();
  await setDoc(doc(db, 'users', userId, 'data', 'matches'), {
    matches, activeMatchId, commentary, broadcastVersion, updatedAt: Date.now(),
  });
}

async function syncTournaments(userId: string) {
  const db = getFirebaseFirestore();
  if (!db) return;
  const { tournaments, managedTeams, version } = useTournamentStore.getState();
  await setDoc(doc(db, 'users', userId, 'data', 'tournaments'), {
    tournaments, managedTeams, version, updatedAt: Date.now(),
  });
}

export function useMatchFirestoreSync(userId: string | null) {
  const broadcastVersion = useMatchStore(s => s.broadcastVersion);
  const syncReady = useRef(false);

  useEffect(() => {
    syncReady.current = false;
    if (!userId) return;
    const t = setTimeout(() => { syncReady.current = true; }, 3000);
    return () => clearTimeout(t);
  }, [userId]);

  // Sync immediately on every state change (after initial 3s delay)
  useEffect(() => {
    if (!userId || !syncReady.current) return;
    syncMatches(userId).catch(() => {});
  }, [broadcastVersion, userId]);

  // Immediate sync when tab becomes hidden (covers browser close / tab switch)
  useEffect(() => {
    if (!userId) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && syncReady.current) {
        syncMatches(userId).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userId]);
}

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
    syncTournaments(userId).catch(() => {});
  }, [version, userId]);

  useEffect(() => {
    if (!userId) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && syncReady.current) {
        syncTournaments(userId).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userId]);
}
