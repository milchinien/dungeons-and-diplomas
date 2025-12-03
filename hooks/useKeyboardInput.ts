import { useRef, useEffect } from 'react';
import type { KeyboardState } from '@/lib/constants';
import type { EventTarget as GameEventTarget } from '@/lib/types/gameState';
import { defaultEventTarget } from '@/lib/types/gameState';

interface KeyboardInputConfig {
  /** Event target for keyboard events (default: window) */
  eventTarget?: GameEventTarget;
}

interface UseKeyboardInputResult {
  keysRef: React.MutableRefObject<KeyboardState>;
}

/**
 * Hook for managing keyboard input state.
 * Tracks the pressed/released state of movement keys (WASD + Arrow keys + Space).
 */
export function useKeyboardInput(config?: KeyboardInputConfig): UseKeyboardInputResult {
  const keysRef = useRef<KeyboardState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    ' ': false
  });

  useEffect(() => {
    const eventTarget = config?.eventTarget ?? defaultEventTarget;

    const handleKeyDown = (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key in keysRef.current) {
        keysRef.current[key as keyof KeyboardState] = true;
      }
    };

    const handleKeyUp = (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key in keysRef.current) {
        keysRef.current[key as keyof KeyboardState] = false;
      }
    };

    eventTarget.addEventListener('keydown', handleKeyDown);
    eventTarget.addEventListener('keyup', handleKeyUp);

    return () => {
      eventTarget.removeEventListener('keydown', handleKeyDown);
      eventTarget.removeEventListener('keyup', handleKeyUp);
    };
  }, [config?.eventTarget]);

  return { keysRef };
}
