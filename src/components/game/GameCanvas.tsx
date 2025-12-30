import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/GameEngine';
import { useGameStore } from '@/lib/store';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const safeAreaRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Subscribe to status changes to trigger engine methods
  const status = useGameStore(state => state.status);
  const replayState = useGameStore(state => state.replayState);
  const finishReplayGeneration = useGameStore(state => state.finishReplayGeneration);
  const resetReplayState = useGameStore(state => state.resetReplayState);
  // Track previous status to determine transition type (Resume vs Start)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (!canvasRef.current) return;
    // Initialize Engine with Error Handling
    try {
        const engine = new GameEngine(canvasRef.current);
        engineRef.current = engine;
        // Initial Safe Area Sync - Force read immediately
        if (safeAreaRef.current) {
            const bottom = safeAreaRef.current.clientHeight;
            engine.setSafeArea({ bottom });
        }
        setError(null);
    } catch (e: any) {
        console.error("Game Engine failed to initialize:", e);
        setError(e.message || "Failed to start game engine");
    }
    // Cleanup
    return () => {
      if (engineRef.current) {
          engineRef.current.destroy();
          engineRef.current = null;
      }
    };
  }, []);
  // Safe Area Observer
  useEffect(() => {
      if (!safeAreaRef.current) return;
      const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
              const bottom = entry.contentRect.height;
              if (engineRef.current) {
                  engineRef.current.setSafeArea({ bottom });
              }
          }
      });
      observer.observe(safeAreaRef.current);
      return () => observer.disconnect();
  }, []);
  // React to game state changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const prevStatus = prevStatusRef.current;
    if (status === 'playing') {
      // Check current score from store directly without subscription to avoid re-renders
      const currentScore = useGameStore.getState().score;
      // If score is 0, it means we reset/restarted, so we must START the engine (which resets it).
      // If prevStatus was NOT paused, it's a fresh start (e.g. from menu), so START.
      // Only RESUME if we were paused AND score is preserved (not 0).
      if (currentScore === 0 || prevStatus !== 'paused') {
        engine.start();
      } else {
        engine.resume();
      }
    } else if (status === 'paused') {
      engine.pause();
    } else if (status === 'menu') {
      engine.stop();
    } else if (status === 'game_over') {
      // Do NOT stop engine here. The engine handles the transition to Replay Mode internally
      // when it detects collision.
    }
    // Update previous status
    prevStatusRef.current = status;
  }, [status]);
  // Handle Replay Video Generation
  useEffect(() => {
      const engine = engineRef.current;
      if (!engine) return;
      if (replayState === 'generating') {
          engine.enterReplayMode();
          engine.generateReplayVideo().then((blob) => {
              if (blob) {
                  finishReplayGeneration(blob);
              } else {
                  toast.error("Failed to generate replay video");
                  resetReplayState();
              }
          }).catch((err) => {
              console.error("Video generation error:", err);
              toast.error("Video generation failed");
              resetReplayState();
          });
      }
  }, [replayState, finishReplayGeneration, resetReplayState]);
  if (error) {
      return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-6 text-center z-50">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 border-2 border-red-200">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">ENGINE ERROR</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-xs">{error}</p>
              <Button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
              >
                  <RefreshCw className="w-4 h-4 mr-2" /> RELOAD GAME
              </Button>
          </div>
      );
  }
  return (
    <>
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none select-none"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
      {/* Hidden element to measure safe area inset */}
      <div
        ref={safeAreaRef}
        style={{
          position: 'fixed', // Changed from absolute to fixed to measure viewport safe area
          bottom: 0,
          left: 0,
          width: '1px',
          height: 'env(safe-area-inset-bottom)',
          zIndex: -10,
          visibility: 'hidden',
          pointerEvents: 'none'
        }}
      />
    </>
  );
}