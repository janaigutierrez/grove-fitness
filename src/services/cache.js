'use strict';

/**
 * Simple in-memory cache with per-key TTL.
 * Singleton — shared across the whole app.
 */

const store = new Map();

const cache = {
    get(key) {
        const entry = store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            store.delete(key);
            return null;
        }
        return entry.data;
    },

    set(key, data, ttlMs) {
        store.set(key, { data, expiresAt: Date.now() + ttlMs });
    },

    invalidate(key) {
        store.delete(key);
    },

    invalidatePrefix(prefix) {
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) store.delete(key);
        }
    },

    clear() {
        store.clear();
    },
};

// TTL constants (ms)
export const TTL = {
    USER_ME:           5  * 60 * 1000,  // 5 min
    USER_STATS:        2  * 60 * 1000,  // 2 min
    WEEKLY_SCHEDULE:   10 * 60 * 1000,  // 10 min
    WORKOUTS:          5  * 60 * 1000,  // 5 min
    EXERCISES:         15 * 60 * 1000,  // 15 min
};

export default cache;
