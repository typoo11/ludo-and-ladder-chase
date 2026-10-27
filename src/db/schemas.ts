/**
 * Database Schemas for Ludo & Ladder Chase
 * 
 * Provides both:
 * 1) Mongoose (MongoDB) Schema Definitions
 * 2) Prisma (PostgreSQL / MySQL) Schema Definitions
 */

/* ==========================================================================
   PART 1: MONGOOSE (MONGODB) SCHEMA
   ========================================================================== */

export const MongooseSchemaCode = `
import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
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
  lastDailyRewardClaim?: Date;
  loginStreak: number;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: 'avatar-1' },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  coins: { type: Number, default: 1000 },
  gems: { type: Number, default: 50 },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ludoWins: { type: Number, default: 0 },
    ladderWins: { type: Number, default: 0 },
  },
  inventory: {
    boards: { type: [String], default: ['classic'] },
    tokens: { type: [String], default: ['classic'] },
    activeBoard: { type: String, default: 'classic' },
    activeToken: { type: String, default: 'classic' },
  },
  lastDailyRewardClaim: { type: Date },
  loginStreak: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false, index: true },
}, { timestamps: true });

// Match History Schema
export interface IMatchHistory extends Document {
  roomCode: string;
  gameMode: 'ludo' | 'ladder';
  matchType: 'ai' | 'online' | 'pass_and_play';
  players: Array<{
    userId: string;
    username: string;
    color: string;
    rank: number;
    coinsWon: number;
  }>;
  winnerId: string;
  rewardPool: number;
  endedAt: Date;
}

const MatchHistorySchema = new Schema<IMatchHistory>({
  roomCode: { type: String, required: true },
  gameMode: { type: String, enum: ['ludo', 'ladder'], required: true },
  matchType: { type: String, enum: ['ai', 'online', 'pass_and_play'], required: true },
  players: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    color: { type: String, required: true },
    rank: { type: Number, default: 0 },
    coinsWon: { type: Number, default: 0 },
  }],
  winnerId: { type: String, required: true },
  rewardPool: { type: Number, default: 0 },
  endedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Economy Config Schema (Admin configurable)
export interface IEconomyConfig extends Document {
  dailyRewardCoins: number;
  dailyRewardGems: number;
  starterCoins: number;
  starterGems: number;
  winBonusMultiplier: number;
}

const EconomyConfigSchema = new Schema<IEconomyConfig>({
  dailyRewardCoins: { type: Number, default: 250 },
  dailyRewardGems: { type: Number, default: 10 },
  starterCoins: { type: Number, default: 1000 },
  starterGems: { type: Number, default: 50 },
  winBonusMultiplier: { type: Number, default: 1.8 },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const MatchHistoryModel = mongoose.models.MatchHistory || mongoose.model<IMatchHistory>('MatchHistory', MatchHistorySchema);
export const EconomyConfigModel = mongoose.models.EconomyConfig || mongoose.model<IEconomyConfig>('EconomyConfig', EconomyConfigSchema);
`;

/* ==========================================================================
   PART 2: PRISMA SCHEMA DEFINITION (prisma/schema.prisma)
   ========================================================================== */

export const PrismaSchemaCode = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  user
  admin
}

enum GameMode {
  ludo
  ladder
}

enum MatchType {
  ai
  online
  pass_and_play
}

model User {
  id                   String         @id @default(uuid())
  email                String         @unique
  username             String
  passwordHash         String
  avatar               String         @default("avatar-1")
  role                 Role           @default(user)
  coins                Int            @default(1000)
  gems                 Int            @default(50)
  gamesPlayed          Int            @default(0)
  wins                 Int            @default(0)
  losses               Int            @default(0)
  ludoWins             Int            @default(0)
  ladderWins           Int            @default(0)
  inventoryBoards      String[]       @default(["classic"])
  inventoryTokens      String[]       @default(["classic"])
  activeBoard          String         @default("classic")
  activeToken          String         @default("classic")
  lastDailyRewardClaim DateTime?
  loginStreak          Int            @default(0)
  isBanned             Boolean        @default(false)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
  matchParticipants    MatchParticipant[]
  wonMatches           MatchHistory[] @relation("MatchWinner")

  @@index([email])
  @@index([role])
}

model MatchHistory {
  id           String             @id @default(uuid())
  roomCode     String
  gameMode     GameMode
  matchType    MatchType
  rewardPool   Int                @default(0)
  winnerId     String
  winner       User               @relation("MatchWinner", fields: [winnerId], references: [id])
  participants MatchParticipant[]
  endedAt      DateTime           @default(now())
  createdAt    DateTime           @default(now())

  @@index([winnerId])
}

model MatchParticipant {
  id        String       @id @default(uuid())
  matchId   String
  match     MatchHistory @relation(fields: [matchId], references: [id], onDelete: Cascade)
  userId    String
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  color     String
  rank      Int          @default(0)
  coinsWon  Int          @default(0)

  @@index([matchId])
  @@index([userId])
}

model EconomyConfig {
  id                 Int      @id @default(1)
  dailyRewardCoins   Int      @default(250)
  dailyRewardGems    Int      @default(10)
  starterCoins       Int      @default(1000)
  starterGems        Int      @default(50)
  winBonusMultiplier Float    @default(1.8)
  updatedAt          DateTime @updatedAt
}
`;
