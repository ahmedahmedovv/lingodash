import { beforeEach } from 'vitest';

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
});
