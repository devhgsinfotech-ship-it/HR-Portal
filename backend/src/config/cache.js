// Cache system supporting In-Memory TTL cache with optional Redis fallback
const memoryCache = new Map();

// High-speed In-Memory Cache with TTL
const cache = {
  get: async (key) => {
    try {
      const item = memoryCache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
      }
      return item.value;
    } catch (err) {
      return null;
    }
  },

  set: async (key, value, ttlSeconds = 300) => {
    try {
      memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
      });
    } catch (err) {
      console.error('Cache set error:', err.message);
    }
  },

  del: async (key) => {
    memoryCache.delete(key);
  },

  clearPattern: async (prefix) => {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }
};

module.exports = cache;
