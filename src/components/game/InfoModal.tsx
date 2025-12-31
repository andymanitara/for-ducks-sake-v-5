import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, BookOpen, AlertTriangle, Skull, Lightbulb, Info, MessageCircle, Instagram, Music, Twitter, Zap, TrendingUp, Clock, Shield, Dumbbell } from 'lucide-react';
import { HAZARD_INFO } from '@/game/constants';
import { HazardPreview } from './HazardPreview';
import { cn } from '@/lib/utils';
import { soundSynth } from '@/game/SoundSynth';
interface InfoModalProps {
  onClose: () => void;
  highlightedHazard?: string | null;
}
function ProgressionGuide() {
    return (
        <div className="bg-blue-500 rounded-xl p-4 mb-6 border-4 border-black shadow-hard relative overflow-hidden shrink-0">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-arcade text-sm text-white tracking-widest flex items-center gap-2 drop-shadow-md">
                        <TrendingUp className="w-5 h-5 text-yellow-300" />
                        LEVEL UP FASTER
                    </h3>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border-2 border-white/20 backdrop-blur-sm space-y-3">
                    <div>
                        <p className="text-xs font-bold text-white mb-2 leading-tight">
                            Unlock new maps by accumulating <span className="text-yellow-300">Total Survival Time</span>.
                        </p>
                        {/* Grace Period Note */}
                        <div className="flex items-start gap-2 text-[10px] font-bold text-blue-100 bg-black/20 p-2 rounded border border-white/10">
                            <Shield className="w-3 h-3 text-blue-300 shrink-0 mt-0.5" />
                            <span className="leading-tight">
                                <span className="text-blue-200 uppercase tracking-wide mr-1">Grace Period:</span>
                                The first 2s of every run are a warm-up and don't count.
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-3 h-3 text-yellow-300 fill-current" />
                            <span className="font-black text-[10px] uppercase text-yellow-300 tracking-wide">Time Multiplier Example</span>
                        </div>
                        <div className="bg-black/40 rounded-lg px-3 py-2 text-xs font-mono font-bold text-center border border-white/10 shadow-inner flex flex-col gap-1.5">
                            {/* Step 1: Grace Period Subtraction */}
                            <div className="flex items-center justify-center gap-1 text-[10px] opacity-80 border-b border-white/10 pb-1.5">
                                <span className="text-white">10s Run</span>
                                <span className="text-gray-400">-</span>
                                <span className="text-blue-300">2s Grace</span>
                                <span className="text-gray-400">=</span>
                                <span className="text-white">8s Base</span>
                            </div>
                            {/* Step 2: Multiplier */}
                            <div className="flex items-center justify-center">
                                <span className="text-white">8s Base</span>
                                <span className="text-gray-400 mx-1">×</span>
                                <span className="text-yellow-400">1.5x Map</span>
                                <span className="text-gray-400 mx-1">=</span>
                                <span className="text-green-400">12s</span>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-blue-100 mt-2 text-center opacity-80">
                            Play harder maps to unlock content faster!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
function GymGuide() {
    return (
        <div className="bg-orange-500 rounded-xl p-4 mb-6 border-4 border-black shadow-hard relative overflow-hidden shrink-0">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-arcade text-sm text-white tracking-widest flex items-center gap-2 drop-shadow-md">
                        <Dumbbell className="w-5 h-5 text-yellow-300" />
                        GYM CLASS RULES
                    </h3>
                </div>
                <div className="bg-white/10 rounded-lg p-3 border-2 border-white/20 backdrop-blur-sm space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-red-500 p-2 rounded-lg border-2 border-red-400 shrink-0">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase mb-1">Coach Barrage</p>
                            <p className="text-[10px] font-bold text-orange-100 leading-tight">
                                Periodically, the coach blows the whistle and throws a volley of wrenches!
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/20 p-2 rounded border border-white/10">
                            <p className="text-[9px] font-black text-yellow-300 uppercase mb-1">1. Warning</p>
                            <p className="text-[9px] font-bold text-white leading-tight">
                                Watch for the <span className="text-red-300">RED FLASH</span> on the screen edge. That's where they come from!
                            </p>
                        </div>
                        <div className="bg-black/20 p-2 rounded border border-white/10">
                            <p className="text-[9px] font-black text-green-300 uppercase mb-1">2. Survive</p>
                            <p className="text-[9px] font-bold text-white leading-tight">
                                Dodge the wrenches for <span className="text-green-300">3-6 seconds</span> until the whistle blows again.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export function InfoModal({ onClose, highlightedHazard }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'info'>('guide');
  const scrollRef = useRef<HTMLDivElement>(null);
  // Auto-scroll to highlighted hazard
  useEffect(() => {
    if (highlightedHazard && activeTab === 'guide') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(`hazard-item-${highlightedHazard}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedHazard, activeTab]);
  const handleTabChange = (tab: 'guide' | 'info') => {
      soundSynth.playClick();
      setActiveTab(tab);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }} // Explicit initialization to resolve Framer Motion warning
      className="absolute inset-0 bg-white z-[60] flex flex-col pointer-events-auto"
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-indigo-500">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
          <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
            INFO HUB
          </h2>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-12 w-12 border-4 border-black rounded-full bg-white hover:bg-red-100 shadow-hard active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-6 h-6 stroke-[3px]" />
        </Button>
      </div>
      {/* Content */}
      <div className="flex-1 p-6 bg-gray-50 overflow-hidden flex flex-col">
        {/* Custom Tabs */}
        <div className="grid w-full grid-cols-2 mb-6 border-4 border-black bg-white p-1 h-auto rounded-xl shadow-hard shrink-0 gap-1">
            <button
                onClick={() => handleTabChange('guide')}
                className={cn(
                    "font-black py-3 rounded-lg border-2 transition-all flex items-center justify-center",
                    activeTab === 'guide'
                        ? "bg-yellow-400 text-black border-black"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                )}
            >
                <AlertTriangle className="w-4 h-4 mr-2" /> GUIDE
            </button>
            <button
                onClick={() => handleTabChange('info')}
                className={cn(
                    "font-black py-3 rounded-lg border-2 transition-all flex items-center justify-center",
                    activeTab === 'info'
                        ? "bg-pink-400 text-black border-black"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                )}
            >
                <Info className="w-4 h-4 mr-2" /> INFO
            </button>
        </div>
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'guide' && (
                <div className="h-full w-full rounded-xl border-4 border-black bg-white p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]" ref={scrollRef}>
                    <ProgressionGuide />
                    <GymGuide />
                    <div className="grid grid-cols-1 gap-4 pb-4">
                        {Object.entries(HAZARD_INFO).map(([type, info]) => {
                        const isHighlighted = highlightedHazard === type;
                        return (
                            <div
                            key={type}
                            id={`hazard-item-${type}`}
                            className={cn(
                                "flex gap-4 p-3 rounded-xl border-2 transition-all group",
                                isHighlighted
                                ? "bg-yellow-50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02]"
                                : "bg-gray-50 border-gray-200 hover:border-black"
                            )}
                            >
                            <div className="w-20 h-20 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center shrink-0 overflow-hidden">
                                <HazardPreview type={type} className="w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start">
                                <h3 className="font-black text-lg uppercase truncate">{info.name}</h3>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                    <Skull
                                        key={i}
                                        className={cn(
                                        "w-3 h-3",
                                        i < info.danger ? "text-red-500 fill-current" : "text-gray-300"
                                        )}
                                    />
                                    ))}
                                </div>
                                </div>
                                <p className="text-sm text-gray-600 font-bold leading-tight mt-1">
                                {info.description}
                                </p>
                                {/* Strategy Tip */}
                                <div className="mt-2 flex items-start gap-1.5 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <Lightbulb className="w-3 h-3 text-blue-600 shrink-0 mt-0.5 fill-current" />
                                <p className="text-xs font-bold text-blue-700 leading-tight">
                                    <span className="uppercase text-[10px] tracking-wider text-blue-400 mr-1">STRATEGY:</span>
                                    {info.strategy}
                                </p>
                                </div>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                </div>
            )}
            {activeTab === 'info' && (
                <div className="h-full w-full rounded-xl border-4 border-black bg-white p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-[calc(2rem+env(safe-area-inset-bottom))]">
                    <div className="space-y-8 text-center pb-8">
                        {/* Credits Section */}
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border-4 border-yellow-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-black uppercase text-yellow-600 tracking-widest mb-2">Created By</h3>
                                <p className="text-2xl font-arcade text-black mb-1">AURELIA</p>
                                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Your AI Co-founder</p>
                                <div className="mt-4 pt-4 border-t border-yellow-200">
                                    <span className="text-[10px] font-black uppercase text-yellow-500 tracking-widest bg-yellow-100 px-2 py-1 rounded-full">
                                        v1.9.0
                                    </span>
                                </div>
                            </div>
                            <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest mb-2">Thanks For Playing!</h3>
                                <p className="text-xs font-bold text-blue-800 leading-relaxed">
                                    We hope you enjoy dodging ducks as much as we enjoyed building this for you.
                                    Keep surviving and unlocking those skins!
                                </p>
                            </div>
                        </div>
                        {/* Socials */}
                        <div className="space-y-4 pt-4 border-t-2 border-gray-100">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-1 w-12 bg-gray-200 rounded-full" />
                                <h3 className="font-black text-gray-400 uppercase tracking-widest text-sm">Follow Us</h3>
                                <div className="h-1 w-12 bg-gray-200 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <SocialButton icon={MessageCircle} label="DISCORD" color="indigo" />
                                <SocialButton icon={Instagram} label="INSTAGRAM" color="pink" />
                                <SocialButton icon={Music} label="TIKTOK" color="black" />
                                <SocialButton icon={Twitter} label="X / TWITTER" color="blue" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}
function SocialButton({ icon: Icon, label, color }: { icon: any, label: string, color: 'indigo' | 'pink' | 'black' | 'blue' }) {
  const colorStyles = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100",
    pink: "bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100",
    black: "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100",
    blue: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
  };
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); soundSynth.playClick(); }}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl border-4 transition-all active:scale-95",
        colorStyles[color]
      )}
    >
      <Icon className="w-8 h-8 mb-2 stroke-[2px]" />
      <span className="font-black text-xs uppercase tracking-wide">{label}</span>
    </a>
  );
}