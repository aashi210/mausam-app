/**
 * SIH26076: Mausam App - Express Server & API Automated Test Suite (testServer.js)
 *
 * Boots the Express application on a dynamic test port and executes end-to-end HTTP
 * assertions against all routes:
 *  - GET /health
 *  - GET /api/weather (Delhi coordinates, validation, cache, all 8 persona evaluations)
 *  - GET /api/weather (Query aliases lat/lon, invalid out-of-bounds coords)
 *  - POST /api/save-location (Valid standard and nested payloads, schema validation errors)
 *  - 404 Route handling
 */

const axios = require('axios');
const app = require('./app');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - MAIN EXPRESS SERVER & ROUTE TEST SUITE');
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

async function runServerTests() {
  // Start server on an ephemeral port (0) to prevent port collision
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Harness] Ephemeral test server running at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Root & Health Check Endpoints
    // -------------------------------------------------------------------------
    console.log('--- Section 1: Service Discovery & Health Check ---');
    const healthRes = await axios.get(`${baseUrl}/health`);
    assertTest('GET /health returns HTTP 200 and status "healthy"', healthRes.status === 200 && healthRes.data.status === 'healthy');

    const rootRes = await axios.get(`${baseUrl}/`);
    assertTest('GET / returns HTTP 200 with service metadata', rootRes.status === 200 && rootRes.data.name.includes('Mausam App'));

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 2: Main Weather Route (GET /api/weather) - First Fetch
    // -------------------------------------------------------------------------
    console.log('--- Section 2: Main Weather Route & Persona Recommendations ---');
    console.log('  Executing GET /api/weather?latitude=28.61&longitude=77.23 (Delhi)...');

    const weatherRes1 = await axios.get(`${baseUrl}/api/weather`, {
      params: { latitude: 28.61, longitude: 77.23 }
    });

    assertTest('GET /api/weather returns HTTP 200 OK', weatherRes1.status === 200);
    assertTest('Response structure contains success=true', weatherRes1.data.success === true);

    const weatherData = weatherRes1.data.weather;
    assertTest('Weather payload includes core temperature number', typeof weatherData.temperature === 'number');
    assertTest('Weather payload includes humidity percentage', typeof weatherData.humidity === 'number');
    assertTest('Weather payload includes soil moisture', typeof weatherData.soilMoisture === 'number');
    assertTest('Weather payload includes visibility meters', typeof weatherData.visibility === 'number');
    assertTest('Weather payload includes PM2.5 and PM10 metrics', typeof weatherData.pm2_5 === 'number' && typeof weatherData.pm10 === 'number');
    assertTest('Weather payload includes UV Index', typeof weatherData.uvIndex === 'number');
    assertTest('Weather payload includes wave height & ocean current velocity', typeof weatherData.waveHeight === 'number' && typeof weatherData.oceanCurrentVelocity === 'number');

    // Verify all 8 Personas
    const expectedPersonas = [
      'Health-Conscious',
      'Outdoor Fitness',
      'Beachgoers/Surfers',
      'Agriculture/Gardeners',
      'Commuters',
      'Parents & Families',
      'Event Planners',
      'Travelers'
    ];

    const personas = weatherRes1.data.personas;
    assertTest('Response contains "personas" object', Boolean(personas) && typeof personas === 'object');

    expectedPersonas.forEach((personaName) => {
      const p = personas[personaName];
      const valid = p && ['Safe', 'Warning', 'Danger'].includes(p.alertLevel) && typeof p.recommendationText === 'string' && p.recommendationText.length > 0;
      assertTest(`Persona [${personaName}] is properly evaluated with alertLevel ("${p?.alertLevel}")`, valid);
    });

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 3: Caching Behavior Verification (Repeat call)
    // -------------------------------------------------------------------------
    console.log('--- Section 3: In-Memory 10-Minute Caching Verification ---');
    const weatherRes2 = await axios.get(`${baseUrl}/api/weather`, {
      params: { latitude: 28.61, longitude: 77.23 }
    });
    assertTest('Repeat call served from cache (isCached === true)', weatherRes2.data.weather.isCached === true);

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 4: Query Alias Compatibility (lat/lon)
    // -------------------------------------------------------------------------
    console.log('--- Section 4: Query Parameter Alias Support ---');
    const aliasRes = await axios.get(`${baseUrl}/api/weather`, {
      params: { lat: 19.076, lon: 72.8777 }
    });
    assertTest('GET /api/weather works seamlessly with shorthand lat/lon aliases (Mumbai)', aliasRes.status === 200 && aliasRes.data.coordinates.latitude === 19.076);

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 5: Input Validation & 400 Error Handling
    // -------------------------------------------------------------------------
    console.log('--- Section 5: Input Validation & Error Handling (validator.js middleware) ---');

    // Out-of-bounds latitude
    try {
      await axios.get(`${baseUrl}/api/weather?latitude=999&longitude=77.23`);
      assertTest('Rejects latitude=999 with HTTP 400', false, 'Should have failed with 400');
    } catch (err) {
      assertTest('Rejects out-of-bounds latitude=999 with HTTP 400', err.response?.status === 400 && err.response?.data?.success === false);
    }

    // Non-numeric string
    try {
      await axios.get(`${baseUrl}/api/weather?latitude=abc&longitude=77.23`);
      assertTest('Rejects non-numeric latitude with HTTP 400', false, 'Should have failed with 400');
    } catch (err) {
      assertTest('Rejects non-numeric latitude="abc" with HTTP 400', err.response?.status === 400 && err.response?.data?.issues?.length > 0);
    }

    // Missing coordinates
    try {
      await axios.get(`${baseUrl}/api/weather`);
      assertTest('Rejects missing coordinate parameters with HTTP 400', false, 'Should have failed with 400');
    } catch (err) {
      assertTest('Rejects missing coordinate query parameters with HTTP 400', err.response?.status === 400);
    }

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 6: Database Location Route (POST /api/save-location)
    // -------------------------------------------------------------------------
    console.log('--- Section 6: Database Location Save Route (POST /api/save-location) ---');

    // 6.1 Valid location save (flat payload)
    const validPayload1 = {
      userId: 'usr_sih_test_001',
      cityName: 'New Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      preferredPersona: 'Agriculture/Gardeners'
    };
    const saveRes1 = await axios.post(`${baseUrl}/api/save-location`, validPayload1);
    assertTest(
      'POST /api/save-location saves valid flat payload with HTTP 201',
      saveRes1.status === 201 && saveRes1.data.success === true && saveRes1.data.data.userId === 'usr_sih_test_001'
    );

    // 6.2 Valid location save (nested location payload)
    const validPayload2 = {
      userId: 'usr_sih_test_002',
      location: {
        cityName: 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946
      },
      preferredPersona: 'Outdoor Fitness'
    };
    const saveRes2 = await axios.post(`${baseUrl}/api/save-location`, validPayload2);
    assertTest(
      'POST /api/save-location supports nested location object with HTTP 201',
      saveRes2.status === 201 && saveRes2.data.success === true && saveRes2.data.data.userId === 'usr_sih_test_002'
    );

    // 6.3 Missing userId validation
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        cityName: 'Kolkata',
        latitude: 22.5726,
        longitude: 88.3639
      });
      assertTest('Rejects save-location missing userId with HTTP 400', false, 'Should have returned 400');
    } catch (err) {
      assertTest('Rejects save-location missing userId with HTTP 400', err.response?.status === 400 && err.response?.data?.message.includes('userId'));
    }

    // 6.4 Missing cityName validation
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        userId: 'usr_test_fail',
        latitude: 22.5726,
        longitude: 88.3639
      });
      assertTest('Rejects save-location missing cityName with HTTP 400', false, 'Should have returned 400');
    } catch (err) {
      assertTest('Rejects save-location missing cityName with HTTP 400', err.response?.status === 400 && err.response?.data?.message.includes('cityName'));
    }

    // 6.5 Invalid coordinate validation in save route
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        userId: 'usr_test_coords',
        cityName: 'Nowhere',
        latitude: 999,
        longitude: 77.209
      });
      assertTest('Rejects save-location with out-of-bounds latitude (999) with HTTP 400', false, 'Should have returned 400');
    } catch (err) {
      assertTest('Rejects save-location with out-of-bounds latitude (999) with HTTP 400', err.response?.status === 400);
    }

    // 6.6 Unrecognized persona enum validation
    try {
      await axios.post(`${baseUrl}/api/save-location`, {
        userId: 'usr_test_persona',
        cityName: 'Chennai',
        latitude: 13.0827,
        longitude: 80.2707,
        preferredPersona: 'UnknownPersonaType'
      });
      assertTest('Rejects unrecognized preferredPersona enum with HTTP 400', false, 'Should have returned 400');
    } catch (err) {
      assertTest('Rejects unrecognized preferredPersona enum with HTTP 400', err.response?.status === 400 && err.response?.data?.message.includes('Invalid preferredPersona'));
    }

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 7: 404 Fallback
    // -------------------------------------------------------------------------
    console.log('--- Section 7: 404 Route Handling ---');
    try {
      await axios.get(`${baseUrl}/api/non-existent-route`);
      assertTest('Non-existent route returns 404', false, 'Should have returned 404');
    } catch (err) {
      assertTest('Non-existent route returns clean JSON HTTP 404', err.response?.status === 404 && err.response?.data?.statusCode === 404);
    }

    console.log('');
    console.log('================================================================================');
    console.log(` ALL ${passedTests}/${totalTests} SERVER INTEGRATION TESTS PASSED!`);
    console.log('================================================================================\n');

    // Print sample weather & persona payload output from Delhi
    console.log('Sample Response Output (GET /api/weather?latitude=28.61&longitude=77.23):');
    console.log(
      JSON.stringify(
        {
          success: weatherRes1.data.success,
          coordinates: weatherRes1.data.coordinates,
          weatherSummary: {
            temperature: `${weatherData.temperature}°C`,
            humidity: `${weatherData.humidity}%`,
            pm2_5: `${weatherData.pm2_5} µg/m³`,
            uvIndex: weatherData.uvIndex,
            source: weatherData.source,
            isCached: weatherData.isCached
          },
          personasPreview: Object.keys(personas).reduce((acc, p) => {
            acc[p] = { alertLevel: personas[p].alertLevel, recommendation: personas[p].recommendationText.slice(0, 70) + '...' };
            return acc;
          }, {})
        },
        null,
        2
      )
    );
  } finally {
    // Ensure clean teardown of the test server
    server.close();
  }
}

runServerTests().catch((err) => {
  console.error('\nFatal failure during server test execution:', err);
  process.exit(1);
});
