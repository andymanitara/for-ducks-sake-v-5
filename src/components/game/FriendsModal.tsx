import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Users, UserPlus, Inbox, Copy, Check, Trash2, Swords, Play, Ghost, Info, Gift, Coins } from 'lucide-react';
import { soundSynth } from '@/game/SoundSynth';
import { DuckAvatar } from './DuckAvatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { LoadingDuck } from '@/components/ui/loading-duck';
import { Confetti } from '@/components/ui/confetti';
interface FriendsModalProps {
  onClose: () => void;
}
export function FriendsModal({ onClose }: FriendsModalProps) {
  const profile = useGameStore(state => state.profile);
  const friends = useGameStore(state => state.friends);
  const requests = useGameStore(state => state.friendRequests);
  const challenges = useGameStore(state => state.challenges);
  const isLoading = useGameStore(state => state.isLoadingFriends);
  const fetchFriends = useGameStore(state => state.fetchFriends);
  const fetchChallenges = useGameStore(state => state.fetchChallenges);
  const sendRequest = useGameStore(state => state.sendFriendRequest);
  const respondToRequest = useGameStore(state => state.respondToFriendRequest);
  const removeFriend = useGameStore(state => state.removeFriend);
  const acceptChallenge = useGameStore(state => state.acceptChallenge);
  const raceFriend = useGameStore(state => state.raceFriend);
  const viewUserProfile = useGameStore(state => state.viewUserProfile);
  const pendingReward = useGameStore(state => state.pendingReward);
  const claimReward = useGameStore(state => state.claimReward);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'requests' | 'challenges'>('list');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    fetchFriends();
    fetchChallenges();
  }, [fetchFriends, fetchChallenges]);
  // Self-healing: Fetch friend code if missing
  useEffect(() => {
      if (profile && !profile.friendCode) {
          api.getUser(profile.playerId).then(res => {
              if (res.success && res.data && res.data.friendCode) {
                  useGameStore.setState(state => ({
                      profile: state.profile ? { ...state.profile, friendCode: res.data.friendCode } : null
                  }));
              }
          });
      }
  }, [profile]);
  const handleCopyCode = () => {
      if (profile?.friendCode) {
          navigator.clipboard.writeText(profile.friendCode);
          toast.success("Friend Code copied!");
          soundSynth.playClick();
      }
  };
  const handleSendRequest = async () => {
      if (!friendCodeInput.trim()) return;
      setIsSubmitting(true);
      soundSynth.playClick();
      await sendRequest(friendCodeInput.trim().toUpperCase());
      setFriendCodeInput('');
      setIsSubmitting(false);
  };
  const handleRespond = async (requestId: string, accept: boolean) => {
      soundSynth.playClick();
      await respondToRequest(requestId, accept ? 'accept' : 'reject');
  };
  const handleRemove = async (friendId: string) => {
      if (confirm("Are you sure you want to remove this friend?")) {
          soundSynth.playDie();
          await removeFriend(friendId);
      }
  };
  const handleAcceptChallenge = (challenge: any) => {
      soundSynth.playClick();
      acceptChallenge(challenge);
      onClose();
  };
  const toggleHelp = () => {
      soundSynth.playClick();
      setShowHelp(!showHelp);
  };
  const handleViewProfile = (userId: string) => {
      soundSynth.playClick();
      viewUserProfile(userId);
  };
  const handleClaimReward = async () => {
      soundSynth.playClick();
      setShowConfetti(true);
      await claimReward();
      setTimeout(() => setShowConfetti(false), 2000);
  };
  const pendingChallenges = challenges.filter(c => c.toUserId === profile?.playerId && c.status === 'pending');
  // Filter for history: Completed/Declined/Accepted OR Pending Sent by Me
  const activeChallenges = challenges.filter(c =>
      c.status !== 'pending' || (c.status === 'pending' && c.fromUserId === profile?.playerId)
  ).sort((a, b) => b.timestamp - a.timestamp);
  const inboxCount = requests.length + (pendingReward ? 1 : 0);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-50 flex flex-col pointer-events-auto"
    >
      {showConfetti && <Confetti count={50} />}
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b-4 border-black bg-pink-500">
        <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-white drop-shadow-md stroke-[3px]" />
            <h2 className="text-2xl font-arcade text-white text-stroke-thick tracking-widest drop-shadow-md">
                SOCIAL
            </h2>
            <button
                onClick={toggleHelp}
                className="ml-2 p-1 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
            >
                <Info className="w-5 h-5" />
            </button>
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
      {/* Help Section */}
      <AnimatePresence>
          {showHelp && (
              <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-blue-50 border-b-4 border-black overflow-hidden"
              >
                  <div className="p-4 space-y-3 text-sm font-bold text-blue-900">
                      <div className="flex items-start gap-3">
                          <div className="bg-blue-200 p-2 rounded-lg shrink-0">
                              <UserPlus className="w-5 h-5 text-blue-700" />
                          </div>
                          <div>
                              <p className="font-black uppercase text-blue-600 mb-1">1. Connect</p>
                              <p className="leading-tight opacity-80">Share your Friend Code (in ADD tab) to connect with other players.</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="bg-purple-200 p-2 rounded-lg shrink-0">
                              <Ghost className="w-5 h-5 text-purple-700" />
                          </div>
                          <div>
                              <p className="font-black uppercase text-purple-600 mb-1">2. Ghost Racing</p>
                              <p className="leading-tight opacity-80">Click the <Ghost className="w-3 h-3 inline" /> icon next to a friend to race against their Personal Best ghost in real-time!</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="bg-orange-200 p-2 rounded-lg shrink-0">
                              <Swords className="w-5 h-5 text-orange-700" />
                          </div>
                          <div>
                              <p className="font-black uppercase text-orange-600 mb-1">3. Challenges</p>
                              <p className="leading-tight opacity-80">Send specific seed challenges to friends. You both play the exact same hazard pattern!</p>
                          </div>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
      {/* Tabs */}
      <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
          <div className="grid grid-cols-4 gap-2">
              <TabButton
                  active={activeTab === 'list'}
                  onClick={() => setActiveTab('list')}
                  icon={Users}
                  label="LIST"
                  color="blue"
              />
              <TabButton
                  active={activeTab === 'challenges'}
                  onClick={() => setActiveTab('challenges')}
                  icon={Swords}
                  label="VS"
                  color="purple"
                  badge={pendingChallenges.length > 0 ? pendingChallenges.length : undefined}
              />
              <TabButton
                  active={activeTab === 'add'}
                  onClick={() => setActiveTab('add')}
                  icon={UserPlus}
                  label="ADD"
                  color="green"
              />
              <TabButton
                  active={activeTab === 'requests'}
                  onClick={() => setActiveTab('requests')}
                  icon={Inbox}
                  label="INBOX"
                  color="orange"
                  badge={inboxCount > 0 ? inboxCount : undefined}
              />
          </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white relative pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <LoadingDuck text="Loading Social..." />
              </div>
          )}
          {activeTab === 'list' && (
              <div className="space-y-3">
                  {friends.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p className="font-black uppercase">No friends yet</p>
                          <p className="text-xs font-bold">Add someone to compare scores!</p>
                      </div>
                  ) : (
                      friends.map(friend => (
                          <div key={friend.id} className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors">
                              <div
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewProfile(friend.id)}
                              >
                                  <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden bg-gray-100">
                                      <DuckAvatar skinId={friend.skinId} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm">{friend.displayName}</p>
                                      <p className="text-xs font-bold text-gray-400">Best: {(friend.bestTime / 1000).toFixed(2)}s</p>
                                  </div>
                              </div>
                              <div className="flex items-center">
                                  <Button
                                      onClick={() => { soundSynth.playClick(); raceFriend(friend); onClose(); }}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg mr-1"
                                      title="Race Ghost"
                                  >
                                      <Ghost className="w-4 h-4" />
                                  </Button>
                                  <Button
                                      onClick={() => handleRemove(friend.id)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </Button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}
          {activeTab === 'challenges' && (
              <div className="space-y-6">
                  {/* Pending Challenges */}
                  {pendingChallenges.length > 0 && (
                      <div className="space-y-3">
                          <h3 className="text-xs font-black uppercase text-purple-500 tracking-widest ml-1">Incoming Challenges</h3>
                          {pendingChallenges.map(challenge => (
                              <div key={challenge.id} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full border border-purple-300 overflow-hidden bg-white">
                                              <DuckAvatar skinId={challenge.fromUserSkin} emotion="excited" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                                          </div>
                                          <div>
                                              <p className="font-black text-sm">{challenge.fromUserName}</p>
                                              <p className="text-[10px] font-bold text-purple-400 uppercase">Challenged You!</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase">TO BEAT</p>
                                          <p className="font-arcade text-lg text-purple-600">{(challenge.challengerScore / 1000).toFixed(2)}s</p>
                                      </div>
                                  </div>
                                  <Button
                                      onClick={() => handleAcceptChallenge(challenge)}
                                      className="w-full h-10 bg-purple-500 hover:bg-purple-600 text-white font-black border-2 border-black rounded-lg shadow-sm active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2"
                                  >
                                      <Play className="w-4 h-4 fill-current" /> ACCEPT CHALLENGE
                                  </Button>
                              </div>
                          ))}
                      </div>
                  )}
                  {/* History / Active */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">History</h3>
                      {activeChallenges.length === 0 ? (
                          <div className="text-center py-6 text-gray-300">
                              <Swords className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p className="text-xs font-bold">No challenge history</p>
                          </div>
                      ) : (
                          activeChallenges.map(challenge => {
                              const isMeSender = challenge.fromUserId === profile?.playerId;
                              const opponentName = isMeSender
                                  ? (challenge.toUserName || 'Friend')
                                  : (challenge.fromUserName || 'Friend');
                              const myScore = isMeSender ? challenge.challengerScore : challenge.targetScore;
                              const theirScore = isMeSender ? challenge.targetScore : challenge.challengerScore;
                              let result = 'UNKNOWN';
                              let resultColor = 'text-gray-500';
                              let bgColor = 'bg-white';
                              let borderColor = 'border-gray-200';
                              if (challenge.status === 'pending') {
                                  result = 'WAITING...';
                                  resultColor = 'text-yellow-600';
                                  bgColor = 'bg-yellow-50';
                                  borderColor = 'border-yellow-200';
                              } else if (challenge.status === 'declined') {
                                  result = 'DECLINED';
                                  resultColor = 'text-red-400';
                                  bgColor = 'bg-gray-50';
                                  borderColor = 'border-gray-200';
                              } else if (challenge.status === 'accepted') {
                                  result = 'IN PROGRESS';
                                  resultColor = 'text-blue-500';
                                  bgColor = 'bg-blue-50';
                                  borderColor = 'border-blue-200';
                              } else if (challenge.status === 'completed') {
                                  const myVal = myScore || 0;
                                  const theirVal = theirScore || 0;
                                  if (myVal > theirVal) {
                                      result = 'VICTORY';
                                      resultColor = 'text-green-600';
                                      bgColor = 'bg-green-50';
                                      borderColor = 'border-green-200';
                                  } else if (myVal < theirVal) {
                                      result = 'DEFEAT';
                                      resultColor = 'text-red-600';
                                      bgColor = 'bg-red-50';
                                      borderColor = 'border-red-200';
                                  } else {
                                      result = 'DRAW';
                                      resultColor = 'text-orange-500';
                                      bgColor = 'bg-orange-50';
                                      borderColor = 'border-orange-200';
                                  }
                              }
                              return (
                                  <div key={challenge.id} className={cn("flex flex-col p-3 border-2 rounded-xl transition-all", bgColor, borderColor)}>
                                      {/* Header */}
                                      <div className="flex justify-between items-center mb-2 border-b border-black/5 pb-2">
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VS</span>
                                              <span className="font-black text-sm text-gray-700 uppercase truncate max-w-[120px]">{opponentName}</span>
                                          </div>
                                          <span className={cn("font-black text-xs tracking-widest", resultColor)}>{result}</span>
                                      </div>
                                      {/* Scores Row */}
                                      <div className="flex justify-between items-center px-2">
                                          {/* My Score */}
                                          <div className="flex flex-col items-start">
                                              <span className="text-[9px] font-black uppercase text-gray-400 mb-0.5">YOU</span>
                                              <span className={cn("font-arcade text-lg leading-none", myScore ? "text-black" : "text-gray-300")}>
                                                  {myScore ? (myScore / 1000).toFixed(2) + 's' : '-'}
                                              </span>
                                          </div>
                                          {/* VS Divider */}
                                          <div className="h-8 w-px bg-black/10 mx-4" />
                                          {/* Their Score */}
                                          <div className="flex flex-col items-end">
                                              <span className="text-[9px] font-black uppercase text-gray-400 mb-0.5">THEM</span>
                                              <span className={cn("font-arcade text-lg leading-none", theirScore ? "text-black" : "text-gray-300")}>
                                                  {theirScore ? (theirScore / 1000).toFixed(2) + 's' : '-'}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          )}
          {activeTab === 'add' && (
              <div className="space-y-6">
                  {/* My Code */}
                  <div className="bg-blue-50 p-6 rounded-2xl border-4 border-blue-200 text-center">
                      <p className="text-xs font-black uppercase text-blue-400 tracking-widest mb-2">Your Friend Code</p>
                      <div className="flex items-center justify-center gap-3 mb-4">
                          <span className="text-4xl font-arcade text-blue-600 tracking-widest">
                              {profile?.friendCode || '??????'}
                          </span>
                      </div>
                      <Button
                          onClick={handleCopyCode}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-black border-2 border-black shadow-sm active:translate-y-[2px] active:shadow-none"
                      >
                          <Copy className="w-4 h-4 mr-2" /> COPY CODE
                      </Button>
                  </div>
                  {/* Input */}
                  <div className="space-y-3">
                      <label className="text-xs font-black uppercase text-gray-400 ml-1">Enter Friend's Code</label>
                      <div className="flex gap-2">
                          <Input
                              value={friendCodeInput}
                              onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                              placeholder="CODE"
                              maxLength={6}
                              className="h-12 text-xl font-arcade uppercase text-center border-4 border-black rounded-xl"
                          />
                          <Button
                              onClick={handleSendRequest}
                              disabled={isSubmitting || friendCodeInput.length < 6}
                              className="h-12 px-6 bg-green-500 hover:bg-green-600 text-white font-black border-4 border-black rounded-xl shadow-hard active:translate-y-[2px] active:shadow-none"
                          >
                              {isSubmitting ? <LoadingDuck className="w-8 h-8" /> : <UserPlus className="w-5 h-5" />}
                          </Button>
                      </div>
                  </div>
              </div>
          )}
          {activeTab === 'requests' && (
              <div className="space-y-3">
                  {/* Pending Reward Card */}
                  {pendingReward && (
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-xl p-4 shadow-hard mb-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent animate-pulse pointer-events-none" />
                          <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black shadow-sm">
                                      <Gift className="w-6 h-6 text-white stroke-[3px]" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm uppercase text-yellow-800">Daily Reward</p>
                                      <p className="text-xs font-bold text-yellow-700">
                                          Rank #{pendingReward.rank} on {pendingReward.mapName}
                                      </p>
                                      <div className="flex items-center gap-1 mt-1 bg-white/50 px-2 py-0.5 rounded-full w-fit">
                                          <Coins className="w-3 h-3 text-yellow-600" />
                                          <span className="font-arcade text-xs text-yellow-800">+{pendingReward.coins}</span>
                                      </div>
                                  </div>
                              </div>
                              <Button
                                  onClick={handleClaimReward}
                                  className="h-10 bg-green-500 hover:bg-green-600 text-white font-black border-2 border-black rounded-lg shadow-sm active:translate-y-[1px] active:shadow-none"
                              >
                                  CLAIM
                              </Button>
                          </div>
                      </div>
                  )}
                  {requests.length === 0 && !pendingReward ? (
                      <div className="text-center py-10 text-gray-400">
                          <Inbox className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p className="font-black uppercase">Inbox Empty</p>
                      </div>
                  ) : (
                      requests.map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl bg-yellow-50">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden bg-white">
                                      <DuckAvatar skinId={req.fromUserSkin} emotion="idle" isStatic className="w-full h-full transform scale-150 translate-y-[10%]" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm">{req.fromUserName}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Wants to be friends</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <Button
                                      onClick={() => handleRespond(req.id, true)}
                                      size="icon"
                                      className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white border-2 border-black rounded-lg shadow-sm"
                                  >
                                      <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                      onClick={() => handleRespond(req.id, false)}
                                      size="icon"
                                      className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-2 border-black rounded-lg shadow-sm"
                                  >
                                      <X className="w-4 h-4" />
                                  </Button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}
      </div>
    </motion.div>
  );
}
function TabButton({ active, onClick, icon: Icon, label, color, badge }: any) {
    const colorStyles = {
        blue: active ? "bg-blue-500 text-white border-black" : "bg-white text-gray-500 border-transparent hover:bg-gray-100",
        green: active ? "bg-green-500 text-white border-black" : "bg-white text-gray-500 border-transparent hover:bg-gray-100",
        orange: active ? "bg-orange-500 text-white border-black" : "bg-white text-gray-500 border-transparent hover:bg-gray-100",
        purple: active ? "bg-purple-500 text-white border-black" : "bg-white text-gray-500 border-transparent hover:bg-gray-100",
    };
    return (
        <button
            onClick={() => { soundSynth.playClick(); onClick(); }}
            className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all relative",
                colorStyles[color]
            )}
        >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
            {badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {badge}
                </div>
            )}
        </button>
    );
}