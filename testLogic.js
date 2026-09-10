/**
 * SIH26076: Mausam App - Persona Logic Engine Test Harness
 *
 * Imports existing mockData payload, executes generatePersonaDashboards(),
 * and logs the resulting 8 persona dashboards with alert levels and recommendations.
 */

const mockData = require('./mockData');
const {
  generatePersonaDashboards,
  calculateTHI,
  calculateHeatIndex,
  calculateWetBulbCelsius,
  evaluateHealthConscious,
  evaluateOutdoorFitness,
  evaluateBeachgoersSurfers,
  evaluateAgricultureGardeners,
  evaluateCommuters,
  evaluateParentsFamilies,
  evaluateEventPlanners,
  evaluateTravelers
} = require('./personaLogic');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - PERSONA LOGIC ENGINE VERIFICATION');
console.log('================================================================================\n');

console.log('--- Input Meteorological Payload (mockData.js) ---');
console.log(JSON.stringify(mockData, null, 2));
console.log('\n--------------------------------------------------------------------------------');
console.log('Generating Persona Dashboards for Baseline Mock Data...');
console.log('--------------------------------------------------------------------------------\n');

const dashboards = generatePersonaDashboards(mockData);

// Format and display each of the 8 persona dashboards
const personaNames = Object.keys(dashboards);
console.log(`Successfully generated ${personaNames.length} persona dashboards:\n`);

personaNames.forEach((name, index) => {
  const item = dashboards[name];
  const badge =
    item.alertLevel === 'Danger'
      ? '🔴 [DANGER]'
      : item.alertLevel === 'Warning'
      ? '🟡 [WARNING]'
      : '🟢 [SAFE]';

  console.log(`${index + 1}. Persona: "${name}"`);
  console.log(`   Status:          ${badge} ${item.alertLevel}`);
  console.log(`   Recommendation:  ${item.recommendationText}`);
  console.log('');
});

console.log('--------------------------------------------------------------------------------');
console.log('Full JSON Output Structure Contract Verification:');
console.log('--------------------------------------------------------------------------------');
console.log(JSON.stringify(dashboards, null, 2));

// =============================================================================
// COMPREHENSIVE PERSONA LOGIC & PSYCHROMETRIC UNIT TEST SUITE
// =============================================================================
console.log('\n================================================================================');
console.log(' AUTONOMOUS VERIFICATION: PERSONA LOGIC RULES & WARNING THRESHOLDS');
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

// -----------------------------------------------------------------------------
// SECTION 1: PSYCHROMETRIC & BIOCLIMATIC FORMULA UNIT TESTS
// -----------------------------------------------------------------------------
console.log('--- Section 1: Psychrometric & Bioclimatic Formula Precision ---');

const wetBulb = calculateWetBulbCelsius(30, 60);
assertTest(
  'calculateWetBulbCelsius computes Stull empirical psychrometric value (~23.8°C for 30°C / 60% RH)',
  wetBulb > 23.0 && wetBulb < 24.5
);

const hiComfortable = calculateHeatIndex(22, 50);
const hiSweltering = calculateHeatIndex(35, 70);
assertTest(
  'calculateHeatIndex returns dry bulb temp for comfortable ambient (< 25°C)',
  hiComfortable === 22
);
assertTest(
  'calculateHeatIndex calculates extreme apparent temperature (> 45°C) for 35°C / 70% RH',
  hiSweltering > 45.0
);

const thiComfortable = calculateTHI(22, 45);
const thiExtreme = calculateTHI(34, 70);
assertTest(
  'calculateTHI calculates comfortable biometeorological score (< 75) for 22°C / 45% RH',
  thiComfortable < 75.0
);
assertTest(
  'calculateTHI calculates severe discomfort score (> 80) for 34°C / 70% RH',
  thiExtreme > 80.0
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 2: HEALTH-CONSCIOUS / RESPIRATORY PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 2: Health-Conscious / Respiratory & Sensitive Rules ---');

const healthSafe = evaluateHealthConscious({ pm2_5: 20, pm10: 40, uvIndex: 3 });
assertTest(
  'Health-Conscious: Safe status when AQI and UV are within baseline limits',
  healthSafe.alertLevel === 'Safe' && healthSafe.recommendationText.includes('healthy baseline limits')
);

const healthWarnPM25 = evaluateHealthConscious({ pm2_5: 65, pm10: 80, uvIndex: 4 });
assertTest(
  'Health-Conscious: Warning triggered when PM2.5 > 60 µg/m³ (asthma / inhaler advisory)',
  healthWarnPM25.alertLevel === 'Warning' && healthWarnPM25.recommendationText.includes('PM2.5: 65')
);

const healthWarnPM10 = evaluateHealthConscious({ pm2_5: 30, pm10: 110, uvIndex: 4 });
assertTest(
  'Health-Conscious: Warning triggered when PM10 > 100 µg/m³',
  healthWarnPM10.alertLevel === 'Warning'
);

const healthWarnUV = evaluateHealthConscious({ pm2_5: 20, pm10: 30, uvIndex: 7 });
assertTest(
  'Health-Conscious: Warning triggered when UV Index > 6 (SPF 30+ sunglasses advisory)',
  healthWarnUV.alertLevel === 'Warning' && healthWarnUV.recommendationText.includes('SPF 30+')
);

const healthDangerPM25 = evaluateHealthConscious({ pm2_5: 135, pm10: 80, uvIndex: 4 });
assertTest(
  'Health-Conscious: Danger triggered when PM2.5 > 120 µg/m³ (N95 mask & HEPA advisory)',
  healthDangerPM25.alertLevel === 'Danger' && healthDangerPM25.recommendationText.includes('N95 mask')
);

const healthDangerPM10 = evaluateHealthConscious({ pm2_5: 30, pm10: 260, uvIndex: 4 });
assertTest(
  'Health-Conscious: Danger triggered when PM10 > 250 µg/m³',
  healthDangerPM10.alertLevel === 'Danger'
);

const healthDangerUV = evaluateHealthConscious({ pm2_5: 20, pm10: 30, uvIndex: 8.5 });
assertTest(
  'Health-Conscious: Danger triggered when UV Index >= 8 (SPF 50+ & avoid midday sun)',
  healthDangerUV.alertLevel === 'Danger' && healthDangerUV.recommendationText.includes('SPF 50+')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 3: OUTDOOR FITNESS / ATHLETES PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 3: Outdoor Fitness / Athlete Rules ---');

const fitnessSafe = evaluateOutdoorFitness({ temperature: 20, humidity: 50 });
assertTest(
  'Outdoor Fitness: Safe status during optimal thermal conditions (20°C / 50% RH)',
  fitnessSafe.alertLevel === 'Safe' && fitnessSafe.recommendationText.includes('Optimal running conditions')
);

const fitnessHighHeat = evaluateOutdoorFitness({ temperature: 33, humidity: 40 });
assertTest(
  'Outdoor Fitness: Warning triggered when Temp >= 32°C (recommends running hours 5:30-7:00 AM)',
  fitnessHighHeat.alertLevel === 'Warning' && fitnessHighHeat.recommendationText.includes('Best running hours')
);

const fitnessHeatHumid = evaluateOutdoorFitness({ temperature: 29, humidity: 70 });
assertTest(
  'Outdoor Fitness: Warning triggered for combined heat & humidity (Temp >= 28°C & Humidity >= 65%)',
  fitnessHeatHumid.alertLevel === 'Warning'
);

const fitnessCold = evaluateOutdoorFitness({ temperature: 6, humidity: 50 });
assertTest(
  'Outdoor Fitness: Warning triggered for cold stress (Temp <= 8°C, advises 15-min indoor warm-up)',
  fitnessCold.alertLevel === 'Warning' && fitnessCold.recommendationText.includes('Warm up thoroughly indoors')
);

const fitnessExtreme = evaluateOutdoorFitness({ temperature: 39, humidity: 50 });
assertTest(
  'Outdoor Fitness: Danger triggered for extreme heat (Temp >= 38°C, midday workouts strongly discouraged)',
  fitnessExtreme.alertLevel === 'Danger' && fitnessExtreme.recommendationText.includes('Midday workouts strongly discouraged')
);

const fitnessExtremeHI = evaluateOutdoorFitness({ temperature: 35, humidity: 85 });
assertTest(
  'Outdoor Fitness: Danger triggered when apparent heat index >= 40°C',
  fitnessExtremeHI.alertLevel === 'Danger'
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 4: BEACHGOERS / SURFERS / COASTAL WORKERS PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 4: Beachgoers / Surfers / Coastal Worker Rules ---');

const beachSafe = evaluateBeachgoersSurfers({ waveHeight: 0.8, windSpeed: 15 });
assertTest(
  'Beachgoers/Surfers: Safe status (Green Flag) for calm seas (Wave < 1.5m, Wind < 25 km/h)',
  beachSafe.alertLevel === 'Safe' && beachSafe.recommendationText.includes('Green Flag Alert')
);

const beachWarnWave = evaluateBeachgoersSurfers({ waveHeight: 1.8, windSpeed: 15 });
assertTest(
  'Beachgoers/Surfers: Warning status (Yellow Flag) when wave height >= 1.5m',
  beachWarnWave.alertLevel === 'Warning' && beachWarnWave.recommendationText.includes('Yellow Flag Alert')
);

const beachWarnWind = evaluateBeachgoersSurfers({ waveHeight: 1.0, windSpeed: 30 });
assertTest(
  'Beachgoers/Surfers: Warning status (Yellow Flag) when wind speed >= 25 km/h',
  beachWarnWind.alertLevel === 'Warning' && beachWarnWind.recommendationText.includes('Yellow Flag Alert')
);

const beachDangerWave = evaluateBeachgoersSurfers({ waveHeight: 2.8, windSpeed: 15 });
assertTest(
  'Beachgoers/Surfers: Danger status (Red Flag) when wave height >= 2.5m (unsafe for swimming)',
  beachDangerWave.alertLevel === 'Danger' && beachDangerWave.recommendationText.includes('Red Flag Alert')
);

const beachDangerWind = evaluateBeachgoersSurfers({ waveHeight: 1.0, windSpeed: 50 });
assertTest(
  'Beachgoers/Surfers: Danger status (Red Flag) when wind speed >= 45 km/h',
  beachDangerWind.alertLevel === 'Danger' && beachDangerWind.recommendationText.includes('Red Flag Alert')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 5: AGRICULTURE / FARMERS / GARDENERS PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 5: Agriculture / Farmers / Gardener Rules ---');

const agriSafe = evaluateAgricultureGardeners({ temperature: 24, soilMoisture: 0.28 });
assertTest(
  'Agriculture: Safe status during optimal soil moisture and favorable crop temperatures',
  agriSafe.alertLevel === 'Safe' && agriSafe.recommendationText.includes('optimal range')
);

const agriLowMoisture = evaluateAgricultureGardeners({ temperature: 24, soilMoisture: 0.15 });
assertTest(
  'Agriculture: Warning triggered when soil moisture < 0.20 m³/m³ (advises irrigation)',
  agriLowMoisture.alertLevel === 'Warning' && agriLowMoisture.recommendationText.includes('irrigation')
);

const agriSaturation = evaluateAgricultureGardeners({ temperature: 24, soilMoisture: 0.50 });
assertTest(
  'Agriculture: Warning triggered when soil moisture > 0.45 m³/m³ (waterlogging alert)',
  agriSaturation.alertLevel === 'Warning' && agriSaturation.recommendationText.includes('Soil saturation alert')
);

const agriFrostWatch = evaluateAgricultureGardeners({ temperature: 5.5, soilMoisture: 0.25 });
assertTest(
  'Agriculture: Frost Watch warning triggered when 4.0°C < Temp <= 6.5°C',
  agriFrostWatch.alertLevel === 'Warning' && agriFrostWatch.recommendationText.includes('Frost Watch')
);

const agriHeatwave = evaluateAgricultureGardeners({ temperature: 42, soilMoisture: 0.25 });
assertTest(
  'Agriculture: Extreme heatwave warning triggered when Temp >= 40.0°C (shade netting advisory)',
  agriHeatwave.alertLevel === 'Warning' && agriHeatwave.recommendationText.includes('Extreme Heatwave Stress')
);

const agriCriticalFrost = evaluateAgricultureGardeners({ temperature: 3.0, soilMoisture: 0.25 });
assertTest(
  'Agriculture: CRITICAL FROST ALERT Danger triggered when Temp <= 4.0°C (protect rabi crops)',
  agriCriticalFrost.alertLevel === 'Danger' && agriCriticalFrost.recommendationText.includes('CRITICAL FROST ALERT')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 6: COMMUTERS / TRANSIT DRIVERS PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 6: Commuters & Transit Driver Rules ---');

const commuteSafe = evaluateCommuters({ visibility: 7500, rainProb: 10 });
assertTest(
  'Commuters: Safe status when visibility is high and rain probability is low',
  commuteSafe.alertLevel === 'Safe' && commuteSafe.recommendationText.includes('Clear commute conditions')
);

const commuteModFog = evaluateCommuters({ visibility: 800, rainProb: 10 });
assertTest(
  'Commuters: Warning triggered for moderate fog (500m <= visibility < 1000m)',
  commuteModFog.alertLevel === 'Warning' && commuteModFog.recommendationText.includes('Fog/Smog Advisory')
);

const commuteRain = evaluateCommuters({ visibility: 3000, rainProb: 55 });
assertTest(
  'Commuters: Warning triggered for probable rain (rain probability >= 50%)',
  commuteRain.alertLevel === 'Warning' && commuteRain.recommendationText.includes('Rain Transit Advisory')
);

const commuteDenseFog = evaluateCommuters({ visibility: 350, rainProb: 10 });
assertTest(
  'Commuters: Danger triggered for dense fog (visibility < 500m, low-beam fog lamps needed)',
  commuteDenseFog.alertLevel === 'Danger' && commuteDenseFog.recommendationText.includes('Critical low visibility')
);

const commuteSevereStorm = evaluateCommuters({ visibility: 750, rainProb: 75 });
assertTest(
  'Commuters: Danger triggered for moderate fog + severe rain (visibility < 1000m & rain >= 70%)',
  commuteSevereStorm.alertLevel === 'Danger' && commuteSevereStorm.recommendationText.includes('Severe Travel Hazard')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 7: PARENTS & FAMILIES / SCHOOL COMMUTE PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 7: Parents & Families / School Commute Rules ---');

const parentSafe = evaluateParentsFamilies({ temperature: 25, rainProb: 15, pm2_5: 20 });
assertTest(
  'Parents & Families: Safe status for mild weather and clear skies',
  parentSafe.alertLevel === 'Safe' && parentSafe.recommendationText.includes('Pleasant and safe weather')
);

const parentRainGear = evaluateParentsFamilies({ temperature: 25, rainProb: 65, pm2_5: 20 });
assertTest(
  'Parents & Families: Warning triggered when rain probability >= 60% (pack raincoat / umbrella)',
  parentRainGear.alertLevel === 'Warning' && parentRainGear.recommendationText.includes('Pack a sturdy raincoat')
);

const parentPollutionWarn = evaluateParentsFamilies({ temperature: 25, rainProb: 15, pm2_5: 70 });
assertTest(
  'Parents & Families: Warning triggered for moderate pollution (PM2.5 >= 60 µg/m³)',
  parentPollutionWarn.alertLevel === 'Warning' && parentPollutionWarn.recommendationText.includes('Moderate pollution')
);

const parentPollutionDanger = evaluateParentsFamilies({ temperature: 25, rainProb: 15, pm2_5: 130 });
assertTest(
  'Parents & Families: Danger triggered for hazardous air quality (PM2.5 >= 120 µg/m³, N95 masks)',
  parentPollutionDanger.alertLevel === 'Danger' && parentPollutionDanger.recommendationText.includes('N95 masks')
);

const parentHighTemp = evaluateParentsFamilies({ temperature: 39, rainProb: 15, pm2_5: 20 });
assertTest(
  'Parents & Families: Warning triggered for high heat (Temp >= 38°C, insulated water bottles)',
  parentHighTemp.alertLevel === 'Warning' && parentHighTemp.recommendationText.includes('High temperature alert')
);

const parentCold = evaluateParentsFamilies({ temperature: 8, rainProb: 15, pm2_5: 20 });
assertTest(
  'Parents & Families: Warning triggered for cold morning commute (Temp <= 10°C, thermal innerwear)',
  parentCold.alertLevel === 'Warning' && parentCold.recommendationText.includes('Cold morning commute')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 8: EVENT PLANNERS / OUTDOOR GATHERINGS PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 8: Event Planners / Outdoor Gathering Rules ---');

const eventSafe = evaluateEventPlanners({ temperature: 22, humidity: 45 });
assertTest(
  'Event Planners: Safe status when THI < 75 (comfortable biometeorological climate)',
  eventSafe.alertLevel === 'Safe' && eventSafe.recommendationText.includes('Comfortable outdoor event conditions')
);

const eventWarn = evaluateEventPlanners({ temperature: 28, humidity: 60 });
assertTest(
  'Event Planners: Warning triggered when 75 <= THI <= 80 (Noticeable Discomfort Index)',
  eventWarn.alertLevel === 'Warning' && eventWarn.recommendationText.includes('Noticeable Discomfort Index')
);

const eventDanger = evaluateEventPlanners({ temperature: 35, humidity: 75 });
assertTest(
  'Event Planners: Danger triggered when THI > 80 (Extreme Heat-Humidity Alert, warn against outdoor events)',
  eventDanger.alertLevel === 'Danger' && eventDanger.recommendationText.includes('Extreme Heat-Humidity Alert')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 9: TRAVELERS / TOURISTS PERSONA
// -----------------------------------------------------------------------------
console.log('--- Section 9: Travelers / Tourist Packing Rules ---');

const travelerFreezing = evaluateTravelers({ temperature: 1, rainProb: 20 });
assertTest(
  'Travelers: Danger triggered for freezing cold (Temp <= 4°C, heavy thermal innerwear & down parka)',
  travelerFreezing.alertLevel === 'Danger' && travelerFreezing.recommendationText.includes('Freezing cold')
);

const travelerChilly = evaluateTravelers({ temperature: 10, rainProb: 20 });
assertTest(
  'Travelers: Warning triggered for chilly conditions (5°C <= Temp <= 12°C, fleece pullovers)',
  travelerChilly.alertLevel === 'Warning' && travelerChilly.recommendationText.includes('Chilly weather')
);

const travelerMild = evaluateTravelers({ temperature: 18, rainProb: 20 });
assertTest(
  'Travelers: Safe status for mild conditions (13°C <= Temp <= 22°C, layering pieces)',
  travelerMild.alertLevel === 'Safe' && travelerMild.recommendationText.includes('Mild/Pleasant weather')
);

const travelerWarm = evaluateTravelers({ temperature: 28, rainProb: 20 });
assertTest(
  'Travelers: Safe status for warm climate (23°C <= Temp <= 35°C, lightweight cotton/linen)',
  travelerWarm.alertLevel === 'Safe' && travelerWarm.recommendationText.includes('Warm climate')
);

const travelerExtremeHeat = evaluateTravelers({ temperature: 38, rainProb: 20 });
assertTest(
  'Travelers: Warning triggered for extreme heat (Temp > 35°C, ultra-light apparel & cooling towels)',
  travelerExtremeHeat.alertLevel === 'Warning' && travelerExtremeHeat.recommendationText.includes('Extreme heat')
);

const travelerRain = evaluateTravelers({ temperature: 25, rainProb: 70 });
assertTest(
  'Travelers: Warning triggered when rain probability >= 60% (waterproof poncho & umbrella)',
  travelerRain.alertLevel === 'Warning' && travelerRain.recommendationText.includes('High rain probability')
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 10: BASELINE MOCK DATA CONTRACT & RESILIENCY VERIFICATION
// -----------------------------------------------------------------------------
console.log('--- Section 10: Baseline Mock Data Contract & Resiliency ---');

const baselineDashboards = generatePersonaDashboards(mockData);
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

assertTest(
  'generatePersonaDashboards generates exact 8 persona dashboards for baseline mock data',
  Object.keys(baselineDashboards).length === 8
);

expectedPersonas.forEach((pName) => {
  const p = baselineDashboards[pName];
  const valid = p && ['Safe', 'Warning', 'Danger'].includes(p.alertLevel) && typeof p.recommendationText === 'string' && p.recommendationText.length > 0;
  assertTest(`Persona contract fulfilled for [${pName}]: alertLevel=${p?.alertLevel}`, valid);
});

const fallbackDashboards = generatePersonaDashboards({});
assertTest(
  'generatePersonaDashboards gracefully evaluates complete dashboards from empty weather object ({}) without crashing',
  Object.keys(fallbackDashboards).length === 8
);

console.log('\n================================================================================');
console.log(` ALL ${passedTests}/${totalTests} PERSONA LOGIC & PSYCHROMETRIC TESTS PASSED!`);
console.log('================================================================================\n');
