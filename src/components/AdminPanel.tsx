import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { sound } from '../services/audio.js';
import { AvatarIcon } from './AvatarIcon.js';
import { UserProfile, AdminStats } from '../types/game.js';
import {
  ShieldAlert,
  Users,
  Coins,
  Gem,
  Activity,
  Search,
  Sliders,
  CheckCircle,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'economy' | 'matches'>('users');
  const [loading, setLoading] = useState(true);

  // Economy inputs
  const [dailyCoins, setDailyCoins] = useState(250);
  const [dailyGems, setDailyGems] = useState(10);
  const [starterCoins, setStarterCoins] = useState(1000);
  const [winMultiplier, setWinMultiplier] = useState(1.8);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Balance adjustment modal
  const [adjustingUser, setAdjustingUser] = useState<UserProfile | null>(null);
  const [coinsDelta, setCoinsDelta] = useState(500);
  const [gemsDelta, setGemsDelta] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, u, m] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getMatchesHistory(),
      ]);
      setStats(s);
      setUsers(u);
      setMatches(m);
      if (s) {
        setDailyCoins(s.dailyRewardAmount);
        setDailyGems(s.dailyGemsAmount);
        setWinMultiplier(s.winBonusMultiplier);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBan = async (user: UserProfile) => {
    sound.playClick();
    try {
      const updated = await api.toggleBanUser(user.id, !user.isBanned);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Ban toggle failed');
    }
  };

  const handleAdjustCurrency = async () => {
    if (!adjustingUser) return;
    sound.playClick();
    try {
      const updated = await api.adjustCurrency(adjustingUser.id, coinsDelta, gemsDelta);
      sound.playCoinReward();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setAdjustingUser(null);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message || 'Adjustment failed');
    }
  };

  const handleSaveEconomy = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    try {
      await api.updateEconomy({
        dailyRewardCoins: dailyCoins,
        dailyRewardGems: dailyGems,
        starterCoins: starterCoins,
        winBonusMultiplier: winMultiplier,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      api.getAdminStats().then(setStats);
    } catch (err: any) {
      alert(err.message || 'Failed to save economy settings');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 sm:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl shadow-red-600/30">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black">Admin Command Center</h1>
                <span className="rounded-md bg-red-600/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-black uppercase text-red-300">
                  Authoritative
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage players, monitor real-time rooms, and adjust game economy parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                fetchData();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-red-600/20 transition-all"
            >
              Exit to Lobby
            </button>
          </div>
        </div>

        {/* Analytics Top Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Total Users</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
              <p className="text-[10px] text-slate-500 mt-1">Registered in Database</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Active Matches</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{stats.activeMatches}</div>
              <p className="text-[10px] text-slate-500 mt-1">Live real-time rooms</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Total Coins</span>
                <Coins className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">
                {stats.totalCoinsInCirculation.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Circulating balance</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Total Gems</span>
                <Gem className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-300">
                {stats.totalGemsInCirculation.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Premium currency</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase">Games Played</span>
                <Trophy className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-300">
                {stats.gamesPlayedTotal.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">All-time finished matches</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-6 pb-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('users');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('economy');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'economy'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Reward &amp; Economy Settings</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('matches');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'matches'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Match Audit Log ({matches.length})</span>
          </button>
        </div>

        {/* Tab 1: User Management Table */}
        {activeTab === 'users' && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
            {/* Search toolbar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full rounded-xl bg-slate-950 border border-white/10 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-red-400 focus:outline-none"
                />
              </div>
              <div className="text-xs text-slate-400 font-semibold">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Coins / Gems</th>
                    <th className="py-3 px-4">Win / Loss</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <AvatarIcon avatarId={u.avatar} size="sm" />
                        <div>
                          <div className="font-bold text-white text-sm">{u.username}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            u.role === 'admin'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="flex items-center gap-1 text-amber-400">
                            <Coins className="h-3.5 w-3.5" />
                            {u.coins.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Gem className="h-3.5 w-3.5" />
                            {u.gems.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-300">
                          <span className="text-emerald-400 font-bold">{u.stats.wins}W</span> /{' '}
                          <span className="text-rose-400 font-bold">{u.stats.losses}L</span>{' '}
                          <span className="text-[11px] text-slate-500">
                            ({u.stats.gamesPlayed} total)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            Banned
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              sound.playClick();
                              setAdjustingUser(u);
                              setCoinsDelta(500);
                              setGemsDelta(10);
                            }}
                            className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold transition-all"
                            title="Adjust player coins & gems"
                          >
                            +/- Balance
                          </button>

                          {u.id !== 'admin-001' && (
                            <button
                              onClick={() => handleToggleBan(u)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                                u.isBanned
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Ban User'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Economy & Reward Configuration */}
        {activeTab === 'economy' && (
          <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
            <h3 className="text-lg font-black text-white mb-2">Economy Parameters</h3>
            <p className="text-xs text-slate-400 mb-6">
              Adjust global reward payouts and starter packs. Changes take effect across all games
              instantly.
            </p>

            {saveSuccess && (
              <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                <span>Economy settings saved and synced to persistent storage!</span>
              </div>
            )}

            <form onSubmit={handleSaveEconomy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Daily Login Reward: Base Gold Coins
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={dailyCoins}
                    onChange={(e) => setDailyCoins(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Multiplied up to 2x by user streak</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Daily Login Reward: Base Gems
                </label>
                <div className="relative">
                  <Gem className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={dailyGems}
                    onChange={(e) => setDailyGems(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Starter Pack Coins for New Players
                </label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    value={starterCoins}
                    onChange={(e) => setStarterCoins(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Win Bonus Multiplier (Stake multiplier on match victory)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={winMultiplier}
                  onChange={(e) => setWinMultiplier(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-red-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">e.g. 1.8x = 180% return on match stakes</p>
              </div>

              <button
                type="submit"
                className="mt-4 rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-red-600/30 transition-all"
              >
                Save Economy Settings
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Match Audit Log */}
        {activeTab === 'matches' && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 text-xs font-bold text-slate-300 uppercase">
              Recent Matches Recorded ({matches.length})
            </div>
            {matches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matches completed yet. Matches will automatically be logged here with winner and
                reward payouts!
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {matches.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300">[{m.roomCode}]</span>
                        <span className="font-extrabold text-white uppercase">{m.gameMode}</span>
                        <span className="text-[10px] text-slate-400">({m.matchType})</span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Winner: <strong className="text-emerald-400">{m.winnerName}</strong> · Payout:{' '}
                        <strong className="text-amber-400">{m.rewardPool} Coins</strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Adjust User Balance */}
        {adjustingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-1">Adjust Currency Balance</h3>
              <p className="text-xs text-slate-400 mb-4">
                User: <strong className="text-amber-300">{adjustingUser.username}</strong>
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Coins Delta (positive to grant, negative to deduct)
                  </label>
                  <input
                    type="number"
                    value={coinsDelta}
                    onChange={(e) => setCoinsDelta(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-sm text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-1.5">
                    {[+500, +2500, +10000, -500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCoinsDelta(amt)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300"
                      >
                        {amt > 0 ? `+${amt}` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Gems Delta
                  </label>
                  <input
                    type="number"
                    value={gemsDelta}
                    onChange={(e) => setGemsDelta(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-sm text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdjustCurrency}
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-black text-slate-950 shadow-md"
                >
                  Apply Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
