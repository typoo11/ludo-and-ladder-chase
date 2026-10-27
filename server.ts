import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';
import { registerSocketHandlers, rooms } from './src/server/socketHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'ludo-ladder-secret-key-super-secure-2026';
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

registerSocketHandlers(io);

app.use(express.json());

// Auth Middleware
interface AuthRequest extends Request {
  user?: any;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin privileges required' });
    }
  });
}

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, password, avatar } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser = db.createUser({
      email,
      username,
      password,
      avatar: avatar || 'avatar-knight',
      role: 'user',
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const sanitized = db.sanitizeUser(user);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/guest', (_req: Request, res: Response) => {
  try {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const email = `guest_${randomNum}@ludo.io`;
    const username = `Player #${randomNum}`;
    const password = `guest_${Math.random().toString(36)}`;

    const avatars = ['avatar-knight', 'avatar-fox', 'avatar-dragon', 'avatar-wizard'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser = db.createUser({
      email,
      username,
      password,
      avatar,
      role: 'user',
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ token, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Guest login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.isBanned) {
    return res.status(403).json({ error: 'Account suspended' });
  }
  res.json({ user: db.sanitizeUser(user) });
});

/* ==========================================================================
   DAILY REWARDS & ECONOMY ROUTES
   ========================================================================== */

app.get('/api/rewards/daily/status', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const economy = db.getEconomyConfig();
  const streak = user.loginStreak || 1;
  const streakMultiplier = 1 + Math.min(streak - 1, 6) * 0.15; // 15% more per day streak
  const rewardCoins = Math.round(economy.dailyRewardCoins * streakMultiplier);
  const rewardGems = economy.dailyRewardGems;

  let canClaim = true;
  let timeRemainingSeconds = 0;

  if (user.lastDailyRewardClaim) {
    const lastClaim = new Date(user.lastDailyRewardClaim).getTime();
    const now = Date.now();
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);

    if (diffHours < 24) {
      canClaim = false;
      timeRemainingSeconds = Math.max(0, Math.floor((24 * 3600 * 1000 - (now - lastClaim)) / 1000));
    }
  }

  res.json({
    canClaim,
    timeRemainingSeconds,
    streak,
    nextReward: {
      coins: rewardCoins,
      gems: rewardGems,
    },
  });
});

app.post('/api/rewards/daily/claim', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = Date.now();
  if (user.lastDailyRewardClaim) {
    const lastClaim = new Date(user.lastDailyRewardClaim).getTime();
    const diffHours = (now - lastClaim) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return res.status(400).json({ error: 'Reward already claimed for today! Check countdown timer.' });
    }

    if (diffHours > 48) {
      user.loginStreak = 1;
    } else {
      user.loginStreak = (user.loginStreak || 1) + 1;
    }
  } else {
    user.loginStreak = 1;
  }

  const economy = db.getEconomyConfig();
  const streakMultiplier = 1 + Math.min(user.loginStreak - 1, 6) * 0.15;
  const rewardCoins = Math.round(economy.dailyRewardCoins * streakMultiplier);
  const rewardGems = economy.dailyRewardGems;

  user.coins += rewardCoins;
  user.gems += rewardGems;
  user.lastDailyRewardClaim = new Date().toISOString();

  const updated = db.updateUser(user.id, user);

  res.json({
    success: true,
    user: updated,
    reward: {
      coins: rewardCoins,
      gems: rewardGems,
      streak: user.loginStreak,
    },
  });
});

/* ==========================================================================
   SHOP / CUSTOMIZATION
   ========================================================================== */

const SHOP_ITEMS = {
  boards: [
    { id: 'classic', name: 'Classic Parchment', priceCoins: 0, priceGems: 0 },
    { id: 'neon', name: 'Cyber Neon Arena', priceCoins: 1200, priceGems: 0 },
    { id: 'royal', name: 'Royal Gold & Jade', priceCoins: 2500, priceGems: 20 },
    { id: 'lava', name: 'Inferno Lava Pit', priceCoins: 5000, priceGems: 50 },
  ],
  tokens: [
    { id: 'classic', name: 'Standard Pawn', priceCoins: 0, priceGems: 0 },
    { id: 'crown', name: 'Imperial Crown', priceCoins: 1000, priceGems: 0 },
    { id: 'cyber', name: 'Neon Cyber Orb', priceCoins: 2000, priceGems: 15 },
    { id: 'star', name: 'Celestial Star Sigil', priceCoins: 4000, priceGems: 40 },
  ],
};

app.get('/api/shop/items', (_req: Request, res: Response) => {
  res.json(SHOP_ITEMS);
});

app.post('/api/shop/buy', authenticateToken, (req: AuthRequest, res: Response) => {
  const { type, itemId } = req.body;
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const catalog = type === 'boards' ? SHOP_ITEMS.boards : SHOP_ITEMS.tokens;
  const item = catalog.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const inventoryList = type === 'boards' ? user.inventory.boards : user.inventory.tokens;
  if (inventoryList.includes(itemId)) {
    return res.status(400).json({ error: 'Item already owned' });
  }

  if (user.coins < item.priceCoins || user.gems < item.priceGems) {
    return res.status(400).json({ error: 'Insufficient coins or gems' });
  }

  user.coins -= item.priceCoins;
  user.gems -= item.priceGems;
  inventoryList.push(itemId);

  const updated = db.updateUser(user.id, user);
  res.json({ success: true, user: updated });
});

app.post('/api/shop/equip', authenticateToken, (req: AuthRequest, res: Response) => {
  const { type, itemId } = req.body;
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (type === 'boards') {
    if (!user.inventory.boards.includes(itemId)) {
      return res.status(400).json({ error: 'Board not unlocked' });
    }
    user.inventory.activeBoard = itemId;
  } else if (type === 'tokens') {
    if (!user.inventory.tokens.includes(itemId)) {
      return res.status(400).json({ error: 'Token not unlocked' });
    }
    user.inventory.activeToken = itemId;
  }

  const updated = db.updateUser(user.id, user);
  res.json({ success: true, user: updated });
});

/* ==========================================================================
   USER PROFILE UPDATE
   ========================================================================== */

app.post('/api/user/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { username, avatar } = req.body;
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (username && username.trim().length >= 2) {
    user.username = username.trim().substring(0, 20);
  }
  if (avatar) {
    user.avatar = avatar;
  }

  const updated = db.updateUser(user.id, user);
  res.json({ user: updated });
});

/* ==========================================================================
   ROOMS & MATCHES
   ========================================================================== */

app.get('/api/rooms/active', (_req: Request, res: Response) => {
  const list = Array.from(rooms.values())
    .filter((r) => r.status === 'waiting')
    .map((r) => ({
      code: r.code,
      mode: r.mode,
      playersCount: r.players.length,
      maxPlayers: r.maxPlayers,
      entryFee: r.entryFee,
      hostName: r.players[0]?.name || 'Unknown',
    }));
  res.json(list);
});

app.get('/api/matches/history', (_req: Request, res: Response) => {
  res.json(db.getMatches());
});

/* ==========================================================================
   ADMIN PANEL ENDPOINTS (Protected with role === 'admin')
   ========================================================================== */

app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const activeMatches = Array.from(rooms.values()).filter((r) => r.status === 'in_progress').length;
  const stats = db.getAdminStats(activeMatches);
  res.json(stats);
});

app.get('/api/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const users = db.getAllUsers();
  res.json(users);
});

app.post('/api/admin/users/:id/currency', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { coinsDelta, gemsDelta } = req.body;
  const updated = db.adjustUserCurrency(id, Number(coinsDelta) || 0, Number(gemsDelta) || 0);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.post('/api/admin/users/:id/ban', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBanned } = req.body;
  const updated = db.setUserBan(id, !!isBanned);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

app.post('/api/admin/economy', requireAdmin, (req: Request, res: Response) => {
  const { dailyRewardCoins, dailyRewardGems, starterCoins, winBonusMultiplier } = req.body;
  const updated = db.updateEconomyConfig({
    ...(dailyRewardCoins !== undefined && { dailyRewardCoins: Number(dailyRewardCoins) }),
    ...(dailyRewardGems !== undefined && { dailyRewardGems: Number(dailyRewardGems) }),
    ...(starterCoins !== undefined && { starterCoins: Number(starterCoins) }),
    ...(winBonusMultiplier !== undefined && { winBonusMultiplier: Number(winBonusMultiplier) }),
  });
  res.json(updated);
});

/* ==========================================================================
   VITE DEV SERVER / PRODUCTION STATIC SERVING
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`🎮 Ludo & Ladder Chase server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
