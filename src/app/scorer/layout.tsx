import { Suspense } from 'react';

export default function ScorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
