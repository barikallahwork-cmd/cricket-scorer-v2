import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAkjCoAqlDXTtjtlbgLOgxmtb5garZrhIw',
  authDomain: 'cricscorer-40848.firebaseapp.com',
  projectId: 'cricscorer-40848',
  storageBucket: 'cricscorer-40848.firebasestorage.app',
  messagingSenderId: '1068507884600',
  appId: '1:1068507884600:web:8779d8edb96b50f63f4acd',
  databaseURL: 'https://cricscorer-40848-default-rtdb.firebaseio.com',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const database = getDatabase(app);
