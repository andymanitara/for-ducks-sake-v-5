import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Volume2, VolumeX, Volume1, Settings, Smartphone, SmartphoneNfc, EyeOff, Eye, Battery, BatteryCharging, RotateCcw, Download } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { haptics } from '@/game/Haptics';
import { CustomToggle } from '@/components/ui/custom-toggle';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';
interface SettingsModalProps {
  onClose: () => void;
}
export function SettingsModal({ onClose }: SettingsModalProps) {
  const isAudioEnabled = useGameStore(state => state.isAudioEnabled);
  const volume = useGameStore(state => state.volume);
  const isHapticsEnabled = useGameStore(state => state.isHapticsEnabled);
  const isReducedMotion = useGameStore(state => state.isReducedMotion);
  const isBatterySaver = useGameStore(state => state.isBatterySaver);
  const toggleAudio = useGameStore(state => state.toggleAudio);
  const setVolume = useGameStore(state => state.setVolume);
  const toggleHaptics = useGameStore(state => state.toggleHaptics);
  const toggleReducedMotion = useGameStore(state => state.toggleReducedMotion);
  const toggleBatterySaver = useGameStore(state => state.toggleBatterySaver);
  const resetSettings = useGameStore(state => state.resetSettings);
  const { isInstallable, promptInstall } = usePwaInstall();
  const handleToggleAudio = () => {
    toggleAudio();
    if (!isAudioEnabled) soundSynth.playClick();
  };
  const handleToggleHaptics = () => {
    toggleHaptics();
    if (!isHapticsEnabled) haptics.soft();
  };
  const handleToggleMotion = () => {
    toggleReducedMotion();
    if (isReducedMotion) soundSynth.playClick();
  };
  const handleToggleBatterySaver = () => {
    toggleBatterySaver();
    if (!isBatterySaver) soundSynth.playClick();
  };
  const handleReset = () => {
    soundSynth.playClick();
    resetSettings();
    toast.success("Settings reset");
  };
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto pb-safe">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ opacity: 0 }}
        className="bg-white rounded-[2rem] max-w-sm w-full border-4 border-black shadow-hard overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
      >
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b-4 border-black flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-white stroke-[3px]" />
                <h2 className="text-xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                    OPTIONS
                </h2>
            </div>
            <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 border-2 border-black rounded-full bg-white hover:bg-red-100 shadow-sm active:translate-y-[2px] active:shadow-none transition-all"
            >
                <X className="w-5 h-5 stroke-[3px]" />
            </Button>
        </div>
        {/* Content */}
        <div className="p-4 space-y-4 bg-gray-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pb-8">
            {/* Volume Control */}
            <div className="bg-white p-3 rounded-xl border-2 border-black shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {volume > 0.5 ? <Volume2 className="w-5 h-5" /> : volume > 0 ? <Volume1 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-500" />}
                        <span className="font-black text-sm uppercase">Master Volume</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-gray-500">{Math.round(volume * 100)}%</span>
                </div>
                <Slider
                    defaultValue={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(vals) => setVolume(vals[0] / 100)}
                    className="py-1"
                />
            </div>
            {/* Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleCard
                    label="Sound FX"
                    icon={isAudioEnabled ? Volume2 : VolumeX}
                    checked={isAudioEnabled}
                    onChange={handleToggleAudio}
                    color="green"
                />
                <ToggleCard
                    label="Haptics"
                    icon={isHapticsEnabled ? SmartphoneNfc : Smartphone}
                    checked={isHapticsEnabled}
                    onChange={handleToggleHaptics}
                    color="blue"
                />
                <ToggleCard
                    label="Motion"
                    icon={!isReducedMotion ? Eye : EyeOff}
                    checked={!isReducedMotion} // Inverted: ON = Full Motion
                    onChange={handleToggleMotion}
                    color="purple"
                />
                <ToggleCard
                    label="Battery Saver"
                    icon={isBatterySaver ? BatteryCharging : Battery}
                    checked={isBatterySaver}
                    onChange={handleToggleBatterySaver}
                    color="orange"
                />
            </div>
            {/* Actions */}
            <div className="space-y-2 pt-2">
                {isInstallable && (
                    <Button
                        onClick={() => { soundSynth.playClick(); promptInstall(); }}
                        className="w-full h-10 bg-blue-500 hover:bg-blue-400 text-white font-black border-2 border-black rounded-xl shadow-sm active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <Download className="w-4 h-4 stroke-[3px]" /> INSTALL APP
                    </Button>
                )}
                <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full h-10 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                    <RotateCcw className="w-4 h-4" /> RESET DEFAULTS
                </Button>
                <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-4 block">v1.9.0</span>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
function ToggleCard({ label, icon: Icon, checked, onChange, color, className }: any) {
    const colorStyles: Record<string, string> = {
        green: checked ? "bg-green-100 border-green-300" : "bg-white border-gray-200",
        blue: checked ? "bg-blue-100 border-blue-300" : "bg-white border-gray-200",
        purple: checked ? "bg-purple-100 border-purple-300" : "bg-white border-gray-200",
        cyan: checked ? "bg-cyan-100 border-cyan-300" : "bg-white border-gray-200",
        orange: checked ? "bg-orange-100 border-orange-300" : "bg-white border-gray-200",
    };
    return (
        <div className={cn(
            "flex items-center justify-between p-2.5 rounded-xl border-2 transition-colors",
            colorStyles[color],
            className
        )}>
            <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border-2 border-black/10 shrink-0",
                    checked ? "bg-white/50" : "bg-gray-100"
                )}>
                    <Icon className={cn("w-4 h-4", checked ? "text-black" : "text-gray-400")} />
                </div>
                <span className="font-black text-xs uppercase leading-tight">{label}</span>
            </div>
            <div className="scale-75 origin-right">
                <CustomToggle checked={checked} onCheckedChange={onChange} />
            </div>
        </div>
    )
}