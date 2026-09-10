/**
 * Fallback Mock Data for SIH26076 (Mausam App)
 * Realistic baseline meteorological metrics used when external API calls fail or time out.
 */

const mockData = {
  temperature: 29.4,            // Air temperature (°C)
  humidity: 68,                 // Relative humidity (%)
  soilMoisture: 0.23,           // Volumetric soil moisture (0-1 m³/m³)
  visibility: 8500,             // Visibility (meters)
  pm2_5: 42.5,                  // PM2.5 particulate concentration (µg/m³)
  pm10: 88.0,                   // PM10 particulate concentration (µg/m³)
  uvIndex: 6.2,                 // UV Index (0-11+)
  waveHeight: 1.1,              // Significant wave height (meters)
  oceanCurrentVelocity: 0.35,   // Ocean current velocity (m/s)
  windSpeed: 12.5,              // Wind speed (km/h)
  rainProb: 15,                 // Probability of precipitation (%)
  trafficCondition: 'Normal Flow', // Route traffic condition (OpenRouteService / Mapbox)
  routeConditions: 'Passable - No severe road weather closures', // Route condition description
  imdAlert: 'Green Alert: Normal seasonal meteorological conditions across district', // National / Monsoon alert (IMD)
  monsoonStatus: 'Normal Monsoon Activity', // Monsoon status (IMD)
  isFallback: true,
  timestamp: new Date().toISOString()
};

module.exports = mockData;
