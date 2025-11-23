'use client';

import { useEffect, useRef, useState } from 'react';
import type { TileTheme } from '@/lib/tiletheme/types';
import { ThemeLoader } from '@/lib/tiletheme/ThemeLoader';

interface UseFallbackThemeResult {
  theme: TileTheme | null;
  isLoaded: boolean;
}

export function useFallbackTheme(skipLoading: boolean): UseFallbackThemeResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const themeRef = useRef<TileTheme | null>(null);

  useEffect(() => {
    if (skipLoading) return;

    const loadFallbackTheme = async () => {
      const result = await ThemeLoader.loadTheme(1);

      if (result) {
        themeRef.current = result.theme;
        setIsLoaded(true);
      } else {
        console.warn('Failed to load fallback theme for combat view');
      }
    };

    loadFallbackTheme();
  }, [skipLoading]);

  return {
    theme: themeRef.current,
    isLoaded
  };
}
