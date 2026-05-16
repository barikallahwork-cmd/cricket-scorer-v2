'use client';

import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';

// When subscribeUserData applies a remote update, it calls this to prevent
// useMatchFirestoreSync from immediately writing the same data back to Firestore.
let _suppressMatchWriteForVersion: number | null = null;
let _suppressTournamentWriteForVersion: number | null = null;

export function suppressMatchWrite(version: number) {
  _suppressMatchWriteForVersion = version;
}

export function suppressTournamentWrite(version: number) {
  _suppressTournamentWriteForVersion = version;
}

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
  // Track whether userId just became non-null (login event).
  // On login, loadUserData already loaded from Firestore — no need to write back.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      initializedRef.current = false;
      return;
    }
    // Skip the first write after login to avoid overwriting Firestore with
    // potentially stale local state before loadUserData has fully applied remote data.
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    // Skip write-back if this broadcastVersion came from a remote (Firestore) update.
    if (_suppressMatchWriteForVersion === broadcastVersion) {
      _suppressMatchWriteForVersion = null;
      return;
    }
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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      initializedRef.current = false;
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (_suppressTournamentWriteForVersion === version) {
      _suppressTournamentWriteForVersion = null;
      return;
    }
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
