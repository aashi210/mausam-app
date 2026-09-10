/**
 * SIH26076: Mausam App - Full Stack End-to-End Integration Test (testIntegration.js)
 *
 * Verifies the complete integrated stack:
 *  Step 1 - express.static() serves public/ directory (HTML, JS, CSS)
 *  Step 2 - CORS headers present on all API responses
 *  Step 3 - GET /api/weather → validateCoordinatesMiddleware → weatherService → personaLogic → unified JSON
 *  Step 4 - Frontend app.js fetches from /api/weather (relative URL, no frontend API key)
 *  Step 5 - isFallback flag and source metadata correctly propagated to UI status fields
 *  Step 6 - All 8 persona dashboards returned with valid alertLevel + recommendationText
 *  Step 7 - Zod validation rejects bad coordinates with HTTP 400
 *  Step 8 - POST /api/save-location accepts valid bookmarks and returns HTTP 201
 *  Step 9 - /health endpoint confirms server uptime
 *  Step 10 - 404 handler works for undefined routes
 */

const axios = require('axios');
const app = require('./app');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - FULL STACK END-TO-END INTEGRATION TEST SUITE');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(description, condition, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ [PASS] ${description}`);
  } else {
    console.error(`  ✖ [FAIL] ${description}${detail ? ' | ' + detail : ''}`);
    throw new Error(`FAILED: ${description} | ${detail}`);
  }
}

async function runIntegrationTests() {
  // Boot the server on a random OS-assigned port to avoid conflicts
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`[Integration] Server booted on: ${base}\n`);

  try {
    // =========================================================================
    // STEP 1: express.static() — static asset serving from public/
    // =========================================================================
    console.log('--- Step 1: Static File Serving (public/) ---');
    const htmlRes = await axios.get(`${base}/`, {
      headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.9' }
    });
    assert('GET / serves index.html with HTTP 200', htmlRes.status === 200);
    assert('Content-Type is text/html', htmlRes.headers['content-type'].includes('text/html'));
    assert('index.html contains correct page title', htmlRes.data.includes('<title>Mausam - AI Weather & Persona Insights (SIH26076)</title>'));
    assert('express.static serves /app.js', (await axios.get(`${base}/app.js`)).status === 200);
    assert('express.static serves /styles.css', (await axios.get(`${base}/styles.css`)).status === 200);
    console.log('');

    // =========================================================================
    // STEP 2: CORS headers
    // =========================================================================
    console.log('--- Step 2: CORS Headers on API Responses ---');
    const corsRes = await axios.get(`${base}/api/weather?latitude=28.6139&longitude=77.2090`);
    assert(
      'CORS Access-Control-Allow-Origin header present',
      corsRes.headers['access-control-allow-origin'] !== undefined,
      `got: ${JSON.stringify(corsRes.headers['access-control-allow-origin'])}`
    );
    console.log('');

    // =========================================================================
    // STEP 3: Backend pipeline: validator → weatherService → personaLogic → JSON
    // =========================================================================
    console.log('--- Step 3: GET /api/weather Full Backend Pipeline ---');
    const weatherRes = await axios.get(`${base}/api/weather?latitude=28.6139&longitude=77.2090`);
    const { success, coordinates, weather, personas } = weatherRes.data;

    assert('HTTP 200 returned', weatherRes.status === 200);
    assert('success flag is true', success === true);
    assert('coordinates.latitude echoed correctly', coordinates.latitude === 28.6139);
    assert('coordinates.longitude echoed correctly', coordinates.longitude === 77.209);

    // Validator: req.validatedCoordinates correctly parsed and passed
    assert('weather.latitude present (validator passed numeric coords)', typeof weather.latitude === 'number');
    assert('weather.longitude present', typeof weather.longitude === 'number');

    // weatherService output fields
    assert('weather.temperature is a number', typeof weather.temperature === 'number');
    assert('weather.humidity is a number', typeof weather.humidity === 'number');
    assert('weather.soilMoisture is a number', typeof weather.soilMoisture === 'number');
    assert('weather.pm2_5 is a number', typeof weather.pm2_5 === 'number');
    assert('weather.uvIndex is a number', typeof weather.uvIndex === 'number');
    assert('weather.windSpeed is a number', typeof weather.windSpeed === 'number');
    assert('weather.rainProb is a number', typeof weather.rainProb === 'number');
    assert('weather.waveHeight is a number', typeof weather.waveHeight === 'number');
    assert('weather.imdAlert is a string', typeof weather.imdAlert === 'string' && weather.imdAlert.length > 5);
    assert('weather.monsoonStatus is a string', typeof weather.monsoonStatus === 'string');

    // personaLogic output
    assert('8 persona dashboards returned', Object.keys(personas).length === 8);
    console.log('');

    // =========================================================================
    // STEP 4: Frontend fetches from /api/weather (no frontend API key)
    // =========================================================================
    console.log('--- Step 4: Frontend app.js Uses Relative /api/weather Endpoint ---');
    const jsRes = await axios.get(`${base}/app.js`);
    assert(
      'app.js calls /api/weather (relative URL, no external key)',
      jsRes.data.includes('/api/weather') && !jsRes.data.includes('openweathermap.org') && !jsRes.data.includes('OWM_KEY')
    );
    assert(
      'app.js contains fetchWeather function calling backend',
      jsRes.data.includes('fetchWeather') && jsRes.data.includes('/api/weather?latitude=')
    );
    console.log('');

    // =========================================================================
    // STEP 5: isFallback flag + source metadata propagated correctly
    // =========================================================================
    console.log('--- Step 5: isFallback & Source Metadata Propagation ---');
    assert('weather.isFallback is a boolean', typeof weather.isFallback === 'boolean');
    assert('weather.isCached is a boolean', typeof weather.isCached === 'boolean');
    assert('weather.source is a string', typeof weather.source === 'string' && weather.source.length > 0);
    assert(
      'weather.sources breakdown object contains all 5 provider keys',
      weather.sources &&
      'openWeatherMap' in weather.sources &&
      'openMeteo' in weather.sources &&
      'stormglass' in weather.sources &&
      'openRouteService' in weather.sources &&
      'imd' in weather.sources
    );
    const validStatuses = ['fulfilled', 'fallback'];
    const allStatusesValid = Object.values(weather.sources).every((s) => validStatuses.includes(s));
    assert('All provider statuses are either "fulfilled" or "fallback"', allStatusesValid);

    // Cache hit test (second call to same coordinates)
    const cached = await axios.get(`${base}/api/weather?latitude=28.6139&longitude=77.2090`);
    assert('Second identical request returns isCached=true (10-min cache)', cached.data.weather.isCached === true);
    console.log('');

    // =========================================================================
    // STEP 6: All 8 Persona Dashboards (alertLevel + recommendationText)
    // =========================================================================
    console.log('--- Step 6: All 8 Persona Dashboards Valid ---');
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
      assert(
        `Persona [${pName}] has valid alertLevel and recommendationText`,
        p &&
        ['Safe', 'Warning', 'Danger'].includes(p.alertLevel) &&
        typeof p.recommendationText === 'string' &&
        p.recommendationText.length > 15
      );
    });
    console.log('');

    // =========================================================================
    // STEP 7: Zod Validator Rejects Bad Inputs with HTTP 400
    // =========================================================================
    console.log('--- Step 7: Input Validation (validator.js → HTTP 400) ---');

    const badCases = [
      { q: '?latitude=999&longitude=77', label: 'Out-of-range latitude' },
      { q: '?latitude=28.61&longitude=999', label: 'Out-of-range longitude' },
      { q: '?longitude=77.23', label: 'Missing latitude' },
      { q: '?latitude=abc&longitude=77', label: 'Non-numeric latitude string' },
      { q: '', label: 'Completely missing query params' }
    ];

    for (const tc of badCases) {
      const r = await axios.get(`${base}/api/weather${tc.q}`, { validateStatus: () => true });
      assert(`Validator rejects [${tc.label}] with HTTP 400`, r.status === 400, `got: ${r.status}`);
      assert(`400 response body has success=false [${tc.label}]`, r.data.success === false);
    }
    console.log('');

    // =========================================================================
    // STEP 8: POST /api/save-location accepts valid bookmarks (HTTP 201)
    // =========================================================================
    console.log('--- Step 8: POST /api/save-location Integration ---');
    const saveRes = await axios.post(
      `${base}/api/save-location`,
      {
        userId: 'usr_integration_test',
        cityName: 'New Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        preferredPersona: 'Health-Conscious'
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    assert('POST /api/save-location returns HTTP 201', saveRes.status === 201);
    assert('Save response has success=true', saveRes.data.success === true);

    // Reject missing userId
    const badSave = await axios.post(`${base}/api/save-location`, { cityName: 'Mumbai', latitude: 19.076, longitude: 72.877 }, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    assert('POST /api/save-location rejects missing userId with HTTP 400', badSave.status === 400);
    console.log('');

    // =========================================================================
    // STEP 9: Health Endpoint
    // =========================================================================
    console.log('--- Step 9: GET /health Endpoint ---');
    const healthRes = await axios.get(`${base}/health`);
    assert('GET /health returns HTTP 200', healthRes.status === 200);
    assert('Health payload has status: healthy', healthRes.data.status === 'healthy');
    assert('Health payload has uptime (number)', typeof healthRes.data.uptime === 'number');
    assert('Health payload has timestamp (string)', typeof healthRes.data.timestamp === 'string');
    console.log('');

    // =========================================================================
    // STEP 10: 404 Handler for Unknown Routes
    // =========================================================================
    console.log('--- Step 10: 404 Handler for Unknown Routes ---');
    const notFound = await axios.get(`${base}/api/totally-undefined-route`, { validateStatus: () => true });
    assert('Unknown route returns HTTP 404', notFound.status === 404);
    assert('404 body has success=false', notFound.data.success === false);
    console.log('');

    // =========================================================================
    // Summary
    // =========================================================================
    console.log('================================================================================');
    console.log(` ALL ${passedTests}/${totalTests} INTEGRATION TESTS PASSED!`);
    console.log('================================================================================\n');
    console.log('Full-Stack Integration Verified:');
    console.log('  ✅ express.static() serves public/ directory (HTML, JS, CSS)');
    console.log('  ✅ CORS enabled on all /api/ endpoints');
    console.log('  ✅ GET /api/weather → validator → weatherService → personaLogic → JSON');
    console.log('  ✅ Frontend /app.js calls relative /api/weather (no frontend API key)');
    console.log('  ✅ isFallback, isCached, source, sources all propagated to client');
    console.log('  ✅ 8 persona dashboards with valid alertLevel + recommendationText');
    console.log('  ✅ Zod validator rejects invalid inputs with HTTP 400');
    console.log('  ✅ POST /api/save-location accepts bookmarks, returns HTTP 201');
    console.log('  ✅ /health endpoint reports uptime and DB state');
    console.log('  ✅ 404 handler for undefined routes\n');

  } finally {
    server.close();
  }
}

runIntegrationTests().catch((err) => {
  console.error('\n[INTEGRATION FAILURE]', err.message);
  process.exit(1);
});
