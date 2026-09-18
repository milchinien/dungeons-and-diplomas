'use client';

import { useState, useEffect } from 'react';
import GameOverlay from './GameOverlay';
import { COLORS } from '@/lib/ui/colors';
import type { AudioSettings } from '@/hooks/useAudioSettings';
import { getEffectsManager, type ParticleQuality, type EffectSettings } from '@/lib/effects';

interface OptionsMenuProps {
  settings: AudioSettings;
  onMasterVolumeChange: (value: number) => void;
  onMusicVolumeChange: (value: number) => void;
  onSfxVolumeChange: (value: number) => void;
  onBack: () => void;
}

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
}

const PARTICLE_QUALITY_OPTIONS: { value: ParticleQuality; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function VolumeSlider({ label, value, onChange, icon }: VolumeSliderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onChange(Math.round(percentage));
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const track = e.currentTarget.parentElement!;
    const rect = track.getBoundingClientRect();

    const handleMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onChange(Math.round(percentage));
    };

    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '450px',
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '24px',
        width: '32px',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{
        width: '80px',
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.text.primary,
        userSelect: 'none',
      }}>
        {label}
      </div>

      {/* Slider Track */}
      <div
        onClick={handleTrackClick}
        style={{
          width: '200px',
          height: '16px',
          backgroundColor: '#333',
          borderRadius: '8px',
          position: 'relative',
          cursor: 'pointer',
          border: `2px solid ${isDragging ? COLORS.gold : '#555'}`,
          boxSizing: 'border-box',
        }}
      >
        {/* Filled Track */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            height: '100%',
            width: `${value}%`,
            backgroundColor: COLORS.gold,
            borderRadius: '6px',
            pointerEvents: 'none',
          }}
        />

        {/* Slider Thumb */}
        <div
          onMouseDown={handleThumbMouseDown}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${value}%`,
            transform: 'translate(-50%, -50%)',
            width: '22px',
            height: '22px',
            backgroundColor: COLORS.gold,
            borderRadius: '50%',
            border: '3px solid #fff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 1,
          }}
        />
      </div>

      {/* Value Display */}
      <div style={{
        width: '45px',
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.gold,
        textAlign: 'right',
        userSelect: 'none',
      }}>
        {value}%
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: string;
}

function ToggleSwitch({ label, value, onChange, icon }: ToggleSwitchProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '450px',
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '24px',
        width: '32px',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{
        flex: 1,
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.text.primary,
        userSelect: 'none',
      }}>
        {label}
      </div>

      {/* Toggle */}
      <div
        onClick={() => onChange(!value)}
        style={{
          width: '56px',
          height: '28px',
          borderRadius: '14px',
          backgroundColor: value ? COLORS.gold : '#333',
          border: `2px solid ${value ? COLORS.gold : '#555'}`,
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: '2px',
            left: value ? '30px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        />
      </div>
    </div>
  );
}

interface QualitySelectorProps {
  label: string;
  value: ParticleQuality;
  onChange: (value: ParticleQuality) => void;
  icon: string;
}

function QualitySelector({ label, value, onChange, icon }: QualitySelectorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '450px',
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '24px',
        width: '32px',
        textAlign: 'center',
        userSelect: 'none',
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{
        width: '80px',
        fontSize: '18px',
        fontWeight: 600,
        color: COLORS.text.primary,
        userSelect: 'none',
      }}>
        {label}
      </div>

      {/* Quality Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
      }}>
        {PARTICLE_QUALITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              padding: '6px 14px',
              fontSize: '14px',
              fontWeight: 600,
              color: value === option.value ? '#000' : COLORS.text.secondary,
              backgroundColor: value === option.value ? COLORS.gold : '#333',
              border: `2px solid ${value === option.value ? COLORS.gold : '#555'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OptionsMenu({
  settings,
  onMasterVolumeChange,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onBack,
}: OptionsMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [effectSettings, setEffectSettings] = useState<EffectSettings>(() => {
    return getEffectsManager().getSettings();
  });

  const handleParticleQualityChange = (quality: ParticleQuality) => {
    getEffectsManager().setParticleQuality(quality);
    setEffectSettings(prev => ({ ...prev, particleQuality: quality }));
  };

  const handleScreenShakeChange = (enabled: boolean) => {
    getEffectsManager().setScreenShakeEnabled(enabled);
    setEffectSettings(prev => ({ ...prev, screenShakeEnabled: enabled }));
  };

  const handleTransitionsChange = (enabled: boolean) => {
    getEffectsManager().setTransitionsEnabled(enabled);
    setEffectSettings(prev => ({ ...prev, transitionsEnabled: enabled }));
  };

  return (
    <GameOverlay
      backgroundColor="rgba(0, 0, 0, 0.9)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'optionsFadeIn 0.2s ease-out',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '56px',
          fontWeight: 900,
          color: COLORS.gold,
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.9)',
          marginBottom: '40px',
          userSelect: 'none',
          letterSpacing: '6px',
        }}
      >
        OPTIONS
      </div>

      {/* Audio Section */}
      <div
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          border: `2px solid ${COLORS.border.gold}`,
          borderRadius: '12px',
          padding: '24px 40px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: COLORS.text.primary,
            marginBottom: '20px',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          Audio
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <VolumeSlider
            label="Master"
            icon="🔊"
            value={settings.masterVolume}
            onChange={onMasterVolumeChange}
          />
          <VolumeSlider
            label="Music"
            icon="🎵"
            value={settings.musicVolume}
            onChange={onMusicVolumeChange}
          />
          <VolumeSlider
            label="Effects"
            icon="👣"
            value={settings.sfxVolume}
            onChange={onSfxVolumeChange}
          />
        </div>
      </div>

      {/* Visual Effects Section */}
      <div
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          border: `2px solid ${COLORS.border.gold}`,
          borderRadius: '12px',
          padding: '24px 40px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: COLORS.text.primary,
            marginBottom: '20px',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          Visual Effects
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <QualitySelector
            label="Particles"
            icon="✨"
            value={effectSettings.particleQuality}
            onChange={handleParticleQualityChange}
          />
          <ToggleSwitch
            label="Screen Shake"
            icon="📳"
            value={effectSettings.screenShakeEnabled}
            onChange={handleScreenShakeChange}
          />
          <ToggleSwitch
            label="Room Transitions"
            icon="🚪"
            value={effectSettings.transitionsEnabled}
            onChange={handleTransitionsChange}
          />
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '200px',
          padding: '14px 40px',
          fontSize: '22px',
          fontWeight: 600,
          color: isHovered ? '#000' : '#fff',
          backgroundColor: isHovered ? COLORS.gold : 'transparent',
          border: `3px solid ${COLORS.gold}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          userSelect: 'none',
        }}
      >
        Back
      </button>

      <style jsx>{`
        @keyframes optionsFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </GameOverlay>
  );
}
