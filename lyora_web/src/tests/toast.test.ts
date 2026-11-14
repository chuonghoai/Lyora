import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore, toast } from '@/core/toast';

describe('Toast Notification System', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it('should add a toast and assign unique ID', () => {
    const id = toast.success('Đăng nhập thành công');
    expect(id).toBeTruthy();
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Đăng nhập thành công');
    expect(toasts[0].type).toBe('success');
  });

  it('should support error, warning, and info toasts', () => {
    toast.error('Lỗi kết nối máy chủ');
    toast.warning('Tài khoản sắp hết hạn');
    toast.info('Thông báo phiên bản mới');

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(3);
    expect(toasts[0].type).toBe('error');
    expect(toasts[1].type).toBe('warning');
    expect(toasts[2].type).toBe('info');
  });

  it('should deduplicate identical toasts within the deduplication window', () => {
    const id1 = toast.error('Thông báo lỗi trùng lặp');
    const id2 = toast.error('Thông báo lỗi trùng lặp');

    expect(id1).toBe(id2);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
  });

  it('should remove a toast by ID', () => {
    const id = toast.info('Tin nhắn sẽ bị xóa');
    expect(useToastStore.getState().toasts.length).toBe(1);

    toast.dismiss(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  it('should clear all toasts', () => {
    toast.success('Mục 1');
    toast.info('Mục 2');
    expect(useToastStore.getState().toasts.length).toBe(2);

    toast.clear();
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
