'use client';

import { useEffect, useState } from 'react';
import type { ComboTier } from '@/hooks/useCombo';

interface ComboDisplayProps {
  count: number;
  tier: ComboTier;
  isActive: boolean;
  damageBonus: number;
  timeRemaining: number;
  timerDuration: number;
}

/**
 * Combo display component
 * Shows "x3 KOMBO" text at bottom center with tier-based visual effects
 * Includes a timer bar that depletes as time runs out
 *
 * Tiers:
 * - none (0-2): Not displayed
 * - bronze (3-4): White text, light sway, 30s timer
 * - silver (5-7): Gold text, stronger sway, glow effect
 * - gold (8-9): Orange text, pulse + sway, particle effect
 * - legendary (10+): Rainbow text, strong pulse, flame aura, 10s timer
 */
export default function ComboDisplay({
  count,
  tier,
  isActive,
  damageBonus,
  timeRemaining,
  timerDuration
}: ComboDisplayProps) {
  const [showFlash, setShowFlash] = useState(false);

  // Flash effect when combo increases
  useEffect(() => {
    if (count >= 3) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  // Don't render if combo is not active
  if (!isActive) return null;

  // Calculate timer bar percentage
  const timerPercent = timerDuration > 0 ? (timeRemaining / timerDuration) * 100 : 0;

  // Timer bar color based on remaining time
  const getTimerBarColor = () => {
    if (timerPercent > 60) return '#4ade80'; // Green
    if (timerPercent > 30) return '#fbbf24'; // Yellow/Orange
    return '#ef4444'; // Red
  };

  // Urgency pulse when timer is low
  const isUrgent = timerPercent <= 30 && timerPercent > 0;

  return (
    <>
      <style jsx>{`
        @keyframes comboSway {
          0%, 100% { transform: translateX(-50%) rotate(-2deg); }
          50% { transform: translateX(-50%) rotate(2deg); }
        }

        @keyframes comboSwayStrong {
          0%, 100% { transform: translateX(-50%) rotate(-4deg) scale(1); }
          25% { transform: translateX(-50%) rotate(0deg) scale(1.05); }
          50% { transform: translateX(-50%) rotate(4deg) scale(1); }
          75% { transform: translateX(-50%) rotate(0deg) scale(1.05); }
        }

        @keyframes comboPulse {
          0%, 100% { transform: translateX(-50%) scale(1); filter: brightness(1); }
          50% { transform: translateX(-50%) scale(1.1); filter: brightness(1.3); }
        }

        @keyframes comboPulseStrong {
          0%, 100% { transform: translateX(-50%) scale(1) rotate(-3deg); filter: brightness(1); }
          25% { transform: translateX(-50%) scale(1.15) rotate(0deg); filter: brightness(1.5); }
          50% { transform: translateX(-50%) scale(1) rotate(3deg); filter: brightness(1); }
          75% { transform: translateX(-50%) scale(1.15) rotate(0deg); filter: brightness(1.5); }
        }

        @keyframes rainbowShift {
          0% { filter: hue-rotate(0deg) brightness(1.2); }
          25% { filter: hue-rotate(90deg) brightness(1.4); }
          50% { filter: hue-rotate(180deg) brightness(1.2); }
          75% { filter: hue-rotate(270deg) brightness(1.4); }
          100% { filter: hue-rotate(360deg) brightness(1.2); }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
          50% { box-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 0 80px currentColor; }
        }

        @keyframes flashIn {
          0% { transform: translateX(-50%) scale(1.5); opacity: 0.5; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.5); opacity: 0; }
        }

        @keyframes flameFlicker {
          0%, 100% { opacity: 0.8; transform: scaleY(1) translateY(0); }
          25% { opacity: 1; transform: scaleY(1.1) translateY(-2px); }
          50% { opacity: 0.9; transform: scaleY(0.95) translateY(1px); }
          75% { opacity: 1; transform: scaleY(1.05) translateY(-1px); }
        }

        @keyframes urgentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes timerBarShrink {
          from { width: 100%; }
          to { width: 0%; }
        }

        .combo-container {
          position: fixed;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 500;
          pointer-events: none;
          user-select: none;
        }

        .combo-text {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 4px;
          text-shadow:
            2px 2px 0 rgba(0, 0, 0, 0.8),
            -2px -2px 0 rgba(0, 0, 0, 0.8),
            2px -2px 0 rgba(0, 0, 0, 0.8),
            -2px 2px 0 rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .combo-number {
          font-size: 48px;
          line-height: 1;
        }

        .combo-label {
          font-size: 18px;
          letter-spacing: 6px;
        }

        .damage-bonus {
          font-size: 14px;
          margin-top: 4px;
          letter-spacing: 2px;
          opacity: 0.9;
        }

        .timer-container {
          margin-top: 8px;
          width: 150px;
          height: 8px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .timer-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s linear, background-color 0.3s ease;
        }

        .timer-bar.urgent {
          animation: urgentPulse 0.5s ease-in-out infinite;
        }

        /* Bronze tier (x3-x4): Simple white, light sway */
        .tier-bronze {
          color: #ffffff;
          animation: comboSway 1.5s ease-in-out infinite;
        }

        .tier-bronze .combo-text {
          text-shadow:
            2px 2px 0 rgba(0, 0, 0, 0.8),
            0 0 10px rgba(255, 255, 255, 0.3);
        }

        /* Silver tier (x5-x7): Gold, stronger sway, glow */
        .tier-silver {
          color: #ffd700;
          animation: comboSwayStrong 1s ease-in-out infinite;
        }

        .tier-silver .combo-text {
          text-shadow:
            2px 2px 0 rgba(0, 0, 0, 0.8),
            0 0 15px rgba(255, 215, 0, 0.6),
            0 0 30px rgba(255, 215, 0, 0.4);
        }

        /* Gold tier (x8-x9): Orange/red, pulse, particles */
        .tier-gold {
          color: #ff6b00;
          animation: comboPulse 0.6s ease-in-out infinite;
        }

        .tier-gold .combo-text {
          text-shadow:
            2px 2px 0 rgba(0, 0, 0, 0.8),
            0 0 20px rgba(255, 107, 0, 0.8),
            0 0 40px rgba(255, 50, 0, 0.5),
            0 0 60px rgba(255, 0, 0, 0.3);
        }

        /* Legendary tier (x10+): Rainbow, strong pulse, flame aura */
        .tier-legendary {
          color: #ff4444;
          animation: comboPulseStrong 0.5s ease-in-out infinite, rainbowShift 2s linear infinite;
        }

        .tier-legendary .combo-text {
          text-shadow:
            2px 2px 0 rgba(0, 0, 0, 0.8),
            0 0 25px currentColor,
            0 0 50px currentColor,
            0 0 75px currentColor;
        }

        .tier-legendary::before {
          content: '';
          position: absolute;
          top: -20px;
          left: -30px;
          right: -30px;
          bottom: -20px;
          background: radial-gradient(ellipse at center, rgba(255, 100, 0, 0.3) 0%, transparent 70%);
          animation: flameFlicker 0.3s ease-in-out infinite;
          z-index: -1;
          border-radius: 50%;
        }

        /* Flash animation when combo increases */
        .flash-in {
          animation: flashIn 0.3s ease-out;
        }

        /* Particle effects for gold+ tiers */
        .particles {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: particleFloat 1s ease-out infinite;
        }
      `}</style>

      <div className={`combo-container tier-${tier} ${showFlash ? 'flash-in' : ''}`}>
        <div className="combo-text">
          <span className="combo-number">x{count}</span>
          <span className="combo-label">COMBO</span>
          <span className="damage-bonus">+{damageBonus} Damage</span>

          {/* Timer Bar */}
          <div className="timer-container">
            <div
              className={`timer-bar ${isUrgent ? 'urgent' : ''}`}
              style={{
                width: `${timerPercent}%`,
                backgroundColor: getTimerBarColor()
              }}
            />
          </div>
        </div>

        {/* Particle effects for gold and legendary tiers */}
        {(tier === 'gold' || tier === 'legendary') && (
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  left: `${20 + i * 12}%`,
                  backgroundColor: tier === 'legendary' ? '#ff4444' : '#ff6b00',
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.8
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
