const NodeCache = require('node-cache');

// TTLs in seconds
const TTL = {
    EXERCISES: 5 * 60,      // 5 min — user exercises change rarely
    WORKOUTS: 2 * 60,       // 2 min — workouts change more often
    USER_STATS: 1 * 60,     // 1 min — stats update after sessions
};

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: false });

const get = (key) => cache.get(key) || null;

const set = (key, data, ttl) => cache.set(key, data, ttl);

const del = (key) => cache.del(key);

const delByPrefix = (prefix) => {
    const keys = cache.keys().filter(k => k.startsWith(prefix));
    if (keys.length) cache.del(keys);
};

module.exports = { get, set, del, delByPrefix, TTL };
