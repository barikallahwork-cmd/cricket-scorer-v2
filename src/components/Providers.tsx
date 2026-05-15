'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useMatchFirestoreSync, useTournamentFirestoreSync } from '@/hooks/useFirestoreSync';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/watch', '/grounds', '/display'];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p));

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return <>{children}</>;
}

function SyncLayer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useMatchFirestoreSync(user?.uid ?? null);
  useTournamentFirestoreSync(user?.uid ?? null);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncLayer>
        <AuthGuard>
          {children}
        </AuthGuard>
      </SyncLayer>
    </AuthProvider>
  );
}
