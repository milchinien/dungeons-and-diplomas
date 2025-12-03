import styled from 'styled-components';

interface IconProps {
  size?: number;
  color?: string;
}

const IconSvg = styled.svg<{ $size: number }>`
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
`;

export function DoorIcon({ size = 32, color = '#4a2511' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Archway */}
      <path
        d="M 8 28 L 8 12 Q 8 4 16 4 Q 24 4 24 12 L 24 28 Z"
        fill={color}
        stroke="#1a1a1a"
        strokeWidth="2"
      />
      {/* Door panels */}
      <rect x="10" y="14" width="5" height="14" fill="#654321" />
      <rect x="17" y="14" width="5" height="14" fill="#654321" />
      {/* Door handles */}
      <circle cx="14" cy="20" r="1" fill="#d4af37" />
      <circle cx="18" cy="20" r="1" fill="#d4af37" />
    </IconSvg>
  );
}

export function SwordIcon({ size = 32, color = '#c0c0c0' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Sword blade */}
      <path
        d="M 16 4 L 18 14 L 17 24 L 16 26 L 15 24 L 14 14 Z"
        fill={color}
        stroke="#1a1a1a"
        strokeWidth="1.5"
      />
      {/* Sword point */}
      <path d="M 16 2 L 18 4 L 14 4 Z" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Cross guard */}
      <rect x="10" y="22" width="12" height="2" fill="#8b7355" stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Handle */}
      <rect x="14" y="24" width="4" height="4" fill="#654321" stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Pommel */}
      <circle cx="16" cy="29" r="2" fill="#d4af37" stroke="#1a1a1a" strokeWidth="1.5" />
    </IconSvg>
  );
}

export function MonsterIcon({ size = 32, color = '#8b0000' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Head */}
      <circle cx="16" cy="16" r="12" fill={color} stroke="#1a1a1a" strokeWidth="2" />
      {/* Horns */}
      <path d="M 8 12 L 6 6 L 10 10" fill="#4a0000" stroke="#1a1a1a" strokeWidth="1.5" />
      <path d="M 24 12 L 26 6 L 22 10" fill="#4a0000" stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Eyes (menacing) */}
      <ellipse cx="11" cy="14" rx="2" ry="3" fill="#ff0000" />
      <ellipse cx="21" cy="14" rx="2" ry="3" fill="#ff0000" />
      <circle cx="11" cy="14" r="1" fill="#1a1a1a" />
      <circle cx="21" cy="14" r="1" fill="#1a1a1a" />
      {/* Sharp teeth */}
      <path
        d="M 10 20 L 12 22 L 14 20 L 16 22 L 18 20 L 20 22 L 22 20"
        stroke="#1a1a1a"
        strokeWidth="2"
        fill="none"
      />
    </IconSvg>
  );
}

export function ChestIcon({ size = 32, color = '#d4af37' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Chest lid */}
      <path
        d="M 8 12 Q 8 8 16 8 Q 24 8 24 12 L 24 14 L 8 14 Z"
        fill="#654321"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
      {/* Chest body */}
      <rect x="8" y="14" width="16" height="12" fill="#8b4513" stroke="#1a1a1a" strokeWidth="2" />
      {/* Lock */}
      <circle cx="16" cy="19" r="2.5" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="15" y="20" width="2" height="4" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Metal bands */}
      <line x1="8" y1="17" x2="24" y2="17" stroke="#4a4a4a" strokeWidth="1.5" />
      <line x1="8" y1="23" x2="24" y2="23" stroke="#4a4a4a" strokeWidth="1.5" />
    </IconSvg>
  );
}

export function CoinIcon({ size = 32, color = '#ffd700' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Coin */}
      <circle cx="16" cy="16" r="10" fill={color} stroke="#1a1a1a" strokeWidth="2" />
      {/* Inner circle */}
      <circle cx="16" cy="16" r="8" fill="none" stroke="#b8860b" strokeWidth="1" />
      {/* Dollar sign */}
      <text
        x="16"
        y="21"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1a1a1a"
        fontFamily="monospace"
      >
        $
      </text>
    </IconSvg>
  );
}

export function StairsIcon({ size = 32, color = '#696969' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Stairs going up */}
      <rect x="4" y="24" width="7" height="4" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="9" y="19" width="7" height="9" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="14" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <rect x="19" y="9" width="7" height="19" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Arrow pointing up */}
      <path d="M 26 6 L 28 4 L 30 6" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      <line x1="28" y1="4" x2="28" y2="10" stroke="#1a1a1a" strokeWidth="2" />
    </IconSvg>
  );
}

export function PlayerIcon({ size = 48, color = '#2a5a2a' }: IconProps) {
  return (
    <IconSvg $size={size} viewBox="0 0 32 32" fill="none">
      {/* Head */}
      <circle cx="16" cy="16" r="11" fill={color} stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Inner glow */}
      <circle cx="16" cy="16" r="9" fill="#3d7a3d" />
      {/* Eyes */}
      <circle cx="12" cy="14" r="2" fill="#1a1a1a" />
      <circle cx="20" cy="14" r="2" fill="#1a1a1a" />
      {/* Eye highlights */}
      <circle cx="12.5" cy="13.5" r="0.8" fill="#ffffff" />
      <circle cx="20.5" cy="13.5" r="0.8" fill="#ffffff" />
      {/* Friendly smile */}
      <path d="M 10 19 Q 16 23 22 19" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
    </IconSvg>
  );
}
