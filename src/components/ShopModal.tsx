import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { sound } from '../services/audio.js';
import { X, ShoppingBag, Coins, Gem, Check, Sparkles } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserLocally } = useAuth();
  const [activeTab, setActiveTab] = useState<'boards' | 'tokens'>('boards');
  const [items, setItems] = useState<{
    boards: Array<{ id: string; name: string; priceCoins: number; priceGems: number }>;
    tokens: Array<{ id: string; name: string; priceCoins: number; priceGems: number }>;
  } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getShopItems().then(setItems).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleBuy = async (type: 'boards' | 'tokens', itemId: string) => {
    setLoadingAction(itemId);
    sound.playClick();
    try {
      const res = await api.buyItem(type, itemId);
      sound.playCoinReward();
      updateUserLocally(res.user);
    } catch (err: any) {
      alert(err.message || 'Purchase failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEquip = async (type: 'boards' | 'tokens', itemId: string) => {
    setLoadingAction(itemId);
    sound.playClick();
    try {
      const res = await api.equipItem(type, itemId);
      updateUserLocally(res.user);
    } catch (err: any) {
      alert(err.message || 'Equip failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const boardThemeVisuals: Record<string, { bg: string; icon: string }> = {
    classic: { bg: 'from-amber-700/30 to-amber-900/40 border-amber-500/30', icon: '📜' },
    neon: { bg: 'from-cyan-900/30 to-purple-900/40 border-cyan-500/30', icon: '🌐' },
    royal: { bg: 'from-emerald-900/30 to-amber-900/40 border-amber-400/40', icon: '👑' },
    lava: { bg: 'from-rose-950/40 to-orange-950/40 border-rose-500/40', icon: '🌋' },
  };

  const tokenStyleVisuals: Record<string, { bg: string; icon: string }> = {
    classic: { bg: 'from-slate-700/40 to-slate-800/40 border-slate-500/30', icon: '♟️' },
    crown: { bg: 'from-amber-600/30 to-amber-800/40 border-amber-400/40', icon: '👑' },
    cyber: { bg: 'from-cyan-800/30 to-blue-900/40 border-cyan-400/40', icon: '🔮' },
    star: { bg: 'from-purple-800/30 to-pink-900/40 border-pink-400/40', icon: '⭐' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Cosmetics Armory</h2>
              <p className="text-xs text-slate-400">Customize your board arena and playing tokens</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-black text-amber-300">{user.coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1">
              <Gem className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-black text-cyan-300">{user.gems.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-950/70 p-1 mb-6 border border-white/5">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('boards');
            }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeTab === 'boards'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Board Arenas
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('tokens');
            }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
              activeTab === 'tokens'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Token Sigils
          </button>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'boards' &&
            items?.boards.map((b) => {
              const owned = user.inventory.boards.includes(b.id);
              const equipped = user.inventory.activeBoard === b.id;
              const visual = boardThemeVisuals[b.id] || boardThemeVisuals.classic;

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border bg-gradient-to-br ${visual.bg} p-4 flex flex-col justify-between transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-1">{visual.icon}</div>
                      <h4 className="font-extrabold text-white text-sm">{b.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Arena Theme</p>
                    </div>
                    {equipped && (
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Equipped
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    {!owned ? (
                      <div className="flex items-center gap-2">
                        {b.priceCoins > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                            <Coins className="h-3.5 w-3.5" />
                            {b.priceCoins}
                          </span>
                        )}
                        {b.priceGems > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-cyan-400">
                            <Gem className="h-3.5 w-3.5" />
                            {b.priceGems}
                          </span>
                        )}
                        {b.priceCoins === 0 && b.priceGems === 0 && (
                          <span className="text-xs font-bold text-emerald-400">Free Starter</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Owned in Vault</span>
                    )}

                    {owned ? (
                      <button
                        onClick={() => handleEquip('boards', b.id)}
                        disabled={equipped || loadingAction === b.id}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                          equipped
                            ? 'bg-slate-800 text-slate-500 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                        }`}
                      >
                        {equipped ? 'Active' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy('boards', b.id)}
                        disabled={loadingAction === b.id}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 px-3.5 py-1.5 text-xs font-black text-white shadow-md transition-all"
                      >
                        {loadingAction === b.id ? 'Unlocking...' : 'Unlock'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {activeTab === 'tokens' &&
            items?.tokens.map((t) => {
              const owned = user.inventory.tokens.includes(t.id);
              const equipped = user.inventory.activeToken === t.id;
              const visual = tokenStyleVisuals[t.id] || tokenStyleVisuals.classic;

              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border bg-gradient-to-br ${visual.bg} p-4 flex flex-col justify-between transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-1">{visual.icon}</div>
                      <h4 className="font-extrabold text-white text-sm">{t.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Token Miniature</p>
                    </div>
                    {equipped && (
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Equipped
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    {!owned ? (
                      <div className="flex items-center gap-2">
                        {t.priceCoins > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                            <Coins className="h-3.5 w-3.5" />
                            {t.priceCoins}
                          </span>
                        )}
                        {t.priceGems > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-cyan-400">
                            <Gem className="h-3.5 w-3.5" />
                            {t.priceGems}
                          </span>
                        )}
                        {t.priceCoins === 0 && t.priceGems === 0 && (
                          <span className="text-xs font-bold text-emerald-400">Free Starter</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Owned in Vault</span>
                    )}

                    {owned ? (
                      <button
                        onClick={() => handleEquip('tokens', t.id)}
                        disabled={equipped || loadingAction === t.id}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                          equipped
                            ? 'bg-slate-800 text-slate-500 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                        }`}
                      >
                        {equipped ? 'Active' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy('tokens', t.id)}
                        disabled={loadingAction === t.id}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 px-3.5 py-1.5 text-xs font-black text-white shadow-md transition-all"
                      >
                        {loadingAction === t.id ? 'Unlocking...' : 'Unlock'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
