import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStorageService } from '@/core/storage';

describe('MemoryStorageService', () => {
  beforeEach(() => {
    memoryStorageService.clear();
  });

  it('should store and retrieve string values', () => {
    memoryStorageService.setItem('test_key', 'hello');
    expect(memoryStorageService.getItem('test_key')).toBe('hello');
  });

  it('should store and retrieve JSON objects', () => {
    const data = { id: 1, name: 'Lyora' };
    memoryStorageService.setItem('json_key', data);
    const retrieved = memoryStorageService.getItem<{ id: number; name: string }>('json_key');
    expect(retrieved).toEqual(data);
  });

  it('should return null for non-existent keys', () => {
    expect(memoryStorageService.getItem('missing_key')).toBeNull();
  });

  it('should remove items correctly', () => {
    memoryStorageService.setItem('rem_key', 'val');
    expect(memoryStorageService.hasItem('rem_key')).toBe(true);
    memoryStorageService.removeItem('rem_key');
    expect(memoryStorageService.hasItem('rem_key')).toBe(false);
    expect(memoryStorageService.getItem('rem_key')).toBeNull();
  });

  it('should clear all items', () => {
    memoryStorageService.setItem('k1', 'v1');
    memoryStorageService.setItem('k2', 'v2');
    memoryStorageService.clear();
    expect(memoryStorageService.getItem('k1')).toBeNull();
    expect(memoryStorageService.getItem('k2')).toBeNull();
  });
});
