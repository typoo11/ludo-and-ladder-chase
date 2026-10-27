import React from 'react';
import { PlayerColor, LudoToken, PlayerSlot } from '../../types/game.js';
import { sound } from '../../services/audio.js';
import { Star, Trophy, Shield } from 'lucide-react';

interface LudoBoardProps {
  players: PlayerSlot[];
  currentPlayerColor: PlayerColor;
  validMovableTokenIds: number[];
  isMyTurn: boolean;
  onSelectToken: (tokenId: number) => void;
  boardTheme?: string;
  activeTokenSkin?: string;
}

// 52 Common Perimeter Path Coordinates (x, y) on 15x15 grid (0 to 14)
export const COMMON_PATH: Array<{ x: number; y: number }> = [
  /* 0  Red Start */ { x: 1, y: 6 },
  /* 1 */ { x: 2, y: 6 },
  /* 2 */ { x: 3, y: 6 },
  /* 3 */ { x: 4, y: 6 },
  /* 4 */ { x: 5, y: 6 },
  /* 5 */ { x: 6, y: 5 },
  /* 6 */ { x: 6, y: 4 },
  /* 7 */ { x: 6, y: 3 },
  /* 8  Safe Star */ { x: 6, y: 2 },
  /* 9 */ { x: 6, y: 1 },
  /* 10 */ { x: 6, y: 0 },
  /* 11 */ { x: 7, y: 0 },
  /* 12 */ { x: 8, y: 0 },
  /* 13 Green Start */ { x: 8, y: 1 },
  /* 14 */ { x: 8, y: 2 },
  /* 15 */ { x: 8, y: 3 },
  /* 16 */ { x: 8, y: 4 },
  /* 17 */ { x: 8, y: 5 },
  /* 18 */ { x: 9, y: 6 },
  /* 19 */ { x: 10, y: 6 },
  /* 20 */ { x: 11, y: 6 },
  /* 21 Safe Star */ { x: 12, y: 6 },
  /* 22 */ { x: 13, y: 6 },
  /* 23 */ { x: 14, y: 6 },
  /* 24 */ { x: 14, y: 7 },
  /* 25 */ { x: 14, y: 8 },
  /* 26 Yellow Start */ { x: 13, y: 8 },
  /* 27 */ { x: 12, y: 8 },
  /* 28 */ { x: 11, y: 8 },
  /* 29 */ { x: 10, y: 8 },
  /* 30 */ { x: 9, y: 8 },
  /* 31 */ { x: 8, y: 9 },
  /* 32 */ { x: 8, y: 10 },
  /* 33 */ { x: 8, y: 11 },
  /* 34 Safe Star */ { x: 8, y: 12 },
  /* 35 */ { x: 8, y: 13 },
  /* 36 */ { x: 8, y: 14 },
  /* 37 */ { x: 7, y: 14 },
  /* 38 */ { x: 6, y: 14 },
  /* 39 Blue Start */ { x: 6, y: 13 },
  /* 40 */ { x: 6, y: 12 },
  /* 41 */ { x: 6, y: 11 },
  /* 42 */ { x: 6, y: 10 },
  /* 43 */ { x: 6, y: 9 },
  /* 44 */ { x: 5, y: 8 },
  /* 45 */ { x: 4, y: 8 },
  /* 46 */ { x: 3, y: 8 },
  /* 47 Safe Star */ { x: 2, y: 8 },
  /* 48 */ { x: 1, y: 8 },
  /* 49 */ { x: 0, y: 8 },
  /* 50 */ { x: 0, y: 7 },
  /* 51 */ { x: 0, y: 6 },
];

// Color Home Run Paths (steps 51 to 55)
export const HOME_PATHS: Record<PlayerColor, Array<{ x: number; y: number }>> = {
  red: [
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
  ],
  green: [
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
  ],
  yellow: [
    { x: 13, y: 7 },
    { x: 12, y: 7 },
    { x: 11, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 7 },
  ],
  blue: [
    { x: 7, y: 13 },
    { x: 7, y: 12 },
    { x: 7, y: 11 },
    { x: 7, y: 10 },
    { x: 7, y: 9 },
  ],
};

// Base Yard Token Slots
export const YARD_SLOTS: Record<PlayerColor, Array<{ x: number; y: number }>> = {
  red: [
    { x: 1.8, y: 1.8 },
    { x: 3.8, y: 1.8 },
    { x: 1.8, y: 3.8 },
    { x: 3.8, y: 3.8 },
  ],
  green: [
    { x: 10.8, y: 1.8 },
    { x: 12.8, y: 1.8 },
    { x: 10.8, y: 3.8 },
    { x: 12.8, y: 3.8 },
  ],
  yellow: [
    { x: 10.8, y: 10.8 },
    { x: 12.8, y: 10.8 },
    { x: 10.8, y: 12.8 },
    { x: 12.8, y: 12.8 },
  ],
  blue: [
    { x: 1.8, y: 10.8 },
    { x: 3.8, y: 10.8 },
    { x: 1.8, y: 12.8 },
    { x: 3.8, y: 12.8 },
  ],
};

export const CENTER_HOME_COORDS: Record<PlayerColor, { x: number; y: number }> = {
  red: { x: 6.3, y: 7 },
  green: { x: 7, y: 6.3 },
  yellow: { x: 7.7, y: 7 },
  blue: { x: 7, y: 7.7 },
};

export const COLOR_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const LudoBoard: React.FC<LudoBoardProps> = ({
  players,
  currentPlayerColor,
  validMovableTokenIds,
  isMyTurn,
  onSelectToken,
  boardTheme = 'classic',
  activeTokenSkin = 'classic',
}) => {
  // Compute positions of all tokens
  const renderedTokens: Array<{
    token: LudoToken;
    player: PlayerSlot;
    x: number;
    y: number;
    isMovable: boolean;
  }> = [];

  for (const player of players) {
    if (!player.tokens) continue;

    player.tokens.forEach((token) => {
      let x = 0;
      let y = 0;

      if (token.step === -1) {
        // Yard
        const slot = YARD_SLOTS[token.color][token.id];
        x = slot.x;
        y = slot.y;
      } else if (token.step >= 0 && token.step <= 50) {
        // Common Path
        const globalIdx = (COLOR_OFFSETS[token.color] + token.step) % 52;
        const coord = COMMON_PATH[globalIdx];
        x = coord.x;
        y = coord.y;
      } else if (token.step >= 51 && token.step <= 55) {
        // Home Path
        const homeIdx = token.step - 51;
        const coord = HOME_PATHS[token.color][homeIdx];
        x = coord.x;
        y = coord.y;
      } else {
        // Center Home finish (step 56 or 57)
        const center = CENTER_HOME_COORDS[token.color];
        x = center.x + (token.id % 2 === 0 ? -0.2 : 0.2);
        y = center.y + (token.id >= 2 ? 0.2 : -0.2);
      }

      const isMovable =
        isMyTurn &&
        token.color === currentPlayerColor &&
        validMovableTokenIds.includes(token.id);

      renderedTokens.push({
        token,
        player,
        x,
        y,
        isMovable,
      });
    });
  }

  const tokenSkinSymbols: Record<string, string> = {
    classic: '♟',
    crown: '👑',
    cyber: '🔮',
    star: '⭐',
  };

  const skinSymbol = tokenSkinSymbols[activeTokenSkin] || '♟';

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto rounded-3xl border-4 border-slate-900 bg-slate-950 p-2 sm:p-3 shadow-2xl shadow-indigo-950/60 select-none">
      {/* 15x15 Grid Layout */}
      <div className="relative w-full h-full grid grid-cols-15 grid-rows-15 gap-0.5 rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
        {/* Red Home Base (Top Left 6x6) */}
        <div className="col-span-6 row-span-6 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 p-2 sm:p-3 rounded-tl-2xl flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-white/90">
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">RED BASE</span>
            <span className="text-sm sm:text-base">🔴</span>
          </div>
          <div className="w-full h-3/4 rounded-xl bg-white/15 backdrop-blur-sm border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="rounded-full bg-rose-950/60 border-2 border-rose-400/50 flex items-center justify-center shadow-inner"
              />
            ))}
          </div>
        </div>

        {/* Top Arm (Green entrance / Red approach: 3 columns, 6 rows) */}
        <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5 bg-slate-900">
          {Array.from({ length: 18 }).map((_, i) => {
            const col = i % 3; // 0, 1, 2
            const row = Math.floor(i / 3); // 0..5
            const isGreenPath = col === 1 && row > 0;
            const isGreenStart = col === 2 && row === 1;
            const isSafeStar = (col === 0 && row === 2) || isGreenStart;

            return (
              <div
                key={i}
                className={`relative flex items-center justify-center border border-white/5 rounded-md ${
                  isGreenPath
                    ? 'bg-emerald-600 shadow-inner'
                    : isGreenStart
                    ? 'bg-emerald-500/80'
                    : 'bg-slate-800/90'
                }`}
              >
                {isSafeStar && <Star className="h-3 w-3 text-amber-300 fill-amber-300 drop-shadow" />}
              </div>
            );
          })}
        </div>

        {/* Green Home Base (Top Right 6x6) */}
        <div className="col-span-6 row-span-6 bg-gradient-to-bl from-emerald-600 via-emerald-700 to-emerald-900 p-2 sm:p-3 rounded-tr-2xl flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-white/90">
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">GREEN BASE</span>
            <span className="text-sm sm:text-base">🟢</span>
          </div>
          <div className="w-full h-3/4 rounded-xl bg-white/15 backdrop-blur-sm border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="rounded-full bg-emerald-950/60 border-2 border-emerald-400/50 flex items-center justify-center shadow-inner"
              />
            ))}
          </div>
        </div>

        {/* Left Arm (Red entrance / Blue approach: 6 columns, 3 rows) */}
        <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5 bg-slate-900">
          {Array.from({ length: 18 }).map((_, i) => {
            const col = i % 6; // 0..5
            const row = Math.floor(i / 6); // 0, 1, 2
            const isRedPath = row === 1 && col > 0;
            const isRedStart = row === 0 && col === 1;
            const isSafeStar = (row === 2 && col === 2) || isRedStart;

            return (
              <div
                key={i}
                className={`relative flex items-center justify-center border border-white/5 rounded-md ${
                  isRedPath
                    ? 'bg-rose-600 shadow-inner'
                    : isRedStart
                    ? 'bg-rose-500/80'
                    : 'bg-slate-800/90'
                }`}
              >
                {isSafeStar && <Star className="h-3 w-3 text-amber-300 fill-amber-300 drop-shadow" />}
              </div>
            );
          })}
        </div>

        {/* Center Home Triangle (3x3) */}
        <div className="col-span-3 row-span-3 relative bg-slate-950 flex items-center justify-center overflow-hidden border border-white/20">
          {/* Triangular home quadrants */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 0, 50% 50%, 0 100%)',
              backgroundColor: '#e11d48',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 50%)',
              backgroundColor: '#059669',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)',
              backgroundColor: '#d97706',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)',
              backgroundColor: '#2563eb',
            }}
          />
          <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-amber-400 shadow-lg">
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
        </div>

        {/* Right Arm (Yellow entrance / Green approach: 6 columns, 3 rows) */}
        <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5 bg-slate-900">
          {Array.from({ length: 18 }).map((_, i) => {
            const col = i % 6; // 0..5
            const row = Math.floor(i / 6); // 0, 1, 2
            const isYellowPath = row === 1 && col < 5;
            const isYellowStart = row === 2 && col === 4;
            const isSafeStar = (row === 0 && col === 3) || isYellowStart;

            return (
              <div
                key={i}
                className={`relative flex items-center justify-center border border-white/5 rounded-md ${
                  isYellowPath
                    ? 'bg-amber-500 shadow-inner'
                    : isYellowStart
                    ? 'bg-amber-400/80'
                    : 'bg-slate-800/90'
                }`}
              >
                {isSafeStar && <Star className="h-3 w-3 text-amber-300 fill-amber-300 drop-shadow" />}
              </div>
            );
          })}
        </div>

        {/* Blue Home Base (Bottom Left 6x6) */}
        <div className="col-span-6 row-span-6 bg-gradient-to-tr from-blue-700 via-blue-800 to-indigo-900 p-2 sm:p-3 rounded-bl-2xl flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-white/90">
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">BLUE BASE</span>
            <span className="text-sm sm:text-base">🔵</span>
          </div>
          <div className="w-full h-3/4 rounded-xl bg-white/15 backdrop-blur-sm border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="rounded-full bg-blue-950/60 border-2 border-blue-400/50 flex items-center justify-center shadow-inner"
              />
            ))}
          </div>
        </div>

        {/* Bottom Arm (Blue entrance / Yellow approach: 3 columns, 6 rows) */}
        <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5 bg-slate-900">
          {Array.from({ length: 18 }).map((_, i) => {
            const col = i % 3; // 0, 1, 2
            const row = Math.floor(i / 3); // 0..5
            const isBluePath = col === 1 && row < 5;
            const isBlueStart = col === 0 && row === 4;
            const isSafeStar = (col === 2 && row === 3) || isBlueStart;

            return (
              <div
                key={i}
                className={`relative flex items-center justify-center border border-white/5 rounded-md ${
                  isBluePath
                    ? 'bg-blue-600 shadow-inner'
                    : isBlueStart
                    ? 'bg-blue-500/80'
                    : 'bg-slate-800/90'
                }`}
              >
                {isSafeStar && <Star className="h-3 w-3 text-amber-300 fill-amber-300 drop-shadow" />}
              </div>
            );
          })}
        </div>

        {/* Yellow Home Base (Bottom Right 6x6) */}
        <div className="col-span-6 row-span-6 bg-gradient-to-tl from-amber-600 via-amber-700 to-yellow-800 p-2 sm:p-3 rounded-br-2xl flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-white/90">
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">YELLOW BASE</span>
            <span className="text-sm sm:text-base">🟡</span>
          </div>
          <div className="w-full h-3/4 rounded-xl bg-white/15 backdrop-blur-sm border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => (
              <div
                key={slotIdx}
                className="rounded-full bg-amber-950/60 border-2 border-amber-400/50 flex items-center justify-center shadow-inner"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Render Active Tokens Overlay with Absolute Positioning (0-14 mapped to 0-100%) */}
      <div className="absolute inset-2 sm:inset-3 pointer-events-none">
        {renderedTokens.map(({ token, x, y, isMovable }) => {
          // Convert (x, y) coordinates from 0-14 into percentages (0-100%)
          const leftPercent = (x / 14) * 92 + 4;
          const topPercent = (y / 14) * 92 + 4;

          const colorGradients: Record<PlayerColor, string> = {
            red: 'from-rose-500 to-rose-700 text-white border-white',
            green: 'from-emerald-400 to-emerald-600 text-white border-white',
            yellow: 'from-amber-400 to-amber-600 text-slate-950 border-white',
            blue: 'from-blue-400 to-blue-600 text-white border-white',
          };

          return (
            <div
              key={`${token.color}-${token.id}`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute transition-all duration-300 ${
                isMovable ? 'pointer-events-auto cursor-pointer z-30' : 'pointer-events-none z-20'
              }`}
              onClick={() => {
                if (isMovable) {
                  sound.playTokenHop();
                  onSelectToken(token.id);
                }
              }}
            >
              {/* Highlight ripple when token is legally movable */}
              {isMovable && (
                <div className="absolute -inset-2 rounded-full bg-amber-400/60 animate-ping pointer-events-none" />
              )}

              {/* The Token piece */}
              <div
                className={`relative flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${
                  colorGradients[token.color]
                } border-2 shadow-lg ${
                  isMovable
                    ? 'ring-4 ring-amber-400 animate-bounce scale-110 shadow-amber-400/40'
                    : 'hover:scale-105'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-black select-none">
                  {skinSymbol}
                </span>

                {/* Safe badge */}
                {token.isSafe && token.step >= 0 && token.step <= 50 && (
                  <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[8px] text-slate-950 font-bold">
                    ★
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
