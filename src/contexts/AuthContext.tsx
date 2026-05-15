'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase';
import useMatchStore from '@/store/matchStore';
import useTournamentStore from '@/store/tournamentStore';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

async function loadUserData(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    const [matchSnap, tournamentSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid, 'data', 'matches')),
      getDoc(doc(db, 'users', uid, 'data', 'tournaments')),
    ]);

    if (matchSnap.exists()) {
      const data = matchSnap.data();
      useMatchStore.setState({
        matches: data.matches ?? {},
        activeMatchId: data.activeMatchId ?? null,
        commentary: data.commentary ?? [],
        broadcastVersion: data.broadcastVersion ?? 0,
      });
    } else {
      // First login — read directly from localStorage (Zustand may not be hydrated yet)
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('cricket-scorer-v2') : null;
        const stored = raw ? JSON.parse(raw) : null;
        const localState = stored?.state ?? {};
        const localMatches = localState.matches ?? {};
        if (Object.keys(localMatches).length > 0) {
          useMatchStore.setState(localState);
          await setDoc(doc(db, 'users', uid, 'data', 'matches'), {
            matches: localMatches,
            activeMatchId: localState.activeMatchId ?? null,
            commentary: localState.commentary ?? [],
            broadcastVersion: localState.broadcastVersion ?? 0,
            updatedAt: Date.now(),
          });
        }
      } catch {}
    }

    if (tournamentSnap.exists()) {
      const data = tournamentSnap.data();
      useTournamentStore.setState({
        tournaments: data.tournaments ?? {},
        managedTeams: data.managedTeams ?? [],
        version: data.version ?? 0,
      });
    } else {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('cricket-tournament-v1') : null;
        const stored = raw ? JSON.parse(raw) : null;
        const localState = stored?.state ?? {};
        const localTournaments = localState.tournaments ?? {};
        if (Object.keys(localTournaments).length > 0) {
          useTournamentStore.setState(localState);
          await setDoc(doc(db, 'users', uid, 'data', 'tournaments'), {
            tournaments: localTournaments,
            managedTeams: localState.managedTeams ?? [],
            version: localState.version ?? 0,
            updatedAt: Date.now(),
          });
        }
      } catch {}
    }
  } catch {
    // Silent fail — app still works with local data
  }
}

function clearStores() {
  useMatchStore.setState({ matches: {}, activeMatchId: null, commentary: [], broadcastVersion: 0 });
  useTournamentStore.setState({ tournaments: {}, managedTeams: [], version: 0 });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await loadUserData(u.uid);
        setUser(u);
      } else {
        clearStores();
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // Re-fetch from Firestore when tab becomes visible (picks up changes from other devices)
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadUserData(uid).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    // Sync to Firestore immediately before clearing local data
    const db = getFirebaseFirestore();
    if (db && user) {
      const uid = user.uid;
      const { matches, activeMatchId, commentary, broadcastVersion } = useMatchStore.getState();
      const { tournaments, managedTeams, version } = useTournamentStore.getState();
      let syncedOk = false;
      try {
        await Promise.all([
          setDoc(doc(db, 'users', uid, 'data', 'matches'), { matches, activeMatchId, commentary, broadcastVersion, updatedAt: Date.now() }),
          setDoc(doc(db, 'users', uid, 'data', 'tournaments'), { tournaments, managedTeams, version, updatedAt: Date.now() }),
        ]);
        syncedOk = true;
      } catch {}

      // Only clear localStorage if sync succeeded — keeps data as fallback if offline
      if (syncedOk) {
        try {
          localStorage.removeItem('cricket-scorer-v2');
          localStorage.removeItem('cricket-tournament-v1');
        } catch {}
      }
    }

    await signOut(auth);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
