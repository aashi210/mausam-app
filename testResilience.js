/**
 * SIH26076: Mausam App - Extreme Failure & Resilience Automated Test Suite (testResilience.js)
 *
 * Verifies that the backend microservice gracefully withstands extreme failure scenarios:
 *  1. Total Network Blackout (ECONNREFUSED / ENOTFOUND across all 5 external providers)
 *  2. weatherService.js error interception and automatic fallback activation (isFallback = true)
 *  3. Seamless delivery of verified baseline mockData without data corruption
 *  4. Express server route stability: GET /api/weather returns HTTP 200 OK instead of 500 error
 *  5. Complete evaluation of all 8 personas during total blackout
 *  6. Simulation of diverse network failure modes (DNS failure, Socket Timeout, 500 Server Crash)
 */

const axios = require('axios');
const app = require('./app');
const weatherService = require('./weatherService');
const { cache, mockData } = require('./weatherService');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - EXTREME FAILURE & RESILIENCE TEST SUITE');
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

// Store original axios.get reference
const originalAxiosGet = axios.get;

async function runResilienceTests() {
  cache.flushAll(); // Clear cache to guarantee fresh fetches under simulated failure

  // Start the Express server on an ephemeral port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Resilience Harness] Express server booted at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Total Network Blackout (Connection Refused on all external APIs)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 1: Total Network Blackout Simulation (ECONNREFUSED) ---');
    console.log('  Intercepting external HTTP calls to simulate complete network outage...');

    let interceptedExternalCalls = 0;

    // Monkey-patch axios.get to simulate complete external network blackout
    axios.get = function (url, config) {
      // Allow local communication with our test Express server
      if (typeof url === 'string' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
        return originalAxiosGet.call(axios, url, config);
      }

      // Block all external APIs (OpenWeatherMap, Open-Meteo, Stormglass, ORS, IMD)
      interceptedExternalCalls++;
      const networkError = new Error(`connect ECONNREFUSED ${url} (Simulated Total Network Blackout)`);
      networkError.code = 'ECONNREFUSED';
      networkError.isAxiosError = true;
      return Promise.reject(networkError);
    };

    const blackoutLat = 26.9124;
    const blackoutLon = 75.7873;

    // 1.1 Direct service test under blackout
    console.log(`  Invoking weatherService(${blackoutLat}, ${blackoutLon}) under blackout...`);
    const serviceResult = await weatherService(blackoutLat, blackoutLon);

    assertTest('weatherService catches all network errors and does not throw', Boolean(serviceResult));
    assertTest('Intercepted multiple external third-party API attempts', interceptedExternalCalls >= 3);
    assertTest('Switches isFallback flag to true', serviceResult.isFallback === true);
    assertTest('Identifies source as "mockData_fallback"', serviceResult.source === 'mockData_fallback');
    assertTest('Populates all 5 sources with "fallback" status',
      serviceResult.sources.openWeatherMap === 'fallback' &&
      serviceResult.sources.openMeteo === 'fallback' &&
      serviceResult.sources.stormglass === 'fallback' &&
      serviceResult.sources.openRouteService === 'fallback' &&
      serviceResult.sources.imd === 'fallback'
    );
    assertTest('Returns valid baseline temperature matching mockData', serviceResult.temperature === mockData.temperature);
    assertTest('Returns valid baseline humidity matching mockData', serviceResult.humidity === mockData.humidity);
    assertTest('Returns valid baseline soilMoisture matching mockData', serviceResult.soilMoisture === mockData.soilMoisture);
    assertTest('Returns valid baseline PM2.5 matching mockData', serviceResult.pm2_5 === mockData.pm2_5);
    assertTest('Returns valid baseline waveHeight matching mockData', serviceResult.waveHeight === mockData.waveHeight);
    assertTest('Returns valid baseline traffic condition matching mockData', serviceResult.trafficCondition === mockData.trafficCondition);
    assertTest('Returns valid baseline IMD alert matching mockData', serviceResult.imdAlert === mockData.imdAlert);

    console.log('');

    // -------------------------------------------------------------------------
    // SCENARIO 2: Express Server Stability Under Network Blackout
    // -------------------------------------------------------------------------
    console.log('--- Scenario 2: Express API Endpoint (GET /api/weather) Stability Under Blackout ---');
    console.log('  Sending HTTP GET /api/weather during total external blackout...');

    cache.flushAll(); // Flush cache so request must trigger backend aggregator

    const apiRes = await axios.get(`${baseUrl}/api/weather`, {
      params: { latitude: 22.5726, longitude: 88.3639 } // Kolkata coordinates
    });

    assertTest('Express server returns HTTP 200 OK (NOT HTTP 500 error)', apiRes.status === 200);
    assertTest('Response structure contains success=true', apiRes.data.success === true);
    assertTest('Response weather object has isFallback=true', apiRes.data.weather.isFallback === true);
    assertTest('Response weather object includes valid mock fallback temperature', typeof apiRes.data.weather.temperature === 'number');

    // Verify all 8 personas are successfully evaluated despite total network blackout
    const personas = apiRes.data.personas;
    assertTest('Response contains personas object during blackout', Boolean(personas));

    const requiredPersonas = [
      'Health-Conscious',
      'Outdoor Fitness',
      'Beachgoers/Surfers',
      'Agriculture/Gardeners',
      'Commuters',
      'Parents & Families',
      'Event Planners',
      'Travelers'
    ];

    requiredPersonas.forEach((pName) => {
      const p = personas[pName];
      const valid = p && ['Safe', 'Warning', 'Danger'].includes(p.alertLevel) && typeof p.recommendationText === 'string' && p.recommendationText.length > 0;
      assertTest(`Persona [${pName}] successfully evaluated under total blackout (${p?.alertLevel})`, valid);
    });

    console.log('');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Extreme DNS Resolution Failure Simulation (ENOTFOUND)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 3: Extreme DNS Resolution Failure (ENOTFOUND) ---');
    cache.flushAll();

    axios.get = function (url, config) {
      if (typeof url === 'string' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
        return originalAxiosGet.call(axios, url, config);
      }
      const dnsError = new Error(`getaddrinfo ENOTFOUND api.open-meteo.com`);
      dnsError.code = 'ENOTFOUND';
      return Promise.reject(dnsError);
    };

    const dnsRes = await axios.get(`${baseUrl}/api/weather?latitude=13.0827&longitude=80.2707`);
    assertTest('Express server returns HTTP 200 OK under total DNS failure', dnsRes.status === 200);
    assertTest('DNS failure triggers isFallback=true gracefully', dnsRes.data.weather.isFallback === true);

    console.log('');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Upstream 500 Server Crashes & 504 Gateway Timeouts
    // -------------------------------------------------------------------------
    console.log('--- Scenario 4: Upstream 500 Internal Server Errors & 504 Timeouts ---');
    cache.flushAll();

    axios.get = function (url, config) {
      if (typeof url === 'string' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
        return originalAxiosGet.call(axios, url, config);
      }
      const upstreamError = new Error('Request failed with status code 504 (Gateway Timeout)');
      upstreamError.response = { status: 504, statusText: 'Gateway Timeout', data: 'Gateway Timeout' };
      return Promise.reject(upstreamError);
    };

    const timeoutRes = await axios.get(`${baseUrl}/api/weather?latitude=31.1048&longitude=77.1734`);
    assertTest('Express server returns HTTP 200 OK under 504 Gateway Timeouts', timeoutRes.status === 200);
    assertTest('Gateway timeouts trigger isFallback=true without crashing', timeoutRes.data.weather.isFallback === true);

    console.log('');
    console.log('================================================================================');
    console.log(` ALL ${passedTests}/${totalTests} RESILIENCE & BLACKOUT TESTS PASSED!`);
    console.log('================================================================================\n');

    console.log('Resilience Summary Evidence:');
    console.log(
      JSON.stringify(
        {
          networkState: 'TOTAL_EXTERNAL_BLACKOUT',
          httpStatusReceived: apiRes.status,
          isFallbackActive: apiRes.data.weather.isFallback,
          source: apiRes.data.weather.source,
          sourcesBreakdown: apiRes.data.weather.sources,
          weatherMetricsDelivered: {
            temperature: `${apiRes.data.weather.temperature}°C`,
            humidity: `${apiRes.data.weather.humidity}%`,
            pm2_5: `${apiRes.data.weather.pm2_5} µg/m³`,
            waveHeight: `${apiRes.data.weather.waveHeight}m`,
            trafficCondition: apiRes.data.weather.trafficCondition,
            imdAlert: apiRes.data.weather.imdAlert
          },
          personasGeneratedCount: Object.keys(personas).length
        },
        null,
        2
      )
    );
  } finally {
    // Restore original axios.get
    axios.get = originalAxiosGet;
    server.close();
  }
}

runResilienceTests().catch((err) => {
  // Always restore original axios.get in case of error
  axios.get = originalAxiosGet;
  console.error('\nFatal error during resilience test execution:', err);
  process.exit(1);
});
