import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { GameMap, MapStats, Achievement } from '@/types/game';
import { cn, formatLargeTime } from '@/lib/utils';
import { IconMap } from './AchievementIcons';
interface MapStatCardProps {
    map: GameMap;
    stats: MapStats;
    achievements: Achievement[];
}
export function MapStatCard({ map, stats, achievements }: MapStatCardProps) {
    const formatTime = (ms: number) => (ms / 1000).toFixed(2) + 's';
    const isDarkTheme = ['glitch', 'billiards'].includes(map.id);
    const textColor = isDarkTheme ? 'text-white' : 'text-black';
    const subTextColor = isDarkTheme ? 'text-white/70' : 'text-black/60';
    return (
        <div
            className="relative overflow-hidden rounded-xl border-4 border-black p-4 shadow-sm transition-transform active:scale-[0.98]"
            style={{ backgroundColor: map.colorTheme }}
        >
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-2">
                    <h4 className={cn("font-black uppercase text-lg leading-none", textColor)}>{map.name}</h4>
                </div>
                <div className={cn("flex gap-4 text-xs font-bold mb-3", subTextColor)}>
                    <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Best: {formatTime(stats.bestTime)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Total: {formatLargeTime(stats.totalTimeSurvived)}
                    </span>
                </div>
                {/* Map Achievements Section */}
                {achievements.length > 0 && (
                    <div className={cn("pt-2 border-t", isDarkTheme ? "border-white/20" : "border-black/10")}>
                        <p className={cn("text-[9px] font-black uppercase mb-1.5 opacity-80", textColor)}>Unlocked Mastery</p>
                        <div className="flex flex-wrap gap-1.5">
                            {achievements.map(ach => {
                                const Icon = IconMap[ach.icon] || Trophy;
                                return (
                                    <div
                                        key={ach.id}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-md border shadow-sm",
                                            isDarkTheme ? "bg-black/30 border-white/20 text-white" : "bg-white/60 border-black/10 text-black"
                                        )}
                                        title={ach.description}
                                    >
                                        <Icon className="w-3 h-3" />
                                        <span className="text-[9px] font-bold uppercase">{ach.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}