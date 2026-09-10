/**
 * SIH26076: Mausam App - Persona Logic Engine
 *
 * Ingests normalized meteorological data (temp, humidity, wind, visibility,
 * soilMoisture, PM2.5/PM10, uvIndex, waveHeight, rainProb) and outputs tailored
 * actionable recommendations and status flags ('Safe', 'Warning', 'Danger')
 * for 8 specific personas following IMD / MoES guidelines.
 */

/**
 * Calculates Wet Bulb Temperature (°C) using Stull's empirical psychrometric formula:
 * Stull, R. (2011). Wet-Bulb Temperature from Relative Humidity and Air Temperature.
 *
 * @param {number} T - Air temperature in °C
 * @param {number} RH - Relative humidity in %
 * @returns {number} Wet bulb temperature in °C
 */
function calculateWetBulbCelsius(T, RH) {
  const Tw =
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Tw;
}

/**
 * Calculates Temperature-Humidity Index (THI) using Thom's classic bioclimatic formula:
 * THI = 15 + 0.4 * (Temp + WetBulb) [with temperatures in °F, where THI > 80 signals severe discomfort/danger]
 *
 * @param {number} tempC - Air temperature in °C
 * @param {number} humidity - Relative humidity in %
 * @returns {number} Calculated THI rounded to 1 decimal place
 */
function calculateTHI(tempC, humidity) {
  // Convert dry bulb to Fahrenheit
  const tempF = (tempC * 9) / 5 + 32;
  // Compute wet bulb in Celsius, then convert to Fahrenheit
  const wetBulbC = calculateWetBulbCelsius(tempC, humidity);
  const wetBulbF = (wetBulbC * 9) / 5 + 32;

  // Thom's formula: THI = 15 + 0.4 * (Temp + WetBulb)
  const thi = 15 + 0.4 * (tempF + wetBulbF);
  return Number(thi.toFixed(1));
}

/**
 * Calculates Heat Index / Apparent Temperature in °C (Rothfusz equation)
 *
 * @param {number} tempC - Air temperature in °C
 * @param {number} humidity - Relative humidity in %
 * @returns {number} Heat Index in °C
 */
function calculateHeatIndex(tempC, humidity) {
  if (tempC < 25) return tempC;
  const T = (tempC * 9) / 5 + 32;
  const RH = humidity;

  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;
  }
  const hiC = ((HI - 32) * 5) / 9;
  return Number(hiC.toFixed(1));
}

/**
 * Evaluates conditions for Health-Conscious / Respiratory & Sensitive individuals.
 * Rule: If PM2.5 > 60 or UV > 6, issue asthma / skin sensitivity warnings.
 */
function evaluateHealthConscious(data) {
  const pm25 = data.pm2_5 ?? 0;
  const pm10 = data.pm10 ?? 0;
  const uv = data.uvIndex ?? 0;

  let alertLevel = 'Safe';
  const warnings = [];

  // Respiratory & Asthma evaluations based on IMD / CPCB thresholds
  if (pm25 > 120 || pm10 > 250) {
    alertLevel = 'Danger';
    warnings.push(
      `Severe air pollution alert (PM2.5: ${pm25} µg/m³). High risk of asthma attacks and respiratory distress. Stay indoors with HEPA air purifiers and wear an N95 mask if outdoors.`
    );
  } else if (pm25 > 60 || pm10 > 100) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    warnings.push(
      `Elevated particulate pollution (PM2.5: ${pm25} µg/m³). Sensitive individuals and asthma patients should limit prolonged outdoor exertion and keep prescribed inhalers accessible.`
    );
  }

  // UV / Skin sensitivity evaluations
  if (uv >= 8) {
    alertLevel = 'Danger';
    warnings.push(
      `Very High/Extreme UV radiation (UV Index: ${uv}). Severe risk of skin burn and eye damage. Apply broad-spectrum SPF 50+ sunscreen, wear UV sunglasses, and avoid direct sun exposure between 11 AM and 3 PM.`
    );
  } else if (uv > 6) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    warnings.push(
      `High UV radiation (UV Index: ${uv}). Elevated risk of skin damage for sensitive skin. Apply SPF 30+ sunscreen, wear protective sunglasses, and seek shade during midday hours.`
    );
  }

  let recommendationText = '';
  if (warnings.length > 0) {
    recommendationText = warnings.join(' | ');
  } else {
    recommendationText = `Air quality (PM2.5: ${pm25} µg/m³) and UV Index (${uv}) are within healthy baseline limits. Safe for all outdoor activities without special precautions.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Outdoor Fitness / Runners / Athletes.
 * Rule: Evaluate temp and humidity. Recommend "best running hours" if heat stress is too high.
 */
function evaluateOutdoorFitness(data) {
  const temp = data.temperature;
  const humidity = data.humidity;
  const heatIndex = calculateHeatIndex(temp, humidity);

  let alertLevel = 'Safe';
  let recommendationText = '';

  const isExtremeHeat = temp >= 38 || heatIndex >= 40;
  const isHighHeat = temp >= 32 || heatIndex >= 35 || (temp >= 28 && humidity >= 65);
  const isColdStress = temp <= 8;

  if (isExtremeHeat) {
    alertLevel = 'Danger';
    recommendationText = `Dangerous heat stress detected (Temp: ${temp}°C, Humidity: ${humidity}%, Apparent: ${heatIndex}°C). High risk of heat cramps and heat exhaustion during cardio. Midday workouts strongly discouraged. Best running hours: Early morning (5:00 AM – 6:30 AM) or late evening (after 8:00 PM). Ensure abundant electrolyte hydration.`;
  } else if (isHighHeat) {
    alertLevel = 'Warning';
    recommendationText = `Elevated heat stress (Temp: ${temp}°C, Humidity: ${humidity}%, Apparent: ${heatIndex}°C). Outdoor cardio during peak hours will cause rapid fatigue and dehydration. Best running hours: Early morning (5:30 AM – 7:00 AM) or late evening (after 7:30 PM). Carry water and moderate your pace.`;
  } else if (isColdStress) {
    alertLevel = 'Warning';
    recommendationText = `Cold weather conditions (${temp}°C). Risk of muscle stiffness and respiratory irritation. Warm up thoroughly indoors for 15 minutes before running, wear moisture-wicking layers, and schedule runs during daylight hours (11:00 AM – 3:00 PM).`;
  } else {
    recommendationText = `Optimal running conditions (Temp: ${temp}°C, Humidity: ${humidity}%). Low thermal strain and comfortable ambient air. Excellent weather for outdoor running and endurance training anytime.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Beachgoers / Surfers / Coastal Workers.
 * Rule: Evaluate waveHeight and windSpeed to flag unsafe swimming/surfing conditions.
 */
function evaluateBeachgoersSurfers(data) {
  const waveHeight = data.waveHeight ?? 0;
  const windSpeed = data.windSpeed ?? (data.wind ?? 10);

  let alertLevel = 'Safe';
  let recommendationText = '';

  const isDangerWaves = waveHeight >= 2.5;
  const isDangerWind = windSpeed >= 45;
  const isWarningWaves = waveHeight >= 1.5;
  const isWarningWind = windSpeed >= 25;

  if (isDangerWaves || isDangerWind) {
    alertLevel = 'Danger';
    recommendationText = `Hazardous sea state (Wave height: ${waveHeight}m, Wind: ${windSpeed} km/h). Red Flag Alert: Extreme swell, heavy chop, and life-threatening rip currents. Water entry, recreational swimming, and surfing are strictly unsafe. Remain safely ashore.`;
  } else if (isWarningWaves || isWarningWind) {
    alertLevel = 'Warning';
    recommendationText = `Rough coastal conditions (Wave height: ${waveHeight}m, Wind: ${windSpeed} km/h). Yellow Flag Alert: Moderate swell with gusty chops and undertow currents. Unsafe for casual swimmers and beginners; surfing permitted only for experienced individuals with personal flotation devices.`;
  } else {
    recommendationText = `Calm marine conditions (Wave height: ${waveHeight}m, Wind: ${windSpeed} km/h). Green Flag Alert: Gentle waves and safe breeze. Excellent conditions for beach leisure, recreational swimming, and water sports.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Agriculture / Farmers / Gardeners.
 * Rule: If soilMoisture is low, advise irrigation. If temp is approaching 4°C, issue a frost alert.
 */
function evaluateAgricultureGardeners(data) {
  const soilMoisture = data.soilMoisture ?? 0.25;
  const temp = data.temperature;

  let alertLevel = 'Safe';
  const notes = [];

  // Frost evaluation: approaching 4°C
  if (temp <= 4.0) {
    alertLevel = 'Danger';
    notes.push(
      `CRITICAL FROST ALERT: Ambient temperature is ${temp}°C (approaching/below 4°C threshold). Imminent danger of radiation frost freezing plant tissues and damaging rabi crops. Apply light evening irrigation to raise soil thermal mass or cover sensitive nursery beds with polythene/straw mulching immediately.`
    );
  } else if (temp <= 6.5) {
    alertLevel = 'Warning';
    notes.push(
      `Frost Watch: Temperature drop to ${temp}°C approaching frost risk threshold. Monitor overnight temperatures closely and prepare protective row coverings.`
    );
  } else if (temp >= 40.0) {
    alertLevel = 'Warning';
    notes.push(
      `Extreme Heatwave Stress (${temp}°C): Severe evapotranspiration rates. Provide agricultural shade netting and increase soil watering frequency.`
    );
  }

  // Soil moisture evaluation (Volumetric soil moisture < 0.20 indicates moisture deficit)
  if (soilMoisture < 0.20) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    notes.push(
      `Low soil moisture (${soilMoisture} m³/m³). Root zone depletion detected. Advise scheduled drip or furrow irrigation during early morning or evening hours to minimize evaporative water loss.`
    );
  } else if (soilMoisture > 0.45) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    notes.push(
      `Soil saturation alert (${soilMoisture} m³/m³). Risk of root waterlogging and hypoxia. Temporarily halt irrigation and clear drainage ditches.`
    );
  }

  let recommendationText = '';
  if (notes.length > 0) {
    recommendationText = notes.join(' | ');
  } else {
    recommendationText = `Soil moisture (${soilMoisture} m³/m³) is in the optimal range and temperatures (${temp}°C) are favorable for healthy crop growth. Proceed with standard crop maintenance and fertilizer schedules.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Commuters / Public Transit / Drivers.
 * Rule: If visibility < 1000m or heavy rain is highly probable, issue traffic/fog warnings.
 */
function evaluateCommuters(data) {
  const visibility = data.visibility ?? 10000;
  const rainProb = data.rainProb ?? (data.precipitationProbability ?? 0);

  let alertLevel = 'Safe';
  const notes = [];

  const isDenseFog = visibility < 500;
  const isModerateFog = visibility < 1000;
  const isSevereRain = rainProb >= 70;
  const isProbableRain = rainProb >= 50;

  if (isDenseFog || (isModerateFog && isSevereRain)) {
    alertLevel = 'Danger';
    notes.push(
      `Severe Travel Hazard: Critical low visibility (${visibility}m < 500m) and/or heavy precipitation risk (${rainProb}%). Dense fog/smog and severe waterlogging expected on arterial corridors. Substantial road, rail, and flight delays likely. Use low-beam fog lamps, double vehicle spacing, and postpone non-essential travel.`
    );
  } else if (isModerateFog || isProbableRain) {
    alertLevel = 'Warning';
    if (isModerateFog) {
      notes.push(
        `Fog/Smog Advisory: Reduced visibility (${visibility}m < 1000m). Highway sight distance compromised. Switch on low-beam headlights, reduce speed, and anticipate slower commute times.`
      );
    }
    if (isProbableRain) {
      notes.push(
        `Rain Transit Advisory: Elevated rain probability (${rainProb}%). Slippery road conditions and intersection waterlogging expected. Allow 15-20 extra minutes for travel.`
      );
    }
  }

  let recommendationText = '';
  if (notes.length > 0) {
    recommendationText = notes.join(' | ');
  } else {
    recommendationText = `Clear commute conditions: Visibility is excellent (${visibility}m) and rain probability is low (${rainProb}%). Transit corridors and highway routes are operating normally.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Parents & Families / School Commutes.
 * Rule: Check rain probability and severe weather to advise on school commute gear (e.g., "Pack a raincoat").
 */
function evaluateParentsFamilies(data) {
  const rainProb = data.rainProb ?? (data.precipitationProbability ?? 0);
  const temp = data.temperature;
  const pm25 = data.pm2_5 ?? 0;

  let alertLevel = 'Safe';
  const advice = [];

  // Rain commute gear guidance
  if (rainProb >= 60) {
    alertLevel = 'Warning';
    advice.push(
      `High rain probability (${rainProb}%): Pack a sturdy raincoat, waterproof school bag cover, and an umbrella in school bags. Equip children with waterproof footwear or gumboots for wet school routes.`
    );
  } else if (rainProb >= 30) {
    advice.push(
      `Showers possible (${rainProb}%): Keep a compact folding umbrella in children's backpacks just in case.`
    );
  }

  // Severe thermal or air quality conditions affecting children
  if (pm25 >= 120) {
    alertLevel = 'Danger';
    advice.push(
      `Hazardous air quality (PM2.5: ${pm25} µg/m³): Equip children with certified N95 masks for the school bus/walk and avoid outdoor playtime.`
    );
  } else if (pm25 >= 60 && alertLevel !== 'Danger') {
    alertLevel = 'Warning';
    advice.push(
      `Moderate pollution (PM2.5: ${pm25} µg/m³): Consider a face mask for children during transit.`
    );
  }

  if (temp >= 38) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    advice.push(
      `High temperature alert (${temp}°C): Ensure children carry insulated water bottles with ORS/electrolytes, wear breathable cotton uniforms, and wear sun caps during pickup/drop.`
    );
  } else if (temp <= 10) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    advice.push(
      `Cold morning commute (${temp}°C): Dress children in thermal innerwear, warm sweaters, and wind-resistant school jackets.`
    );
  }

  let recommendationText = '';
  if (advice.length > 0) {
    recommendationText = advice.join(' | ');
  } else {
    recommendationText = `Pleasant and safe weather for family outings and school commute (Temp: ${temp}°C, Rain chance: ${rainProb}%). Standard school uniform and gear are appropriate.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Event Planners / Outdoor Gatherings.
 * Rule: Implement THI = 15 + 0.4 * (Temp + WetBulb/Humidity equivalent).
 * If THI > 80, warn against outdoor gatherings.
 */
function evaluateEventPlanners(data) {
  const temp = data.temperature;
  const humidity = data.humidity;
  const thi = calculateTHI(temp, humidity);

  let alertLevel = 'Safe';
  let recommendationText = '';

  if (thi > 80) {
    alertLevel = 'Danger';
    recommendationText = `Extreme Heat-Humidity Alert (THI: ${thi} > 80). Severe thermal discomfort and elevated risk of heat cramps and fainting for attendees. Strongly warn against open-air gatherings; relocate to air-conditioned banquet halls or install high-capacity misting coolers and shaded marquees.`;
  } else if (thi >= 75) {
    alertLevel = 'Warning';
    recommendationText = `Noticeable Discomfort Index (THI: ${thi} [75-80 range]). Many outdoor guests will experience heat and humidity discomfort. Provide covered canopy tents, heavy-duty pedestal fans, and continuous cold beverage/hydration stations.`;
  } else {
    recommendationText = `Comfortable outdoor event conditions (THI: ${thi} < 75). Excellent biometeorological climate for open-air weddings, concerts, sporting tournaments, and public celebrations.`;
  }

  return { alertLevel, recommendationText };
}

/**
 * Evaluates conditions for Travelers / Tourists.
 * Rule: Provide packing suggestions based on rain and temp extremes.
 */
function evaluateTravelers(data) {
  const temp = data.temperature;
  const rainProb = data.rainProb ?? (data.precipitationProbability ?? 0);

  let alertLevel = 'Safe';
  const packingItems = [];

  // Temperature extreme packing rules
  if (temp <= 4) {
    alertLevel = 'Danger';
    packingItems.push(
      `Freezing cold (${temp}°C): Pack heavy thermal innerwear, down parka/overcoat, woolen caps, thermal socks, and insulated gloves.`
    );
  } else if (temp <= 12) {
    alertLevel = 'Warning';
    packingItems.push(
      `Chilly weather (${temp}°C): Pack fleece pullovers, warm sweaters, a windbreaker jacket, and comfortable walking boots.`
    );
  } else if (temp <= 22) {
    packingItems.push(
      `Mild/Pleasant weather (${temp}°C): Pack comfortable layering pieces, light cardigans or denim jackets for evening strolls, and sturdy walking shoes.`
    );
  } else if (temp <= 35) {
    packingItems.push(
      `Warm climate (${temp}°C): Pack breathable lightweight cotton/linen clothing, UV-blocking sunglasses, a sun hat, and broad-spectrum sunscreen.`
    );
  } else {
    alertLevel = 'Warning';
    packingItems.push(
      `Extreme heat (${temp}°C): Pack loose-fitting ultra-light apparel, UV-shielding parasol, cooling towels, electrolyte sachets, and an insulated water flask.`
    );
  }

  // Rain gear packing rules
  if (rainProb >= 60) {
    if (alertLevel !== 'Danger') alertLevel = 'Warning';
    packingItems.push(
      `High rain probability (${rainProb}%): Essential packing includes a waterproof raincoat/poncho, compact travel umbrella, quick-dry clothes, and waterproof luggage covers.`
    );
  } else if (rainProb >= 30) {
    packingItems.push(`Occasional showers likely (${rainProb}%): Carry a pocket travel umbrella.`);
  }

  const recommendationText = packingItems.join(' | ');

  return { alertLevel, recommendationText };
}

/**
 * Main Persona Dashboard Engine
 *
 * Ingests normalized weather data and returns a single JSON object
 * containing tailored dashboards for each of the 8 personas.
 *
 * @param {Object} weatherData - Normalized meteorological data from weatherService.js
 * @returns {Object} JSON object mapping each of the 8 persona names to their alertLevel and recommendationText
 */
function generatePersonaDashboards(weatherData = {}) {
  // Normalize defaults to ensure total resiliency against missing properties
  const safeData = {
    temperature: weatherData.temperature ?? 25,
    humidity: weatherData.humidity ?? 50,
    soilMoisture: weatherData.soilMoisture ?? 0.25,
    visibility: weatherData.visibility ?? 10000,
    pm2_5: weatherData.pm2_5 ?? 25,
    pm10: weatherData.pm10 ?? 50,
    uvIndex: weatherData.uvIndex ?? 3,
    waveHeight: weatherData.waveHeight ?? 0.5,
    oceanCurrentVelocity: weatherData.oceanCurrentVelocity ?? 0.2,
    windSpeed: weatherData.windSpeed ?? weatherData.wind ?? 12.0,
    rainProb: weatherData.rainProb ?? weatherData.precipitationProbability ?? 10,
    ...weatherData
  };

  return {
    'Health-Conscious': evaluateHealthConscious(safeData),
    'Outdoor Fitness': evaluateOutdoorFitness(safeData),
    'Beachgoers/Surfers': evaluateBeachgoersSurfers(safeData),
    'Agriculture/Gardeners': evaluateAgricultureGardeners(safeData),
    'Commuters': evaluateCommuters(safeData),
    'Parents & Families': evaluateParentsFamilies(safeData),
    'Event Planners': evaluateEventPlanners(safeData),
    'Travelers': evaluateTravelers(safeData)
  };
}

// Modular CommonJS Exports
module.exports = generatePersonaDashboards;
module.exports.generatePersonaDashboards = generatePersonaDashboards;
module.exports.calculateTHI = calculateTHI;
module.exports.calculateHeatIndex = calculateHeatIndex;
module.exports.calculateWetBulbCelsius = calculateWetBulbCelsius;
module.exports.evaluateHealthConscious = evaluateHealthConscious;
module.exports.evaluateOutdoorFitness = evaluateOutdoorFitness;
module.exports.evaluateBeachgoersSurfers = evaluateBeachgoersSurfers;
module.exports.evaluateAgricultureGardeners = evaluateAgricultureGardeners;
module.exports.evaluateCommuters = evaluateCommuters;
module.exports.evaluateParentsFamilies = evaluateParentsFamilies;
module.exports.evaluateEventPlanners = evaluateEventPlanners;
module.exports.evaluateTravelers = evaluateTravelers;
