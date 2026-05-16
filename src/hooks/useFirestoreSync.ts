'use client';

import { useEffect } from 'react';
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

  // Write to Firestore on every state change — no delay, no timing gaps
  useEffect(() => {
    if (!userId) return;
    syncMatches(userId).catch(() => {});
  }, [broadcastVersion, userId]);

  // Sync when tab is hidden (browser close / tab switch away)
  useEffect(() => {
    if (!userId) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        syncMatches(userId).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userId]);
}

export function useTournamentFirestoreSync(userId: string | null) {
  const version = useTournamentStore(s => s.version);

  useEffect(() => {
    if (!userId) return;
    syncTournaments(userId).catch(() => {});
  }, [version, userId]);

  useEffect(() => {
    if (!userId) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        syncTournaments(userId).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userId]);
}
