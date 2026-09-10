/**
 * SIH26076: Mausam App - Frontend UI Dashboard Automated Test Suite (testFrontend.js)
 *
 * Verifies:
 *  1. GET / with browser Accept header (text/html) serves index.html dashboard
 *  2. HTML contains all core UI elements:
 *     - Tailwind CSS CDN and prominent Mausam header
 *     - Searchable Indian city preset dropdown (Delhi, Mumbai, Bengaluru, Udaipur, Bikaner)
 *     - Custom coordinate inputs (lat, lon, cityName, submit button)
 *     - Primary meteorological cards (temp, humidity, PM2.5, wave height, UV, soil)
 *     - 8-tab grid layout and active persona spotlight viewer
 *     - Fallback offline alert banner and live Multi-Source status badges
 *     - Save/bookmark location modal
 *  3. GET /app.js returns the client-side JavaScript controller:
 *     - Contains PRESET_LOCATIONS with Udaipur and Bikaner
 *     - Contains fetchWeather, renderPersonaCards, displayActivePersonaDetail
 *  4. GET /styles.css returns frontend stylesheet with persona-card & active-selected styles
 *  5. Content Negotiation: GET / with Accept: application/json returns API service discovery metadata
 *  6. End-to-end integration of frontend-targeted API response and 8-persona structure
 */

const axios = require('axios');
const app = require('./app');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - FRONTEND UI DASHBOARD TEST SUITE');
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

async function runFrontendTests() {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Harness] Frontend test server running at: ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Browser Navigation GET / (HTML Dashboard)
    // -------------------------------------------------------------------------
    console.log('--- Section 1: Dashboard HTML Layout & UI Elements ---');
    const htmlRes = await axios.get(`${baseUrl}/`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    assertTest('GET / with Accept: text/html returns HTTP 200 OK', htmlRes.status === 200);
    assertTest(
      'Response Content-Type includes text/html',
      htmlRes.headers['content-type'] && htmlRes.headers['content-type'].includes('text/html')
    );

    const html = htmlRes.data;
    assertTest('HTML document contains Mausam page title', html.includes('<title>Mausam - AI Weather & Persona Insights (SIH26076)</title>'));
    assertTest('HTML loads Tailwind CSS CDN', html.includes('cdn.tailwindcss.com'));
    assertTest('HTML contains prominent Mausam branding and SIH26076 identifier', html.includes('Mausam') && html.includes('SIH26076'));
    assertTest('HTML contains preset container and coordinate search form', html.includes('id="coordForm"') && html.includes('id="presetChipsContainer"'));
    assertTest('HTML contains searchable city dropdown and datalist input', html.includes('id="presetCitySelect"') && html.includes('id="citySearchInput"'));
    assertTest('HTML contains presets for Udaipur and Bikaner', html.includes('Udaipur') && html.includes('Bikaner'));
    assertTest('HTML contains primary weather metrics display elements', html.includes('id="tempValue"') && html.includes('id="humidityVal"') && html.includes('id="pm25Val"') && html.includes('id="waveVal"'));
    assertTest('HTML contains 8-persona recommendations grid container', html.includes('id="personasContainer"') && html.includes('id="personaFilterTabs"'));
    assertTest('HTML contains active persona spotlight detail component', html.includes('id="activePersonaSpotlight"'));
    assertTest('HTML contains offline fallback warning banner element', html.includes('id="offlineBanner"') && html.includes('Offline Fallback Mode Active'));
    assertTest('HTML contains live data source badge indicator', html.includes('id="sourceStatusBadge"') && html.includes('id="sourceStatusText"'));
    assertTest('HTML contains bookmark modal for saving locations', html.includes('id="saveModal"') && html.includes('id="saveLocationForm"'));

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 2: Static Asset Serving (app.js & styles.css)
    // -------------------------------------------------------------------------
    console.log('--- Section 2: Frontend Static Asset Serving ---');

    const jsRes = await axios.get(`${baseUrl}/app.js`);
    assertTest('GET /app.js returns HTTP 200 OK', jsRes.status === 200);
    assertTest(
      'app.js includes PRESET_LOCATIONS with Delhi, Mumbai, Bengaluru, Udaipur, Bikaner',
      jsRes.data.includes('PRESET_LOCATIONS') &&
      jsRes.data.includes('Delhi') &&
      jsRes.data.includes('Mumbai') &&
      jsRes.data.includes('Bengaluru') &&
      jsRes.data.includes('Udaipur') &&
      jsRes.data.includes('Bikaner')
    );
    assertTest(
      'app.js includes fetchWeather, renderPersonaCards, and displayActivePersonaDetail controllers',
      jsRes.data.includes('fetchWeather') &&
      jsRes.data.includes('renderPersonaCards') &&
      jsRes.data.includes('displayActivePersonaDetail')
    );

    const cssRes = await axios.get(`${baseUrl}/styles.css`);
    assertTest('GET /styles.css returns HTTP 200 OK', cssRes.status === 200);
    assertTest('styles.css contains persona-card styles', cssRes.data.includes('.persona-card'));
    assertTest('styles.css contains active-selected card styles', cssRes.data.includes('.persona-card.active-selected'));

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 3: Content Negotiation (API JSON metadata on Accept: application/json)
    // -------------------------------------------------------------------------
    console.log('--- Section 3: Content Negotiation Backwards Compatibility ---');

    const jsonRes = await axios.get(`${baseUrl}/`, {
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    });
    assertTest('GET / with Accept: application/json returns HTTP 200 JSON', jsonRes.status === 200);
    assertTest(
      'JSON response preserves API service discovery metadata',
      jsonRes.data.name && jsonRes.data.name.includes('Mausam App') && jsonRes.data.documentation === 'GET /api-docs'
    );

    console.log('');

    // -------------------------------------------------------------------------
    // TEST 4: Frontend Client API Consumption & Persona Verification
    // -------------------------------------------------------------------------
    console.log('--- Section 4: Frontend Client API Consumption & 8 Personas ---');

    const weatherRes = await axios.get(`${baseUrl}/api/weather?latitude=28.6139&longitude=77.2090`);
    assertTest('GET /api/weather responds with success=true for New Delhi', weatherRes.status === 200 && weatherRes.data.success === true);
    assertTest('Payload provides all 8 personas needed for UI cards', Object.keys(weatherRes.data.personas).length === 8);
    assertTest('Payload includes isFallback flag for status badge rendering', typeof weatherRes.data.weather.isFallback === 'boolean');
    assertTest('Payload includes isCached flag for cache tag rendering', typeof weatherRes.data.weather.isCached === 'boolean');

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
      const pData = weatherRes.data.personas[pName];
      assertTest(
        `Persona [${pName}] provides valid alertLevel and recommendationText`,
        pData &&
        ['Safe', 'Warning', 'Danger'].includes(pData.alertLevel) &&
        typeof pData.recommendationText === 'string' &&
        pData.recommendationText.length > 10
      );
    });

    console.log('');
    console.log('================================================================================');
    console.log(` ALL ${passedTests}/${totalTests} FRONTEND INTEGRATION TESTS PASSED!`);
    console.log('================================================================================\n');
  } finally {
    server.close();
  }
}

runFrontendTests().catch((err) => {
  console.error('\nFatal failure during frontend test execution:', err);
  process.exit(1);
});
