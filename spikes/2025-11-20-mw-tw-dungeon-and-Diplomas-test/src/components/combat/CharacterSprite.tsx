import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { SpriteSheetLoader } from '../../lib/SpriteSheetLoader';
import { DIRECTION, ANIMATION } from '../../lib/constants';

interface CharacterSpriteProps {
  isPlayer: boolean;
  isAttacking?: boolean;
  isHurt?: boolean;
}

const SpriteContainer = styled(motion.div)<{ $isPlayer: boolean }>`
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 30px;
  ${(props) => (props.$isPlayer ? 'left: 80px;' : 'right: 80px;')}
  filter: drop-shadow(6px 6px 12px rgba(0, 0, 0, 0.6));
`;

const SpriteCanvas = styled.canvas`
  width: 300px;
  height: 300px;
  image-rendering: pixelated;
`;

export function CharacterSprite({ isPlayer, isAttacking, isHurt }: CharacterSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<SpriteSheetLoader | null>(null);
  const [loaded, setLoaded] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const loadSprite = async () => {
      const spriteName = isPlayer ? 'player' : 'goblin';
      const sprite = new SpriteSheetLoader(spriteName);
      await sprite.load();

      // Set initial animation based on state
      if (isAttacking) {
        sprite.playAnimation(DIRECTION.RIGHT, ANIMATION.RUN);
      } else if (isHurt) {
        sprite.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
      } else {
        sprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
      }

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

  useEffect(() => {
    if (!loaded || !spriteRef.current) return;

    // Update animation based on state
    if (isAttacking) {
      spriteRef.current.playAnimation(DIRECTION.RIGHT, ANIMATION.RUN);
    } else if (isHurt) {
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.HURT);
    } else {
      spriteRef.current.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
    }
  }, [isAttacking, isHurt, loaded]);

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

  if (isPlayer) {
    return (
      <SpriteContainer
        $isPlayer={isPlayer}
        animate={{
          x: isAttacking ? 30 : 0,
          rotate: isHurt ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <SpriteCanvas ref={canvasRef} width={300} height={300} />
      </SpriteContainer>
    );
  }

  // Enemy (Goblin)
  return (
    <SpriteContainer
      $isPlayer={isPlayer}
      animate={{
        x: isHurt ? [-15, 15, -15, 0] : 0,
        scale: isHurt ? [1, 0.95, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <SpriteCanvas ref={canvasRef} width={300} height={300} />
    </SpriteContainer>
  );
}
