# Ludo & Ladder Chase

A complete, full-stack, responsive web-based multiplayer game featuring **Classic Ludo** and **Ladder Chase (Snakes & Ladders Twist)** with real-time Socket.io synchronization, user authentication, daily login rewards, in-game cosmetics shop, AI opponents with 3 difficulties, and an authoritative Admin Panel.

---

## 🚀 Quick Start & Local Run Instructions

### 1. Installation
Clone or download the repository, then install all dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
JWT_SECRET="your-secure-jwt-secret-key"
```

### 3. Running the Game
Start the full-stack server (runs both the Express + Socket.io backend and the Vite frontend on port 3000):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 🔑 Pre-Seeded Accounts for Testing

| Account Role | Email | Password | Features / Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ludo.io` | `admin123` | Full access to Admin Command Center, Ban/Unban players, adjust balances, configure economy & view analytics. |
| **Player** | `player@ludo.io` | `player123` | Standard player with unlocked board & tokens, 2,400 coins, 80 gems. |
| **Guest Play** | *Instant 1-Click* | *Auto* | Generates a unique guest name and starter pack with no email required. |

> **Tip:** You can also click the red **"Demo: Login as Admin"** button inside the Sign In modal to instantly review the Admin Panel with zero typing!

---

## 🎮 Features & Architecture

### 1. Authentication & Profiles
- Email / Password registration & login with bcrypt password hashing and JWT token storage.
- Instant 1-Click Guest play.
- Player profile customization (7 battle avatars, editable nickname).
- Combat statistics: Win rate %, total matches, Ludo wins, Ladder Chase wins.
- Data persistence via file-backed JSON store in `data/database.json`.

### 2. Daily Rewards & In-Game Economy
- 7-day progressive login bonus track with streak multiplier.
- 24-hour countdown cooldown timer.
- Web Audio API sound chime and celebratory confetti particle bursts on claim.
- In-Game Cosmetics Armory:
  - **Board Themes:** Classic Parchment, Cyber Neon Arena, Royal Gold & Jade, Inferno Lava Pit.
  - **Token Sigils:** Standard Pawn, Imperial Crown, Neon Cyber Orb, Celestial Star Sigil.
- Match stakes selection: Free, 100, 500, or 1,000 Coins with win multipliers.

### 3. Game Modes
- **Mode A: Classic Ludo Arena (Quick or Classic)**
  - 4 player colors (Red, Green, Yellow, Blue).
  - Authentic 15x15 board geometry with home yards, safe star squares, 52-step common circuit, and home runs.
  - Server-authoritative dice rolling with rolling physics animation.
  - Roll 6 rules: Unlock pawn to board, bonus turn, 3 consecutive sixes forfeits turn.
  - Safe star tiles protect tokens from being knocked out.
  - Capturing opponent tokens sends them back to home base and awards a bonus turn.
  - Classic mode requires 4 tokens to win; Quick mode requires 2 tokens to win.
- **Mode B: Ladder Chase (Snakes & Ladders Twist)**
  - 100-tile serpentine board with custom SVG ladders and monster chutes.
  - Strategic twist tiles: Mystery stars granting Monster Shields, Speed Boosts (+3), or Extra Dice Rolls.
  - Real-time token progress indicators and victory detection at Tile 100.

### 4. Multiplayer & Matchmaking
- **Play vs. Computer (AI):** Easy, Medium, and Hard AI behaviors.
  - *Hard AI:* Aggressively targets opponent token knockouts, unlocks pawns on 6, and moves tokens closest to finish.
- **Play with Friends:**
  - Host creates a room with an automatic 6-digit room code (e.g. `ABC123`).
  - Friends join via the code or the live public rooms browser.
  - Host can fill remaining slots with AI bots or kick players.
  - Real-time turn timer, dice synchronization, and move execution via Socket.io.
  - In-game quick emoji reactions and text chat.

### 5. Admin Panel (`role: 'admin'`)
- Accessible to users with `role: 'admin'`.
- **System Analytics:** Total registered users, active matches, circulating coins and gems, all-time games played.
- **User Management Table:** Search users, ban/unban rogue players, and adjust coin/gem balances (+/- 500, +2500, custom).
- **Economy Parameters:** Configurable daily reward coins/gems, starter pack amounts, and win stake multipliers.
- **Match Audit Log:** Chronological record of completed rooms, winners, and coin payouts.

---

## 🗄️ Database Schemas

Full schema definitions are provided in:
- `prisma/schema.prisma` (PostgreSQL / MySQL)
- `src/db/schemas.ts` (Mongoose / MongoDB & Prisma reference)
