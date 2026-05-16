'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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

function backupKey(uid: string) { return `cricket-backup-${uid}`; }

function saveBackup(uid: string) {
  try {
    const m = useMatchStore.getState();
    const t = useTournamentStore.getState();
    if (Object.keys(m.matches).length === 0 && Object.keys(t.tournaments).length === 0) return;
    localStorage.setItem(backupKey(uid), JSON.stringify({
      matches: m.matches, activeMatchId: m.activeMatchId,
      commentary: m.commentary, broadcastVersion: m.broadcastVersion,
      tournaments: t.tournaments, managedTeams: t.managedTeams,
      version: t.version, savedAt: Date.now(),
    }));
  } catch {}
}

function restoreFromBackup(uid: string) {
  try {
    const raw = localStorage.getItem(backupKey(uid));
    if (!raw) return;
    const b = JSON.parse(raw);
    if (Object.keys(b.matches ?? {}).length > 0) {
      useMatchStore.setState({
        matches: b.matches, activeMatchId: b.activeMatchId ?? null,
        commentary: b.commentary ?? [], broadcastVersion: b.broadcastVersion ?? 0,
      });
    }
    if (Object.keys(b.tournaments ?? {}).length > 0) {
      useTournamentStore.setState({
        tournaments: b.tournaments, managedTeams: b.managedTeams ?? [], version: b.version ?? 0,
      });
    }
  } catch {}
}

async function migrateLocalData(uid: string, db: NonNullable<ReturnType<typeof getFirebaseFirestore>>) {
  const sources = [
    () => { try { const r = localStorage.getItem(backupKey(uid)); return r ? JSON.parse(r) : null; } catch { return null; } },
    () => { try { const r = localStorage.getItem('cricket-scorer-v2'); const s = r ? JSON.parse(r) : null; return s?.state ?? null; } catch { return null; } },
  ];

  for (const getSrc of sources) {
    const src = getSrc();
    if (!src) continue;
    if (Object.keys(src.matches ?? {}).length > 0) {
      useMatchStore.setState({ matches: src.matches, activeMatchId: src.activeMatchId ?? null, commentary: src.commentary ?? [], broadcastVersion: src.broadcastVersion ?? 0 });
      try { await setDoc(doc(db, 'users', uid, 'data', 'matches'), { matches: src.matches, activeMatchId: src.activeMatchId ?? null, commentary: src.commentary ?? [], broadcastVersion: src.broadcastVersion ?? 0, updatedAt: Date.now() }); } catch {}
    }
    if (Object.keys(src.tournaments ?? {}).length > 0) {
      useTournamentStore.setState({ tournaments: src.tournaments, managedTeams: src.managedTeams ?? [], version: src.version ?? 0 });
      try { await setDoc(doc(db, 'users', uid, 'data', 'tournaments'), { tournaments: src.tournaments, managedTeams: src.managedTeams ?? [], version: src.version ?? 0, updatedAt: Date.now() }); } catch {}
    }
    break;
  }
}

// Initial one-time load from Firestore on login
async function loadUserData(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) { restoreFromBackup(uid); return; }

  try {
    const [matchSnap, tournamentSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid, 'data', 'matches')),
      getDoc(doc(db, 'users', uid, 'data', 'tournaments')),
    ]);

    let needMigration = false;

    if (matchSnap.exists()) {
      const d = matchSnap.data();
      useMatchStore.setState({ matches: d.matches ?? {}, activeMatchId: d.activeMatchId ?? null, commentary: d.commentary ?? [], broadcastVersion: d.broadcastVersion ?? 0 });
      try { localStorage.removeItem(backupKey(uid)); } catch {}
    } else {
      needMigration = true;
    }

    if (tournamentSnap.exists()) {
      const d = tournamentSnap.data();
      useTournamentStore.setState({ tournaments: d.tournaments ?? {}, managedTeams: d.managedTeams ?? [], version: d.version ?? 0 });
    }

    if (needMigration) await migrateLocalData(uid, db);
  } catch {
    restoreFromBackup(uid);
  }
}

// Real-time Firestore listener — fires on every change from any device
// Version check prevents write-back loops: only apply if incoming version > local version
function subscribeUserData(uid: string): () => void {
  const db = getFirebaseFirestore();
  if (!db) return () => {};

  const unsubMatches = onSnapshot(
    doc(db, 'users', uid, 'data', 'matches'),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const incoming = data.broadcastVersion ?? 0;
      const current = useMatchStore.getState().broadcastVersion;
      if (incoming > current) {
        useMatchStore.setState({
          matches: data.matches ?? {},
          activeMatchId: data.activeMatchId ?? null,
          commentary: data.commentary ?? [],
          broadcastVersion: incoming,
        });
      }
    },
    () => {}, // silent error
  );

  const unsubTournaments = onSnapshot(
    doc(db, 'users', uid, 'data', 'tournaments'),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const incoming = data.version ?? 0;
      const current = useTournamentStore.getState().version;
      if (incoming > current) {
        useTournamentStore.setState({
          tournaments: data.tournaments ?? {},
          managedTeams: data.managedTeams ?? [],
          version: incoming,
        });
      }
    },
    () => {},
  );

  return () => { unsubMatches(); unsubTournaments(); };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null>(null);
  const firestoreUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        uidRef.current = u.uid;
        await loadUserData(u.uid);
        // Start real-time listener after initial load
        firestoreUnsubRef.current = subscribeUserData(u.uid);
        setUser(u);
      } else {
        // Unsubscribe real-time listener on logout
        firestoreUnsubRef.current?.();
        firestoreUnsubRef.current = null;
        uidRef.current = null;
        setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    // Write current state to Firestore before signing out
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
