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
      // First login — migrate any existing localStorage data to Firestore
      const current = useMatchStore.getState();
      if (Object.keys(current.matches).length > 0) {
        await setDoc(doc(db, 'users', uid, 'data', 'matches'), {
          matches: current.matches,
          activeMatchId: current.activeMatchId,
          commentary: current.commentary,
          broadcastVersion: current.broadcastVersion,
          updatedAt: Date.now(),
        });
      }
    }

    if (tournamentSnap.exists()) {
      const data = tournamentSnap.data();
      useTournamentStore.setState({
        tournaments: data.tournaments ?? {},
        managedTeams: data.managedTeams ?? [],
        version: data.version ?? 0,
      });
    } else {
      const current = useTournamentStore.getState();
      if (Object.keys(current.tournaments).length > 0) {
        await setDoc(doc(db, 'users', uid, 'data', 'tournaments'), {
          tournaments: current.tournaments,
          managedTeams: current.managedTeams,
          version: current.version,
          updatedAt: Date.now(),
        });
      }
    }
  } catch {
    // Silent fail — app still works with local data
  }
}

function clearStores() {
  useMatchStore.setState({ matches: {}, activeMatchId: null, commentary: [], broadcastVersion: 0 });
  useTournamentStore.setState({ tournaments: {}, managedTeams: [], version: 0 });
  try {
    localStorage.removeItem('cricket-scorer-v2');
    localStorage.removeItem('cricket-tournament-v1');
  } catch {}
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

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
