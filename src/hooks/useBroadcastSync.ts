'use client';

import { useEffect } from 'react';
import useMatchStore from '@/store/matchStore';

const STORAGE_KEY = 'cricket-scorer-v2';

function applyRemoteState(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const s = raw as any;
  // Only update fields that actually carry live score data
  useMatchStore.setState({
    matches: s.matches ?? {},
    activeMatchId: s.activeMatchId ?? null,
    commentary: s.commentary ?? [],
    broadcastVersion: s.broadcastVersion ?? 0,
  });
}

/**
 * Dual-mechanism real-time sync for the display screen.
 *
 * 1. BroadcastChannel  — fires immediately in the same browser (fastest path).
 * 2. StorageEvent      — fires when localStorage is written by another tab.
 *                        This is the reliable fallback: the Zustand persist
 *                        middleware writes to localStorage after every ball,
 *                        so the display always catches updates even if
 *                        BroadcastChannel is blocked or unavailable.
 *
 * Neither mechanism fires in the same tab that triggered the change, so there
 * is zero risk of an infinite update loop.
 */
export function useBroadcastReceiver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // --- Path 1: BroadcastChannel (instant, same browser) ---
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cricket-scorer-v1');
      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE') {
          applyRemoteState(event.data.payload);
        }
      };
    } catch {
      // BroadcastChannel unavailable (some private modes); storage event covers it
    }

    // --- Path 2: storage event (cross-tab, fires when localStorage changes) ---
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        // Zustand persist wraps state under { state: {...}, version: n }
        if (parsed?.state) {
          applyRemoteState(parsed.state);
        }
      } catch {
        // malformed JSON — ignore
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []); // run once — both listeners stay active for the lifetime of the page
}

export function useBroadcastVersion(): number {
  return useMatchStore(s => s.broadcastVersion);
}
