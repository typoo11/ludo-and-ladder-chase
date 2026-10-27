import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { socketService } from './services/socket.js';
import { sound } from './services/audio.js';
import { GameRoom } from './types/game.js';
import { Navbar } from './components/Navbar.js';
import { Lobby } from './components/Lobby.js';
import { LudoGame } from './components/Ludo/LudoGame.js';
import { LadderChaseGame } from './components/LadderChase/LadderChaseGame.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { DailyRewardModal } from './components/DailyRewardModal.js';
import { ShopModal } from './components/ShopModal.js';
import { AdminPanel } from './components/AdminPanel.js';

function GameRoot() {
  const { user, loading, dailyStatus } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<GameRoom | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Auto-prompt daily reward if claimable once user loads
  useEffect(() => {
    if (user && dailyStatus?.canClaim) {
      const timer = setTimeout(() => {
        setIsDailyOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, dailyStatus?.canClaim]);

  // Subscribe to real-time socket events
  useEffect(() => {
    const unsubRoom = socketService.on('room_updated', (room: GameRoom) => {
      if (room.status === 'in_progress' || room.status === 'completed') {
        setCurrentRoom(room);
        setWaitingRoom(null);
      } else if (room.status === 'waiting') {
        setWaitingRoom(room);
      }
    });

    return () => {
      unsubRoom();
    };
  }, []);

  const handleExitGame = () => {
    setCurrentRoom(null);
    setWaitingRoom(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 shadow-xl shadow-rose-500/30 animate-bounce">
            <span className="text-3xl">🎲</span>
          </div>
          <div className="text-sm font-bold text-amber-300 animate-pulse">
            Loading Ludo &amp; Ladder Arena...
          </div>
        </div>
      </div>
    );
  }

  // Active Game Screen (Ludo or Ladder Chase)
  if (currentRoom) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans selection:bg-rose-500 selection:text-white">
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenDaily={() => setIsDailyOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenAdmin={() => setIsAdminView(true)}
          currentView="game"
          onGoHome={handleExitGame}
        />

        {currentRoom.mode === 'ludo' ? (
          <LudoGame
            room={currentRoom}
            userId={user?.id || ''}
            onExit={handleExitGame}
            activeTokenSkin={user?.inventory.activeToken || 'classic'}
            activeBoardTheme={user?.inventory.activeBoard || 'classic'}
          />
        ) : (
          <LadderChaseGame
            room={currentRoom}
            userId={user?.id || ''}
            onExit={handleExitGame}
          />
        )}

        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <DailyRewardModal isOpen={isDailyOpen} onClose={() => setIsDailyOpen(false)} />
        <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    );
  }

  // Admin View
  if (isAdminView && user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenDaily={() => setIsDailyOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenAdmin={() => setIsAdminView(true)}
          currentView="admin"
          onGoHome={() => setIsAdminView(false)}
        />
        <AdminPanel onClose={() => setIsAdminView(false)} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <DailyRewardModal isOpen={isDailyOpen} onClose={() => setIsDailyOpen(false)} />
        <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
      </div>
    );
  }

  // Main Dashboard / Lobby
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-between">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        currentView="lobby"
        onGoHome={() => {
          setIsAdminView(false);
          setWaitingRoom(null);
        }}
      />

      <main className="flex-1">
        <Lobby
          onJoinSuccess={(room) => {
            if (room.status === 'in_progress') {
              setCurrentRoom(room);
            } else {
              setWaitingRoom(room);
            }
          }}
          waitingRoom={waitingRoom}
          setWaitingRoom={setWaitingRoom}
        />
      </main>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <DailyRewardModal isOpen={isDailyOpen} onClose={() => setIsDailyOpen(false)} />
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameRoot />
    </AuthProvider>
  );
}
