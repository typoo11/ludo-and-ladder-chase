import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserProfile, AdminStats } from '../types/game.ts';

interface EconomyConfig {
  dailyRewardCoins: number;
  dailyRewardGems: number;
  starterCoins: number;
  starterGems: number;
  winBonusMultiplier: number;
}

interface MatchRecord {
  id: string;
  roomCode: string;
  gameMode: string;
  matchType: string;
  winnerId: string;
  winnerName: string;
  rewardPool: number;
  players: Array<{
    id: string;
    name: string;
    color: string;
    coinsWon: number;
  }>;
  createdAt: string;
}

interface StoredUser extends UserProfile {
  passwordHash: string;
}

interface DatabaseStructure {
  users: StoredUser[];
  matches: MatchRecord[];
  economy: EconomyConfig;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const DEFAULT_ECONOMY: EconomyConfig = {
  dailyRewardCoins: 250,
  dailyRewardGems: 10,
  starterCoins: 1000,
  starterGems: 50,
  winBonusMultiplier: 1.8,
};

class DatabaseService {
  private data: DatabaseStructure = {
    users: [],
    matches: [],
    economy: DEFAULT_ECONOMY,
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedDefaults();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database file, reinitializing defaults:', err);
      this.seedDefaults();
      this.save();
    }
  }

  private seedDefaults() {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const playerPasswordHash = bcrypt.hashSync('player123', salt);

    const adminUser: StoredUser = {
      id: 'admin-001',
      email: 'admin@ludo.io',
      username: 'GrandMaster Admin',
      passwordHash: adminPasswordHash,
      avatar: 'avatar-king',
      role: 'admin',
      coins: 50000,
      gems: 2500,
      stats: {
        gamesPlayed: 120,
        wins: 95,
        losses: 25,
        ludoWins: 55,
        ladderWins: 40,
      },
      inventory: {
        boards: ['classic', 'neon', 'royal', 'lava'],
        tokens: ['classic', 'crown', 'cyber', 'star'],
        activeBoard: 'royal',
        activeToken: 'crown',
      },
      loginStreak: 7,
      createdAt: new Date().toISOString(),
    };

    const demoPlayer: StoredUser = {
      id: 'player-001',
      email: 'player@ludo.io',
      username: 'DiceKnight',
      passwordHash: playerPasswordHash,
      avatar: 'avatar-knight',
      role: 'user',
      coins: 2400,
      gems: 80,
      stats: {
        gamesPlayed: 18,
        wins: 11,
        losses: 7,
        ludoWins: 7,
        ladderWins: 4,
      },
      inventory: {
        boards: ['classic', 'neon'],
        tokens: ['classic', 'cyber'],
        activeBoard: 'classic',
        activeToken: 'classic',
      },
      loginStreak: 3,
      createdAt: new Date().toISOString(),
    };

    this.data = {
      users: [adminUser, demoPlayer],
      matches: [],
      economy: DEFAULT_ECONOMY,
    };
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public getUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): StoredUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: {
    email: string;
    username: string;
    password: string;
    role?: 'user' | 'admin';
    avatar?: string;
  }): UserProfile {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.password, salt);
    const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    const newUser: StoredUser = {
      id,
      email: userData.email,
      username: userData.username,
      passwordHash,
      avatar: userData.avatar || 'avatar-knight',
      role: userData.role || 'user',
      coins: this.data.economy.starterCoins,
      gems: this.data.economy.starterGems,
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ludoWins: 0,
        ladderWins: 0,
      },
      inventory: {
        boards: ['classic'],
        tokens: ['classic'],
        activeBoard: 'classic',
        activeToken: 'classic',
      },
      loginStreak: 1,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();
    return this.sanitizeUser(newUser);
  }

  public updateUser(id: string, updates: Partial<StoredUser>): UserProfile | null {
    const user = this.getUserById(id);
    if (!user) return null;

    Object.assign(user, updates);
    this.save();
    return this.sanitizeUser(user);
  }

  public sanitizeUser(user: StoredUser): UserProfile {
    const { passwordHash: _pass, ...profile } = user;
    return profile;
  }

  public getAllUsers(): UserProfile[] {
    return this.data.users.map((u) => this.sanitizeUser(u));
  }

  public adjustUserCurrency(id: string, coinsDelta: number, gemsDelta: number): UserProfile | null {
    const user = this.getUserById(id);
    if (!user) return null;

    user.coins = Math.max(0, user.coins + coinsDelta);
    user.gems = Math.max(0, user.gems + gemsDelta);
    this.save();
    return this.sanitizeUser(user);
  }

  public setUserBan(id: string, isBanned: boolean): UserProfile | null {
    const user = this.getUserById(id);
    if (!user) return null;

    user.isBanned = isBanned;
    this.save();
    return this.sanitizeUser(user);
  }

  public recordMatch(match: Omit<MatchRecord, 'id' | 'createdAt'>): MatchRecord {
    const record: MatchRecord = {
      ...match,
      id: 'match_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };

    this.data.matches.unshift(record);
    if (this.data.matches.length > 200) {
      this.data.matches.pop();
    }

    for (const p of match.players) {
      const user = this.getUserById(p.id);
      if (user) {
        user.stats.gamesPlayed += 1;
        if (p.id === match.winnerId) {
          user.stats.wins += 1;
          if (match.gameMode === 'ludo') user.stats.ludoWins += 1;
          if (match.gameMode === 'ladder') user.stats.ladderWins += 1;
        } else {
          user.stats.losses += 1;
        }
        if (p.coinsWon > 0) {
          user.coins += p.coinsWon;
        }
      }
    }

    this.save();
    return record;
  }

  public getMatches(): MatchRecord[] {
    return this.data.matches;
  }

  public getEconomyConfig(): EconomyConfig {
    return this.data.economy;
  }

  public updateEconomyConfig(newConfig: Partial<EconomyConfig>): EconomyConfig {
    Object.assign(this.data.economy, newConfig);
    this.save();
    return this.data.economy;
  }

  public getAdminStats(activeMatchesCount: number = 0): AdminStats {
    let totalCoins = 0;
    let totalGems = 0;
    let totalGames = 0;

    for (const u of this.data.users) {
      totalCoins += u.coins;
      totalGems += u.gems;
      totalGames += u.stats.gamesPlayed;
    }

    return {
      totalUsers: this.data.users.length,
      activeMatches: activeMatchesCount,
      totalCoinsInCirculation: totalCoins,
      totalGemsInCirculation: totalGems,
      gamesPlayedTotal: totalGames,
      dailyRewardAmount: this.data.economy.dailyRewardCoins,
      dailyGemsAmount: this.data.economy.dailyRewardGems,
      winBonusMultiplier: this.data.economy.winBonusMultiplier,
    };
  }
}

export const db = new DatabaseService();
