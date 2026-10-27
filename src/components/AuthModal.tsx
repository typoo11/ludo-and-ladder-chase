import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { sound } from '../services/audio.js';
import { AVATAR_LIST, AvatarIcon } from './AvatarIcon.js';
import { X, Lock, Mail, User, Shield, Sparkles, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, guestLogin, loginAsDemoAdmin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('avatar-knight');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.playClick();

    try {
      if (isRegister) {
        if (!username || username.trim().length < 2) {
          throw new Error('Username must be at least 2 characters');
        }
        await register(email, username, password, avatar);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError('');
    setLoading(true);
    sound.playClick();
    try {
      await guestLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDemo = async () => {
    setError('');
    setLoading(true);
    sound.playClick();
    try {
      await loginAsDemoAdmin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
        {/* Close Button */}
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
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 shadow-lg shadow-rose-500/30">
            <span className="text-2xl">🎲</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {isRegister ? 'Join the Arena' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? 'Create your account to save stats, climb ranks & win rewards'
              : 'Sign in to access your tokens, coins, and battle history'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-950/60 p-1 mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsRegister(false);
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              !isRegister
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsRegister(true);
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              isRegister
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Player Nickname
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. MasterRoller"
                  className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Avatar selector on register */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose Battle Avatar
              </label>
              <div className="flex flex-wrap gap-2 justify-center py-1">
                {AVATAR_LIST.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAvatar(av.id);
                    }}
                    className={`rounded-2xl p-1 transition-all ${
                      avatar === av.id ? 'ring-2 ring-amber-400 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <AvatarIcon avatarId={av.id} size="md" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Free Account' : 'Sign In & Play'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Or Instant Play</span>
          </div>
        </div>

        {/* Quick Options: Guest & Demo Admin */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-white/10 py-2.5 text-xs font-bold text-slate-200 transition-all"
          >
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>Play Instantly as Guest (No Signup)</span>
          </button>

          <button
            type="button"
            onClick={handleAdminDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 py-2 text-xs font-bold text-red-300 transition-all"
            title="Auto-login with seeded Admin credentials (admin@ludo.io / admin123)"
          >
            <Shield className="h-3.5 w-3.5 text-red-400" />
            <span>Demo: Login as Admin (Review Admin Panel)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
