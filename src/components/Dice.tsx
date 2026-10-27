import React, { useState, useEffect } from 'react';
import { sound } from '../services/audio.js';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  playerColor?: string;
  disabledReason?: string;
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling: externalRolling,
  canRoll,
  onRoll,
  playerColor = 'red',
  disabledReason,
}) => {
  const [internalRolling, setInternalRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(value || 6);

  useEffect(() => {
    if (value !== null) {
      setDisplayValue(value);
    }
  }, [value]);

  const handleRollClick = () => {
    if (!canRoll || internalRolling || externalRolling) return;

    sound.playDiceRoll();
    setInternalRolling(true);

    // Fast face shuffle animation
    let shuffleCount = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      shuffleCount++;
      if (shuffleCount > 8) {
        clearInterval(interval);
        setInternalRolling(false);
      }
    }, 60);

    onRoll();
  };

  const isRolling = internalRolling || externalRolling;

  // Dot patterns for values 1 to 6 on a 3x3 grid
  const renderDots = (num: number) => {
    const dots: boolean[] = Array(9).fill(false);

    if (num === 1) {
      dots[4] = true;
    } else if (num === 2) {
      dots[0] = dots[8] = true;
    } else if (num === 3) {
      dots[0] = dots[4] = dots[8] = true;
    } else if (num === 4) {
      dots[0] = dots[2] = dots[6] = dots[8] = true;
    } else if (num === 5) {
      dots[0] = dots[2] = dots[4] = dots[6] = dots[8] = true;
    } else if (num === 6) {
      dots[0] = dots[2] = dots[3] = dots[5] = dots[6] = dots[8] = true;
    }

    const dotColor =
      playerColor === 'red'
        ? 'bg-rose-600'
        : playerColor === 'green'
        ? 'bg-emerald-600'
        : playerColor === 'yellow'
        ? 'bg-amber-500'
        : 'bg-blue-600';

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-10 h-10 sm:w-12 sm:h-12 p-1.5 gap-1">
        {dots.map((active, i) => (
          <div key={i} className="flex items-center justify-center">
            {active && (
              <span
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${dotColor} shadow-inner shadow-black/40`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handleRollClick}
        disabled={!canRoll || isRolling}
        className={`relative group rounded-2xl p-2 sm:p-2.5 transition-all transform duration-200 ${
          canRoll && !isRolling
            ? 'cursor-pointer hover:scale-105 active:scale-95 animate-pulse'
            : 'cursor-not-allowed opacity-85'
        }`}
        title={disabledReason || (canRoll ? 'Click to Roll Dice!' : 'Waiting...')}
      >
        {/* Glow halo when it's your turn */}
        {canRoll && !isRolling && (
          <div className="absolute -inset-2 rounded-3xl bg-amber-400/40 blur-md animate-pulse pointer-events-none" />
        )}

        {/* 3D Dice Cube */}
        <div
          className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-white/90 shadow-2xl shadow-black/50 ${
            isRolling ? 'animate-spin' : ''
          }`}
          style={{
            boxShadow:
              'inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.25), 0 8px 18px rgba(0,0,0,0.4)',
          }}
        >
          {renderDots(displayValue)}

          {/* Value badge in corner if not rolling */}
          {!isRolling && value !== null && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-white/20 text-[10px] font-black text-amber-400 shadow">
              {value}
            </div>
          )}
        </div>
      </button>

      {/* Button CTA text */}
      <div className="mt-2 text-center">
        {canRoll ? (
          <span className="inline-block rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-0.5 text-xs font-black text-amber-300 uppercase tracking-wider animate-bounce">
            Roll Now!
          </span>
        ) : disabledReason ? (
          <span className="text-[11px] text-slate-400 font-medium">{disabledReason}</span>
        ) : null}
      </div>
    </div>
  );
};
