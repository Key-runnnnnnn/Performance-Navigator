const redis = require('redis');
require('dotenv').config();

// Prefer detailed config if provided, else fallback to REDIS_URL or localhost
const redisOptions = process.env.REDIS_HOST && process.env.REDIS_PORT
  ? {
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      },
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    }
  : {
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    };

const redisClient = redis.createClient(redisOptions);

let connected = false;
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
    if (process.env.NODE_ENV !== 'production') {
        console.warn('WARNING: Redis is not connected. Caching and rate limiting will not work.');
    } else {
        console.error('ERROR: Redis connection failed in production. Exiting.');
        process.exit(1);
    }
});

redisClient.connect()
    .then(() => {
        connected = true;
        console.log('Redis connected');
    })
    .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('WARNING: Redis connection failed. App will continue to run, but caching and rate limiting are disabled.');
        } else {
            console.error('ERROR: Redis connection failed in production. Exiting.');
            process.exit(1);
        }
    });

module.exports = redisClient;
