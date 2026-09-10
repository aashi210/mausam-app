/**
 * SIH26076: Mausam App - Multi-Source Aggregator Automated Test Suite (testAggregator.js)
 *
 * Verifies:
 *  1. Ingestion of latitude & longitude coordinates
 *  2. Concurrent queries across 5 data feeds using Promise.allSettled()
 *  3. Normalization into a single flat JSON object containing all core & extended metrics
 *  4. Graceful individual field fallback substitution when third-party APIs fail, time out, or lack keys
 *  5. Complete fallback handling when all endpoints are unreachable
 *  6. 10-minute node-cache caching verification
 */

const weatherService = require('./weatherService');
const { normalizeAggregatedData, cache, mockData } = require('./weatherService');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - MULTI-SOURCE AGGREGATOR TEST SUITE');
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

async function runAggregatorTests() {
  cache.flushAll(); // Ensure clean slate for test

  const testLat = 28.6139;
  const testLon = 77.2090;

  // ---------------------------------------------------------------------------
  // TEST 1: Live Multi-Source Aggregation (Delhi)
  // ---------------------------------------------------------------------------
  console.log('--- Section 1: Live Multi-Source Concurrent Aggregation ---');
  console.log(`  Querying coordinates: Lat ${testLat}, Lon ${testLon}...`);

  const t0 = Date.now();
  const aggregatedData = await weatherService(testLat, testLon);
  const duration = Date.now() - t0;
  console.log(`  Aggregation completed in ${duration}ms.\n`);

  assertTest('Aggregator completes within strict timeout boundary (<= 5000ms)', duration <= 5000);
  assertTest('Response includes latitude and longitude numbers', aggregatedData.latitude === testLat && aggregatedData.longitude === testLon);
  assertTest('Contains numeric temperature (°C)', typeof aggregatedData.temperature === 'number');
  assertTest('Contains numeric relative humidity (%)', typeof aggregatedData.humidity === 'number');
  assertTest('Contains numeric volumetric soil moisture (m³/m³)', typeof aggregatedData.soilMoisture === 'number');
  assertTest('Contains numeric visibility (m)', typeof aggregatedData.visibility === 'number');
  assertTest('Contains numeric PM2.5 and PM10 particulate readings', typeof aggregatedData.pm2_5 === 'number' && typeof aggregatedData.pm10 === 'number');
  assertTest('Contains numeric solar UV Index', typeof aggregatedData.uvIndex === 'number');
  assertTest('Contains numeric wave height (m) and ocean current velocity (m/s)', typeof aggregatedData.waveHeight === 'number' && typeof aggregatedData.oceanCurrentVelocity === 'number');
  assertTest('Contains numeric wind speed (km/h) and rain probability (%)', typeof aggregatedData.windSpeed === 'number' && typeof aggregatedData.rainProb === 'number');
  assertTest('Contains traffic condition string (OpenRouteService / Mapbox)', typeof aggregatedData.trafficCondition === 'string' && aggregatedData.trafficCondition.length > 0);
  assertTest('Contains route conditions description', typeof aggregatedData.routeConditions === 'string' && aggregatedData.routeConditions.length > 0);
  assertTest('Contains IMD bulletin alert description', typeof aggregatedData.imdAlert === 'string' && aggregatedData.imdAlert.length > 0);
  assertTest('Contains IMD monsoon status description', typeof aggregatedData.monsoonStatus === 'string' && aggregatedData.monsoonStatus.length > 0);

  // Sources tracking object
  assertTest('Contains sources status object with all 5 providers', Boolean(aggregatedData.sources) &&
    'openWeatherMap' in aggregatedData.sources &&
    'openMeteo' in aggregatedData.sources &&
    'stormglass' in aggregatedData.sources &&
    'openRouteService' in aggregatedData.sources &&
    'imd' in aggregatedData.sources
  );

  console.log('');

  // ---------------------------------------------------------------------------
  // TEST 2: 10-Minute Caching Layer Verification
  // ---------------------------------------------------------------------------
  console.log('--- Section 2: In-Memory 10-Minute Node-Cache Verification ---');
  const cachedData = await weatherService(testLat, testLon);
  assertTest('Repeat call is served immediately from cache (isCached === true)', cachedData.isCached === true);
  assertTest('Cached payload matches original temperature', cachedData.temperature === aggregatedData.temperature);

  console.log('');

  // ---------------------------------------------------------------------------
  // TEST 3: Individual Field Graceful Fallback Substitution
  // ---------------------------------------------------------------------------
  console.log('--- Section 3: Field-by-Field Fallback Substitution Simulation ---');

  // Simulate a scenario where OWM, Stormglass, and ORS fail, but Open-Meteo & IMD succeed
  const simulatedPartialSettled = [
    { status: 'rejected', reason: new Error('OWM_KEY is missing') },
    {
      status: 'fulfilled',
      value: {
        temperature: 24.5,
        humidity: 55,
        soilMoisture: 0.18,
        visibility: 10000,
        windSpeed: 14.0,
        rainProb: 20,
        pm2_5: 35.0,
        pm10: 70.0,
        uvIndex: 4.5
      }
    },
    { status: 'rejected', reason: new Error('Stormglass 500 Server Error') },
    { status: 'rejected', reason: new Error('ORS connection timed out') },
    {
      status: 'fulfilled',
      value: {
        imdAlert: 'Yellow Alert: Isolated thunderstorms expected over NCR',
        monsoonStatus: 'Advancing Monsoon Current'
      }
    }
  ];

  const partialNormalized = normalizeAggregatedData(simulatedPartialSettled, 28.61, 77.23);

  assertTest('Selects live Open-Meteo temperature when OWM is rejected', partialNormalized.temperature === 24.5);
  assertTest('Selects live Open-Meteo soil moisture', partialNormalized.soilMoisture === 0.18);
  assertTest('Gracefully substitutes fallback wave height when Stormglass is rejected', partialNormalized.waveHeight === mockData.waveHeight);
  assertTest('Gracefully substitutes fallback traffic condition when ORS is rejected', partialNormalized.trafficCondition === mockData.trafficCondition);
  assertTest('Retains live IMD alert when IMD succeeds', partialNormalized.imdAlert.includes('Yellow Alert'));
  assertTest('Marks OWM as fallback and Open-Meteo as fulfilled in sources object',
    partialNormalized.sources.openWeatherMap === 'fallback' &&
    partialNormalized.sources.openMeteo === 'fulfilled' &&
    partialNormalized.sources.stormglass === 'fallback' &&
    partialNormalized.sources.imd === 'fulfilled'
  );
  assertTest('isFallback remains false because live provider (Open-Meteo) provided valid meteorology', partialNormalized.isFallback === false);

  console.log('');

  // ---------------------------------------------------------------------------
  // TEST 4: Total Outage Fallback Simulation
  // ---------------------------------------------------------------------------
  console.log('--- Section 4: Total Network Outage Resilience Simulation ---');

  const simulatedTotalFailure = [
    { status: 'rejected', reason: new Error('Timeout: 5000ms') },
    { status: 'rejected', reason: new Error('Timeout: 5000ms') },
    { status: 'rejected', reason: new Error('Timeout: 5000ms') },
    { status: 'rejected', reason: new Error('Timeout: 5000ms') },
    { status: 'rejected', reason: new Error('Timeout: 5000ms') }
  ];

  const totalFallback = normalizeAggregatedData(simulatedTotalFailure, 28.61, 77.23);

  assertTest('Total failure substitutes baseline mockData temperature without throwing exception', totalFallback.temperature === mockData.temperature);
  assertTest('Total failure substitutes baseline mockData soil moisture', totalFallback.soilMoisture === mockData.soilMoisture);
  assertTest('Total failure substitutes baseline mockData PM2.5', totalFallback.pm2_5 === mockData.pm2_5);
  assertTest('Total failure sets isFallback to true', totalFallback.isFallback === true);
  assertTest('Total failure sets source to mockData_fallback', totalFallback.source === 'mockData_fallback');

  console.log('');
  console.log('================================================================================');
  console.log(` ALL ${passedTests}/${totalTests} AGGREGATOR TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================================\n');

  console.log('Sample Aggregated Payload:');
  console.log(JSON.stringify(aggregatedData, null, 2));
}

runAggregatorTests().catch((err) => {
  console.error('\nFatal error during aggregator test execution:', err);
  process.exit(1);
});
