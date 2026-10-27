import { UserProfile, DailyRewardStatus, AdminStats } from '../types/game.js';

const TOKEN_KEY = 'ludo_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  },

  // Auth
  async register(body: { email: string; username: string; password: string; avatar?: string }) {
    const res = await this.request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res.user;
  },

  async login(body: { email: string; password: string }) {
    const res = await this.request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.setToken(res.token);
    return res.user;
  },

  async guestLogin() {
    const res = await this.request<{ token: string; user: UserProfile }>('/api/auth/guest', {
      method: 'POST',
    });
    this.setToken(res.token);
    return res.user;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await this.request<{ user: UserProfile }>('/api/auth/me');
      return res.user;
    } catch {
      this.removeToken();
      return null;
    }
  },

  async updateProfile(updates: { username?: string; avatar?: string }): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    return res.user;
  },

  // Rewards
  async getDailyRewardStatus(): Promise<DailyRewardStatus> {
    return this.request<DailyRewardStatus>('/api/rewards/daily/status');
  },

  async claimDailyReward(): Promise<{ success: boolean; user: UserProfile; reward: any }> {
    return this.request<{ success: boolean; user: UserProfile; reward: any }>('/api/rewards/daily/claim', {
      method: 'POST',
    });
  },

  // Shop
  async getShopItems() {
    return this.request<{
      boards: Array<{ id: string; name: string; priceCoins: number; priceGems: number }>;
      tokens: Array<{ id: string; name: string; priceCoins: number; priceGems: number }>;
    }>('/api/shop/items');
  },

  async buyItem(type: 'boards' | 'tokens', itemId: string): Promise<{ success: boolean; user: UserProfile }> {
    return this.request<{ success: boolean; user: UserProfile }>('/api/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ type, itemId }),
    });
  },

  async equipItem(type: 'boards' | 'tokens', itemId: string): Promise<{ success: boolean; user: UserProfile }> {
    return this.request<{ success: boolean; user: UserProfile }>('/api/shop/equip', {
      method: 'POST',
      body: JSON.stringify({ type, itemId }),
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/api/admin/stats');
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/api/admin/users');
  },

  async adjustCurrency(userId: string, coinsDelta: number, gemsDelta: number): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/admin/users/${userId}/currency`, {
      method: 'POST',
      body: JSON.stringify({ coinsDelta, gemsDelta }),
    });
  },

  async toggleBanUser(userId: string, isBanned: boolean): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ isBanned }),
    });
  },

  async updateEconomy(config: any): Promise<any> {
    return this.request<any>('/api/admin/economy', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  async getMatchesHistory(): Promise<any[]> {
    return this.request<any[]>('/api/matches/history');
  },
};
