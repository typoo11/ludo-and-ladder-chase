import React from 'react';

export const AVATAR_LIST = [
  { id: 'avatar-king', label: 'Ludo King', color: 'from-amber-400 to-amber-600', emoji: '👑' },
  { id: 'avatar-knight', label: 'Dice Knight', color: 'from-blue-500 to-indigo-600', emoji: '⚔️' },
  { id: 'avatar-wizard', label: 'Arcane Mage', color: 'from-purple-500 to-fuchsia-600', emoji: '🔮' },
  { id: 'avatar-dragon', label: 'Inferno Drake', color: 'from-red-500 to-rose-700', emoji: '🐉' },
  { id: 'avatar-fox', label: 'Shadow Fox', color: 'from-emerald-500 to-teal-700', emoji: '🦊' },
  { id: 'avatar-queen', label: 'Royal Empress', color: 'from-pink-400 to-rose-600', emoji: '👸' },
  { id: 'avatar-bot', label: 'AI Mech', color: 'from-cyan-400 to-blue-600', emoji: '🤖' },
];

interface AvatarIconProps {
  avatarId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ avatarId = 'avatar-knight', size = 'md', className = '' }) => {
  const avatar = AVATAR_LIST.find((a) => a.id === avatarId) || AVATAR_LIST[1];

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.color} shadow-md border-2 border-white/20 select-none ${sizeClasses[size]} ${className}`}
    >
      <span>{avatar.emoji}</span>
    </div>
  );
};
