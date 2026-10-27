import React, { useState } from 'react';
import { socketService } from '../services/socket.js';
import { sound } from '../services/audio.js';
import { ChatMessage, PlayerColor } from '../types/game.js';
import { MessageSquare, Send, Smile } from 'lucide-react';

interface GameChatProps {
  roomCode: string;
  messages: ChatMessage[];
  playerColor: PlayerColor;
}

const QUICK_EMOJIS = ['🎲', '🔥', '🏆', '😱', '😂', '👏', '💥', '🛡️'];
const QUICK_PHRASES = ['Good luck!', 'Nice roll!', 'Ouch!!', 'Almost there!', 'Well played!'];

export const GameChat: React.FC<GameChatProps> = ({ roomCode, messages, playerColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const sendEmoji = (emoji: string) => {
    sound.playClick();
    socketService.sendChat(roomCode, emoji, true);
  };

  const sendPhrase = (phrase: string) => {
    sound.playClick();
    socketService.sendChat(roomCode, phrase, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sound.playClick();
    socketService.sendChat(roomCode, text.trim(), false);
    setText('');
  };

  return (
    <div className="relative">
      {/* Quick Emoji bar above or below */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 bg-slate-900/80 rounded-2xl border border-white/10 max-w-full">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendEmoji(emoji)}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-base hover:scale-110 active:scale-90 transition-transform"
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setIsOpen(!isOpen);
          }}
          className="flex-shrink-0 px-2 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-300 text-xs font-bold flex items-center gap-1"
        >
          <MessageSquare className="h-3 w-3" />
          <span>Chat</span>
        </button>
      </div>

      {/* Popover Chat Feed */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 sm:w-80 rounded-2xl bg-slate-950/95 border border-white/10 p-3 shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-xs font-bold text-slate-300">Room Chat &amp; Reactions</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Quick phrases */}
          <div className="flex flex-wrap gap-1 mb-2">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendPhrase(phrase)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300 font-medium"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="h-40 overflow-y-auto space-y-2 mb-2 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-6 text-[11px]">
                No messages yet. Send an emoji or quick phrase!
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl bg-slate-900/90 border border-white/5 p-2 flex items-start gap-2"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      m.senderColor === 'red'
                        ? 'bg-rose-500'
                        : m.senderColor === 'green'
                        ? 'bg-emerald-500'
                        : m.senderColor === 'yellow'
                        ? 'bg-amber-400'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-[11px] text-slate-300">
                      {m.senderName}
                    </div>
                    <div
                      className={`text-slate-100 ${
                        m.isEmoji ? 'text-xl mt-0.5' : 'text-xs mt-0.5 break-words'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <input
              type="text"
              maxLength={60}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 rounded-xl bg-slate-900 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 p-2 text-white shadow"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
