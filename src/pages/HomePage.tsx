import React, { useEffect } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { UIOverlay } from '@/components/game/UIOverlay';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGameStore } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Smartphone } from 'lucide-react';
export function HomePage() {
  const handleAuthCallback = useGameStore(state => state.handleAuthCallback);
  const checkServerReset = useGameStore(state => state.checkServerReset);
  const restoreGameState = useGameStore(state => state.restoreGameState);
  useEffect(() => {
    // Check if server has been reset (wiped) and sync local state
    checkServerReset();
    // Restore game state if stuck in daily mode after reload
    restoreGameState();
    const params = new URLSearchParams(window.location.search);
    // Handle Challenge Seed
    const seed = params.get('seed');
    if (seed) {
        const store = useGameStore.getState();
        store.setPendingSeed(seed);
        store.setGameMode('challenge');
        toast.success("Challenge Seed Loaded! Good Luck!");
        window.history.replaceState({}, '', window.location.pathname);
    }
    // Handle OAuth Callback
    const userId = params.get('userId');
    const error = params.get('error');
    if (error) {
        toast.error(`Login Failed: ${error}`);
        window.history.replaceState({}, '', window.location.pathname);
    } else if (userId) {
        handleAuthCallback(params);
    }
  }, [handleAuthCallback, checkServerReset, restoreGameState]);
  return (
    <AppLayout container={false} className="bg-yellow-50 h-dynamic-screen w-screen overflow-hidden flex items-center justify-center relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:20px_20px]" />
      {/* Mobile Container Wrapper */}
      <div className="relative w-full h-full max-w-md md:max-h-[85vh] md:aspect-[9/16] bg-white md:rounded-[3rem] md:border-[12px] md:border-gray-900 md:shadow-[0_0_60px_rgba(0,0,0,0.3)] overflow-hidden z-10 ring-1 ring-black/5">
        <GameCanvas />
        <UIOverlay />
      </div>
      {/* Desktop Background Decoration */}
      <div className="absolute inset-0 -z-10 hidden md:flex items-center justify-center pointer-events-none">
        <div className="text-[15vw] font-black rotate-12 select-none text-yellow-400/20 tracking-tighter">DUCKS</div>
      </div>
      {/* Desktop Badge */}
      <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-black/10 shadow-sm text-sm font-bold text-gray-500">
        <Smartphone className="w-4 h-4" />
        Best played on mobile
      </div>
      <Toaster />
    </AppLayout>
  );
}