'use client';

import { useEffect, useRef, useState } from 'react';
import { SpriteSheetLoader } from '@/lib/SpriteSheetLoader';
import { DIRECTION, ANIMATION } from '@/lib/constants';
import { getContext2D } from '@/lib/rendering/canvasUtils';

interface CharacterSpriteProps {
  isPlayer: boolean;
  enemyType?: string;
  isAttacking?: boolean;
  isHurt?: boolean;
  isDead?: boolean;
}

export default function CharacterSprite({ isPlayer, isAttacking, isHurt, isDead, enemyType }: CharacterSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<SpriteSheetLoader | null>(null);
  const [loaded, setLoaded] = useState(false);
  const animationFrameRef = useRef<number>();

  // Load sprite
  useEffect(() => {
    const loadSprite = async () => {
      const spriteName = isPlayer ? 'player' : (enemyType || 'goblin');
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
  }, [isPlayer, enemyType]);

  // Update animation based on state
  useEffect(() => {
    if (!loaded || !spriteRef.current) return;

    if (isDead) {
      // Death animation - play ALL frames and stop on last frame
      spriteRef.current.stopOnLastFrame = true;
      spriteRef.current.maxFrame = null; // Use all frames for death
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
    } else if (isAttacking) {
      // Combat animation - use SLASH for attack
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.maxFrame = null;
      spriteRef.current.playAnimation(isPlayer ? DIRECTION.RIGHT : DIRECTION.LEFT, ANIMATION.SLASH);
    } else if (isHurt) {
      // Damage animation - use HURT but skip last 2 frames (death frames)
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.maxFrame = 4; // Only play first 4 frames (hurt has 6, last 2 are death)
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
    } else {
      // Idle animation
      spriteRef.current.stopOnLastFrame = false;
      spriteRef.current.maxFrame = null;
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
    }
  }, [isAttacking, isHurt, isDead, loaded, isPlayer]);

  // Animation loop
  useEffect(() => {
    if (!loaded || !spriteRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = getContext2D(canvas);
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
  // Attacker moves to the edge of the defender's sprite box, then retreats
  // Sprite box is 320px wide, so attacker needs to close the gap until boxes almost touch
  const getAnimationStyle = () => {
    if (isPlayer) {
      if (isDead) {
        // Move to combat position for death animation
        return {
          transform: 'translateX(calc(-50% + 15vw - 170px))',
          opacity: 1,
          transition: 'transform 0.2s ease-out, opacity 0.5s ease'
        };
      }
      if (isAttacking) {
        // Move right until sprite boxes almost touch
        // Gap is 30vw, sprites are 320px each, leave 20px gap
        return {
          transform: 'translateX(calc(-50% + 30vw - 340px))',
          transition: 'transform 0.2s ease-out'
        };
      } else if (isHurt) {
        // Move toward attacker (half the distance)
        return {
          transform: 'translateX(calc(-50% + 15vw - 170px))',
          transition: 'transform 0.2s ease-out'
        };
      }
      return {
        transform: 'translateX(-50%)',
        transition: 'transform 0.25s ease-out'
      };
    } else {
      if (isDead) {
        // Move to combat position for death animation
        return {
          transform: 'translateX(calc(50% - 15vw + 170px))',
          opacity: 1,
          transition: 'transform 0.2s ease-out, opacity 0.5s ease'
        };
      }
      if (isAttacking) {
        // Move left until sprite boxes almost touch
        // Gap is 30vw, sprites are 320px each, leave 20px gap
        return {
          transform: 'translateX(calc(50% - 30vw + 340px))',
          transition: 'transform 0.2s ease-out'
        };
      } else if (isHurt) {
        // Move toward attacker (half the distance)
        return {
          transform: 'translateX(calc(50% - 15vw + 170px))',
          transition: 'transform 0.2s ease-out'
        };
      }
      return {
        transform: 'translateX(50%)',
        transition: 'transform 0.25s ease-out'
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
        // Position characters at 35% from each side (closer together)
        ...(isPlayer ? { left: '35%' } : { right: '35%' }),
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
          0% { transform: translateX(50%) scale(1); }
          20% { transform: translateX(calc(50% + 5px)) scale(0.98); }
          40% { transform: translateX(calc(50% - 5px)) scale(0.98); }
          60% { transform: translateX(calc(50% + 3px)) scale(0.99); }
          80% { transform: translateX(calc(50% - 3px)) scale(1); }
          100% { transform: translateX(50%) scale(1); }
        }

        @keyframes playerHurt {
          0% { transform: translateX(-50%) scale(1); }
          20% { transform: translateX(calc(-50% - 5px)) scale(0.98); }
          40% { transform: translateX(calc(-50% + 5px)) scale(0.98); }
          60% { transform: translateX(calc(-50% - 3px)) scale(0.99); }
          80% { transform: translateX(calc(-50% + 3px)) scale(1); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </>
  );
}
