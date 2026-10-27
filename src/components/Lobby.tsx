import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { socketService } from '../services/socket.js';
import { sound } from '../services/audio.js';
import { AvatarIcon } from './AvatarIcon.js';
import { GameRoom, GameMode, AIDifficulty } from '../types/game.js';
import {
  Dice5,
  TrendingUp,
  Bot,
  Users,
  Copy,
  Check,
  Play,
  UserPlus,
  Coins,
  Shield,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface LobbyProps {
  onJoinSuccess: (room: GameRoom) => void;
  waitingRoom: GameRoom | null;
  setWaitingRoom: (room: GameRoom | null) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  onJoinSuccess,
  waitingRoom,
  setWaitingRoom,
}) => {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameMode>('ludo');
  const [matchType, setMatchType] = useState<'ai' | 'online'>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [quickMode, setQuickMode] = useState(false);
  const [twistMode, setTwistMode] = useState(true);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeRooms, setActiveRooms] = useState<any[]>([]);

  // Fetch active rooms for the room browser
  const refreshActiveRooms = () => {
    fetch('/api/rooms/active')
      .then((res) => res.json())
      .then((list) => setActiveRooms(list || []))
      .catch(() => {});
  };

  useEffect(() => {
    refreshActiveRooms();
    const interval = setInterval(refreshActiveRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    sound.playClick();

    try {
      const res = await socketService.createRoom({
        hostUser: { id: user.id, username: user.username, avatar: user.avatar },
        mode: selectedMode,
        matchType,
        entryFee,
        quickMode,
        twistMode,
        difficulty,
      });

      if (!res.success || !res.room) {
        throw new Error(res.error || 'Failed to create room');
      }

      if (matchType === 'ai') {
        // AI match starts directly!
        socketService.startGame(res.room.code);
      } else {
        setWaitingRoom(res.room);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating match');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWithCode = async (codeToJoin?: string) => {
    if (!user) return;
    const targetCode = (codeToJoin || joinCode).trim().toUpperCase();
    if (!targetCode) {
      setError('Please enter a 6-digit room code');
      return;
    }

    setError('');
    setLoading(true);
    sound.playClick();

    try {
      const res = await socketService.joinRoom({
        code: targetCode,
        user: { id: user.id, username: user.username, avatar: user.avatar },
      });

      if (!res.success || !res.room) {
        throw new Error(res.error || 'Failed to join room');
      }

      setWaitingRoom(res.room);
    } catch (err: any) {
      setError(err.message || 'Error joining room');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!waitingRoom) return;
    sound.playClick();
    navigator.clipboard.writeText(waitingRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBot = (diff: AIDifficulty = 'medium') => {
    if (!waitingRoom) return;
    sound.playClick();
    socketService.addBot(waitingRoom.code, diff);
  };

  const handleKickPlayer = (playerId: string) => {
    if (!waitingRoom) return;
    sound.playClick();
    socketService.removePlayer(waitingRoom.code, playerId);
  };

  const handleStartMatch = () => {
    if (!waitingRoom) return;
    sound.playClick();
    socketService.startGame(waitingRoom.code);
  };

  /* ==========================================================================
     WAITING ROOM STAGING VIEW (Play with Friends)
     ========================================================================== */
  if (waitingRoom) {
    const isHost = waitingRoom.hostId === user?.id;
    const canStart = waitingRoom.players.length >= 2;

    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-bold uppercase text-indigo-300">
              {waitingRoom.mode === 'ludo' ? 'Classic Ludo' : 'Ladder Chase'} Room
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">Match Lobby</h2>
            <p className="text-xs text-slate-400 mt-1">
              Share the Room Code with friends or add AI bots to start the battle!
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-950 border-2 border-dashed border-amber-400/40 p-4 mb-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Private Room Code
              </div>
              <div className="font-mono text-3xl font-black text-amber-300 tracking-widest">
                {waitingRoom.code}
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md transition-all"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Stakes & Rules Overview */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-4 px-1">
            <span>
              Players: <strong className="text-white">{waitingRoom.players.length} / 4</strong>
            </span>
            {waitingRoom.entryFee > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="h-3.5 w-3.5" /> Entry: {waitingRoom.entryFee} Coins
              </span>
            )}
          </div>

          {/* Players Grid (Slots 1 to 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {waitingRoom.players.map((p) => {
              const colorPill: Record<string, string> = {
                red: 'border-rose-500/50 bg-rose-950/30 text-rose-300',
                green: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
                yellow: 'border-amber-400/50 bg-amber-950/30 text-amber-300',
                blue: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
              };

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-3 flex items-center justify-between ${
                    colorPill[p.color]
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarIcon avatarId={p.avatar} size="md" />
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isHost && (
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1 font-black">
                            HOST
                          </span>
                        )}
                        {p.isAI && (
                          <span className="rounded bg-slate-700 text-cyan-300 text-[9px] px-1 font-black">
                            BOT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {p.color} Token
                      </div>
                    </div>
                  </div>

                  {isHost && !p.isHost && (
                    <button
                      onClick={() => handleKickPlayer(p.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs font-bold p-1"
                      title="Kick from lobby"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: 4 - waitingRoom.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-2xl border border-dashed border-white/10 p-3 flex items-center justify-between bg-slate-950/30"
              >
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <div className="w-10 h-10 rounded-2xl border border-white/5 flex items-center justify-center">
                    ?
                  </div>
                  <span>Waiting for player...</span>
                </div>

                {isHost && (
                  <button
                    onClick={() => handleAddBot('medium')}
                    className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-300 border border-white/10 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>+ Bot</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setWaitingRoom(null);
              }}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-slate-300 transition-colors"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                onClick={handleStartMatch}
                disabled={!canStart}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/25 hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{canStart ? 'Launch Game' : 'Waiting for Players (Min 2)'}</span>
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-bold text-amber-300 bg-amber-500/10 rounded-xl py-3 border border-amber-500/20">
                Waiting for host to start match...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     CENTRAL LOBBY & GAME MODE SELECTION VIEW
     ========================================================================== */
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 sm:p-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Hero Lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-white/10 px-4 py-1.5 text-xs font-bold text-amber-300 mb-3 shadow">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Real-Time Multiplayer &amp; AI Arena</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Choose Your Board Mode
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2">
            Compete in classic strategic Ludo or climb ladders &amp; dodge chutes in high-stakes matches!
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Game Mode Cards (Mode A: Ludo, Mode B: Ladder Chase) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Mode A: Ludo Classic / Quick */}
          <div
            onClick={() => {
              sound.playClick();
              setSelectedMode('ludo');
            }}
            className={`relative rounded-3xl p-6 sm:p-8 border-2 cursor-pointer transition-all ${
              selectedMode === 'ludo'
                ? 'border-amber-400 bg-gradient-to-b from-amber-950/30 to-slate-900 shadow-2xl shadow-amber-500/20 scale-[1.02]'
                : 'border-white/10 bg-slate-900/60 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg shadow-amber-500/30">
                <Dice5 className="h-7 w-7 text-white" />
              </div>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-[11px] font-black uppercase text-amber-300">
                Mode A
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">Classic Ludo Arena</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Roll 6 to unlock tokens, strike opponent pawns back to base, and race down home straight!
            </p>

            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setQuickMode(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  !quickMode
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Classic (4 Tokens)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setQuickMode(true);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  quickMode
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Quick Mode (2 Tokens)
              </button>
            </div>
          </div>

          {/* Mode B: Ladder Chase */}
          <div
            onClick={() => {
              sound.playClick();
              setSelectedMode('ladder');
            }}
            className={`relative rounded-3xl p-6 sm:p-8 border-2 cursor-pointer transition-all ${
              selectedMode === 'ladder'
                ? 'border-indigo-400 bg-gradient-to-b from-indigo-950/30 to-slate-900 shadow-2xl shadow-indigo-500/20 scale-[1.02]'
                : 'border-white/10 bg-slate-900/60 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-[11px] font-black uppercase text-indigo-300">
                Mode B
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">Ladder Chase</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Snakes &amp; Ladders twist with shields, speed boosts, and monster chutes along a 100-cell serpentine track!
            </p>

            <div className="flex items-center gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setTwistMode(true);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  twistMode
                    ? 'bg-indigo-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ✨ Twist (Shields &amp; Boosts)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setTwistMode(false);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  !twistMode
                    ? 'bg-indigo-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Standard
              </button>
            </div>
          </div>
        </div>

        {/* Match Type Tabs: Play vs Computer (AI) or Play with Friends (Online Room) */}
        <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex rounded-2xl bg-slate-950 p-1 mb-6 border border-white/5">
            <button
              onClick={() => {
                sound.playClick();
                setMatchType('ai');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                matchType === 'ai'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Play vs Computer (AI)</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMatchType('online');
              }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                matchType === 'online'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Play with Friends (Room Code)</span>
            </button>
          </div>

          {/* AI Configuration */}
          {matchType === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select AI Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setDifficulty(diff);
                      }}
                      className={`rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all border ${
                        difficulty === diff
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md'
                          : 'border-white/5 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Match Stakes (Gold Coins)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 100, 500, 1000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setEntryFee(fee);
                      }}
                      className={`rounded-xl py-2 text-xs font-black transition-all border ${
                        entryFee === fee
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow'
                          : 'border-white/5 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fee === 0 ? 'Free' : `${fee} Coins`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full mt-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 py-3.5 text-sm font-black text-white shadow-xl shadow-rose-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{loading ? 'Starting Match...' : 'Start Battle vs AI'}</span>
              </button>
            </div>
          )}

          {/* Online Room Configuration */}
          {matchType === 'online' && (
            <div className="space-y-6">
              {/* Host Create Room */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Host New Room
                </h4>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[0, 100, 500, 1000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setEntryFee(fee);
                      }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                        entryFee === fee
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-white/5 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      {fee === 0 ? 'Free Match' : `Entry: ${fee} Coins`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Create Room &amp; Generate Code</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Or Join Room</span>
                </div>
              </div>

              {/* Join with Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Enter 6-Digit Room Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7X9K2P"
                    className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 font-mono text-base font-bold text-amber-300 uppercase tracking-widest placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinWithCode()}
                    disabled={loading || !joinCode}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <span>Join</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public Waiting Rooms Browser */}
        {activeRooms.length > 0 && (
          <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Open Public Rooms ({activeRooms.length})
              </h4>
              <span className="text-[10px] text-emerald-400 font-semibold">● Real-time Live</span>
            </div>

            <div className="space-y-2">
              {activeRooms.map((r) => (
                <div
                  key={r.code}
                  className="rounded-2xl border border-white/5 bg-slate-950/60 p-3 flex items-center justify-between hover:border-amber-400/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      #{r.code}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white capitalize">
                        {r.mode === 'ludo' ? 'Classic Ludo' : 'Ladder Chase'}
                      </div>
                      <div className="text-[10px] text-slate-400">Host: {r.hostName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {r.playersCount}/{r.maxPlayers} Players
                    </span>
                    <button
                      onClick={() => handleJoinWithCode(r.code)}
                      className="rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 px-3 py-1.5 text-xs font-black transition-all"
                    >
                      Join Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
