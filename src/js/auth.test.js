import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase for this specific test
vi.mock('./supabase.js', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => vi.fn())
    }
  }
}));

import { signUp, signIn, signOut, getCurrentUser, getSession, onAuthStateChange } from './auth.js';
import { supabase } from './supabase.js';

describe('Authentication Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await getCurrentUser();
      expect(result).toEqual(mockUser);
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getCurrentUser();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Network error' } });

      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should return session when available', async () => {
      const mockSession = { access_token: 'token123', user: { id: '123' } };
      supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const result = await getSession();
      expect(result).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await getSession();
      expect(result).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should successfully sign up new user', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await signUp('new@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123'
      });
    });

    it('should handle signup error', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' }
      });

      const result = await signUp('existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should handle network errors', async () => {
      supabase.auth.signUp.mockRejectedValue(new Error('Network timeout'));

      const result = await signUp('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle invalid credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      const result = await signIn('wrong@example.com', 'wrongpass');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle sign out error', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      supabase.auth.onAuthStateChange.mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
