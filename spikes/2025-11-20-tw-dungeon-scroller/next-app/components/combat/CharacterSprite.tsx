'use client';

import { useEffect, useRef, useState } from 'react';
import { SpriteSheetLoader } from '@/lib/SpriteSheetLoader';
import { DIRECTION, ANIMATION } from '@/lib/constants';

interface CharacterSpriteProps {
  isPlayer: boolean;
  isAttacking?: boolean;
  isHurt?: boolean;
  isDead?: boolean;
}

export default function CharacterSprite({ isPlayer, isAttacking, isHurt, isDead }: CharacterSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<SpriteSheetLoader | null>(null);
  const [loaded, setLoaded] = useState(false);
  const animationFrameRef = useRef<number>();

  // Load sprite
  useEffect(() => {
    const loadSprite = async () => {
      const spriteName = isPlayer ? 'player' : 'goblin';
      const sprite = new SpriteSheetLoader(spriteName);
      await sprite.load();

      // Set initial animation based on state
      sprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);

      spriteRef.current = sprite;
      setLoaded(true);
    };

    loadSprite();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayer]);

  // Update animation based on state
  useEffect(() => {
    if (!loaded || !spriteRef.current) return;

    if (isDead) {
      // Death animation - play once and stop on last frame
      spriteRef.current.stopOnLastFrame = true;
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
    } else if (isAttacking) {
      // Combat animation - use SLASH for attack
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.playAnimation(isPlayer ? DIRECTION.RIGHT : DIRECTION.LEFT, ANIMATION.SLASH);
    } else if (isHurt) {
      // Damage animation - use HURT
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
    } else {
      // Idle animation
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
    }
  }, [isAttacking, isHurt, isDead, loaded, isPlayer]);

  // Animation loop
  useEffect(() => {
    if (!loaded || !spriteRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const animate = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (spriteRef.current) {
        spriteRef.current.update(dt);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw sprite centered
        spriteRef.current.draw(ctx, 0, 0, canvas.width, canvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loaded]);

  // Calculate animation styles
  const getAnimationStyle = () => {
    if (isDead) {
      return {
        opacity: 1,
        transition: 'opacity 0.5s ease'
      };
    }

    if (isPlayer) {
      if (isAttacking) {
        return {
          transform: 'translateX(30px)',
          transition: 'transform 0.3s ease'
        };
      } else if (isHurt) {
        return {
          animation: 'playerHurt 0.4s ease'
        };
      }
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease'
      };
    } else {
      // Enemy (Goblin)
      if (isAttacking) {
        return {
          transform: 'translateX(-30px)',
          transition: 'transform 0.3s ease'
        };
      } else if (isHurt) {
        return {
          animation: 'enemyHurt 0.4s ease'
        };
      }
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease'
      };
    }
  };

  return (
    <>
      <div style={{
        width: '320px',
        height: '320px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: '180px',
        ...(isPlayer ? { left: '120px' } : { right: '120px' }),
        filter: 'drop-shadow(6px 6px 12px rgba(0, 0, 0, 0.6))',
        zIndex: 10,
        ...getAnimationStyle()
      }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{
            width: '300px',
            height: '300px',
            imageRendering: 'pixelated'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes enemyHurt {
          0% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-15px) scale(0.95); }
          50% { transform: translateX(15px) scale(0.95); }
          75% { transform: translateX(-15px) scale(1); }
          100% { transform: translateX(0) scale(1); }
        }

        @keyframes playerHurt {
          0% { transform: translateX(0) scale(1); }
          25% { transform: translateX(15px) scale(0.95); }
          50% { transform: translateX(-15px) scale(0.95); }
          75% { transform: translateX(15px) scale(1); }
          100% { transform: translateX(0) scale(1); }
        }
      `}</style>
    </>
  );
}
