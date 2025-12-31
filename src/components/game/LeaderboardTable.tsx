import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw, AlertTriangle } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';
import { DuckAvatar } from './DuckAvatar';
import { formatDistanceToNow } from 'date-fns';
import { MAPS } from '@/game/constants';
import { cn } from '@/lib/utils';
import { LoadingDuck } from '@/components/ui/loading-duck';
import { ScrollArea } from '@/components/ui/scroll-area';
interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  profile?: any;
  selectedMapId?: string;
  onUserClick?: (userId: string) => void;
  emptyMessage?: string;
  className?: string;
}
export const LeaderboardTable = ({
  data,
  isLoading,
  error,
  onRetry,
  profile,
  selectedMapId,
  onUserClick,
  emptyMessage = "No scores yet",
  className
}: LeaderboardTableProps) => {
  const selectedMap = selectedMapId ? (MAPS.find(m => m.id === selectedMapId) || MAPS[0]) : null;
  if (isLoading) {
    return (
      <div className={cn("flex-1 flex items-center justify-center min-h-[200px]", className)}>
        <LoadingDuck text="Fetching Ranks..." />
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center min-h-[200px]", className)}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2 border-2 border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="max-w-[240px]">
          <p className="font-black uppercase text-lg text-gray-600">Connection Failed</p>
          <p className="text-xs font-bold text-gray-400 mt-1 break-words px-2 leading-tight">{error}</p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white font-black border-2 border-black shadow-hard active:translate-y-[2px] active:shadow-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> RETRY
          </Button>
        )}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 p-8 text-center min-h-[200px]", className)}>
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
          <DuckAvatar skinId="default" emotion="dizzy" isStatic className="w-20 h-20 opacity-50 grayscale" />
        </div>
        <div>
          <p className="font-black uppercase text-xl text-gray-500">{emptyMessage}</p>
          {selectedMap && (
            <p className="text-sm font-bold">Be the first to conquer the {selectedMap.name}!</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex-1 overflow-hidden relative bg-white rounded-t-2xl border-x-4 border-t-4 border-black shadow-hard mx-1 flex flex-col", className)}>
      <ScrollArea className="flex-1 h-full w-full">
        <div className="divide-y-2 divide-gray-100">
          {data.map((entry, index) => {
            const isMe = entry.userId === profile?.playerId;
            const timeAgo = entry.date ? formatDistanceToNow(entry.date, { addSuffix: true }) : '';
            const isTop3 = index < 3;
            // Handle name/playerName discrepancy
            const displayName = (entry as any).playerName || entry.name;
            return (
              <div
                key={`${entry.rank}-${entry.userId}`}
                onClick={() => onUserClick && onUserClick(entry.userId)}
                className={cn(
                  "flex items-center p-3 gap-3 transition-colors",
                  onUserClick ? "cursor-pointer" : "cursor-default",
                  isMe ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"
                )}
              >
                {/* Rank */}
                <div className="w-8 flex justify-center shrink-0">
                  {index === 0 ? (
                    <Crown className="w-6 h-6 text-yellow-500 fill-yellow-200" />
                  ) : (
                    <span className={cn(
                      "font-black font-arcade text-lg",
                      isTop3 ? "text-black" : "text-gray-400"
                    )}>
                      {entry.rank}
                    </span>
                  )}
                </div>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full border-2 border-black/10 overflow-hidden bg-gray-100 shrink-0 relative">
                  <DuckAvatar skinId={entry.skinId} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-black truncate text-sm", isMe && "text-blue-600")}>
                      {displayName} {isMe && "(You)"}
                    </span>
                  </div>
                  {timeAgo && (
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1">
                      {timeAgo}
                    </span>
                  )}
                </div>
                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="font-arcade font-black text-lg text-black">
                    {(entry.score / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};