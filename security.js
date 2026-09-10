/**
 * SIH26076: Mausam App - Security & Hardening Middleware (security.js)
 *
 * Implements production security defenses:
 *  - Helmet: Secures HTTP response headers against web vulnerabilities (XSS, clickjacking, MIME-sniffing).
 *  - Rate Limiter: Throttles requests (max 100 per 15 min per IP) to prevent DoS & brute-force attacks.
 *  - Morgan: Combined standard HTTP request logging in terminal.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

/**
 * Helmet configuration.
 * Configured with relaxed Content Security Policy to allow Swagger UI inline assets
 * while enforcing all other strict security headers:
 *  - X-Content-Type-Options: nosniff
 *  - X-Frame-Options: SAMEORIGIN
 *  - Strict-Transport-Security
 *  - X-DNS-Prefetch-Control
 *  - Referrer-Policy
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Factory to create rate limiters.
 *
 * @param {Object} overrides - Custom options (e.g., lower max for fast testing)
 * @returns {Function} Express rate limit middleware
 */
function createRateLimiter(overrides = {}) {
  const windowMs = overrides.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = overrides.max !== undefined ? overrides.max : 100; // 100 requests per window

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Returns `RateLimit-*` headers (RFC draft-ietf-httpapi-ratelimit-headers)
    legacyHeaders: false, // Disables `X-RateLimit-*` headers
    statusCode: 429,
    message: {
      success: false,
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
    // Optional bypass header for automated integration test harnesses
    skip: (req) => req.headers['x-bypass-ratelimit'] === 'true',
    ...overrides
  });
}

// Default standard 100 req / 15 min rate limiter
const apiRateLimiter = createRateLimiter();

/**
 * Morgan logger middleware in 'combined' Apache standard format.
 * Skips logging during automated test suite runs (NODE_ENV === 'test') to maintain clean test output.
 */
const morganMiddleware = morgan('combined', {
  skip: () => process.env.NODE_ENV === 'test'
});

module.exports = {
  helmetMiddleware,
  apiRateLimiter,
  createRateLimiter,
  morganMiddleware
};
