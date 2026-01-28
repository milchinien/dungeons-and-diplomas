'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { RoomLayout } from '@/lib/roomlayouts/types';
import { TILE } from '@/lib/constants';

type SortField = 'name' | 'size' | 'difficulty';
type SortDirection = 'asc' | 'desc';
type RoomTypeFilter = 'all' | 'empty' | 'treasure' | 'combat' | 'shop' | 'any';

const FILTER_OPTIONS: { value: RoomTypeFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'empty', label: 'Leer' },
  { value: 'treasure', label: 'Schatz' },
  { value: 'combat', label: 'Kampf' },
  { value: 'shop', label: 'Shop' },
  { value: 'any', label: 'Any' },
];

export default function RoomLayoutGallery() {
  const router = useRouter();
  const [layouts, setLayouts] = useState<RoomLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>('all');

  useEffect(() => {
    const loadLayouts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/room-layouts');
        if (response.ok) {
          const data = await response.json();
          setLayouts(data);
        }
      } catch (error) {
        console.error('Failed to load layouts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLayouts();
  }, []);

  const sortedLayouts = useMemo(() => {
    const filtered = roomTypeFilter === 'all'
      ? layouts
      : layouts.filter((l) => l.roomType === roomTypeFilter);

    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'size':
          cmp = (a.width * a.height) - (b.width * b.height);
          break;
        case 'difficulty':
          cmp = a.difficulty - b.difficulty;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [layouts, sortField, sortDirection, roomTypeFilter]);

  const sortLabel = useMemo(() => {
    const labels: Record<SortField, string> = { name: 'Name', size: 'Größe', difficulty: 'Schwierigkeit' };
    return `${labels[sortField]} (${sortDirection === 'asc' ? 'A→Z' : 'Z→A'})`;
  }, [sortField, sortDirection]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Rajdhani, monospace',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        backgroundColor: '#222',
        borderBottom: '1px solid #333',
        flexShrink: 0
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0
        }}>
          Room Layout
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#333',
                color: '#ccc',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Rajdhani, monospace',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3a3a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#333'; }}
            >
              <span style={{ color: '#888' }}>↕</span> Sort
            </button>

            {sortOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: '8px',
                minWidth: '180px',
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                overflow: 'hidden'
              }}>
                {([
                  { field: 'name' as SortField, dir: 'asc' as SortDirection, label: 'Name (A→Z)' },
                  { field: 'name', dir: 'desc', label: 'Name (Z→A)' },
                  { field: 'size', dir: 'asc', label: 'Größe (Klein→Groß)' },
                  { field: 'size', dir: 'desc', label: 'Größe (Groß→Klein)' },
                  { field: 'difficulty', dir: 'asc', label: 'Schwierigkeit (1→10)' },
                  { field: 'difficulty', dir: 'desc', label: 'Schwierigkeit (10→1)' },
                ] as const).map((opt) => (
                  <button
                    key={`${opt.field}-${opt.dir}`}
                    onClick={() => {
                      setSortField(opt.field);
                      setSortDirection(opt.dir);
                      setSortOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: sortField === opt.field && sortDirection === opt.dir ? '#4a9eff22' : 'transparent',
                      color: sortField === opt.field && sortDirection === opt.dir ? '#4a9eff' : '#ccc',
                      border: 'none',
                      borderBottom: '1px solid #333',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Rajdhani, monospace',
                      fontSize: '13px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3a3a'; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        sortField === opt.field && sortDirection === opt.dir ? '#4a9eff22' : 'transparent';
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Button */}
          <button
            onClick={() => router.push('/room-editor/create')}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#4a9eff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(74, 158, 255, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3a8eef';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4a9eff';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.4)';
            }}
            title="Neuen Raum erstellen"
          >
            +
          </button>
        </div>
      </div>

      {/* Close sort dropdown on outside click */}
      {sortOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 5 }}
          onClick={() => setSortOpen(false)}
        />
      )}

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 32px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid #2a2a2a',
        flexShrink: 0,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '13px', color: '#666', marginRight: '4px' }}>Typ:</span>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoomTypeFilter(opt.value)}
            style={{
              padding: '6px 14px',
              backgroundColor: roomTypeFilter === opt.value ? '#4a9eff' : '#333',
              color: roomTypeFilter === opt.value ? '#fff' : '#999',
              border: roomTypeFilter === opt.value ? 'none' : '1px solid #444',
              borderRadius: '20px',
              cursor: 'pointer',
              fontFamily: 'Rajdhani, monospace',
              fontSize: '13px',
              fontWeight: roomTypeFilter === opt.value ? 'bold' : 'normal',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (roomTypeFilter !== opt.value) e.currentTarget.style.backgroundColor = '#3a3a3a';
            }}
            onMouseLeave={(e) => {
              if (roomTypeFilter !== opt.value) e.currentTarget.style.backgroundColor = '#333';
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            Laden...
          </div>
        ) : sortedLayouts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#666',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ fontSize: '48px', opacity: 0.3 }}>⬜</div>
            <div style={{ fontSize: '18px' }}>Keine Layouts vorhanden</div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              Klicke auf das "+" um einen neuen Raum zu erstellen
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            {sortedLayouts.map((layout) => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                onClick={() => router.push(`/room-editor/edit/${layout.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LayoutCardProps {
  layout: RoomLayout;
  onClick: () => void;
}

function LayoutCard({ layout, onClick }: LayoutCardProps) {
  const thumbnailSize = 180;
  const tileSize = Math.min(
    thumbnailSize / layout.width,
    thumbnailSize / layout.height
  );

  const typeColors: Record<string, string> = {
    empty: '#888',
    treasure: '#c8a415',
    combat: '#d44',
    shop: '#00CED1',
    any: '#666'
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        border: '1px solid #3a3a3a',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333';
        e.currentTarget.style.borderColor = '#4a9eff';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2a2a2a';
        e.currentTarget.style.borderColor = '#3a3a3a';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Preview Thumbnail */}
      <div style={{
        backgroundColor: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        height: '160px'
      }}>
        <svg
          width={thumbnailSize}
          height={thumbnailSize}
          style={{ maxHeight: '128px', maxWidth: '100%' }}
          viewBox={`0 0 ${layout.width * tileSize} ${layout.height * tileSize}`}
        >
          {layout.tileGrid.map((row, y) =>
            row.map((tile, x) => {
              let color = '#0a0a0a';
              if (tile === TILE.FLOOR) color = '#666';
              else if (tile === TILE.WALL) color = '#333';
              else if (tile === TILE.DOOR) color = '#4a9eff';

              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * tileSize}
                  y={y * tileSize}
                  width={tileSize}
                  height={tileSize}
                  fill={color}
                  stroke="#1a1a1a"
                  strokeWidth="0.5"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Info */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Name */}
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {layout.name}
        </div>

        {/* Metadata Row */}
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '13px',
          color: '#999'
        }}>
          <span>
            <span style={{ color: '#666', marginRight: '4px' }}>Typ</span>
            <span style={{ color: typeColors[layout.roomType] || '#888' }}>
              {layout.roomType.charAt(0).toUpperCase() + layout.roomType.slice(1)}
            </span>
          </span>
          <span>
            <span style={{ color: '#666', marginRight: '4px' }}>Größe</span>
            {layout.width}×{layout.height}
          </span>
        </div>

        {/* Door Badges */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {layout.doorPositions.north && <DoorBadge label="N" />}
          {layout.doorPositions.south && <DoorBadge label="S" />}
          {layout.doorPositions.east && <DoorBadge label="O" />}
          {layout.doorPositions.west && <DoorBadge label="W" />}
        </div>
      </div>
    </div>
  );
}

function DoorBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      backgroundColor: '#4a9eff33',
      color: '#4a9eff',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 'bold'
    }}>
      {label}
    </span>
  );
}
