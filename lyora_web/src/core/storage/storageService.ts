import type { IStorageService } from './storage.interface';

class MemoryStorageService implements IStorageService {
  private store = new Map<string, string>();

  getItem<T = string>(key: string): T | null {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  setItem<T = unknown>(key: string, value: T): void {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      this.store.set(key, serialized);
    } catch (e) {
      console.error(`[MemoryStorage] Failed to set item "${key}":`, e);
    }
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  hasItem(key: string): boolean {
    return this.store.has(key);
  }
}

class WebStorageWrapper implements IStorageService {
  private memoryFallback: MemoryStorageService;
  private isAvailable: boolean;
  private getStorage: () => Storage | null;
  private prefix: string;

  constructor(
    getStorage: () => Storage | null,
    prefix: string = 'lyora:',
  ) {
    this.getStorage = getStorage;
    this.prefix = prefix;
    this.memoryFallback = new MemoryStorageService();
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const storage = this.getStorage();
      if (!storage) return false;
      const testKey = `__test__${Date.now()}`;
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private formatKey(key: string): string {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  getItem<T = string>(key: string): T | null {
    const formatted = this.formatKey(key);
    if (!this.isAvailable) {
      return this.memoryFallback.getItem<T>(formatted);
    }

    try {
      const storage = this.getStorage();
      const raw = storage?.getItem(formatted);
      if (raw === null || raw === undefined) return null;

      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (e) {
      console.warn(`[Storage] Failed to read key "${formatted}", fallback to memory:`, e);
      return this.memoryFallback.getItem<T>(formatted);
    }
  }

  setItem<T = unknown>(key: string, value: T): void {
    const formatted = this.formatKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (!this.isAvailable) {
      this.memoryFallback.setItem(formatted, serialized);
      return;
    }

    try {
      const storage = this.getStorage();
      storage?.setItem(formatted, serialized);
    } catch (e) {
      console.warn(`[Storage] Failed to write key "${formatted}", writing to memory:`, e);
      this.memoryFallback.setItem(formatted, serialized);
    }
  }

  removeItem(key: string): void {
    const formatted = this.formatKey(key);
    if (!this.isAvailable) {
      this.memoryFallback.removeItem(formatted);
      return;
    }

    try {
      const storage = this.getStorage();
      storage?.removeItem(formatted);
    } catch {
      this.memoryFallback.removeItem(formatted);
    }
  }

  clear(): void {
    if (!this.isAvailable) {
      this.memoryFallback.clear();
      return;
    }

    try {
      const storage = this.getStorage();
      if (!storage) return;

      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        storage.removeItem(key);
      }
    } catch {
      this.memoryFallback.clear();
    }
  }

  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}

export const localStorageService: IStorageService = new WebStorageWrapper(
  () => (typeof window !== 'undefined' ? window.localStorage : null),
  'lyora:',
);

export const sessionStorageService: IStorageService = new WebStorageWrapper(
  () => (typeof window !== 'undefined' ? window.sessionStorage : null),
  'lyora:',
);

export const memoryStorageService: IStorageService = new MemoryStorageService();
