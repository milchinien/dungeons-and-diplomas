import { useState } from 'react';
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
  const [userGold, setUserGold] = useState<number>(0);
  // Always show login on mount - user must enter username each time
  // Storage is only used to remember the username for convenience
  const [showLogin, setShowLogin] = useState(true);

  const handleLogin = async (id: number, name: string, xp?: number, gold?: number) => {
    setUserId(id);
    setUsername(name);
    setUserXp(xp || 0);
    setUserGold(gold || 0);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    storage.remove('userId');
    storage.remove('username');
    setUserId(null);
    setUsername(null);
    setUserXp(0);
    setUserGold(0);
    setShowLogin(true);
  };

  return {
    userId,
    username,
    userXp,
    setUserXp,
    userGold,
    setUserGold,
    showLogin,
    handleLogin,
    handleLogout
  };
}
