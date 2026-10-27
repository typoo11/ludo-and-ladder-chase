import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { sound } from '../services/audio.js';
import { AVATAR_LIST, AvatarIcon } from './AvatarIcon.js';
import { X, Trophy, Swords, Shield, Coins, Gem, Edit2, Check, Flame } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar-knight');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const totalGames = user.stats.gamesPlayed;
  const wins = user.stats.wins;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const handleSave = async () => {
    setSaving(true);
    sound.playClick();
    try {
      await updateProfile(username, selectedAvatar);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Card Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-white/10">
          <div className="relative">
            <AvatarIcon avatarId={isEditing ? selectedAvatar : user.avatar} size="xl" />
            {user.role === 'admin' && (
              <div className="absolute -bottom-2 -right-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-wider border-2 border-slate-900 shadow">
                ADMIN
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  className="rounded-xl bg-slate-950 border border-amber-400/50 px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedAvatar(av.id);
                      }}
                      className={`rounded-xl p-0.5 transition-all ${
                        selectedAvatar === av.id ? 'ring-2 ring-amber-400 scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <AvatarIcon avatarId={av.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">{user.username}</h3>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsEditing(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title="Edit Nickname & Avatar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Coins className="h-3.5 w-3.5" />
                    {user.coins.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Gem className="h-3.5 w-3.5" />
                    {user.gems.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <Flame className="h-3.5 w-3.5" />
                    {user.loginStreak} Day Streak
                  </span>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all"
              >
                <Check className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* Player Stats Grid */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Combat Statistics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-3 text-center">
              <Swords className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{totalGames}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Matches</div>
            </div>

            <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-3 text-center">
              <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <div className="text-xl font-black text-amber-300">{wins}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Victories</div>
            </div>

            <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-3 text-center">
              <Shield className="h-5 w-5 text-rose-400 mx-auto mb-1" />
              <div className="text-xl font-black text-rose-300">{user.stats.losses}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Defeats</div>
            </div>

            <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-3 text-center">
              <div className="text-lg font-black text-emerald-400 mt-0.5">{winRate}%</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Win Rate</div>
            </div>
          </div>

          {/* Mode breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Classic Ludo</div>
                <div className="text-[10px] text-slate-400">Wins Record</div>
              </div>
              <div className="text-lg font-black text-amber-400">
                {user.stats.ludoWins}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/40 border border-white/5 p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Ladder Chase</div>
                <div className="text-[10px] text-slate-400">Wins Record</div>
              </div>
              <div className="text-lg font-black text-indigo-400">
                {user.stats.ladderWins}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            Registered: {new Date(user.createdAt).toLocaleDateString()}
          </div>
          <button
            onClick={() => {
              sound.playClick();
              logout();
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
