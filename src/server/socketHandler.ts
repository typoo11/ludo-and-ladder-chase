import { Server, Socket } from 'socket.io';
import { db } from './db.ts';
import {
  GameRoom,
  PlayerSlot,
  PlayerColor,
  LudoToken,
  GameMode,
  AIDifficulty,
  ChatMessage,
} from '../types/game.ts';
import {
  PLAYER_COLORS,
  COLOR_OFFSETS,
  SAFE_SQUARES,
  LADDERS,
  CHUTES,
  MYSTERY_TILES,
} from '../constants/gameConstants.ts';

// Global in-memory rooms synchronized with DB
export const rooms: Map<string, GameRoom> = new Map();

// Helper to generate 6-digit room code
export function generateRoomCode(): string {
  let code = '';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function createInitialTokens(color: PlayerColor): LudoToken[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    step: -1, // -1 means in yard
    isSafe: true,
  }));
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentUserId: string | null = null;

    // Heartbeat / ping
    socket.on('join_session', ({ userId }: { userId: string }) => {
      currentUserId = userId;
    });

    // Create room
    socket.on(
      'create_room',
      (
        data: {
          hostUser: { id: string; username: string; avatar: string };
          mode: GameMode;
          matchType: 'ai' | 'online' | 'pass_and_play';
          entryFee?: number;
          quickMode?: boolean;
          twistMode?: boolean;
          maxPlayers?: number;
          difficulty?: AIDifficulty;
        },
        callback: (response: { success: boolean; room?: GameRoom; error?: string }) => void
      ) => {
        try {
          const code = generateRoomCode();
          const hostColor: PlayerColor = 'red';
          const maxPlayers = data.maxPlayers || 4;
          const entryFee = data.entryFee || 0;

          // Check user balance if entry fee > 0
          if (entryFee > 0) {
            const user = db.getUserById(data.hostUser.id);
            if (!user || user.coins < entryFee) {
              return callback({ success: false, error: 'Insufficient coins for this stake' });
            }
          }

          const hostPlayer: PlayerSlot = {
            id: data.hostUser.id,
            socketId: socket.id,
            name: data.hostUser.username,
            avatar: data.hostUser.avatar,
            color: hostColor,
            isHost: true,
            isReady: true,
            isAI: false,
            isConnected: true,
            tokens: createInitialTokens(hostColor),
            ladderPosition: 1,
            isShielded: false,
          };

          const newRoom: GameRoom = {
            code,
            hostId: data.hostUser.id,
            mode: data.mode,
            matchType: data.matchType,
            maxPlayers,
            entryFee,
            rewardPool: entryFee * (data.matchType === 'ai' ? 2 : maxPlayers),
            status: 'waiting',
            players: [hostPlayer],
            currentTurnIndex: 0,
            diceValue: null,
            diceRolled: false,
            consecutiveSixes: 0,
            winner: null,
            turnTimeLeft: 20,
            boardTheme: 'classic',
            ludoQuickMode: !!data.quickMode,
            ladderTwistMode: !!data.twistMode,
            chatMessages: [],
            createdAt: Date.now(),
          };

          // If AI mode selected, auto-populate bots
          if (data.matchType === 'ai') {
            const botNames = ['Cyber Knight', 'Mystic Fox', 'Solar Phoenix'];
            const botAvatars = ['avatar-bot1', 'avatar-bot2', 'avatar-bot3'];
            const count = Math.min(maxPlayers - 1, 3);

            for (let i = 0; i < count; i++) {
              const color = PLAYER_COLORS[i + 1];
              newRoom.players.push({
                id: `bot-${color}-${Date.now()}`,
                name: botNames[i] || `Bot ${color.toUpperCase()}`,
                avatar: botAvatars[i] || 'avatar-bot',
                color,
                isHost: false,
                isReady: true,
                isAI: true,
                difficulty: data.difficulty || 'medium',
                isConnected: true,
                tokens: createInitialTokens(color),
                ladderPosition: 1,
                isShielded: false,
              });
            }
          }

          rooms.set(code, newRoom);
          currentRoomCode = code;
          socket.join(code);

          callback({ success: true, room: newRoom });
          io.to(code).emit('room_updated', newRoom);
        } catch (err: any) {
          callback({ success: false, error: err.message || 'Failed to create room' });
        }
      }
    );

    // Join room
    socket.on(
      'join_room',
      (
        data: {
          code: string;
          user: { id: string; username: string; avatar: string };
        },
        callback: (response: { success: boolean; room?: GameRoom; error?: string }) => void
      ) => {
        try {
          const roomCode = data.code.trim().toUpperCase();
          const room = rooms.get(roomCode);

          if (!room) {
            return callback({ success: false, error: 'Room not found with code: ' + roomCode });
          }

          if (room.status !== 'waiting') {
            return callback({ success: false, error: 'Game is already in progress or completed' });
          }

          if (room.players.length >= room.maxPlayers) {
            return callback({ success: false, error: 'Room is full' });
          }

          // Check if user already in room
          const existing = room.players.find((p) => p.id === data.user.id);
          if (existing) {
            existing.socketId = socket.id;
            existing.isConnected = true;
            currentRoomCode = roomCode;
            socket.join(roomCode);
            callback({ success: true, room });
            io.to(roomCode).emit('room_updated', room);
            return;
          }

          // Check balance if entry fee > 0
          if (room.entryFee > 0) {
            const user = db.getUserById(data.user.id);
            if (!user || user.coins < room.entryFee) {
              return callback({ success: false, error: `Need at least ${room.entryFee} coins to join` });
            }
          }

          // Assign next color
          const usedColors = new Set(room.players.map((p) => p.color));
          const nextColor = PLAYER_COLORS.find((c) => !usedColors.has(c)) || 'blue';

          const newPlayer: PlayerSlot = {
            id: data.user.id,
            socketId: socket.id,
            name: data.user.username,
            avatar: data.user.avatar,
            color: nextColor,
            isHost: false,
            isReady: true,
            isAI: false,
            isConnected: true,
            tokens: createInitialTokens(nextColor),
            ladderPosition: 1,
            isShielded: false,
          };

          room.players.push(newPlayer);
          room.rewardPool = room.entryFee * room.players.length;
          currentRoomCode = roomCode;
          socket.join(roomCode);

          callback({ success: true, room });
          io.to(roomCode).emit('room_updated', room);
        } catch (err: any) {
          callback({ success: false, error: err.message || 'Failed to join room' });
        }
      }
    );

    // Add bot to room (host only)
    socket.on('add_bot', ({ roomCode, difficulty }: { roomCode: string; difficulty?: AIDifficulty }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'waiting') return;
      if (room.players.length >= room.maxPlayers) return;

      const usedColors = new Set(room.players.map((p) => p.color));
      const nextColor = PLAYER_COLORS.find((c) => !usedColors.has(c)) || 'blue';

      const botNames = ['Cyber Knight', 'Mystic Fox', 'Solar Phoenix', 'Titan Golem'];
      const botName = botNames[room.players.length] || `Bot ${nextColor.toUpperCase()}`;

      room.players.push({
        id: `bot-${nextColor}-${Date.now()}`,
        name: botName,
        avatar: 'avatar-bot',
        color: nextColor,
        isHost: false,
        isReady: true,
        isAI: true,
        difficulty: difficulty || 'medium',
        isConnected: true,
        tokens: createInitialTokens(nextColor),
        ladderPosition: 1,
        isShielded: false,
      });

      room.rewardPool = room.entryFee * room.players.length;
      io.to(roomCode).emit('room_updated', room);
    });

    // Remove player or bot (host only)
    socket.on('remove_player', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'waiting') return;
      if (playerId === room.hostId) return;

      room.players = room.players.filter((p) => p.id !== playerId);
      room.rewardPool = room.entryFee * room.players.length;
      io.to(roomCode).emit('room_updated', room);
    });

    // Start game
    socket.on('start_game', ({ roomCode }: { roomCode: string }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'waiting') return;
      if (room.players.length < 2) return;

      // Deduct entry fee from real human players
      if (room.entryFee > 0) {
        for (const p of room.players) {
          if (!p.isAI) {
            db.adjustUserCurrency(p.id, -room.entryFee, 0);
          }
        }
      }

      room.status = 'in_progress';
      room.currentTurnIndex = 0;
      room.diceValue = null;
      room.diceRolled = false;
      room.consecutiveSixes = 0;
      room.lastAction = `${room.players[0].name}'s turn to roll!`;

      io.to(roomCode).emit('room_updated', room);

      // Check if first player is AI
      triggerAIMoveIfNeeded(room, io);
    });

    // Roll dice
    socket.on('roll_dice', ({ roomCode }: { roomCode: string }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'in_progress' || room.diceRolled) return;

      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer) return;

      // Authoritative random roll 1-6
      const roll = Math.floor(Math.random() * 6) + 1;
      room.diceValue = roll;
      room.diceRolled = true;

      if (roll === 6) {
        room.consecutiveSixes += 1;
      } else {
        room.consecutiveSixes = 0;
      }

      // Check 3 consecutive sixes rule: forfeits turn
      if (room.consecutiveSixes >= 3) {
        room.lastAction = `${currentPlayer.name} rolled 3 sixes in a row! Turn forfeited!`;
        advanceTurn(room, io);
        return;
      }

      room.lastAction = `${currentPlayer.name} rolled a ${roll}!`;

      // Handle based on game mode
      if (room.mode === 'ludo') {
        const validMoves = getValidLudoMoves(currentPlayer, roll);
        if (validMoves.length === 0) {
          // No valid moves, pass turn after brief timeout
          setTimeout(() => {
            room.lastAction = `No moves available for ${currentPlayer.name}. Turn passed.`;
            advanceTurn(room, io);
          }, 1400);
        } else if (validMoves.length === 1 && currentPlayer.isAI) {
          // AI has 1 move, execute it automatically
          setTimeout(() => {
            executeLudoMove(room, currentPlayer, validMoves[0].id, roll, io);
          }, 800);
        }
      } else if (room.mode === 'ladder') {
        // Ladder Chase: move happens immediately
        setTimeout(() => {
          executeLadderMove(room, currentPlayer, roll, io);
        }, 600);
      }

      io.to(roomCode).emit('room_updated', room);
    });

    // Move Ludo token
    socket.on('move_token', ({ roomCode, tokenId }: { roomCode: string; tokenId: number }) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'in_progress' || !room.diceRolled || room.diceValue === null) return;

      const currentPlayer = room.players[room.currentTurnIndex];
      if (!currentPlayer || currentPlayer.isAI) return;

      const roll = room.diceValue;
      const validMoves = getValidLudoMoves(currentPlayer, roll);
      const isValid = validMoves.some((m) => m.id === tokenId);

      if (!isValid) return;

      executeLudoMove(room, currentPlayer, tokenId, roll, io);
    });

    // Chat / Quick Emoji message
    socket.on(
      'send_chat',
      (data: { roomCode: string; content: string; isEmoji?: boolean }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        const sender = room.players.find((p) => p.socketId === socket.id) || room.players[0];
        const msg: ChatMessage = {
          id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
          senderName: sender ? sender.name : 'Spectator',
          senderColor: sender ? sender.color : 'red',
          content: data.content,
          isEmoji: !!data.isEmoji,
          timestamp: Date.now(),
        };

        room.chatMessages.push(msg);
        if (room.chatMessages.length > 50) {
          room.chatMessages.shift();
        }

        io.to(data.roomCode).emit('chat_received', msg);
      }
    );

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          const player = room.players.find((p) => p.socketId === socket.id);
          if (player) {
            player.isConnected = false;
            // If waiting in lobby and not host, remove
            if (room.status === 'waiting' && !player.isHost) {
              room.players = room.players.filter((p) => p.socketId !== socket.id);
            }
            io.to(currentRoomCode).emit('room_updated', room);
          }
        }
      }
    });
  });
}

/**
 * Advance turn to next player
 */
function advanceTurn(room: GameRoom, io: Server) {
  if (room.status === 'completed') return;

  room.diceValue = null;
  room.diceRolled = false;

  // Next non-finished player
  let nextIdx = (room.currentTurnIndex + 1) % room.players.length;
  let attempts = 0;
  while (room.players[nextIdx].hasFinished && attempts < room.players.length) {
    nextIdx = (nextIdx + 1) % room.players.length;
    attempts++;
  }

  room.currentTurnIndex = nextIdx;
  const nextPlayer = room.players[nextIdx];
  room.lastAction = `${nextPlayer.name}'s turn to roll!`;

  io.to(room.code).emit('room_updated', room);

  // If next is AI, trigger roll
  triggerAIMoveIfNeeded(room, io);
}

/**
 * Handle AI turns
 */
function triggerAIMoveIfNeeded(room: GameRoom, io: Server) {
  if (room.status !== 'in_progress') return;

  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || !currentPlayer.isAI) return;

  const delay = currentPlayer.difficulty === 'hard' ? 700 : 1100;

  setTimeout(() => {
    if (room.status !== 'in_progress') return;
    const current = room.players[room.currentTurnIndex];
    if (!current || !current.isAI || room.diceRolled) return;

    // Roll
    const roll = Math.floor(Math.random() * 6) + 1;
    room.diceValue = roll;
    room.diceRolled = true;

    if (roll === 6) {
      room.consecutiveSixes += 1;
    } else {
      room.consecutiveSixes = 0;
    }

    if (room.consecutiveSixes >= 3) {
      room.lastAction = `${current.name} rolled 3 sixes! Turn forfeited!`;
      advanceTurn(room, io);
      return;
    }

    room.lastAction = `${current.name} (AI) rolled a ${roll}!`;
    io.to(room.code).emit('room_updated', room);

    if (room.mode === 'ludo') {
      const validMoves = getValidLudoMoves(current, roll);
      if (validMoves.length === 0) {
        setTimeout(() => {
          room.lastAction = `No moves for ${current.name}. Turn passed.`;
          advanceTurn(room, io);
        }, 1200);
      } else {
        // Choose move based on AI difficulty
        const chosenToken = selectAITokenMove(room, current, validMoves, roll);
        setTimeout(() => {
          executeLudoMove(room, current, chosenToken.id, roll, io);
        }, 900);
      }
    } else if (room.mode === 'ladder') {
      setTimeout(() => {
        executeLadderMove(room, current, roll, io);
      }, 700);
    }
  }, delay);
}

/**
 * Ludo Logic: Valid Moves
 */
export function getValidLudoMoves(player: PlayerSlot, roll: number): LudoToken[] {
  if (!player.tokens) return [];

  return player.tokens.filter((token) => {
    // Finished tokens cannot move
    if (token.step === 57) return false;

    // In yard: only can move out on 6
    if (token.step === -1) {
      return roll === 6;
    }

    // On board: maximum steps is 57 (51 is entrance to home run, 57 is finished)
    return token.step + roll <= 57;
  });
}

/**
 * Global common path index for a token
 */
export function getGlobalStep(color: PlayerColor, localStep: number): number | null {
  if (localStep < 0 || localStep > 51) return null; // in yard or in home path
  const offset = COLOR_OFFSETS[color];
  return (offset + localStep) % 52;
}

/**
 * Execute Ludo Token Move
 */
function executeLudoMove(
  room: GameRoom,
  player: PlayerSlot,
  tokenId: number,
  roll: number,
  io: Server
) {
  if (!player.tokens) return;
  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token) return;

  let gotBonusTurn = roll === 6;
  let didKnockout = false;

  if (token.step === -1) {
    // Move out of yard to start square (step 0)
    token.step = 0;
    token.isSafe = true; // start squares are safe
    room.lastAction = `${player.name} unlocked a token to the board!`;
  } else {
    // Advance steps
    token.step += roll;

    // Check if token reached Home (57)
    if (token.step === 57) {
      room.lastAction = `🎉 ${player.name}'s token reached Home!`;
      gotBonusTurn = true; // Reaching home gives bonus turn!
    } else if (token.step <= 51) {
      // Check safe square
      const globalPos = getGlobalStep(player.color, token.step);
      if (globalPos !== null) {
        token.isSafe = SAFE_SQUARES.has(globalPos);

        // Check knockouts if not safe!
        if (!token.isSafe) {
          for (const opp of room.players) {
            if (opp.id === player.id || !opp.tokens) continue;

            for (const oppToken of opp.tokens) {
              if (oppToken.step >= 0 && oppToken.step <= 51) {
                const oppGlobal = getGlobalStep(opp.color, oppToken.step);
                if (oppGlobal === globalPos) {
                  // KNOCKOUT! Send back to yard
                  oppToken.step = -1;
                  oppToken.isSafe = true;
                  didKnockout = true;
                  gotBonusTurn = true;
                  room.lastAction = `💥 ${player.name} knocked out ${opp.name}'s token back to base!`;
                }
              }
            }
          }
        }
      }
    }
  }

  // Check victory condition
  const finishedTokens = player.tokens.filter((t) => t.step === 57).length;
  const requiredToWin = room.ludoQuickMode ? 2 : 4;

  if (finishedTokens >= requiredToWin) {
    handleGameVictory(room, player, io);
    return;
  }

  io.to(room.code).emit('room_updated', room);

  // If bonus turn (rolled 6, knockout, or home finish), player rolls again
  if (gotBonusTurn) {
    room.diceValue = null;
    room.diceRolled = false;
    room.lastAction += ` (Bonus Turn for ${player.name}!)`;
    io.to(room.code).emit('room_updated', room);
    triggerAIMoveIfNeeded(room, io);
  } else {
    advanceTurn(room, io);
  }
}

/**
 * AI move decision algorithm
 */
function selectAITokenMove(
  room: GameRoom,
  player: PlayerSlot,
  validMoves: LudoToken[],
  roll: number
): LudoToken {
  if (validMoves.length === 1) return validMoves[0];

  // Hard AI: smart prioritization
  if (player.difficulty === 'hard') {
    // 1. Can we knock out an opponent?
    for (const token of validMoves) {
      const nextStep = token.step === -1 ? 0 : token.step + roll;
      if (nextStep <= 51) {
        const nextGlobal = getGlobalStep(player.color, nextStep);
        if (nextGlobal !== null && !SAFE_SQUARES.has(nextGlobal)) {
          for (const opp of room.players) {
            if (opp.id === player.id || !opp.tokens) continue;
            for (const oppToken of opp.tokens) {
              if (oppToken.step >= 0 && oppToken.step <= 51) {
                if (getGlobalStep(opp.color, oppToken.step) === nextGlobal) {
                  return token; // Aggressive knockout!
                }
              }
            }
          }
        }
      }
    }

    // 2. Can we reach home (step 57)?
    for (const token of validMoves) {
      if (token.step + roll === 57) return token;
    }

    // 3. Can we unlock a token on 6?
    if (roll === 6) {
      const yardToken = validMoves.find((t) => t.step === -1);
      if (yardToken) return yardToken;
    }

    // 4. Move token closest to home
    return validMoves.sort((a, b) => b.step - a.step)[0];
  }

  // Medium AI: balanced
  if (player.difficulty === 'medium') {
    if (roll === 6) {
      const yard = validMoves.find((t) => t.step === -1);
      if (yard && Math.random() > 0.3) return yard;
    }
    // Prefer advancing most advanced token
    return validMoves.sort((a, b) => b.step - a.step)[0];
  }

  // Easy AI: random choice
  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

/**
 * Ladder Chase Execution
 */
function executeLadderMove(
  room: GameRoom,
  player: PlayerSlot,
  roll: number,
  io: Server
) {
  let pos = player.ladderPosition || 1;
  const target = pos + roll;

  if (target <= 100) {
    pos = target;
  } else {
    // Exact roll needed or bounce back
    const overflow = target - 100;
    pos = 100 - overflow;
  }

  room.lastAction = `${player.name} moved to tile ${pos}.`;

  // Check Ladders
  if (LADDERS[pos]) {
    const newPos = LADDERS[pos];
    room.lastAction = `🚀 ${player.name} found a Ladder! Climbed from ${pos} to ${newPos}!`;
    pos = newPos;
  }
  // Check Chutes/Monsters (unless shielded)
  else if (CHUTES[pos]) {
    if (player.isShielded) {
      player.isShielded = false;
      room.lastAction = `🛡️ ${player.name}'s Shield blocked the Monster slide at tile ${pos}!`;
    } else {
      const newPos = CHUTES[pos];
      room.lastAction = `👾 Oh no! ${player.name} slipped down a Monster Chute from ${pos} to ${newPos}!`;
      pos = newPos;
    }
  }
  // Check Mystery Twist tiles
  else if (MYSTERY_TILES.has(pos) && room.ladderTwistMode) {
    const twists = ['shield', 'boost', 'extra_roll'];
    const twist = twists[Math.floor(Math.random() * twists.length)];
    if (twist === 'shield') {
      player.isShielded = true;
      room.lastAction = `✨ Mystery Tile! ${player.name} gained a Monster Shield!`;
    } else if (twist === 'boost') {
      pos = Math.min(100, pos + 3);
      room.lastAction = `⚡ Speed Boost! ${player.name} surged forward +3 tiles to ${pos}!`;
    } else if (twist === 'extra_roll') {
      room.lastAction = `🎲 Lucky Star! ${player.name} earned an Extra Dice Roll!`;
    }
  }

  player.ladderPosition = pos;

  // Win condition: reach 100
  if (pos === 100) {
    handleGameVictory(room, player, io);
    return;
  }

  // Bonus turn on 6
  if (roll === 6) {
    room.diceValue = null;
    room.diceRolled = false;
    room.lastAction += ` (Bonus Turn for rolling a 6!)`;
    io.to(room.code).emit('room_updated', room);
    triggerAIMoveIfNeeded(room, io);
  } else {
    advanceTurn(room, io);
  }
}

/**
 * Handle game victory
 */
function handleGameVictory(room: GameRoom, winner: PlayerSlot, io: Server) {
  room.status = 'completed';
  room.winner = winner;
  room.lastAction = `🏆 VICTORY! ${winner.name} won the match!`;

  const economy = db.getEconomyConfig();
  const rewardAmount = Math.floor(
    room.rewardPool > 0
      ? room.rewardPool * economy.winBonusMultiplier
      : 250 // Free match reward
  );

  // If winner is human, award reward
  if (!winner.isAI) {
    db.adjustUserCurrency(winner.id, rewardAmount, 5);
  }

  // Record match in DB
  db.recordMatch({
    roomCode: room.code,
    gameMode: room.mode,
    matchType: room.matchType,
    winnerId: winner.id,
    winnerName: winner.name,
    rewardPool: room.rewardPool,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      coinsWon: p.id === winner.id ? rewardAmount : 0,
    })),
  });

  io.to(room.code).emit('room_updated', room);
  io.to(room.code).emit('game_ended', {
    winner,
    rewardAmount,
    gemsWon: 5,
  });
}
