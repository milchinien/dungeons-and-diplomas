import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { type StorageService, defaultStorage } from '@/lib/storage';
import { logHookError } from '@/lib/hooks';

interface UseAuthOptions {
  /** Storage service for persistence (defaults to localStorage) */
  storage?: StorageService;
}

export function useAuth(options: UseAuthOptions = {}) {
  const storage = options.storage ?? defaultStorage;

  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userXp, setUserXp] = useState<number>(0);
  const [showLogin, setShowLogin] = useState(true);

  // Check storage for existing user on mount and reload XP from server
  useEffect(() => {
    const storedUserId = storage.get('userId');
    const storedUsername = storage.get('username');

    if (storedUserId && storedUsername) {
      const id = parseInt(storedUserId, 10);
      setUserId(id);
      setUsername(storedUsername);
      setShowLogin(false);

      // Reload XP from server on mount (e.g. after page refresh)
      api.auth.login(storedUsername).then(userData => {
        setUserXp(userData.xp || 0);
      }).catch(err => {
        logHookError('useAuth', err, 'Failed to reload user XP');
      });
    }
  }, []);

  const handleLogin = async (id: number, name: string, xp?: number) => {
    setUserId(id);
    setUsername(name);
    setUserXp(xp || 0);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    storage.remove('userId');
    storage.remove('username');
    setUserId(null);
    setUsername(null);
    setUserXp(0);
    setShowLogin(true);
  };

  return {
    userId,
    username,
    userXp,
    setUserXp,
    showLogin,
    handleLogin,
    handleLogout
  };
}
