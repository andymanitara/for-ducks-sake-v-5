import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Play, Home, Settings, RotateCcw } from 'lucide-react';
import { SkinSelector } from './SkinSelector';
import { Leaderboard } from './Leaderboard';
import { MainMenu } from './MainMenu';
import { WelcomeScreen } from './WelcomeScreen';
import { ProfileScreen } from './ProfileScreen';
import { UnlockModal } from './UnlockModal';
import { GameOverSheet } from './GameOverSheet';
import { GameHUD } from './GameHUD';
import { InfoModal } from './InfoModal';
import { MapSelector } from './MapSelector';
import { AchievementsModal } from './AchievementsModal';
import { SettingsModal } from './SettingsModal';
import { FriendsModal } from './FriendsModal';
import { ChallengesModal } from './ChallengesModal';
import { MenuBackground } from './MenuBackground';
import { NotificationManager } from './NotificationManager';
import { ShopModal } from './ShopModal';
import { OtherUserProfileModal } from './OtherUserProfileModal';
import { OfflineIndicator } from './OfflineIndicator';
import { ResumeCountdown } from './ResumeCountdown';
import { soundSynth } from '@/game/SoundSynth';
import { GAME_TIPS } from '@/game/constants';
import { setGlobalResetToken } from '@/lib/api';
export function UIOverlay() {
  const status = useGameStore(state => state.status);
  const profile = useGameStore(state => state.profile);
  const newUnlocks = useGameStore(state => state.newUnlocks);
  const replayViewMode = useGameStore(state => state.replayViewMode);
  const showFriendsModal = useGameStore(state => state.showFriendsModal);
  const isViewingProfileOpen = useGameStore(state => state.isViewingProfileOpen);
  const closeUserProfile = useGameStore(state => state.closeUserProfile);
  const setStatus = useGameStore(state => state.setStatus);
  const togglePause = useGameStore(state => state.togglePause);
  const clearNewUnlocks = useGameStore(state => state.clearNewUnlocks);
  const setReplayViewMode = useGameStore(state => state.setReplayViewMode);
  const checkBackendStatus = useGameStore(state => state.checkBackendStatus);
  const setShowFriendsModal = useGameStore(state => state.setShowFriendsModal);
  const resetGame = useGameStore(state => state.resetGame);
  const currentBiome = useGameStore(state => state.biome);
  const serverResetToken = useGameStore(state => state.serverResetToken);
  const resetReplayState = useGameStore(state => state.resetReplayState);
  const [showSkins, setShowSkins] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [highlightedHazard, setHighlightedHazard] = useState<string | null>(null);
  const [randomTip, setRandomTip] = useState('');
  const [isResuming, setIsResuming] = useState(false);
  // Context for Challenges Modal to open correct tab/map
  const [challengeContext, setChallengeContext] = useState<{ tab: 'daily' | 'maps', mapId?: string } | null>(null);
  // Sync Reset Token to API
  useEffect(() => {
      setGlobalResetToken(serverResetToken);
  }, [serverResetToken]);
  // Check backend status on mount
  useEffect(() => {
      checkBackendStatus();
  }, [checkBackendStatus]);
  // Select a random tip when status changes to paused
  useEffect(() => {
      if (status === 'paused') {
          setRandomTip(GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]);
          setIsResuming(false); // Reset resume state when pausing
      }
  }, [status]);
  if (!profile) {
    return <WelcomeScreen />;
  }
  const handleOpenStrategy = (hazardType: string) => {
      setHighlightedHazard(hazardType);
      setShowInfo(true);
  };
  const handleCloseInfo = () => {
      setShowInfo(false);
      setHighlightedHazard(null);
  };
  const handleResumeClick = () => {
      soundSynth.playClick();
      setIsResuming(true);
  };
  const handleCountdownComplete = () => {
      togglePause();
      setIsResuming(false);
  };
  const handleOpenShopFromWardrobe = () => {
      setShowSkins(false);
      setShowShop(true);
  };
  const handleOpenChallenges = () => {
      soundSynth.playClick();
      // Capture context based on current game state before resetting
      const store = useGameStore.getState();
      if (store.gameMode === 'challenge') {
          setChallengeContext({ tab: 'maps', mapId: store.biome });
      } else if (store.gameMode === 'daily') {
          setChallengeContext({ tab: 'daily' });
      } else {
          setChallengeContext(null);
      }
      resetReplayState();
      setStatus('menu');
      setShowChallenges(true);
  };
  const getActiveView = () => {
    if (newUnlocks.length > 0) {
        return <UnlockModal key="unlock-modal" skinIds={newUnlocks} onClose={clearNewUnlocks} />;
    }
    if (showSkins) {
        return <SkinSelector key="skins" onClose={() => setShowSkins(false)} onOpenShop={handleOpenShopFromWardrobe} />;
    }
    if (isViewingProfileOpen) {
        return <OtherUserProfileModal key="other-profile" onClose={closeUserProfile} />;
    }
    if (showShop) {
        return <ShopModal key="shop" onClose={() => setShowShop(false)} />;
    }
    if (showChallenges) {
        return <ChallengesModal 
            key="challenge-select" 
            onClose={() => { setShowChallenges(false); setChallengeContext(null); }} 
            initialContext={challengeContext}
        />;
    }
    if (showLeaderboard) {
        return <Leaderboard key="leaderboard" onClose={() => setShowLeaderboard(false)} />;
    }
    if (showProfile) {
        return <ProfileScreen key="profile" onClose={() => setShowProfile(false)} />;
    }
    if (showMaps) {
        return <MapSelector key="maps" onClose={() => setShowMaps(false)} />;
    }
    if (showAchievements) {
        return <AchievementsModal key="achievements" onClose={() => setShowAchievements(false)} />;
    }
    if (showSettings) {
        return <SettingsModal key="settings" onClose={() => setShowSettings(false)} />;
    }
    if (showFriendsModal) {
        return <FriendsModal key="friends" onClose={() => setShowFriendsModal(false)} />;
    }
    if (showInfo) {
        return <InfoModal key="info" onClose={handleCloseInfo} highlightedHazard={highlightedHazard} />;
    }
    if (status === 'paused') {
        if (isResuming) {
            return <ResumeCountdown key="countdown" onComplete={handleCountdownComplete} />;
        }
        return (
            <motion.div
                key="paused"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ opacity: 0 }} // Explicit initialization
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-40 p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    style={{ opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm border-4 border-black shadow-hard-xl text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-6 bg-yellow-400 border-b-4 border-black flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-2 h-2 bg-black rounded-full" />
                    </div>
                    <h2 className="text-6xl font-arcade text-yellow-400 text-stroke-thick tracking-tighter drop-shadow-sm mt-6 mb-8 transform -rotate-2">
                        PAUSED
                    </h2>
                    <div className="space-y-4">
                        <Button
                            onClick={handleResumeClick}
                            className="w-full h-20 text-2xl font-arcade bg-green-500 hover:bg-green-400 text-white border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <Play className="w-8 h-8 fill-current" />
                            RESUME
                        </Button>
                        <Button
                            onClick={() => { soundSynth.playClick(); resetGame(); }}
                            className="w-full h-16 text-xl font-arcade bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <RotateCcw className="w-6 h-6 stroke-[3px]" />
                            RESTART
                        </Button>
                        <Button
                            onClick={() => { soundSynth.playClick(); setShowSettings(true); }}
                            className="w-full h-16 text-xl font-arcade bg-blue-500 hover:bg-blue-400 text-white border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <Settings className="w-6 h-6" />
                            OPTIONS
                        </Button>
                        <Button
                            onClick={() => { soundSynth.playClick(); setStatus('menu'); }}
                            className="w-full h-16 text-xl font-arcade bg-red-500 hover:bg-red-400 text-white border-4 border-black rounded-2xl shadow-hard active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <Home className="w-6 h-6" />
                            QUIT
                        </Button>
                    </div>
                    {/* Tip Section */}
                    <div className="mt-6 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl transform rotate-1 shadow-sm">
                        <p className="text-xs font-bold text-blue-800 leading-tight text-center font-sans">
                            <span className="font-black uppercase text-blue-400 block mb-1 text-[10px] tracking-widest">Game Tip</span>
                            {randomTip}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        );
    }
    if (status === 'game_over') {
        if (replayViewMode === 'fullscreen') {
             return (
                <motion.div
                    key="tap-return"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{ opacity: 0 }} // Explicit initialization
                    onClick={() => setReplayViewMode('default')}
                    className="absolute inset-0 z-50 pointer-events-auto flex items-end justify-center cursor-pointer"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ opacity: 0 }}
                        className="bg-black/50 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold text-sm border border-white/20 font-arcade tracking-widest"
                    >
                        TAP TO RETURN
                    </motion.div>
                </motion.div>
             );
        }
        // Default game over sheet
        return (
            <GameOverSheet
                key="game-over"
                onWatchReplay={() => setReplayViewMode('fullscreen')}
                onOpenStrategy={handleOpenStrategy}
                onOpenChallenges={handleOpenChallenges}
            />
        );
    }
    if (status === 'menu') {
        return (
            <motion.div
                key="main-menu"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ opacity: 1 }} // Explicit initialization
                className="absolute inset-0 z-30 pointer-events-auto"
            >
                <MainMenu
                    onStart={() => { soundSynth.playClick(); setShowMaps(true); }}
                    onSkins={() => { soundSynth.playClick(); setShowSkins(true); }}
                    onLeaderboard={() => { soundSynth.playClick(); setShowLeaderboard(true); }}
                    onBiome={() => { soundSynth.playClick(); setShowMaps(true); }}
                    onProfile={() => { soundSynth.playClick(); setShowProfile(true); }}
                    onInfo={() => { soundSynth.playClick(); setShowInfo(true); }}
                    onAchievements={() => { soundSynth.playClick(); setShowAchievements(true); }}
                    onSettings={() => { soundSynth.playClick(); setShowSettings(true); }}
                    onFriends={() => { soundSynth.playClick(); setShowFriendsModal(true); }}
                    onShop={() => { soundSynth.playClick(); setShowShop(true); }}
                    onChallenges={() => { soundSynth.playClick(); setShowChallenges(true); }}
                    onDaily={() => { soundSynth.playClick(); setShowChallenges(true); }}
                    profile={profile}
                />
            </motion.div>
        );
    }
    return null;
  };
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <GameHUD />
      <NotificationManager />
      <OfflineIndicator />
      {/* Persistent Menu Background with Dynamic Theme */}
      {status === 'menu' && (
        <div className="absolute inset-0 z-0">
          <MenuBackground biome={currentBiome} />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        </div>
      )}
      <AnimatePresence mode="wait">
        {getActiveView()}
      </AnimatePresence>
    </div>
  );
}