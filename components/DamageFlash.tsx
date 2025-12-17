'use client';

import { useEffect, useState } from 'react';

interface DamageFlashProps {
  /** Increment this to trigger a new flash */
  trigger: number;
  /** Duration of the flash in ms */
  duration?: number;
}

/**
 * Red screen flash + vignette + shake effect when player takes damage
 */
export default function DamageFlash({ trigger, duration = 300 }: DamageFlashProps) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (trigger === 0) return;

    // Start flash
    setVisible(true);
    setOpacity(0.5);

    // Screen shake animation
    let shakeCount = 0;
    const maxShakes = 6;
    const shakeInterval = setInterval(() => {
      if (shakeCount >= maxShakes) {
        setShakeOffset({ x: 0, y: 0 });
        clearInterval(shakeInterval);
        return;
      }

      // Decreasing intensity shake
      const intensity = 8 * (1 - shakeCount / maxShakes);
      setShakeOffset({
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity
      });
      shakeCount++;
    }, 30);

    // Fade out
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 50);

    // Hide completely
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearInterval(shakeInterval);
      setShakeOffset({ x: 0, y: 0 });
    };
  }, [trigger, duration]);

  // Apply shake to body
  useEffect(() => {
    if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
      document.body.style.transform = `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`;
    } else {
      document.body.style.transform = '';
    }
  }, [shakeOffset]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity,
        transition: `opacity ${duration - 50}ms ease-out`,
        // Red vignette effect - darker at edges
        background: `
          radial-gradient(
            ellipse at center,
            rgba(255, 0, 0, 0.1) 0%,
            rgba(255, 0, 0, 0.4) 50%,
            rgba(180, 0, 0, 0.7) 100%
          )
        `,
      }}
    />
  );
}
