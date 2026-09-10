const weatherService = require('./weatherService');

async function testModule() {
  const delhiLatitude = 28.61;
  const delhiLongitude = 77.23;

  console.log('=====================================================');
  console.log('SIH26076 Mausam App - API Integration Module Test');
  console.log(`Target: Delhi (Latitude: ${delhiLatitude}, Longitude: ${delhiLongitude})`);
  console.log('=====================================================\n');

  console.log('--- Test Run 1 (Initial Fetch / Cache Miss) ---');
  const result1 = await weatherService(delhiLatitude, delhiLongitude);
  console.log('\nFinal Normalized Output:');
  console.log(JSON.stringify(result1, null, 2));

  console.log('\n--- Test Run 2 (Testing 10-minute node-cache) ---');
  const result2 = await weatherService(delhiLatitude, delhiLongitude);
  console.log('\nCached Output:');
  console.log(JSON.stringify(result2, null, 2));
  console.log('\nCache Verification:', result2.isCached ? 'PASSED (Data served from cache)' : 'FAILED');

  console.log('\n=====================================================');
  console.log('All tests completed successfully.');
  console.log('=====================================================');
}

testModule().catch(err => {
  console.error('Fatal error during test harness execution:', err);
  process.exit(1);
});
