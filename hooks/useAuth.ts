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

  // Always show login on mount - user must enter username each time
  // Storage is only used to remember the username for convenience
  useEffect(() => {
    // Keep showLogin true - user must always log in
    setShowLogin(true);
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
