'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
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

// Separate localStorage key not managed by Zustand persist — survives clearStores()
function backupKey(uid: string) { return `cricket-backup-${uid}`; }

function saveBackup(uid: string) {
  try {
    const m = useMatchStore.getState();
    const t = useTournamentStore.getState();
    if (Object.keys(m.matches).length === 0 && Object.keys(t.tournaments).length === 0) return;
    localStorage.setItem(backupKey(uid), JSON.stringify({
      matches: m.matches,
      activeMatchId: m.activeMatchId,
      commentary: m.commentary,
      broadcastVersion: m.broadcastVersion,
      tournaments: t.tournaments,
      managedTeams: t.managedTeams,
      version: t.version,
      savedAt: Date.now(),
    }));
  } catch {}
}

function clearStores() {
  useMatchStore.setState({ matches: {}, activeMatchId: null, commentary: [], broadcastVersion: 0 });
  useTournamentStore.setState({ tournaments: {}, managedTeams: [], version: 0 });
}

async function loadUserData(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) {
    // No Firestore — restore from backup if available
    restoreFromBackup(uid);
    return;
  }

  try {
    const [matchSnap, tournamentSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid, 'data', 'matches')),
      getDoc(doc(db, 'users', uid, 'data', 'tournaments')),
    ]);

    let matchesLoaded = false;
    let tournamentsLoaded = false;

    if (matchSnap.exists()) {
      const data = matchSnap.data();
      useMatchStore.setState({
        matches: data.matches ?? {},
        activeMatchId: data.activeMatchId ?? null,
        commentary: data.commentary ?? [],
        broadcastVersion: data.broadcastVersion ?? 0,
      });
      matchesLoaded = true;
    }

    if (tournamentSnap.exists()) {
      const data = tournamentSnap.data();
      useTournamentStore.setState({
        tournaments: data.tournaments ?? {},
        managedTeams: data.managedTeams ?? [],
        version: data.version ?? 0,
      });
      tournamentsLoaded = true;
    }

    // If Firestore had no data, try backup then fall back to main localStorage
    if (!matchesLoaded || !tournamentsLoaded) {
      await migrateLocalData(uid, db, !matchesLoaded, !tournamentsLoaded);
    }

    // Clean up backup once Firestore data confirmed loaded
    if (matchesLoaded) {
      try { localStorage.removeItem(backupKey(uid)); } catch {}
    }
  } catch {
    // Firestore read failed — restore from backup
    restoreFromBackup(uid);
  }
}

function restoreFromBackup(uid: string) {
  try {
    const raw = localStorage.getItem(backupKey(uid));
    if (!raw) return;
    const b = JSON.parse(raw);
    if (Object.keys(b.matches ?? {}).length > 0) {
      useMatchStore.setState({
        matches: b.matches,
        activeMatchId: b.activeMatchId ?? null,
        commentary: b.commentary ?? [],
        broadcastVersion: b.broadcastVersion ?? 0,
      });
    }
    if (Object.keys(b.tournaments ?? {}).length > 0) {
      useTournamentStore.setState({
        tournaments: b.tournaments,
        managedTeams: b.managedTeams ?? [],
        version: b.version ?? 0,
      });
    }
  } catch {}
}

async function migrateLocalData(
  uid: string,
  db: ReturnType<typeof getFirebaseFirestore>,
  migrateMatches: boolean,
  migrateTournaments: boolean,
) {
  if (!db) return;

  // Check UID-tagged backup first, then Zustand persist key
  const sources = [
    () => {
      try {
        const raw = localStorage.getItem(backupKey(uid));
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    () => {
      try {
        const raw = localStorage.getItem('cricket-scorer-v2');
        const stored = raw ? JSON.parse(raw) : null;
        return stored?.state ?? null;
      } catch { return null; }
    },
  ];

  for (const getSource of sources) {
    const src = getSource();
    if (!src) continue;

    if (migrateMatches && Object.keys(src.matches ?? {}).length > 0) {
      useMatchStore.setState({
        matches: src.matches,
        activeMatchId: src.activeMatchId ?? null,
        commentary: src.commentary ?? [],
        broadcastVersion: src.broadcastVersion ?? 0,
      });
      try {
        await setDoc(doc(db, 'users', uid, 'data', 'matches'), {
          matches: src.matches,
          activeMatchId: src.activeMatchId ?? null,
          commentary: src.commentary ?? [],
          broadcastVersion: src.broadcastVersion ?? 0,
          updatedAt: Date.now(),
        });
        migrateMatches = false;
      } catch {}
    }

    if (migrateTournaments && Object.keys(src.tournaments ?? {}).length > 0) {
      useTournamentStore.setState({
        tournaments: src.tournaments,
        managedTeams: src.managedTeams ?? [],
        version: src.version ?? 0,
      });
      try {
        await setDoc(doc(db, 'users', uid, 'data', 'tournaments'), {
          tournaments: src.tournaments,
          managedTeams: src.managedTeams ?? [],
          version: src.version ?? 0,
          updatedAt: Date.now(),
        });
        migrateTournaments = false;
      } catch {}
    }

    if (!migrateMatches && !migrateTournaments) break;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        uidRef.current = u.uid;
        await loadUserData(u.uid);
        setUser(u);
      } else {
        // Do NOT clear stores — data stays in localStorage as fallback.
        // loadUserData() on next login will load fresh Firestore data and overwrite it.
        // AuthGuard shows a spinner until then so stale data is never visible.
        uidRef.current = null;
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // Re-fetch from Firestore when tab becomes visible (cross-device sync)
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

    // Write to Firestore immediately before signing out
    const db = getFirebaseFirestore();
    if (db && user) {
      const uid = user.uid;
      const { matches, activeMatchId, commentary, broadcastVersion } = useMatchStore.getState();
      const { tournaments, managedTeams, version } = useTournamentStore.getState();
      try {
        await Promise.all([
          setDoc(doc(db, 'users', uid, 'data', 'matches'), { matches, activeMatchId, commentary, broadcastVersion, updatedAt: Date.now() }),
          setDoc(doc(db, 'users', uid, 'data', 'tournaments'), { tournaments, managedTeams, version, updatedAt: Date.now() }),
        ]);
      } catch {}
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
