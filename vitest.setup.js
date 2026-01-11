import { beforeEach, vi } from 'vitest';

// Setup localStorage mock
beforeEach(() => {
  const localStorageMock = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value.toString();
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
    get length() {
      return Object.keys(this.store).length;
    },
    key(index) {
      const keys = Object.keys(this.store);
      return keys[index] || null;
    }
  };

  global.localStorage = localStorageMock;

  // Setup comprehensive Supabase mock for all tests
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnValue(builder),
      eq: vi.fn().mockReturnValue(builder),
      neq: vi.fn().mockReturnValue(builder),
      gt: vi.fn().mockReturnValue(builder),
      gte: vi.fn().mockReturnValue(builder),
      lt: vi.fn().mockReturnValue(builder),
      lte: vi.fn().mockReturnValue(builder),
      ilike: vi.fn().mockReturnValue(builder),
      order: vi.fn().mockReturnValue(builder),
      range: vi.fn().mockReturnValue(builder),
      limit: vi.fn().mockReturnValue(builder),
      single: vi.fn().mockReturnValue(builder),
      insert: vi.fn().mockReturnValue(builder),
      update: vi.fn().mockReturnValue(builder),
      delete: vi.fn().mockReturnValue(builder),
      upsert: vi.fn().mockReturnValue(builder),
      head: vi.fn().mockReturnValue(builder),
      count: vi.fn().mockReturnValue(builder),
      exact: vi.fn().mockReturnValue(builder)
    };
    return builder;
  };

  vi.mock('./src/js/supabase.js', () => ({
    supabase: {
      from: vi.fn(() => ({
        ...createQueryBuilder(),
        then: vi.fn() // Make it thenable for async operations
      })),
      auth: {
        signUp: vi.fn().mockResolvedValue({}),
        signInWithPassword: vi.fn().mockResolvedValue({}),
        signOut: vi.fn().mockResolvedValue({}),
        getUser: vi.fn().mockResolvedValue({}),
        getSession: vi.fn().mockResolvedValue({}),
        onAuthStateChange: vi.fn(() => vi.fn())
      }
    },
    getUserId: vi.fn().mockResolvedValue('test-user-id')
  }), { virtual: true });
});
