import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { AvatarIcon } from './AvatarIcon.js';
import { sound } from '../services/audio.js';
import {
  Coins,
  Gem,
  Gift,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShoppingBag,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenDaily: () => void;
  onOpenShop: () => void;
  onOpenAdmin: () => void;
  currentView: string;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
  onOpenDaily,
  onOpenShop,
  onOpenAdmin,
  currentView,
  onGoHome,
}) => {
  const { user, logout, dailyStatus } = useAuth();
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🎲</span>
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold ring-2 ring-slate-950">
              ⚡
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
                Ludo &amp; Ladder
              </span>
              <span className="hidden sm:inline-block rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider border border-amber-500/30">
                CHASE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Multiplayer Board Arena
            </p>
          </div>
        </button>

        {/* Currency & Action Center */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <>
              {/* Coins Counter */}
              <div
                onClick={() => {
                  sound.playClick();
                  onOpenShop();
                }}
                className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 sm:px-3 py-1 cursor-pointer hover:bg-amber-500/20 transition-all shadow-sm group"
                title="Your Gold Coins (Click to visit shop)"
              >
                <Coins className="h-4 w-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                  {user.coins.toLocaleString()}
                </span>
              </div>

              {/* Gems Counter */}
              <div
                onClick={() => {
                  sound.playClick();
                  onOpenShop();
                }}
                className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 sm:px-3 py-1 cursor-pointer hover:bg-cyan-500/20 transition-all shadow-sm group"
                title="Your Gems (Click to visit shop)"
              >
                <Gem className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-black text-cyan-300 tabular-nums">
                  {user.gems.toLocaleString()}
                </span>
              </div>

              {/* Daily Bonus Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDaily();
                }}
                className={`relative flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-md ${
                  dailyStatus?.canClaim
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white animate-pulse shadow-rose-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
                }`}
                title="Daily Login Bonus"
              >
                <Gift className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Bonus</span>
                {dailyStatus?.canClaim && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>

              {/* Shop Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenShop();
                }}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Cosmetics Shop"
              >
                <ShoppingBag className="h-4 w-4 text-purple-400" />
                <span className="hidden md:inline">Shop</span>
              </button>

              {/* Admin Panel button if role === 'admin' */}
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAdmin();
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                    currentView === 'admin'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                      : 'bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60'
                  }`}
                  title="Admin Dashboard"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}

              {/* Player Profile Avatar Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenProfile();
                }}
                className="flex items-center gap-2 rounded-xl p-1 sm:px-2.5 sm:py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-all text-left group"
                title="View Profile & Stats"
              >
                <AvatarIcon avatarId={user.avatar} size="sm" />
                <div className="hidden lg:block text-xs">
                  <div className="font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[100px]">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user.role}
                  </div>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all"
            >
              <User className="h-4 w-4" />
              <span>Login / Play</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 transition-all"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-slate-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
