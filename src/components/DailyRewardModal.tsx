import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { sound } from '../services/audio.js';
import confetti from 'canvas-confetti';
import { X, Gift, Sparkles, Coins, Gem, Clock, CheckCircle2 } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose }) => {
  const { dailyStatus, claimDailyReward, user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ coins: number; gems: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(dailyStatus?.timeRemainingSeconds || 0);

  useEffect(() => {
    setSecondsLeft(dailyStatus?.timeRemainingSeconds || 0);
  }, [dailyStatus]);

  // Countdown ticker
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  if (!isOpen) return null;

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClaim = async () => {
    if (!dailyStatus?.canClaim && secondsLeft > 0) return;
    setClaiming(true);
    sound.playClick();

    try {
      const reward = await claimDailyReward();
      sound.playCoinReward();

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setClaimedReward({ coins: reward.coins, gems: reward.gems });
    } catch (err: any) {
      alert(err.message || 'Failed to claim daily reward');
    } finally {
      setClaiming(false);
    }
  };

  const streak = user?.loginStreak || 1;
  const days = [
    { day: 1, coins: 250, gems: 5 },
    { day: 2, coins: 300, gems: 5 },
    { day: 3, coins: 400, gems: 10 },
    { day: 4, coins: 500, gems: 10 },
    { day: 5, coins: 650, gems: 15 },
    { day: 6, coins: 800, gems: 20 },
    { day: 7, coins: 1200, gems: 35, big: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/20">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 shadow-xl shadow-amber-500/30">
            <Gift className="h-8 w-8 text-white animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Daily Login Bonus</h2>
          <p className="text-xs text-slate-400 mt-1">
            Check in every 24 hours to build your streak and unlock mega chests!
          </p>
        </div>

        {/* 7-Day Streak Timeline */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
          {days.map((d) => {
            const isCompleted = d.day < streak;
            const isCurrent = d.day === ((streak - 1) % 7) + 1;

            return (
              <div
                key={d.day}
                className={`relative flex flex-col items-center rounded-2xl p-2.5 text-center border transition-all ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 scale-105'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-white/10 bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
                  Day {d.day}
                </div>
                <div className="text-lg my-0.5">
                  {d.big ? '🎁' : isCompleted ? '✅' : '🪙'}
                </div>
                <div className="text-xs font-black text-amber-300">
                  +{d.coins}
                </div>
                {d.gems > 0 && (
                  <div className="text-[10px] font-bold text-cyan-300">
                    +{d.gems} 💎
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action / Countdown */}
        {claimedReward ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-extrabold text-white text-base">Claimed Successfully!</h3>
            <p className="text-xs text-emerald-300 mt-1 font-semibold">
              +{claimedReward.coins} Gold Coins &amp; +{claimedReward.gems} Gems added to your account!
            </p>
          </div>
        ) : dailyStatus?.canClaim || secondsLeft <= 0 ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 py-3.5 text-base font-black text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-5 w-5 text-slate-950" />
            <span>{claiming ? 'Claiming Reward...' : 'Claim Today\'s Reward'}</span>
          </button>
        ) : (
          <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Next reward unlocks in</span>
            </div>
            <div className="font-mono text-2xl font-black text-amber-300 tracking-wider">
              {formatCountdown(secondsLeft)}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Come back tomorrow to keep your {streak}-day streak alive!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
