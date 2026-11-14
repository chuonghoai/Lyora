export interface IStorageService {
  getItem<T = string>(key: string): T | null;
  setItem<T = unknown>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
  hasItem(key: string): boolean;
}

export type StorageType = 'local' | 'session' | 'memory';

