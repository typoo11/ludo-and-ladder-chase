import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, DailyRewardStatus } from '../types/game.js';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  dailyStatus: DailyRewardStatus | null;
  refreshUser: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, username: string, pass: string, avatar?: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  logout: () => void;
  claimDailyReward: () => Promise<{ coins: number; gems: number; streak: number }>;
  updateProfile: (username: string, avatar: string) => Promise<void>;
  updateUserLocally: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyStatus, setDailyStatus] = useState<DailyRewardStatus | null>(null);

  const refreshUser = async () => {
    try {
      const current = await api.getCurrentUser();
      setUser(current);
      if (current) {
        socketService.connect(current.id);
        fetchDailyStatus();
      }
    } catch (err) {
      console.error('Failed to get current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStatus = async () => {
    try {
      const status = await api.getDailyRewardStatus();
      setDailyStatus(status);
    } catch {
      // not logged in or error
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const u = await api.login({ email, password: pass });
    setUser(u);
    socketService.connect(u.id);
    fetchDailyStatus();
  };

  const register = async (email: string, username: string, pass: string, avatar?: string) => {
    const u = await api.register({ email, username, password: pass, avatar });
    setUser(u);
    socketService.connect(u.id);
    fetchDailyStatus();
  };

  const guestLogin = async () => {
    const u = await api.guestLogin();
    setUser(u);
    socketService.connect(u.id);
    fetchDailyStatus();
  };

  const loginAsDemoAdmin = async () => {
    const u = await api.login({ email: 'admin@ludo.io', password: 'admin123' });
    setUser(u);
    socketService.connect(u.id);
    fetchDailyStatus();
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    setDailyStatus(null);
  };

  const claimDailyReward = async () => {
    const res = await api.claimDailyReward();
    if (res.success) {
      setUser(res.user);
      await fetchDailyStatus();
      return res.reward;
    }
    throw new Error('Could not claim reward');
  };

  const updateProfile = async (username: string, avatar: string) => {
    const updated = await api.updateProfile({ username, avatar });
    setUser(updated);
  };

  const updateUserLocally = (newUser: UserProfile) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        dailyStatus,
        refreshUser,
        login,
        register,
        guestLogin,
        loginAsDemoAdmin,
        logout,
        claimDailyReward,
        updateProfile,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
