// server/src/config/redisService.js
// ═══════════════════════════════════════════════════════════════════
// Redis & In-Memory Fallback Cache Service
// ═══════════════════════════════════════════════════════════════════

class InMemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value: JSON.stringify(value), expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value);
    } catch {
      return item.value;
    }
  }

  del(key) {
    this.store.delete(key);
  }

  flush() {
    this.store.clear();
  }
}

const memoryCache = new InMemoryCache();

export const redisService = {
  async get(key) {
    return memoryCache.get(key);
  },

  async set(key, value, ttlSeconds = 300) {
    memoryCache.set(key, value, ttlSeconds);
    return true;
  },

  async del(key) {
    memoryCache.del(key);
    return true;
  },

  async cacheMiddleware(ttlSeconds = 60) {
    return (req, res, next) => {
      if (req.method !== 'GET') return next();
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      const cachedData = memoryCache.get(cacheKey);

      if (cachedData) {
        res.setHeader('X-Cache', 'HIT (Redis/Memory)');
        return res.json(cachedData);
      }

      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          memoryCache.set(cacheKey, body, ttlSeconds);
        }
        return originalJson(body);
      };
      next();
    };
  },
};
