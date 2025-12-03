import { useEffect, useRef, useCallback } from 'react';
import { getFootstepManager, disposeFootstepManager } from '@/lib/audio';
import type { Player } from '@/lib/enemy/types';
import type { Enemy } from '@/lib/enemy/Enemy';

interface UseFootstepsProps {
  enabled?: boolean;
}

export function useFootsteps({ enabled = true }: UseFootstepsProps = {}) {
  const isInitializedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  // Initialize audio on first user interaction
  const handleUserInteraction = useCallback(async () => {
    if (hasUserInteractedRef.current) return;
    hasUserInteractedRef.current = true;

    const manager = getFootstepManager();
    await manager.initialize();
    await manager.resume();
    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Listen for any user interaction to enable audio
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
      disposeFootstepManager();
    };
  }, [enabled, handleUserInteraction]);

  /**
   * Update footsteps - call this from the game loop
   */
  const updateFootsteps = useCallback((
    player: Player,
    enemies: Enemy[],
    tileSize: number
  ) => {
    if (!enabled || !isInitializedRef.current) return;

    const manager = getFootstepManager();
    const currentTime = performance.now() / 1000; // Convert to seconds
    manager.update(player, enemies, tileSize, currentTime);
  }, [enabled]);

  return {
    updateFootsteps,
    isInitialized: isInitializedRef.current
  };
}
