'use client';

import { useState } from 'react';

interface DungeonSelectMenuProps {
  onSelectDungeon: (dungeonType: string) => void;
  onBack: () => void;
}

interface DungeonLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  building: 'castle' | 'tower' | 'temple' | 'cabin' | 'fortress' | 'mine';
  available: boolean;
  isDaily?: boolean;
}

const dungeonLocations: DungeonLocation[] = [
  { id: 'daily', name: 'Königsburg', description: 'Daily Dungeon', x: 50, y: 45, building: 'castle', available: true, isDaily: true },
  { id: 'mathe', name: 'Turm der Zahlen', description: 'Mathematik', x: 20, y: 30, building: 'tower', available: false },
  { id: 'physik', name: 'Tempel der Kräfte', description: 'Physik', x: 75, y: 25, building: 'temple', available: false },
  { id: 'chemie', name: 'Alchemistenhütte', description: 'Chemie', x: 15, y: 65, building: 'cabin', available: false },
  { id: 'geschichte', name: 'Zeitmine', description: 'Geschichte', x: 82, y: 70, building: 'mine', available: false },
  { id: 'biologie', name: 'Festung des Lebens', description: 'Biologie', x: 55, y: 78, building: 'fortress', available: false },
];

// Castle - Main daily dungeon
function CastleBuilding({ glow = false }: { glow?: boolean }) {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" style={{ filter: glow ? 'drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FFD700)' : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' }}>
      {/* Main keep */}
      <rect x="35" y="30" width="50" height="60" fill="#8B7355" stroke="#5D4E37" strokeWidth="2"/>
      {/* Left tower */}
      <rect x="15" y="20" width="25" height="70" fill="#9D8B73" stroke="#5D4E37" strokeWidth="2"/>
      <polygon points="15,20 27.5,5 40,20" fill="#8B0000" stroke="#6B0000" strokeWidth="1"/>
      {/* Right tower */}
      <rect x="80" y="20" width="25" height="70" fill="#9D8B73" stroke="#5D4E37" strokeWidth="2"/>
      <polygon points="80,20 92.5,5 105,20" fill="#8B0000" stroke="#6B0000" strokeWidth="1"/>
      {/* Center tower */}
      <rect x="45" y="15" width="30" height="75" fill="#A89880" stroke="#5D4E37" strokeWidth="2"/>
      <polygon points="45,15 60,0 75,15" fill="#FFD700" stroke="#DAA520" strokeWidth="1"/>
      {/* Flag */}
      <line x1="60" y1="0" x2="60" y2="-15" stroke="#5D4E37" strokeWidth="2"/>
      <polygon points="60,-15 75,-10 60,-5" fill="#FF0000"/>
      {/* Door */}
      <path d="M 50 90 L 50 65 Q 60 55 70 65 L 70 90 Z" fill="#3D2817"/>
      {/* Windows */}
      <rect x="22" y="35" width="10" height="15" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1"/>
      <rect x="88" y="35" width="10" height="15" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1"/>
      <rect x="55" y="30" width="10" height="12" fill="#87CEEB" stroke="#5D4E37" strokeWidth="1"/>
      {/* Battlements */}
      {[20, 28, 85, 93].map((x, i) => (
        <rect key={i} x={x} y="15" width="5" height="8" fill="#9D8B73" stroke="#5D4E37" strokeWidth="1"/>
      ))}
      {[38, 48, 64, 74].map((x, i) => (
        <rect key={i} x={x} y="25" width="5" height="8" fill="#8B7355" stroke="#5D4E37" strokeWidth="1"/>
      ))}
    </svg>
  );
}

// Tower - Math dungeon in mountains
function TowerBuilding() {
  return (
    <svg width="60" height="90" viewBox="0 0 60 90" style={{ opacity: 0.6, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
      <rect x="15" y="20" width="30" height="65" fill="#7D7D8D" stroke="#4D4D5D" strokeWidth="2"/>
      <polygon points="10,20 30,0 50,20" fill="#4A5568" stroke="#2D3748" strokeWidth="1"/>
      <rect x="22" y="70" width="16" height="15" fill="#2D1810" rx="8" ry="0"/>
      <rect x="20" y="30" width="8" height="12" fill="#87CEEB" stroke="#4D4D5D" strokeWidth="1"/>
      <rect x="32" y="30" width="8" height="12" fill="#87CEEB" stroke="#4D4D5D" strokeWidth="1"/>
      <rect x="26" y="50" width="8" height="10" fill="#87CEEB" stroke="#4D4D5D" strokeWidth="1"/>
      {/* Spiral decoration */}
      <ellipse cx="30" cy="15" rx="3" ry="3" fill="#FFD700"/>
    </svg>
  );
}

// Temple - Physics dungeon
function TempleBuilding() {
  return (
    <svg width="80" height="70" viewBox="0 0 80 70" style={{ opacity: 0.6, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
      <polygon points="40,5 75,25 5,25" fill="#E8E0D0" stroke="#B8A888" strokeWidth="2"/>
      <rect x="10" y="25" width="60" height="40" fill="#D8CCA8" stroke="#B8A888" strokeWidth="2"/>
      {/* Columns */}
      {[15, 28, 42, 55].map((x, i) => (
        <rect key={i} x={x} y="28" width="8" height="35" fill="#F0E8D8" stroke="#B8A888" strokeWidth="1"/>
      ))}
      <rect x="30" y="45" width="20" height="20" fill="#3D2817"/>
      {/* Energy symbol */}
      <circle cx="40" cy="15" r="5" fill="#00BFFF" opacity="0.8"/>
      <path d="M 38 12 L 42 15 L 38 18" stroke="#fff" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

// Cabin - Chemistry dungeon in forest
function CabinBuilding() {
  return (
    <svg width="60" height="55" viewBox="0 0 60 55" style={{ opacity: 0.6, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
      <polygon points="30,5 55,25 5,25" fill="#6B4423" stroke="#4A2F17" strokeWidth="2"/>
      <rect x="10" y="25" width="40" height="25" fill="#8B6914" stroke="#6B4423" strokeWidth="2"/>
      <rect x="22" y="35" width="16" height="15" fill="#3D2817"/>
      <rect x="15" y="30" width="8" height="8" fill="#87CEEB" stroke="#6B4423" strokeWidth="1"/>
      <rect x="37" y="30" width="8" height="8" fill="#87CEEB" stroke="#6B4423" strokeWidth="1"/>
      {/* Chimney with smoke */}
      <rect x="40" y="8" width="8" height="17" fill="#8B4513"/>
      <ellipse cx="44" cy="5" rx="4" ry="3" fill="#aaa" opacity="0.5"/>
      <ellipse cx="46" cy="2" rx="3" ry="2" fill="#aaa" opacity="0.3"/>
    </svg>
  );
}

// Mine entrance - History dungeon
function MineBuilding() {
  return (
    <svg width="70" height="60" viewBox="0 0 70 60" style={{ opacity: 0.6, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
      {/* Rock formation */}
      <ellipse cx="35" cy="50" rx="32" ry="15" fill="#5D4E37"/>
      <ellipse cx="35" cy="45" rx="25" ry="12" fill="#4D3E27"/>
      {/* Mine entrance */}
      <path d="M 20 55 L 20 35 Q 35 25 50 35 L 50 55 Z" fill="#1a1a1a"/>
      <path d="M 22 55 L 22 36 Q 35 28 48 36 L 48 55 Z" fill="#0a0a0a"/>
      {/* Wooden frame */}
      <rect x="18" y="30" width="4" height="25" fill="#8B4513"/>
      <rect x="48" y="30" width="4" height="25" fill="#8B4513"/>
      <rect x="18" y="28" width="34" height="4" fill="#8B4513"/>
      {/* Lantern */}
      <circle cx="35" cy="38" r="4" fill="#FFD700" opacity="0.6"/>
      {/* Cart tracks */}
      <line x1="25" y1="55" x2="25" y2="60" stroke="#5D4E37" strokeWidth="2"/>
      <line x1="45" y1="55" x2="45" y2="60" stroke="#5D4E37" strokeWidth="2"/>
    </svg>
  );
}

// Fortress - Biology dungeon
function FortressBuilding() {
  return (
    <svg width="90" height="65" viewBox="0 0 90 65" style={{ opacity: 0.6, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
      <rect x="5" y="25" width="80" height="35" fill="#6B7B6B" stroke="#4B5B4B" strokeWidth="2"/>
      {/* Towers */}
      <rect x="0" y="15" width="20" height="45" fill="#7B8B7B" stroke="#4B5B4B" strokeWidth="2"/>
      <rect x="70" y="15" width="20" height="45" fill="#7B8B7B" stroke="#4B5B4B" strokeWidth="2"/>
      {/* Battlements */}
      {[3, 12, 73, 82].map((x, i) => (
        <rect key={i} x={x} y="10" width="5" height="8" fill="#7B8B7B" stroke="#4B5B4B" strokeWidth="1"/>
      ))}
      {[15, 30, 50, 65].map((x, i) => (
        <rect key={i} x={x} y="20" width="5" height="8" fill="#6B7B6B" stroke="#4B5B4B" strokeWidth="1"/>
      ))}
      {/* Gate */}
      <rect x="32" y="40" width="26" height="20" fill="#3B2B1B"/>
      {/* Vines */}
      <path d="M 5 30 Q 10 35 8 45" stroke="#228B22" strokeWidth="2" fill="none"/>
      <path d="M 85 25 Q 80 35 82 50" stroke="#228B22" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function BuildingComponent({ building, glow }: { building: DungeonLocation['building']; glow?: boolean }) {
  switch (building) {
    case 'castle': return <CastleBuilding glow={glow} />;
    case 'tower': return <TowerBuilding />;
    case 'temple': return <TempleBuilding />;
    case 'cabin': return <CabinBuilding />;
    case 'mine': return <MineBuilding />;
    case 'fortress': return <FortressBuilding />;
  }
}

function DungeonMarker({ location, onClick }: { location: DungeonLocation; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${location.x}%`,
        top: `${location.y}%`,
        transform: 'translate(-50%, -80%)',
        cursor: location.available ? 'pointer' : 'not-allowed',
        zIndex: isHovered ? 100 : (location.isDaily ? 50 : 10),
      }}
      onClick={location.available ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        transform: isHovered && location.available ? 'scale(1.15) translateY(-5px)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}>
        <BuildingComponent building={location.building} glow={location.isDaily && isHovered} />
      </div>

      {/* Label */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '-5px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        {location.isDaily && (
          <div style={{
            backgroundColor: '#FFD700',
            color: '#000',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '4px',
            display: 'inline-block',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            animation: 'pulse 2s infinite',
          }}>
            DAILY DUNGEON
          </div>
        )}
        <div style={{
          color: location.available ? '#fff' : '#aaa',
          fontSize: location.isDaily ? '16px' : '13px',
          fontWeight: 700,
          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
        }}>
          {location.name}
        </div>
        <div style={{
          color: location.available ? '#ddd' : '#888',
          fontSize: '11px',
          fontWeight: 500,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        }}>
          {location.description}
        </div>
      </div>

      {/* Unavailable tooltip */}
      {isHovered && !location.available && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.95)',
          border: '2px solid #ff6b6b',
          borderRadius: '6px',
          padding: '8px 14px',
          whiteSpace: 'nowrap',
          fontSize: '13px',
          color: '#ff6b6b',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          🔒 Bald verfügbar...
        </div>
      )}
    </div>
  );
}

// Landscape SVG elements
function Mountains() {
  return (
    <g>
      {/* Back mountains - lighter */}
      <polygon points="0,35 15,15 30,35" fill="#6B7B8B"/>
      <polygon points="20,35 40,10 60,35" fill="#7B8B9B"/>
      <polygon points="50,35 70,8 90,35" fill="#6B7B8B"/>
      <polygon points="80,35 95,18 100,35" fill="#7B8B9B"/>
      {/* Snow caps */}
      <polygon points="15,15 20,22 10,22" fill="#fff"/>
      <polygon points="40,10 47,20 33,20" fill="#fff"/>
      <polygon points="70,8 78,18 62,18" fill="#fff"/>
      {/* Front mountains - darker */}
      <polygon points="5,40 25,20 45,40" fill="#5B6B7B"/>
      <polygon points="55,40 80,15 100,40" fill="#4B5B6B"/>
      <polygon points="75,18 82,12 89,18" fill="#fff" opacity="0.8"/>
    </g>
  );
}

function Trees({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Pine tree cluster */}
      <polygon points="0,20 5,0 10,20" fill="#2D5A27"/>
      <polygon points="0,25 5,8 10,25" fill="#1D4A17"/>
      <rect x="3" y="20" width="4" height="6" fill="#5D3A1A"/>
    </g>
  );
}

function ForestArea({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const trees: Array<{ tx: number; ty: number; s: number }> = [];
  for (let i = 0; i < 15; i++) {
    trees.push({
      tx: x + Math.random() * width,
      ty: y + Math.random() * height,
      s: 0.6 + Math.random() * 0.5,
    });
  }
  return (
    <g>
      {trees.map((t, i) => (
        <Trees key={i} x={t.tx} y={t.ty} scale={t.s} />
      ))}
    </g>
  );
}

function River() {
  return (
    <g>
      <path
        d="M 0 55 Q 10 52 20 55 Q 30 58 40 54 Q 50 50 55 52 Q 60 54 65 52"
        stroke="#4A90B8"
        strokeWidth="3"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M 0 55 Q 10 52 20 55 Q 30 58 40 54 Q 50 50 55 52 Q 60 54 65 52"
        stroke="#6AB0D8"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </g>
  );
}

function Rocks({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="5" rx="8" ry="5" fill="#6B6B6B"/>
      <ellipse cx="10" cy="6" rx="6" ry="4" fill="#7B7B7B"/>
      <ellipse cx="5" cy="3" rx="5" ry="3" fill="#8B8B8B"/>
    </g>
  );
}

function Path() {
  return (
    <g>
      {/* Main road from bottom to castle */}
      <path
        d="M 50 100 Q 50 90 48 80 Q 45 70 50 60 Q 55 50 50 45"
        stroke="#8B7355"
        strokeWidth="2.5"
        fill="none"
        opacity="0.6"
        strokeDasharray="4,2"
      />
      {/* Branches to other dungeons */}
      <path d="M 48 70 Q 35 60 20 45" stroke="#6B5335" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2"/>
      <path d="M 52 60 Q 65 50 75 35" stroke="#6B5335" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2"/>
      <path d="M 45 75 Q 30 75 15 70" stroke="#6B5335" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2"/>
      <path d="M 55 70 Q 70 75 82 75" stroke="#6B5335" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2"/>
      <path d="M 50 80 Q 52 85 55 85" stroke="#6B5335" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="3,2"/>
    </g>
  );
}

function Landscape() {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Grass gradient */}
        <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4A7C3F"/>
          <stop offset="50%" stopColor="#3D6B32"/>
          <stop offset="100%" stopColor="#2D5A27"/>
        </linearGradient>
        {/* Sky gradient */}
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2a4a"/>
          <stop offset="40%" stopColor="#2a4a6a"/>
          <stop offset="100%" stopColor="#4a7a8a"/>
        </linearGradient>
        {/* Mountain area gradient */}
        <linearGradient id="mountainArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5B6B7B"/>
          <stop offset="100%" stopColor="#4A7C3F"/>
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="100" height="40" fill="url(#skyGradient)"/>

      {/* Stars */}
      {[
        [10, 8], [25, 5], [45, 10], [60, 6], [78, 12], [90, 8], [15, 15], [55, 3], [85, 18]
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r="0.3" fill="#fff" opacity="0.6"/>
      ))}

      {/* Moon */}
      <circle cx="85" cy="12" r="4" fill="#F0E68C" opacity="0.9"/>
      <circle cx="86" cy="11" r="3.5" fill="url(#skyGradient)"/>

      {/* Mountains in background */}
      <Mountains />

      {/* Main grass area */}
      <rect x="0" y="35" width="100" height="65" fill="url(#grassGradient)"/>

      {/* Grass texture */}
      {Array.from({ length: 50 }).map((_, i) => (
        <line
          key={i}
          x1={Math.random() * 100}
          y1={40 + Math.random() * 55}
          x2={Math.random() * 100 + 0.5}
          y2={38 + Math.random() * 55}
          stroke="#2D5A27"
          strokeWidth="0.3"
          opacity="0.3"
        />
      ))}

      {/* River */}
      <River />

      {/* Forest areas */}
      <ForestArea x={5} y={55} width={20} height={15} />
      <ForestArea x={75} y={45} width={15} height={12} />
      <ForestArea x={60} y={75} width={18} height={10} />

      {/* Scattered trees */}
      <Trees x={35} y={60} scale={0.8} />
      <Trees x={70} y={55} scale={0.7} />
      <Trees x={25} y={75} scale={0.9} />
      <Trees x={45} y={85} scale={0.6} />

      {/* Rocky areas near mountain base and cave */}
      <Rocks x={15} y={38} />
      <Rocks x={78} y={40} />
      <Rocks x={80} y={65} />

      {/* Paths */}
      <Path />

      {/* Cave entrance area (darker) */}
      <ellipse cx="82" cy="72" rx="8" ry="5" fill="#3D3020" opacity="0.6"/>
    </svg>
  );
}

export default function DungeonSelectMenu({ onSelectDungeon, onBack }: DungeonSelectMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        animation: 'mapFadeIn 0.5s ease-out',
        zIndex: 1000,
      }}
    >
      {/* Landscape background */}
      <Landscape />

      {/* Dungeon locations */}
      {dungeonLocations.map((location) => (
        <DungeonMarker
          key={location.id}
          location={location}
          onClick={() => onSelectDungeon(location.id)}
        />
      ))}

      {/* Title banner */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(30, 20, 10, 0.9)',
          border: '3px solid #8B7355',
          borderRadius: '8px',
          padding: '12px 30px',
          zIndex: 200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          color: '#FFD700',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '4px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          WELTKARTE
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 40px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#FFD700',
          backgroundColor: 'rgba(30, 20, 10, 0.9)',
          border: '3px solid #8B7355',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(60, 40, 20, 0.95)';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(30, 20, 10, 0.9)';
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
        }}
      >
        ← Zurück zum Login
      </button>

      {/* Compass */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        width: '70px',
        height: '70px',
        zIndex: 150,
        opacity: 0.7,
      }}>
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="rgba(30,20,10,0.8)" stroke="#8B7355" strokeWidth="3"/>
          <polygon points="50,15 55,45 50,40 45,45" fill="#FFD700"/>
          <polygon points="50,85 55,55 50,60 45,55" fill="#8B7355"/>
          <polygon points="15,50 45,45 40,50 45,55" fill="#8B7355"/>
          <polygon points="85,50 55,45 60,50 55,55" fill="#8B7355"/>
          <text x="50" y="12" textAnchor="middle" fontSize="10" fill="#FFD700" fontWeight="bold">N</text>
          <text x="50" y="95" textAnchor="middle" fontSize="8" fill="#8B7355">S</text>
          <text x="8" y="53" textAnchor="middle" fontSize="8" fill="#8B7355">W</text>
          <text x="92" y="53" textAnchor="middle" fontSize="8" fill="#8B7355">O</text>
        </svg>
      </div>

      {/* Instructions hint */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        backgroundColor: 'rgba(30, 20, 10, 0.8)',
        border: '2px solid #5D4E37',
        borderRadius: '6px',
        padding: '10px 15px',
        color: '#aaa',
        fontSize: '13px',
        zIndex: 150,
      }}>
        Klicke auf ein Gebäude, um das Dungeon zu betreten
      </div>

      <style jsx>{`
        @keyframes mapFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  );
}
