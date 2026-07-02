import React from 'react';

// Sanrio character decorative borders and elements
export const SanrioCharacterBorder = ({ character = 'hello-kitty', position = 'top' }) => {
  const characters = {
    'hello-kitty': {
      top: (
        <svg viewBox="0 0 200 100" className="w-full h-auto" preserveAspectRatio="none">
          {/* Hello Kitty - simple top decoration */}
          <g transform="translate(20, 10)">
            {/* Head */}
            <circle cx="20" cy="20" r="18" fill="#FFF" stroke="#000" strokeWidth="2" />
            {/* Ears */}
            <circle cx="8" cy="5" r="6" fill="#FFF" stroke="#000" strokeWidth="2" />
            <circle cx="32" cy="5" r="6" fill="#FFF" stroke="#000" strokeWidth="2" />
            {/* Bow */}
            <rect x="18" y="0" width="4" height="3" fill="#FF1493" />
            <circle cx="15" cy="2" r="3" fill="#FF1493" />
            <circle cx="27" cy="2" r="3" fill="#FF1493" />
            {/* Eyes */}
            <circle cx="15" cy="18" r="2" fill="#000" />
            <circle cx="25" cy="18" r="2" fill="#000" />
            {/* Nose */}
            <circle cx="20" cy="22" r="1.5" fill="#000" />
            {/* Mouth */}
            <path d="M 20 22 Q 23 25 25 23" stroke="#000" strokeWidth="1" fill="none" />
          </g>
          
          {/* Cinnamoroll - middle */}
          <g transform="translate(70, 15)">
            {/* Head */}
            <circle cx="15" cy="15" r="12" fill="#FFF" stroke="#000" strokeWidth="1.5" />
            {/* Ears */}
            <path d="M 10 5 Q 8 0 6 2" stroke="#000" strokeWidth="1.5" fill="none" />
            <path d="M 20 5 Q 22 0 24 2" stroke="#000" strokeWidth="1.5" fill="none" />
            {/* Eyes */}
            <circle cx="11" cy="12" r="1.5" fill="#000" />
            <circle cx="19" cy="12" r="1.5" fill="#000" />
            {/* Smile */}
            <path d="M 15 15 Q 13 18 11 17" stroke="#000" strokeWidth="1" fill="none" />
          </g>
          
          {/* My Melody - right */}
          <g transform="translate(130, 10)">
            {/* Head */}
            <circle cx="20" cy="18" r="15" fill="#FFF" stroke="#000" strokeWidth="2" />
            {/* Ears - bunny style */}
            <ellipse cx="12" cy="5" rx="4" ry="8" fill="#FFF" stroke="#000" strokeWidth="2" />
            <ellipse cx="28" cy="5" rx="4" ry="8" fill="#FFF" stroke="#000" strokeWidth="2" />
            {/* Bow */}
            <rect x="18" y="0" width="4" height="3" fill="#FFB6C1" />
            {/* Eyes */}
            <circle cx="16" cy="16" r="1.5" fill="#000" />
            <circle cx="24" cy="16" r="1.5" fill="#000" />
            {/* Happy mouth */}
            <path d="M 18 21 Q 20 23 22 21" stroke="#000" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      ),
      bottom: (
        <svg viewBox="0 0 200 100" className="w-full h-auto" preserveAspectRatio="none">
          {/* Playful bottom decoration with scattered characters */}
          <g transform="translate(15, 30)">
            <circle cx="10" cy="10" r="8" fill="#FFB6C1" opacity="0.3" />
            <text x="10" y="12" fontSize="12" textAnchor="middle" fill="#000">💕</text>
          </g>
          <g transform="translate(170, 35)">
            <circle cx="10" cy="10" r="8" fill="#FFDAB9" opacity="0.3" />
            <text x="10" y="12" fontSize="12" textAnchor="middle" fill="#000">🎀</text>
          </g>
        </svg>
      ),
    },
    'cinnamoroll': {
      top: (
        <svg viewBox="0 0 200 80" className="w-full h-auto" preserveAspectRatio="none">
          <g transform="translate(50, 10)">
            {/* Cloud-like head */}
            <path d="M 20 15 Q 5 15 5 25 Q 5 35 15 35 Q 15 40 25 40 Q 35 40 35 35 Q 45 35 45 25 Q 45 15 30 15" fill="#FFFACD" stroke="#8B7355" strokeWidth="2" />
            {/* Ears */}
            <circle cx="18" cy="12" r="4" fill="#FFFACD" stroke="#8B7355" strokeWidth="1.5" />
            <circle cx="32" cy="12" r="4" fill="#FFFACD" stroke="#8B7355" strokeWidth="1.5" />
            {/* Eyes */}
            <circle cx="20" cy="22" r="2" fill="#4169E1" />
            <circle cx="30" cy="22" r="2" fill="#4169E1" />
            {/* Smile */}
            <path d="M 25 28 Q 23 30 21 29" stroke="#8B7355" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      ),
    },
    'kuromi': {
      top: (
        <svg viewBox="0 0 200 80" className="w-full h-auto" preserveAspectRatio="none">
          <g transform="translate(60, 10)">
            {/* Head */}
            <circle cx="20" cy="20" r="16" fill="#2F4F4F" stroke="#000" strokeWidth="2" />
            {/* Horns */}
            <path d="M 12 8 Q 8 0 10 -5" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M 28 8 Q 32 0 30 -5" stroke="#000" strokeWidth="2" fill="none" />
            {/* Skull mark */}
            <circle cx="20" cy="12" r="3" fill="#FF1493" />
            {/* Eyes */}
            <circle cx="16" cy="20" r="2" fill="#FFF" />
            <circle cx="24" cy="20" r="2" fill="#FFF" />
            {/* Angry mouth */}
            <path d="M 18 26 L 22 26" stroke="#000" strokeWidth="1.5" />
          </g>
        </svg>
      ),
    },
    'badtz-maru': {
      top: (
        <svg viewBox="0 0 200 80" className="w-full h-auto" preserveAspectRatio="none">
          <g transform="translate(55, 15)">
            {/* Body */}
            <ellipse cx="20" cy="25" rx="14" ry="16" fill="#4A4A4A" stroke="#000" strokeWidth="1.5" />
            {/* Head */}
            <circle cx="20" cy="12" r="10" fill="#4A4A4A" stroke="#000" strokeWidth="1.5" />
            {/* Ears */}
            <circle cx="14" cy="5" r="3" fill="#4A4A4A" stroke="#000" strokeWidth="1" />
            <circle cx="26" cy="5" r="3" fill="#4A4A4A" stroke="#000" strokeWidth="1" />
            {/* Eyes */}
            <circle cx="17" cy="11" r="1.5" fill="#FFF" />
            <circle cx="23" cy="11" r="1.5" fill="#FFF" />
            {/* Pink cheeks */}
            <circle cx="12" cy="14" r="2" fill="#FFB6C1" opacity="0.7" />
            <circle cx="28" cy="14" r="2" fill="#FFB6C1" opacity="0.7" />
            {/* Beak */}
            <path d="M 20 15 L 18 18 L 22 18 Z" fill="#FFD700" stroke="#000" strokeWidth="1" />
          </g>
        </svg>
      ),
    },
  };

  return (
    <div className="w-full">
      {characters[character]?.[position] || characters['hello-kitty'][position]}
    </div>
  );
};

// Sanrio corner decorations
export const SanrioCornerDecoration = ({ position = 'top-left', size = 'md' }) => {
  const sizeMap = { sm: 'w-12 h-12', md: 'w-16 h-16', lg: 'w-24 h-24' };
  
  const decorations = {
    'top-left': '🎀',
    'top-right': '💕',
    'bottom-left': '⭐',
    'bottom-right': '✨',
  };

  const positionMap = {
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2',
  };

  return (
    <div className={`${positionMap[position]} ${sizeMap[size]} text-center leading-none opacity-20 hover:opacity-40 transition`}>
      <span className="text-4xl">{decorations[position]}</span>
    </div>
  );
};

// Sanrio color palette hook
export const useSanrioColors = () => {
  return {
    primary: 'from-pink-400 to-rose-400',
    secondary: 'from-purple-300 to-pink-300',
    accent: 'from-yellow-200 to-pink-200',
    neutral: 'from-white to-pink-50',
    text: {
      primary: 'text-pink-700',
      secondary: 'text-purple-600',
      accent: 'text-rose-500',
    },
    border: {
      primary: 'border-pink-200',
      secondary: 'border-purple-200',
      accent: 'border-rose-200',
    },
    bg: {
      light: 'bg-pink-50',
      lighter: 'bg-rose-50',
      accent: 'bg-purple-50',
    },
  };
};

export default SanrioCharacterBorder;
