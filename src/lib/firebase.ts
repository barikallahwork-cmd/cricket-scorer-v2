import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAkjCoAqlDXTtjtlbgLOgxmtb5garZrhIw',
  authDomain: 'cricscorer-40848.firebaseapp.com',
  projectId: 'cricscorer-40848',
  storageBucket: 'cricscorer-40848.firebasestorage.app',
  messagingSenderId: '1068507884600',
  appId: '1:1068507884600:web:8779d8edb96b50f63f4acd',
  databaseURL: 'https://cricscorer-40848-default-rtdb.firebaseio.com',
};

let _db: Database | null = null;

export function getFirebaseDB(): Database | null {
  if (typeof window === 'undefined') return null;
  if (_db) return _db;
  try {
    const app: FirebaseApp = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    _db = getDatabase(app);
    return _db;
  } catch {
    return null;
  }
}
