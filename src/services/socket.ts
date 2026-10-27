import { io, Socket } from 'socket.io-client';
import { GameRoom, GameMode, AIDifficulty, ChatMessage } from '../types/game.js';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  public connect(userId?: string): Socket {
    if (this.socket && this.socket.connected) {
      if (userId) {
        this.socket.emit('join_session', { userId });
      }
      return this.socket;
    }

    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to game server socket:', this.socket?.id);
      if (userId) {
        this.socket?.emit('join_session', { userId });
      }
    });

    this.socket.on('room_updated', (room: GameRoom) => {
      this.emitLocal('room_updated', room);
    });

    this.socket.on('game_ended', (data: any) => {
      this.emitLocal('game_ended', data);
    });

    this.socket.on('chat_received', (msg: ChatMessage) => {
      this.emitLocal('chat_received', msg);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emitLocal(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in socket listener for ${event}:`, e);
        }
      });
    }
  }

  public createRoom(params: {
    hostUser: { id: string; username: string; avatar: string };
    mode: GameMode;
    matchType: 'ai' | 'online' | 'pass_and_play';
    entryFee?: number;
    quickMode?: boolean;
    twistMode?: boolean;
    maxPlayers?: number;
    difficulty?: AIDifficulty;
  }): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) this.connect(params.hostUser.id);
      this.socket?.emit('create_room', params, (response: any) => {
        resolve(response);
      });
    });
  }

  public joinRoom(params: {
    code: string;
    user: { id: string; username: string; avatar: string };
  }): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) this.connect(params.user.id);
      this.socket?.emit('join_room', params, (response: any) => {
        resolve(response);
      });
    });
  }

  public addBot(roomCode: string, difficulty: AIDifficulty = 'medium') {
    this.socket?.emit('add_bot', { roomCode, difficulty });
  }

  public removePlayer(roomCode: string, playerId: string) {
    this.socket?.emit('remove_player', { roomCode, playerId });
  }

  public startGame(roomCode: string) {
    this.socket?.emit('start_game', { roomCode });
  }

  public rollDice(roomCode: string) {
    this.socket?.emit('roll_dice', { roomCode });
  }

  public moveToken(roomCode: string, tokenId: number) {
    this.socket?.emit('move_token', { roomCode, tokenId });
  }

  public sendChat(roomCode: string, content: string, isEmoji: boolean = false) {
    this.socket?.emit('send_chat', { roomCode, content, isEmoji });
  }
}

export const socketService = new SocketService();
