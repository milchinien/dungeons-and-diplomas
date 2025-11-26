/**
 * Storage service interface for abstracting storage operations.
 * Enables dependency injection for testing.
 */
export interface StorageService {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/**
 * LocalStorage implementation of StorageService.
 * Default implementation for browser environments.
 */
export class LocalStorageService implements StorageService {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
}

/**
 * In-memory implementation of StorageService.
 * Useful for testing and SSR environments.
 */
export class InMemoryStorageService implements StorageService {
  private storage: Map<string, string> = new Map();

  get(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  /** Clear all stored data (useful for test cleanup) */
  clear(): void {
    this.storage.clear();
  }

  /** Get all keys (useful for debugging) */
  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

/** Default storage service instance */
export const defaultStorage = new LocalStorageService();
