import React, { useEffect } from 'react';
import { GameRoom, PlayerSlot, PlayerColor } from '../../types/game.js';
import { LudoBoard } from './LudoBoard.js';
import { Dice } from '../Dice.js';
import { GameChat } from '../GameChat.js';
import { AvatarIcon } from '../AvatarIcon.js';
import { socketService } from '../../services/socket.js';
import { sound } from '../../services/audio.js';
import confetti from 'canvas-confetti';
import { Trophy, ArrowLeft, Coins } from 'lucide-react';

interface LudoGameProps {
  room: GameRoom;
  userId: string;
  onExit: () => void;
  activeTokenSkin?: string;
  activeBoardTheme?: string;
}

export const LudoGame: React.FC<LudoGameProps> = ({
  room,
  userId,
  onExit,
  activeTokenSkin = 'classic',
  activeBoardTheme = 'classic',
}) => {
  const currentPlayer = room.players[room.currentTurnIndex];
  const mySlot = room.players.find((p) => p.id === userId);
  const isMyTurn = !!mySlot && currentPlayer?.id === mySlot.id;

  const validMovableTokenIds: number[] = [];
  if (room.diceRolled && room.diceValue !== null && currentPlayer?.tokens) {
    const roll = room.diceValue;
    currentPlayer.tokens.forEach((t) => {
      if (t.step === 57) return;
      if (t.step === -1 && roll === 6) {
        validMovableTokenIds.push(t.id);
      } else if (t.step >= 0 && t.step + roll <= 57) {
        validMovableTokenIds.push(t.id);
      }
    });
  }

  useEffect(() => {
    if (room.status === 'completed' && room.winner) {
      sound.playVictory();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, [room.status, room.winner]);

  const handleRollDice = () => {
    if (!isMyTurn || room.diceRolled) return;
    socketService.rollDice(room.code);
  };

  const handleSelectToken = (tokenId: number) => {
    if (!isMyTurn || !room.diceRolled) return;
    socketService.moveToken(room.code, tokenId);
  };

  const colorBorderMap: Record<PlayerColor, string> = {
    red: 'border-rose-500 bg-rose-950/40 text-rose-300',
    green: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
    yellow: 'border-amber-400 bg-amber-950/40 text-amber-300',
    blue: 'border-blue-500 bg-blue-950/40 text-blue-300',
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-2 sm:p-4 text-white flex flex-col justify-between">
      {/* Top Bar: Room Info & Exit */}
      <div className="mx-auto w-full max-w-4xl flex items-center justify-between gap-3 mb-2 px-2">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Leave Room</span>
        </button>

        {/* Action announcement pill */}
        <div className="flex-1 text-center truncate">
          <span className="inline-block max-w-xs sm:max-w-md truncate rounded-full bg-slate-900 border border-white/10 px-3 sm:px-4 py-1 text-xs font-bold text-amber-300 shadow">
            {room.lastAction || 'Match started! Good luck!'}
          </span>
        </div>

        {/* Room Code & Stakes badge */}
        <div className="flex items-center gap-2">
          {room.rewardPool > 0 && (
            <div className="hidden sm:flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400">
              <Coins className="h-3.5 w-3.5" />
              <span>Pool: {room.rewardPool}</span>
            </div>
          )}
          <span className="rounded-xl bg-slate-800 border border-white/10 px-2.5 py-1 text-xs font-mono font-bold text-slate-300">
            #{room.code}
          </span>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 my-auto">
        {/* Left Player List (Red & Blue) */}
        <div className="hidden sm:flex flex-row lg:flex-col gap-3 justify-center">
          {room.players.slice(0, 2).map((player, idx) => {
            const isTurn = room.currentTurnIndex === idx;
            const finished = player.tokens?.filter((t) => t.step === 57).length || 0;

            return (
              <div
                key={player.id}
                className={`relative w-44 rounded-2xl border-2 p-3 transition-all ${
                  colorBorderMap[player.color]
                } ${isTurn ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-400/20 scale-105' : 'opacity-80'}`}
              >
                <div className="flex items-center gap-2.5">
                  <AvatarIcon avatarId={player.avatar} size="sm" />
                  <div className="overflow-hidden">
                    <div className="font-black text-xs text-white truncate flex items-center gap-1">
                      {player.name}
                      {player.isAI && (
                        <span className="rounded text-[9px] bg-slate-700 px-1 py-0.2 text-cyan-300">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {player.color} Player
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Tokens Home:</span>
                  <span className="text-amber-300">{finished} / {room.ludoQuickMode ? 2 : 4}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* The 15x15 Ludo Board */}
        <div className="flex-1 flex justify-center items-center">
          <LudoBoard
            players={room.players}
            currentPlayerColor={currentPlayer?.color || 'red'}
            validMovableTokenIds={validMovableTokenIds}
            isMyTurn={isMyTurn}
            onSelectToken={handleSelectToken}
            boardTheme={activeBoardTheme}
            activeTokenSkin={activeTokenSkin}
          />
        </div>

        {/* Right Player List (Green & Yellow) */}
        <div className="hidden sm:flex flex-row lg:flex-col gap-3 justify-center">
          {room.players.slice(2, 4).map((player, idx) => {
            const actualIdx = idx + 2;
            const isTurn = room.currentTurnIndex === actualIdx;
            const finished = player.tokens?.filter((t) => t.step === 57).length || 0;

            return (
              <div
                key={player.id}
                className={`relative w-44 rounded-2xl border-2 p-3 transition-all ${
                  colorBorderMap[player.color]
                } ${isTurn ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-400/20 scale-105' : 'opacity-80'}`}
              >
                <div className="flex items-center gap-2.5">
                  <AvatarIcon avatarId={player.avatar} size="sm" />
                  <div className="overflow-hidden">
                    <div className="font-black text-xs text-white truncate flex items-center gap-1">
                      {player.name}
                      {player.isAI && (
                        <span className="rounded text-[9px] bg-slate-700 px-1 py-0.2 text-cyan-300">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {player.color} Player
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Tokens Home:</span>
                  <span className="text-amber-300">{finished} / {room.ludoQuickMode ? 2 : 4}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Console: Active Player Turn & Dice Roller & Chat */}
      <div className="mx-auto w-full max-w-2xl mt-3 flex items-center justify-between gap-4 bg-slate-900/90 border border-white/10 rounded-3xl p-3 sm:px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <AvatarIcon avatarId={currentPlayer?.avatar} size="md" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Current Turn
            </div>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentPlayer?.name}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentPlayer?.color === 'red'
                    ? 'bg-rose-500'
                    : currentPlayer?.color === 'green'
                    ? 'bg-emerald-500'
                    : currentPlayer?.color === 'yellow'
                    ? 'bg-amber-400'
                    : 'bg-blue-500'
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              {room.diceRolled
                ? validMovableTokenIds.length > 0
                  ? isMyTurn
                    ? 'Tap a bouncing token to move!'
                    : 'Selecting token move...'
                  : 'No moves available'
                : isMyTurn
                ? 'Your turn! Roll the dice!'
                : 'Waiting for player to roll...'}
            </div>
          </div>
        </div>

        {/* Center: Interactive Dice */}
        <div className="flex items-center justify-center">
          <Dice
            value={room.diceValue}
            isRolling={false}
            canRoll={isMyTurn && !room.diceRolled}
            onRoll={handleRollDice}
            playerColor={currentPlayer?.color || 'red'}
            disabledReason={
              !isMyTurn
                ? `Waiting for ${currentPlayer?.name}`
                : room.diceRolled
                ? 'Select token'
                : undefined
            }
          />
        </div>

        {/* Right: Quick Chat & Reactions */}
        <div>
          <GameChat
            roomCode={room.code}
            messages={room.chatMessages || []}
            playerColor={mySlot?.color || 'red'}
          />
        </div>
      </div>

      {/* Victory Modal */}
      {room.status === 'completed' && room.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/30">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-rose-600 shadow-xl shadow-amber-500/40 animate-bounce">
              <Trophy className="h-10 w-10 text-white" />
            </div>

            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase text-amber-300">
              Match Finished
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {room.winner.name} Wins!
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Outstanding victory in Classic Ludo Arena!
            </p>

            <div className="my-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="text-xs font-semibold text-slate-300">Champion Prize Awarded</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Coins className="h-5 w-5 text-amber-400" />
                <span className="text-2xl font-black text-amber-300">
                  +{room.rewardPool > 0 ? Math.floor(room.rewardPool * 1.8) : 250} Coins
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onExit();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg hover:opacity-95 transition-all"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
