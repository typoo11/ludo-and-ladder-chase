import { PlayerSlot, PlayerColor } from '../../types/game.js';
import { LADDERS, CHUTES, MYSTERY_TILES } from '../../constants/gameConstants.js';
import { Shield, Sparkles, Zap, Flame, Trophy } from 'lucide-react';

interface LadderChaseBoardProps {
  players: PlayerSlot[];
  twistMode?: boolean;
}

// Convert tile number (1-100) to grid coordinates (col 0-9, row 0-9 from bottom)
export function tileToCoords(tile: number): { col: number; row: number } {
  const t = Math.max(1, Math.min(100, tile));
  const zeroBased = t - 1;
  const row = Math.floor(zeroBased / 10); // 0 (bottom) to 9 (top)
  const remainder = zeroBased % 10;
  // Serpentine: even rows (0, 2, 4...) go left-to-right; odd rows go right-to-left
  const col = row % 2 === 0 ? remainder : 9 - remainder;
  return { col, row };
}

// Convert tile number to percentage coordinates (x: 0-100%, y: 0-100% from top)
export function tileToPercent(tile: number): { x: number; y: number } {
  const { col, row } = tileToCoords(tile);
  const x = (col + 0.5) * 10; // 5%, 15%, 25% ... 95%
  const y = (9 - row + 0.5) * 10; // 95%, 85%, ... 5%
  return { x, y };
}

export const LadderChaseBoard: React.FC<LadderChaseBoardProps> = ({
  players,
  twistMode = true,
}) => {
  // Generate 100 tiles from 100 down to 1 for visual layout
  const gridCells = [];
  for (let r = 9; r >= 0; r--) {
    for (let c = 0; c < 10; c++) {
      // Calculate tile number
      const rowFromBottom = r;
      const tileNumber =
        rowFromBottom % 2 === 0
          ? rowFromBottom * 10 + c + 1
          : rowFromBottom * 10 + (9 - c) + 1;

      const isLadderStart = !!LADDERS[tileNumber];
      const isChuteStart = !!CHUTES[tileNumber];
      const isMystery = MYSTERY_TILES.has(tileNumber);
      const isGoal = tileNumber === 100;

      gridCells.push({
        tile: tileNumber,
        isLadderStart,
        isChuteStart,
        isMystery,
        isGoal,
      });
    }
  }

  const playerColors: Record<PlayerColor, string> = {
    red: 'bg-rose-500 border-white text-white shadow-rose-500/50',
    green: 'bg-emerald-500 border-white text-white shadow-emerald-500/50',
    yellow: 'bg-amber-400 border-white text-slate-950 shadow-amber-400/50',
    blue: 'bg-blue-500 border-white text-white shadow-blue-500/50',
  };

  return (
    <div className="relative aspect-square w-full max-w-[560px] mx-auto rounded-3xl border-4 border-slate-900 bg-slate-950 p-2 sm:p-3 shadow-2xl select-none">
      {/* 10x10 Grid */}
      <div className="relative w-full h-full grid grid-cols-10 grid-rows-10 gap-1 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 p-1">
        {gridCells.map(({ tile, isLadderStart, isChuteStart, isMystery, isGoal }) => {
          const isEven = (tileToCoords(tile).col + tileToCoords(tile).row) % 2 === 0;

          return (
            <div
              key={tile}
              className={`relative flex flex-col justify-between p-1 rounded-lg border transition-all ${
                isGoal
                  ? 'bg-gradient-to-br from-amber-500 to-rose-600 border-amber-300 shadow-lg shadow-amber-500/40 text-white'
                  : isLadderStart
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : isChuteStart
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : isMystery && twistMode
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                  : isEven
                  ? 'bg-slate-800/80 border-white/5 text-slate-300'
                  : 'bg-slate-850/60 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black">{tile}</span>
                {isGoal && <Trophy className="h-3 w-3 text-amber-200 fill-amber-200 animate-bounce" />}
                {isLadderStart && <span className="text-[10px]">🪜</span>}
                {isChuteStart && <span className="text-[10px]">👾</span>}
                {isMystery && twistMode && <Sparkles className="h-2.5 w-2.5 text-purple-400" />}
              </div>

              {isLadderStart && (
                <div className="text-[8px] font-black text-emerald-400 text-right">
                  ↗ {LADDERS[tile]}
                </div>
              )}
              {isChuteStart && (
                <div className="text-[8px] font-black text-rose-400 text-right">
                  ↘ {CHUTES[tile]}
                </div>
              )}
            </div>
          );
        })}

        {/* SVG Connectors for Ladders and Monster Chutes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="ladderGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="chuteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Render Ladders */}
          {Object.entries(LADDERS).map(([startStr, endNum]) => {
            const startNum = Number(startStr);
            const p1 = tileToPercent(startNum);
            const p2 = tileToPercent(endNum);

            return (
              <g key={`ladder-${startNum}`}>
                <line
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke="url(#ladderGrad)"
                  strokeWidth="4"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </g>
            );
          })}

          {/* Render Chutes */}
          {Object.entries(CHUTES).map(([startStr, endNum]) => {
            const startNum = Number(startStr);
            const p1 = tileToPercent(startNum);
            const p2 = tileToPercent(endNum);

            return (
              <g key={`chute-${startNum}`}>
                <line
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke="url(#chuteGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="opacity-75"
                />
              </g>
            );
          })}
        </svg>

        {/* Active Player Tokens on Board */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {players.map((p, pIdx) => {
            const pos = p.ladderPosition || 1;
            const percent = tileToPercent(pos);

            // Small offset if multiple players on same tile
            const offsetMultiplier = pIdx - (players.length - 1) / 2;
            const offsetX = offsetMultiplier * 6;
            const offsetY = offsetMultiplier * 4;

            return (
              <div
                key={p.id}
                style={{
                  left: `calc(${percent.x}% + ${offsetX}px)`,
                  top: `calc(${percent.y}% + ${offsetY}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute transition-all duration-500 ease-out"
              >
                <div
                  className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 shadow-xl ${
                    playerColors[p.color]
                  }`}
                >
                  <span className="text-xs font-black">{p.name.charAt(0)}</span>

                  {p.isShielded && (
                    <div className="absolute -top-2 -right-2 rounded-full bg-cyan-400 p-0.5 text-slate-950 shadow-md">
                      <Shield className="h-3 w-3 fill-cyan-400" />
                    </div>
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
