/**
 * Core types for Ludo & Ladder Chase
 */

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: string;
  role: UserRole;
  coins: number;
  gems: number;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    ludoWins: number;
    ladderWins: number;
  };
  inventory: {
    boards: string[];
    tokens: string[];
    activeBoard: string;
    activeToken: string;
  };
  lastDailyRewardClaim?: string;
  loginStreak: number;
  isBanned?: boolean;
  createdAt: string;
}

export type GameMode = 'ludo' | 'ladder';
export type MatchType = 'ai' | 'online' | 'pass_and_play';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  step: number; // -1: in base yard, 0-50: on common path, 51-56: home path, 57: finished home
  isSafe: boolean;
}

export interface LadderPlayer {
  id: string;
  color: PlayerColor;
  name: string;
  avatar: string;
  position: number; // 1 to 100
  inventory: {
    shields: number;
    extraDice: number;
  };
  isShielded: boolean;
  isAI?: boolean;
  difficulty?: AIDifficulty;
}

export interface PlayerSlot {
  id: string; // user id or bot id
  socketId?: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  isAI: boolean;
  difficulty?: AIDifficulty;
  isConnected: boolean;
  tokens?: LudoToken[]; // for ludo
  ladderPosition?: number; // for ladder
  isShielded?: boolean;
  hasFinished?: boolean;
  rank?: number;
}

export interface GameRoom {
  code: string;
  hostId: string;
  mode: GameMode;
  matchType: MatchType;
  maxPlayers: number;
  entryFee: number;
  rewardPool: number;
  status: 'waiting' | 'in_progress' | 'completed';
  players: PlayerSlot[];
  currentTurnIndex: number;
  diceValue: number | null;
  diceRolled: boolean;
  consecutiveSixes: number;
  winner: PlayerSlot | null;
  turnTimeLeft: number;
  boardTheme: string;
  ludoQuickMode?: boolean; // 2 tokens to win vs 4
  ladderTwistMode?: boolean;
  lastAction?: string;
  chatMessages: ChatMessage[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderColor: PlayerColor;
  content: string;
  isEmoji?: boolean;
  timestamp: number;
}

export interface AdminStats {
  totalUsers: number;
  activeMatches: number;
  totalCoinsInCirculation: number;
  totalGemsInCirculation: number;
  gamesPlayedTotal: number;
  dailyRewardAmount: number;
  dailyGemsAmount: number;
  winBonusMultiplier: number;
}

export interface DailyRewardStatus {
  canClaim: boolean;
  timeRemainingSeconds: number;
  streak: number;
  nextReward: {
    coins: number;
    gems: number;
  };
}
