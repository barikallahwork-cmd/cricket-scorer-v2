import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAkjCoAqlDXTtjtlbgLOgxmtb5garZrhIw',
  authDomain: 'cricscorer-40848.firebaseapp.com',
  projectId: 'cricscorer-40848',
  storageBucket: 'cricscorer-40848.firebasestorage.app',
  messagingSenderId: '1068507884600',
  appId: '1:1068507884600:web:8779d8edb96b50f63f4acd',
  databaseURL: 'https://cricscorer-40848-default-rtdb.firebaseio.com',
};

function getApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  try {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } catch { return null; }
}

let _db: Database | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;

export function getFirebaseDB(): Database | null {
  if (typeof window === 'undefined') return null;
  if (_db) return _db;
  try {
    const app = getApp();
    if (!app) return null;
    _db = getDatabase(app);
    return _db;
  } catch { return null; }
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (_auth) return _auth;
  try {
    const app = getApp();
    if (!app) return null;
    _auth = getAuth(app);
    return _auth;
  } catch { return null; }
}

export function getFirebaseFirestore(): Firestore | null {
  if (typeof window === 'undefined') return null;
  if (_firestore) return _firestore;
  try {
    const app = getApp();
    if (!app) return null;
    _firestore = getFirestore(app);
    return _firestore;
  } catch { return null; }
}
