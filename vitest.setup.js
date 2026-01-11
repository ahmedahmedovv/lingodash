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

  // Mock data for tests
  let mockWordsData = [
    {
      id: 1,
      word: 'test',
      definition: 'A procedure for critical evaluation',
      example: 'This is a test example.',
      timestamp: '2024-01-01T00:00:00.000Z',
      interval: 1,
      ease_factor: 2.5,
      next_review: '2024-01-02T00:00:00.000Z',
      review_count: 1,
      correct_count: 1
    }
  ];

  let mockUsers = [
    {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  ];

  // Setup comprehensive Supabase mock for all tests
  const createQueryBuilder = (tableName) => {
    let queryState = {
      selectFields: '*',
      filters: {},
      orderBy: null,
      limitCount: null,
      offsetCount: 0,
      isSingle: false,
      isHead: false,
      countMode: false,
      exactCount: false
    };

    const executeQuery = async () => {
      let data = [];

      // Handle different tables
      if (tableName === 'words') {
        data = [...mockWordsData];

        // Apply filters
        if (queryState.filters.user_id) {
          data = data.filter(word => word.user_id === queryState.filters.user_id);
        }
        if (queryState.filters.word) {
          if (queryState.filters.ilike) {
            data = data.filter(word => word.word.toLowerCase().includes(queryState.filters.word.toLowerCase()));
          } else {
            data = data.filter(word => word.word === queryState.filters.word);
          }
        }
        if (queryState.filters.id) {
          data = data.filter(word => word.id === queryState.filters.id);
        }

        // Apply ordering
        if (queryState.orderBy) {
          const [field, direction] = queryState.orderBy;
          data.sort((a, b) => {
            if (direction === 'desc') {
              return b[field] > a[field] ? 1 : -1;
            }
            return a[field] > b[field] ? 1 : -1;
          });
        }

        // Apply range/offset/limit
        if (queryState.offsetCount > 0) {
          data = data.slice(queryState.offsetCount);
        }
        if (queryState.limitCount) {
          data = data.slice(0, queryState.limitCount);
        }
      } else if (tableName === 'users') {
        data = [...mockUsers];
      }

      // Handle count queries
      if (queryState.countMode) {
        return {
          count: data.length,
          error: null
        };
      }

      // Handle head requests
      if (queryState.isHead) {
        return {
          count: data.length,
          error: null
        };
      }

      // Handle single requests
      if (queryState.isSingle) {
        return {
          data: data[0] || null,
          error: null
        };
      }

      return {
        data: data,
        error: null
      };
    };

    const builder = {
      select: vi.fn((fields) => {
        queryState.selectFields = fields;
        return builder;
      }),
      eq: vi.fn((field, value) => {
        queryState.filters[field] = value;
        return builder;
      }),
      neq: vi.fn((field, value) => {
        // For simplicity, just store the filter
        queryState.filters[field] = { $neq: value };
        return builder;
      }),
      gt: vi.fn((field, value) => {
        queryState.filters[field] = { $gt: value };
        return builder;
      }),
      gte: vi.fn((field, value) => {
        queryState.filters[field] = { $gte: value };
        return builder;
      }),
      lt: vi.fn((field, value) => {
        queryState.filters[field] = { $lt: value };
        return builder;
      }),
      lte: vi.fn((field, value) => {
        queryState.filters[field] = { $lte: value };
        return builder;
      }),
      ilike: vi.fn((field, value) => {
        queryState.filters[field] = value;
        queryState.filters.ilike = true;
        return builder;
      }),
      order: vi.fn((field, options) => {
        queryState.orderBy = [field, options?.ascending === false ? 'desc' : 'asc'];
        return builder;
      }),
      range: vi.fn((start, end) => {
        queryState.offsetCount = start;
        queryState.limitCount = end - start + 1;
        return builder;
      }),
      limit: vi.fn((count) => {
        queryState.limitCount = count;
        return builder;
      }),
      single: vi.fn(() => {
        queryState.isSingle = true;
        return builder;
      }),
      head: vi.fn(() => {
        queryState.isHead = true;
        return builder;
      }),
      count: vi.fn((options) => {
        queryState.countMode = true;
        if (options?.count === 'exact') {
          queryState.exactCount = true;
        }
        return builder;
      }),
      insert: vi.fn((data) => {
        // Simulate insert
        const newRecord = { ...data, id: Date.now() };
        if (tableName === 'words') {
          mockWordsData.push(newRecord);
        }
        return Promise.resolve({ data: newRecord, error: null });
      }),
      update: vi.fn((data) => {
        // Simulate update
        return Promise.resolve({ data: data, error: null });
      }),
      delete: vi.fn(() => {
        // Simulate delete
        return Promise.resolve({ error: null });
      }),
      upsert: vi.fn((data) => {
        // Simulate upsert
        return Promise.resolve({ data: data, error: null });
      }),
      then: vi.fn((resolve) => {
        executeQuery().then(resolve);
      })
    };

    return builder;
  };

  vi.mock('./src/js/supabase.js', () => ({
    supabase: {
      from: vi.fn((tableName) => createQueryBuilder(tableName)),
      auth: {
        signUp: vi.fn().mockResolvedValue({ data: { user: mockUsers[0] }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUsers[0] }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUsers[0] }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn((callback) => {
          callback('SIGNED_IN', { user: mockUsers[0] });
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        })
      }
    },
    getUserId: vi.fn().mockResolvedValue('test-user-id')
  }), { virtual: true });
});
