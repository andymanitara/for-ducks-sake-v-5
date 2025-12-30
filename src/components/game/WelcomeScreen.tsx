import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/lib/store';
import { generateRandomName } from '@/lib/names';
import { Dice5, ArrowRight } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { toast } from 'sonner';
import { DuckAvatar } from './DuckAvatar';
import { SocialAuthButton } from '@/components/ui/social-auth-button';
export function WelcomeScreen() {
  const createProfile = useGameStore(state => state.createProfile);
  const loginWithProvider = useGameStore(state => state.loginWithProvider);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | 'apple' | null>(null);
  const handleRandomize = () => {
    soundSynth.playClick();
    setName(generateRandomName());
    setError('');
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundSynth.playClick();
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }
    if (trimmed.length > 15) {
      setError('Name must be under 15 characters');
      return;
    }
    createProfile(trimmed);
    toast.success(`Welcome, ${trimmed}!`);
  };
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    soundSynth.playClick();
    setIsSocialLoading(provider);
    try {
      await loginWithProvider(provider);
      // Success toast is handled in store
    } catch (e) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSocialLoading(null);
    }
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-400 p-6 pointer-events-auto overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ opacity: 0 }} // Explicit initialization to prevent runtime warning
        className="w-full max-w-md bg-yellow-400 rounded-[2.5rem] shadow-hard-xl p-8 border-4 border-black text-center relative z-10 max-h-[90vh] overflow-y-auto scrollbar-none"
      >
        {/* Header Section */}
        <div className="mb-6 relative">
          <h1 className="text-2xl sm:text-3xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md transform -rotate-2">
            WELCOME!
          </h1>
        </div>
        {/* Mascot */}
        <div className="flex justify-center mb-6 -mt-2">
          <div className="w-32 h-32 bg-white rounded-full border-4 border-black shadow-hard flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 bg-blue-100 opacity-50" />
             <DuckAvatar skinId="default" emotion="excited" className="w-40 h-40 mt-4" />
          </div>
        </div>
        <p className="text-black font-black uppercase tracking-wide mb-6 text-sm">
          Create your Duck Profile to start dodging!
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-xs font-black uppercase tracking-widest ml-1 text-black/70">Display Name</label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="ENTER NAME..."
                className="h-14 text-xl font-arcade uppercase border-4 border-black rounded-xl bg-white focus-visible:ring-0 focus-visible:border-blue-500 placeholder:text-gray-300"
                autoFocus
                disabled={!!isSocialLoading}
              />
              <Button
                type="button"
                onClick={handleRandomize}
                disabled={!!isSocialLoading}
                className="h-14 w-14 p-0 border-4 border-black rounded-xl bg-blue-400 hover:bg-blue-300 text-black shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Dice5 className="w-6 h-6 stroke-[2.5px]" />
              </Button>
            </div>
            {error && <p className="text-red-600 text-xs font-black ml-1 bg-red-100 px-2 py-1 rounded inline-block border-2 border-red-200">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || !!isSocialLoading}
            className="w-full h-16 text-xl font-arcade bg-green-500 hover:bg-green-400 text-white border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 group"
          >
            START <ArrowRight className="w-6 h-6 stroke-[4px] group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-yellow-400 px-2 text-black/50 font-black tracking-widest">OR</span>
          </div>
        </div>
        {/* Social Auth */}
        <div className="space-y-3">
          <SocialAuthButton
            provider="google"
            onClick={() => handleSocialLogin('google')}
            isLoading={isSocialLoading === 'google'}
            className={isSocialLoading === 'apple' ? 'opacity-50 pointer-events-none' : ''}
          />
          <SocialAuthButton
            provider="apple"
            onClick={() => handleSocialLogin('apple')}
            isLoading={isSocialLoading === 'apple'}
            className={isSocialLoading === 'google' ? 'opacity-50 pointer-events-none' : ''}
          />
        </div>
      </motion.div>
    </div>
  );
}