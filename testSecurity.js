/**
 * SIH26076: Mausam App - Security, Rate Limiting & Swagger Verification Test Suite (testSecurity.js)
 *
 * Validates:
 *  1. Helmet HTTP Security Headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
 *  2. Express-Rate-Limit standard headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
 *  3. Rate Limiter Throttling Enforcement (HTTP 429 Too Many Requests)
 *  4. Swagger UI HTML & Asset Rendering at /api-docs/
 *  5. API Route Functionality under Security Middleware
 */

const axios = require('axios');
const express = require('express');
const app = require('./app');
const { createRateLimiter, helmetMiddleware } = require('./security');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - SECURITY & DOCUMENTATION TEST SUITE');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertTest(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ [PASS] ${description}`);
  } else {
    console.error(`  ✖ [FAIL] ${description} - ${details}`);
    throw new Error(`Assertion failed: ${description} | ${details}`);
  }
}

async function runSecurityTests() {
  // Start the main app on an ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Harness] Security test server running at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: Helmet HTTP Security Headers
    // -------------------------------------------------------------------------
    console.log('--- Section 1: Helmet Security Headers ---');
    const healthRes = await axios.get(`${baseUrl}/health`);

    assertTest(
      'Enforces "X-Content-Type-Options: nosniff" against MIME sniffing',
      healthRes.headers['x-content-type-options'] === 'nosniff'
    );

    assertTest(
      'Enforces "X-Frame-Options: SAMEORIGIN" against clickjacking',
      healthRes.headers['x-frame-options'] === 'SAMEORIGIN'
    );

    assertTest(
      'Enforces "Strict-Transport-Security" (HSTS)',
      Boolean(healthRes.headers['strict-transport-security'])
    );

    assertTest(
      'Enforces "X-DNS-Prefetch-Control: off"',
      healthRes.headers['x-dns-prefetch-control'] === 'off'
    );

    assertTest(
      'Enforces "Content-Security-Policy" (CSP)',
      Boolean(healthRes.headers['content-security-policy'])
    );

    console.log('');

    // -------------------------------------------------------------------------
    // SECTION 2: Rate Limiting Headers
    // -------------------------------------------------------------------------
    console.log('--- Section 2: Rate Limiting Standard Headers ---');
    const weatherRes = await axios.get(`${baseUrl}/api/weather`, {
      params: { latitude: 28.61, longitude: 77.23 }
    });

    assertTest(
      'Contains "ratelimit-limit" header configured to 100',
      weatherRes.headers['ratelimit-limit'] === '100'
    );

    assertTest(
      'Contains "ratelimit-remaining" tracking available capacity',
      weatherRes.headers['ratelimit-remaining'] !== undefined &&
        Number(weatherRes.headers['ratelimit-remaining']) <= 100
    );

    assertTest(
      'Contains "ratelimit-reset" countdown seconds',
      weatherRes.headers['ratelimit-reset'] !== undefined
    );

    console.log('');

    // -------------------------------------------------------------------------
    // SECTION 3: Rate Limiter Throttling Enforcement (HTTP 429)
    // -------------------------------------------------------------------------
    console.log('--- Section 3: Rate Limiting Throttling & 429 Verification ---');

    // Create a mini Express instance with a strict threshold (max 3 requests)
    const testApp = express();
    testApp.use(createRateLimiter({ max: 3, windowMs: 60 * 1000 }));
    testApp.get('/test-throttle', (req, res) => res.json({ ok: true }));

    const throttleServer = await new Promise((resolve) => {
      const ts = testApp.listen(0, () => resolve(ts));
    });
    const throttleUrl = `http://127.0.0.1:${throttleServer.address().port}/test-throttle`;

    try {
      // Requests 1, 2, 3 should succeed
      for (let i = 1; i <= 3; i++) {
        const r = await axios.get(throttleUrl);
        assertTest(`Throttled route accepts request #${i} under limit (HTTP ${r.status})`, r.status === 200);
      }

      // Request 4 must be throttled with HTTP 429
      try {
        await axios.get(throttleUrl);
        assertTest('Rejects request #4 exceeding rate limit with HTTP 429', false, 'Should have failed with 429');
      } catch (throttleErr) {
        assertTest(
          'Rejects request #4 exceeding rate limit with HTTP 429 Too Many Requests',
          throttleErr.response?.status === 429 &&
            throttleErr.response?.data?.statusCode === 429 &&
            throttleErr.response?.data?.error === 'Too Many Requests'
        );
      }
    } finally {
      throttleServer.close();
    }

    console.log('');

    // -------------------------------------------------------------------------
    // SECTION 4: Interactive Swagger UI Documentation (/api-docs)
    // -------------------------------------------------------------------------
    console.log('--- Section 4: Interactive Swagger UI Documentation ---');

    const swaggerRes = await axios.get(`${baseUrl}/api-docs/`);
    assertTest(
      'GET /api-docs/ responds with HTTP 200 OK',
      swaggerRes.status === 200
    );

    assertTest(
      'GET /api-docs/ serves HTML page containing Swagger UI container',
      typeof swaggerRes.data === 'string' &&
        swaggerRes.data.includes('swagger-ui') &&
        swaggerRes.data.includes('SIH26076')
    );

    const swaggerBundleRes = await axios.get(`${baseUrl}/api-docs/swagger-ui-bundle.js`);
    assertTest(
      'Swagger UI JavaScript bundle (swagger-ui-bundle.js) loads successfully (HTTP 200)',
      swaggerBundleRes.status === 200 && swaggerBundleRes.headers['content-type'].includes('javascript')
    );

    const swaggerCssRes = await axios.get(`${baseUrl}/api-docs/swagger-ui.css`);
    assertTest(
      'Swagger UI Stylesheet (swagger-ui.css) loads successfully (HTTP 200)',
      swaggerCssRes.status === 200 && swaggerCssRes.headers['content-type'].includes('css')
    );

    const rootRes = await axios.get(`${baseUrl}/`);
    assertTest(
      'GET / discovery endpoint exposes Swagger documentation link at /api-docs',
      rootRes.data.documentation === 'GET /api-docs' || rootRes.data.endpoints?.docs === 'GET /api-docs'
    );

    console.log('');

    // -------------------------------------------------------------------------
    // SECTION 5: End-to-End Route Health Under Production Hardening
    // -------------------------------------------------------------------------
    console.log('--- Section 5: Route Health with Security Active ---');

    // Weather Route
    const apiWeather = await axios.get(`${baseUrl}/api/weather?latitude=28.61&longitude=77.23`);
    assertTest(
      'GET /api/weather succeeds with 8 persona dashboards under Helmet & RateLimiter',
      apiWeather.status === 200 && Object.keys(apiWeather.data.personas).length === 8
    );

    // Save Location Route
    const apiSave = await axios.post(`${baseUrl}/api/save-location`, {
      userId: 'usr_sec_test',
      cityName: 'Jaipur',
      latitude: 26.9124,
      longitude: 75.7873,
      preferredPersona: 'Travelers'
    });
    assertTest(
      'POST /api/save-location persists successfully under security middleware (HTTP 201)',
      apiSave.status === 201 && apiSave.data.success === true
    );

    console.log('');

    // -------------------------------------------------------------------------
    // SECTION 6: Security Boundary & Input Rejection
    // -------------------------------------------------------------------------
    console.log('--- Section 6: Security Boundary & Input Rejection ---');

    // 1. Missing coordinates rejection
    try {
      await axios.get(`${baseUrl}/api/weather`);
      assertTest('Rejects GET /api/weather with missing coordinates', false, 'Should have failed with 400');
    } catch (err) {
      assertTest(
        'Rejects GET /api/weather with missing coordinates (HTTP 400)',
        err.response?.status === 400 && err.response?.data?.statusCode === 400
      );
    }

    // 2. Out-of-bounds latitude rejection
    try {
      await axios.get(`${baseUrl}/api/weather?latitude=999&longitude=77.23`);
      assertTest('Rejects out-of-bounds latitude (999)', false, 'Should have failed with 400');
    } catch (err) {
      assertTest(
        'Rejects out-of-bounds latitude on /api/weather with HTTP 400',
        err.response?.status === 400 && err.response?.data?.message.includes('between -90 and 90')
      );
    }

    // 3. SQL injection query string rejection
    try {
      await axios.get(`${baseUrl}/api/weather?latitude=28.6;DROP%20TABLE%20users;--&longitude=77.23`);
      assertTest('Rejects SQL injection query on /api/weather', false, 'Should have failed with 400');
    } catch (err) {
      assertTest(
        'Rejects SQL injection query string with HTTP 400 without crashing',
        err.response?.status === 400 && err.response?.data?.error === 'Bad Request: Validation Failed'
      );
    }

    // 4. Invalid latitude in POST /api/save-location
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        userId: 'usr_sec_bad',
        cityName: 'BadCity',
        latitude: 500,
        longitude: 77.23
      });
      assertTest('Rejects invalid latitude in save-location', false, 'Should have failed with 400');
    } catch (err) {
      assertTest(
        'POST /api/save-location rejects out-of-bounds latitude (HTTP 400)',
        err.response?.status === 400 && err.response?.data?.success === false
      );
    }

    // 5. Missing required userId in POST /api/save-location
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        cityName: 'CityNoUser',
        latitude: 28.61,
        longitude: 77.23
      });
      assertTest('Rejects save-location missing userId', false, 'Should have failed with 400');
    } catch (err) {
      assertTest(
        'POST /api/save-location rejects missing userId (HTTP 400)',
        err.response?.status === 400 && err.response?.data?.success === false
      );
    }

    // 6. Non-existent route 404 under security headers
    try {
      await axios.get(`${baseUrl}/api/non-existent-route-xyz`);
      assertTest('Handles non-existent route with 404', false, 'Should have failed with 404');
    } catch (err) {
      assertTest(
        'Returns HTTP 404 for undefined routes with security headers intact',
        err.response?.status === 404 && Boolean(err.response?.headers['x-content-type-options'])
      );
    }

    console.log('');
    console.log('================================================================================');
    console.log(` ALL ${passedTests}/${totalTests} SECURITY & DOCUMENTATION TESTS PASSED!`);
    console.log('================================================================================\n');
  } finally {
    server.close();
  }
}

runSecurityTests().catch((err) => {
  console.error('\nFatal failure during security test execution:', err);
  process.exit(1);
});
