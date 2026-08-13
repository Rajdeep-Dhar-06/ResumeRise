export const AUTH = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  SALT_ROUNDS: 10,
};

export const SCRAPER = {
  CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours in ms
  JINA_TIMEOUT_MS: 20000,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 9,
  MAX_LIMIT: 50,
};
