import { PlayerColor } from '../types/game.js';

export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const COLOR_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Ladder & Chute definitions for Ladder Chase mode
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

export const CHUTES: Record<number, number> = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

export const MYSTERY_TILES = new Set([12, 25, 45, 65, 83]);
