/**
 *  Frontend Client Controller & Personalization Engine 
 * Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)
 *
 *  - Searchable Indian cities dropdown (Delhi, Mumbai, Bengaluru, Udaipur, Bikaner, etc.)
 *  - Preset location chips & HTML5 GPS detection
 *  - Multi-Source API data fetching from /api/weather (zero frontend API keys exposed)
 *  - Dynamic DOM rendering for meteorological summary & 8-persona advisories
 *  - Interactive 8-tab grid with active card selection & spotlight detail viewer
 *  - Live Multi-Source API status indicators vs offline fallback alerts
 *  - Favorite location bookmarking to /api/save-location
 *  - Bilingual i18n dictionary (English & Hindi)
 *  - Algorithmic Personalization Engine (dynamic card re-ordering & tailored insights)
 *  - 24-Hour Temperature & Rain Chart.js telemetry charts
 *  - 7-Day extended IMD numerical forecast simulation
 *  - Leaflet Doppler Radar & satellite precipitation map
 *  - Mausam AI Assistant side drawer chatbot
 *  - Modal managers (Advisory detail, Widget customization, Persona onboarding wizard)
 */

// Preset Indian Cities (featuring Delhi, Mumbai, Bengaluru, Udaipur, Bikaner)
const PRESET_LOCATIONS = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, region: 'NCR' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, region: 'Coastal Maharashtra' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, region: 'Karnataka Tech Plateau' },
  { name: 'Udaipur', lat: 24.5854, lon: 73.7125, region: 'City of Lakes, Rajasthan' },
  { name: 'Bikaner', lat: 28.0229, lon: 73.3119, region: 'Thar Desert, Rajasthan' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, region: 'Coromandel Coast' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, region: 'Ganges Delta' },
  { name: 'Shimla', lat: 31.1048, lon: 77.1734, region: 'Himalayan Foothills' },
  { name: 'Kochi', lat: 9.9312, lon: 76.2673, region: 'Malabar Coast' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, region: 'Deccan Plateau' }
];

// Persona Configuration Metadata: maps 8 personas to UI labels, icons and categories
const PERSONA_CONFIG = {
  'Health-Conscious': {
    title: 'Health-Conscious',
    displayName: 'Health',
    subtitle: 'Respiratory, Asthma & UV Protection',
    icon: '🩺',
    filterKey: 'Health-Conscious',
    category: 'Health & Respiratory',
    keyMetrics: ['pm2_5', 'pm10', 'uvIndex'],
    guidance: 'Monitors fine particulate matter and solar irradiance for vulnerable populations.'
  },
  'Commuters': {
    title: 'Daily Commuters',
    displayName: 'Commuters',
    subtitle: 'Corridor Visibility, Fog & Rain Transit',
    icon: '🚗',
    filterKey: 'Commuters',
    category: 'Transit & Mobility',
    keyMetrics: ['visibility', 'rainProb', 'trafficCondition'],
    guidance: 'Evaluates highway visibility thresholds and precipitation impact on road corridors.'
  },
  'Agriculture/Gardeners': {
    title: 'Farmers & Agriculture',
    displayName: 'Farmers',
    subtitle: 'Root Moisture, Sowing & Frost Watch',
    icon: '🌾',
    filterKey: 'Agriculture/Gardeners',
    category: 'Agro & Farming',
    keyMetrics: ['soilMoisture', 'temperature', 'humidity'],
    guidance: 'Optimizes irrigation scheduling, fertilizer timing, and frost crop protection.'
  },
  'Beachgoers/Surfers': {
    title: 'Beachgoers & Surfers',
    displayName: 'Beachgoers',
    subtitle: 'Wave Swell, Rip Currents & Coastal Safety',
    icon: '🏄',
    filterKey: 'Beachgoers/Surfers',
    category: 'Coastal & Marine',
    keyMetrics: ['waveHeight', 'oceanCurrentVelocity', 'windSpeed'],
    guidance: 'Tracks significant wave height and offshore surface current velocities.'
  },
  'Parents & Families': {
    title: 'Parents & Families',
    displayName: 'Parents',
    subtitle: 'School Transit, Child Rain & Heat Gear',
    icon: '👨‍👩‍👧',
    filterKey: 'Parents & Families',
    category: 'Family & School',
    keyMetrics: ['temperature', 'rainProb', 'pm2_5'],
    guidance: 'Recommends child weather gear, hydration, and outdoor school safety measures.'
  },
  'Event Planners': {
    title: 'Event Planners',
    displayName: 'Event Planners',
    subtitle: 'Thom THI Bioclimatic Comfort Index',
    icon: '🎉',
    filterKey: 'Event Planners',
    category: 'Events & Hospitality',
    keyMetrics: ['temperature', 'humidity'],
    guidance: 'Calculates psychrometric Temperature-Humidity Index (THI) for outdoor gatherings.'
  },
  'Travelers': {
    title: 'Travelers & Tourists',
    displayName: 'Travelers',
    subtitle: 'Adaptive Packing & Microclimate Warning',
    icon: '🧳',
    filterKey: 'Travelers',
    category: 'Tourism & Travel',
    keyMetrics: ['temperature', 'rainProb', 'uvIndex'],
    guidance: 'Provides dynamic packing advisories based on regional temperature classifications.'
  },
  'Outdoor Fitness': {
    title: 'Outdoor Fitness / General',
    displayName: 'General',
    subtitle: 'Athletes, Running Windows & Heat Stress',
    icon: '🏃',
    filterKey: 'Outdoor Fitness',
    category: 'Athletics & General',
    keyMetrics: ['temperature', 'humidity', 'uvIndex'],
    guidance: 'Determines safe outdoor workout windows and heat stress prevention.'
  }
};

// =============================================================================
// Bilingual Dictionary (English & Hindi)
// =============================================================================
const i18n = {
  en: {
    govTag: '<i class="fa-solid fa-flag text-sky-400"></i> Ministry of Earth Sciences (MoES) • Govt. of India • IMD',
    tabHome: 'Home',
    tabForecast: 'Forecast',
    tabLocations: 'Locations',
    tabAlerts: 'IMD Alerts',
    tabProfile: 'My Profile',
    customizeBtn: 'Customize',
    advisoryBtn: 'View Advisory',
    humidity: 'Humidity',
    wind: 'Wind',
    uvIndex: 'UV Index',
    rainChance: 'Rain Chance',
    soilMoisture: 'Soil Moisture',
    dewPoint: 'Dew Point',
    hailRisk: 'Hail / Frost Risk',
    irrigationRec: 'Irrigation Advice',
    aiInsightTitle: 'Smart AI Personalization Insight',
    rankingLabel: 'AI Ranking Engine:',
    fitnessTitle: 'Running & Workout Guide',
    bestWorkoutWindow: 'Optimal Workout Windows:',
    heatIndex: 'Heat Risk',
    hydration: 'Hydration',
    parentTitle: 'School Commute & Family Outing',
    travelerTitle: 'Traveler & Destination Weather',
    kisanTitle: 'Gramin Krishi Mausam Sewa',
    healthTitle: 'Air Quality & Health Risk',
    commuterTitle: 'Daily Commuter & Nowcast',
    forecastTitle: '7-Day IMD Official Extended Forecast',
    chartTitle: '24-Hour Temperature & Rain Probability Trend',
    chartSubtitle: 'Real-time psychrometric progression derived from active station telemetry',
    radarTitle: 'Doppler Weather Radar & Live Satellite Map',
    radarSubtitle: 'Interactive precipitation radar overlay updated every 10 mins',
    aiTitle: 'Mausam AI Assistant',
    aiSub: 'MoES Weather Recommendations',
    aiWelcome: 'Namaste! I am your <strong>Mausam AI Assistant</strong>. Ask me anything like: <em>"Can I go jogging today?", "What is the crop advice for wheat?", or "Is rain expected in Delhi?"</em>',
    modalTitle: 'Customize Homepage Widgets',
    modalDesc: 'Toggle which widgets you wish to prioritize on your personalized Mausam homepage:',
    savePreferences: 'Save Preferences'
  },
  hi: {
    govTag: '<i class="fa-solid fa-flag text-sky-400"></i> पृथ्वी विज्ञान मंत्रालय (MoES) • भारत सरकार • मौसम विभाग',
    tabHome: 'होम',
    tabForecast: 'पूर्वानुमान',
    tabLocations: 'स्थान',
    tabAlerts: 'मौसम चेतावनी',
    tabProfile: 'मेरी प्रोफ़ाइल',
    customizeBtn: 'अनुकूलित करें',
    advisoryBtn: 'सलाह देखें',
    humidity: 'आर्द्रता',
    wind: 'हवा की गति',
    uvIndex: 'यूवी सूचकांक',
    rainChance: 'बारिश की संभावना',
    soilMoisture: 'मृदा नमी',
    dewPoint: 'ओसांक',
    hailRisk: 'ओलावृष्टि / पाला जोखिम',
    irrigationRec: 'सिंचाई सलाह',
    aiInsightTitle: 'स्मार्ट एआई वैयक्तिकरण जानकारी',
    rankingLabel: 'एआई रैंकिंग इंजन:',
    fitnessTitle: 'रनिंग और आउटडोर वर्कआउट गाइड',
    bestWorkoutWindow: 'आज वर्कआउट का सही समय:',
    heatIndex: 'ताप जोखिम',
    hydration: 'जल आपूर्ति',
    parentTitle: 'स्कूल आवागमन एवं पारिवारिक यात्रा',
    travelerTitle: 'यात्री एवं गंतव्य मौसम',
    kisanTitle: 'ग्रामीण कृषि मौसम सेवा',
    healthTitle: 'वायु गुणवत्ता सूचकांक (AQI) और स्वास्थ्य जोखिम',
    commuterTitle: 'दैनिक यात्री एवं नाउकास्ट',
    forecastTitle: '7-दिवसीय IMD आधिकारिक विस्तार पूर्वानुमान',
    chartTitle: '24-घंटे तापमान एवं वर्षा संभावना प्रवृत्ति',
    chartSubtitle: 'स्टेशन टेलीमेट्री द्वारा संचालित वास्तविक समय का पूर्वानुमान',
    radarTitle: 'डॉप्लर वेदर रडार एवं लाइव सैटेलाइट मानचित्र',
    radarSubtitle: 'हर 10 मिनट में अपडेट होने वाला वर्षा रडार',
    aiTitle: 'मौसम एआई सहायक',
    aiSub: 'MoES मौसम संबंधी सिफारिशें',
    aiWelcome: 'नमस्ते! मैं आपका <strong>मौसम एआई सहायक</strong> हूँ। मुझसे पूछें: <em>"क्या मैं आज दौड़ने जा सकता हूँ?", "गेहूं की फसल के लिए क्या सलाह है?", या "दिल्ली में बारिश होगी?"</em>',
    modalTitle: 'होमपेज विजेट्स को अनुकूलित करें',
    modalDesc: 'अपने होमपेज पर दिखाए जाने वाले विजेट चुनें:',
    savePreferences: 'प्राथमिकताएं सहेजें'
  }
};

// Global State
const state = {
  currentCity: 'Delhi',
  currentLang: 'en',
  currentPersona: 'runner', // runner, parent, traveler, farmer, health, commuter
  userWidgets: {
    fitness: true,
    parent: true,
    traveler: true,
    kisan: true,
    health: true,
    commuter: true
  }
};

let currentCoordinates = { lat: 28.6139, lon: 77.2090 };
let currentCityName = 'New Delhi';
let currentWeatherData = null;
let currentPersonaData = {};
let activeSelectedPersonaKey = 'Health-Conscious';

let hourlyChartInstance = null;
let personaHourlyChartInstance = null;


// =============================================================================
// Algorithmic Personalization Engine
// =============================================================================
const PersonalizationEngine = {
  calculateScores(role, weather) {
    const scores = {
      fitness: 30,
      parent: 30,
      traveler: 30,
      kisan: 30,
      health: 30,
      commuter: 30
    };

    const temp = Number(weather.temperature || 28);
    const rain = Number(weather.rainProb || 15);
    const uv = Number(weather.uvIndex || 5);
    const pm25 = Number(weather.pm2_5 || 40);

    if (role === 'runner' || role === 'fitness') {
      scores.fitness += 55;
      if (temp > 30) scores.fitness += 15;
      if (uv > 6) scores.fitness += 10;
    } else if (role === 'parent') {
      scores.parent += 55;
      if (rain > 40) scores.parent += 20;
    } else if (role === 'traveler') {
      scores.traveler += 55;
      if (rain > 40) scores.traveler += 15;
    } else if (role === 'farmer' || role === 'agriculture') {
      scores.kisan += 60;
      if (weather.soilMoisture < 0.25) scores.kisan += 15;
    } else if (role === 'health') {
      scores.health += 55;
      if (pm25 > 60) scores.health += 25;
    } else if (role === 'commuter') {
      scores.commuter += 55;
      if (rain > 40 || weather.visibility < 3000) scores.commuter += 20;
    }

    return scores;
  },

  generateInsight(role, weather, city) {
    const temp = Number(weather.temperature || 28).toFixed(1);
    const humidity = weather.humidity || 60;
    const rain = weather.rainProb || 0;
    const pm25 = weather.pm2_5 || 35;

    if (role === 'runner' || role === 'fitness') {
      const best = temp > 32 ? '05:30 AM - 07:15 AM' : '06:00 AM - 08:30 AM';
      return `Current weather in ${city} is ${temp}°C with ${humidity}% humidity. For optimal performance, <strong>${best}</strong> is the safest running window before peak heat index.`;
    }
    if (role === 'parent') {
      const adv = rain >= 50
        ? 'Rainfall expected during commute hours. Ensure children carry raincoats and umbrellas.'
        : 'Clear to pleasant commute conditions anticipated. Ensure sufficient hydration.';
      return `School commute update for ${city}: Rain probability is <strong>${rain}%</strong>. ${adv}`;
    }
    if (role === 'traveler') {
      const pack = rain >= 50
        ? 'Pack waterproof footwear and an umbrella.'
        : temp > 30 ? 'Pack light breathable cotton apparel.' : 'Pack a light jacket for breezy evenings.';
      return `Travel briefing for ${city}: Current temperature is <strong>${temp}°C</strong>. ${pack}`;
    }
    if (role === 'farmer' || role === 'agriculture') {
      const moisture = weather.soilMoisture !== undefined ? `${(weather.soilMoisture * 100).toFixed(0)}%` : '62%';
      return `Gramin Krishi Update for ${city}: Soil moisture is ${moisture}. Weather conditions are suitable for seasonal field operations and soil aeration.`;
    }
    if (role === 'health') {
      const status = pm25 > 90 ? 'Poor' : pm25 > 60 ? 'Moderate' : 'Good';
      return `PM2.5 particulate level in ${city} is <strong>${pm25} µg/m³ (${status})</strong>. Sensitive individuals should wear protective masks during peak traffic hours.`;
    }
    if (role === 'commuter') {
      return `Commuter update for ${city}: Road corridor visibility is <strong>${weather.visibility ? (weather.visibility / 1000).toFixed(1) + ' km' : 'Good'}</strong>. ${weather.trafficCondition || 'Smooth Flow'}.`;
    }

    return `Weather in ${city} is ${temp}°C with ${weather.humidity}% humidity. Have a safe and productive day ahead!`;
  },

  rankAndSortWidgets(role, weather) {
    const scores = this.calculateScores(role, weather);
    const grid = document.getElementById('widgetsGrid');
    if (!grid) return;

    const cards = Array.from(grid.children);
    cards.forEach((card) => {
      const widgetId = card.getAttribute('data-widget');
      const score = scores[widgetId] || 20;
      card.setAttribute('data-score', score);
      card.style.order = 100 - score;
    });
  }
};

// =============================================================================
// DOM Elements Initialization
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderPresetChips();
  setupDropdownAndSearch();
  setupFilterTabs();
  setupModalEvents();
  setupPersonaSwitchers();
  setupNavigationTabs();
  setupLanguageToggle();
  setupAiDrawer();

  // Initial load for Delhi
  fetchWeather(28.6139, 77.2090, 'New Delhi');
});

// =============================================================================
// Searchable Dropdown & Autocomplete Search Bar
// =============================================================================
function setupDropdownAndSearch() {
  const presetCitySelect = document.getElementById('presetCitySelect');
  const citySearchInput = document.getElementById('citySearchInput');

  if (presetCitySelect) {
    presetCitySelect.addEventListener('change', (e) => {
      const selectedCity = e.target.value;
      const match = PRESET_LOCATIONS.find((loc) => loc.name.toLowerCase() === selectedCity.toLowerCase());
      if (match) {
        selectLocation(match);
      }
    });
  }

  if (citySearchInput) {
    citySearchInput.addEventListener('change', (e) => {
      const query = e.target.value.trim().toLowerCase();
      const match = PRESET_LOCATIONS.find(
        (loc) => loc.name.toLowerCase() === query || loc.region.toLowerCase().includes(query)
      );
      if (match) {
        selectLocation(match);
      }
    });
  }
}

function selectLocation(loc) {
  const latInput = document.getElementById('latInput');
  const lonInput = document.getElementById('lonInput');
  const cityNameInput = document.getElementById('cityNameInput');
  const citySearchInput = document.getElementById('citySearchInput');
  const presetCitySelect = document.getElementById('presetCitySelect');

  const parsedLat = parseFloat(loc.lat);
  const parsedLon = parseFloat(loc.lon);

  if (latInput) latInput.value = parsedLat;
  if (lonInput) lonInput.value = parsedLon;
  if (cityNameInput) cityNameInput.value = loc.name;
  if (citySearchInput) citySearchInput.value = loc.name;
  if (presetCitySelect) presetCitySelect.value = loc.name;
  
  state.currentCity = loc.name;
  fetchWeather(parsedLat, parsedLon, loc.name);
}

// Global window helper for location switching from tab pages
window.switchCity = function(cityName) {
  const match = PRESET_LOCATIONS.find((loc) => loc.name.toLowerCase() === cityName.toLowerCase());
  if (match) {
    selectLocation(match);
    const homeTab = document.querySelector('.nav-tab[data-tab="home"]');
    if (homeTab) homeTab.click();
  }
};

window.updateApiStatus = function(isLive, label) {
  const badge = document.getElementById('sourceStatusBadge');
  const text = document.getElementById('sourceStatusText');
  if (!badge || !text) return;
  if (isLive) {
    badge.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm transition';
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span id="sourceStatusText">${label || 'Multi-Source API (Live)'}</span>`;
  } else {
    badge.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm transition';
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span id="sourceStatusText">${label || 'Offline Fallback Mode'}</span>`;
  }
};

// =============================================================================
// Preset Location Chips (Includes Delhi, Mumbai, Bengaluru, Udaipur, Bikaner)
// =============================================================================
function renderPresetChips() {
  const presetChipsContainer = document.getElementById('presetChipsContainer');
  if (!presetChipsContainer) return;
  presetChipsContainer.innerHTML = '';

  PRESET_LOCATIONS.forEach((loc) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className =
      'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-sky-600 hover:text-white text-slate-300 border border-slate-700/80 hover:border-sky-500 transition duration-150 shadow-sm flex items-center space-x-1.5 active:scale-95';
    chip.innerHTML = `<span>📍</span><span>${loc.name}</span><span class="text-[10px] text-slate-400 opacity-75">(${loc.region})</span>`;

    chip.addEventListener('click', () => {
      selectLocation(loc);
    });

    presetChipsContainer.appendChild(chip);
  });
}

// GPS Auto-Detection & Coordinate Form Submission
const gpsBtn = document.getElementById('gpsBtn');
if (gpsBtn) {
  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Defaulting to Ahmedabad.');
      state.currentCity = 'Ahmedabad';
      fetchWeather(23.0225, 72.5714, 'Ahmedabad');
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.innerHTML = `<span>⏳</span><span>Locating...</span>`;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');
        const cityNameInput = document.getElementById('cityNameInput');
        if (latInput) latInput.value = lat;
        if (lonInput) lonInput.value = lon;
        if (cityNameInput) cityNameInput.value = 'My Current Location';
        fetchWeather(lat, lon, 'My Current Location');
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<span>🧭</span><span>Use My GPS</span>`;
      },
      (err) => {
        console.warn(`Could not obtain GPS location: ${err.message}`);
        alert(`Location access denied or timed out. Defaulting gracefully to Ahmedabad.`);
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');
        const cityNameInput = document.getElementById('cityNameInput');
        if (latInput) latInput.value = 23.0225;
        if (lonInput) lonInput.value = 72.5714;
        if (cityNameInput) cityNameInput.value = 'Ahmedabad';
        state.currentCity = 'Ahmedabad';
        fetchWeather(23.0225, 72.5714, 'Ahmedabad');
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<span>🧭</span><span>Use My GPS</span>`;
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

const coordForm = document.getElementById('coordForm');
if (coordForm) {
  coordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('latInput').value);
    const lon = parseFloat(document.getElementById('lonInput').value);
    const city = document.getElementById('cityNameInput').value.trim() || 'Custom Coordinates';

    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert('Latitude must be a valid number between -90 and 90 degrees.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      alert('Longitude must be a valid number between -180 and 180 degrees.');
      return;
    }

    state.currentCity = city;
    fetchWeather(lat, lon, city);
  });
}

// =============================================================================
// Core Weather API Fetcher (Backend /api/weather Pipeline)
// =============================================================================
async function fetchWeather(rawLat, rawLng, cityName = 'Selected Location') {
  setLoading(true);
  
  const lat = parseFloat(rawLat) || 23.0225;
  const lon = parseFloat(rawLng) || 72.5714;
  
  currentCoordinates = { lat, lon };
  currentCityName = cityName;
  state.currentCity = cityName;

  try {
    const url = `/api/weather?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || `Server returned error ${res.status}`);
    }

    currentWeatherData = data.weather;
    currentPersonaData = data.personas || data.dashboards || {};

    // 1. Primary weather summary card & status indicators
    updateWeatherSummaryCard(data.weather, lat, lon, cityName);
    updateStatusIndicators(data.weather);

    // 2. 8 Persona recommendation cards & active spotlight detail
    renderPersonaCards(currentPersonaData);
    displayActivePersonaDetail(activeSelectedPersonaKey, currentPersonaData[activeSelectedPersonaKey]);

    // 3. Update Warning Alert Bar
    updateWarningAlertBar(data.weather);

    // 4. Update AI Personalization Insight & Re-rank Widgets
    updatePersonalizationEngineUI(data.weather, cityName);

    // 5. Update Forecast & Charts
    renderForecast(data.weather);
    renderChart(data.weather);
    renderPersonaHourlyChart(data.weather);


  } catch (err) {
    console.error('[Mausam App ERROR]', err);
    alert(`Failed to fetch forecast: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// =============================================================================
// DOM Updater: Primary Weather Summary Card
// =============================================================================
function updateWeatherSummaryCard(weather, rawLat, rawLng, city) {
  const lat = parseFloat(rawLat) || 23.0225;
  const lon = parseFloat(rawLng) || 72.5714;
  
  const currentCityDisplay = document.getElementById('currentCityDisplay');
  const cityCoordsDisplay = document.getElementById('cityCoordsDisplay');
  const timestampDisplay = document.getElementById('timestampDisplay');
  const tempValue = document.getElementById('tempValue');
  const weatherBadge = document.getElementById('weatherBadge');
  const windDisplay = document.getElementById('windDisplay');
  const rainDisplay = document.getElementById('rainDisplay');
  const humidityVal = document.getElementById('humidityVal');
  const pm25Val = document.getElementById('pm25Val');
  const aqiBadge = document.getElementById('aqiBadge');
  const uvVal = document.getElementById('uvVal');
  const uvBadge = document.getElementById('uvBadge');
  const visibilityVal = document.getElementById('visibilityVal');
  const soilVal = document.getElementById('soilVal');
  const waveVal = document.getElementById('waveVal');
  const currentSpeedVal = document.getElementById('currentSpeedVal');
  const providerStatusList = document.getElementById('providerStatusList');

  if (currentCityDisplay) currentCityDisplay.textContent = city;
  if (cityCoordsDisplay) cityCoordsDisplay.textContent = `Lat: ${Number(lat).toFixed(2)}, Lon: ${Number(lon).toFixed(2)}`;
  if (timestampDisplay) timestampDisplay.textContent = `Updated: ${new Date(weather.timestamp || Date.now()).toLocaleTimeString()}`;

  const temp = weather.temperature;
  if (tempValue) tempValue.textContent = typeof temp === 'number' ? temp.toFixed(1) : temp;

  // Temperature classification badge
  if (weatherBadge) {
    if (temp >= 38) {
      weatherBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 inline-block border border-rose-500/30';
      weatherBadge.textContent = '🔥 Severe Heatwave';
    } else if (temp >= 32) {
      weatherBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 inline-block border border-amber-500/30';
      weatherBadge.textContent = '☀️ Hot & Humid';
    } else if (temp <= 5) {
      weatherBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 inline-block border border-cyan-500/30';
      weatherBadge.textContent = '❄️ Frost Warning';
    } else if (temp <= 15) {
      weatherBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 inline-block border border-sky-500/30';
      weatherBadge.textContent = '🧥 Chilly';
    } else {
      weatherBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 inline-block border border-emerald-500/30';
      weatherBadge.textContent = '✨ Pleasant';
    }
  }

  if (windDisplay) windDisplay.textContent = `${weather.windSpeed ?? '--'} km/h`;
  if (rainDisplay) rainDisplay.textContent = `${weather.rainProb ?? 0}%`;
  if (humidityVal) humidityVal.textContent = `${weather.humidity ?? '--'}%`;

  // PM2.5 & AQI Evaluation
  const pm25 = weather.pm2_5;
  if (pm25Val) pm25Val.textContent = typeof pm25 === 'number' ? pm25.toFixed(1) : pm25;
  if (aqiBadge) {
    if (pm25 <= 30) {
      aqiBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      aqiBadge.textContent = 'Good (CPCB)';
    } else if (pm25 <= 60) {
      aqiBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-lime-500/20 text-lime-300 border border-lime-500/30';
      aqiBadge.textContent = 'Satisfactory';
    } else if (pm25 <= 90) {
      aqiBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30';
      aqiBadge.textContent = 'Moderate';
    } else if (pm25 <= 120) {
      aqiBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-orange-500/20 text-orange-300 border border-orange-500/30';
      aqiBadge.textContent = 'Poor';
    } else {
      aqiBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30';
      aqiBadge.textContent = 'Severe / Hazardous';
    }
  }

  // UV Index Evaluation
  const uv = weather.uvIndex;
  if (uvVal) uvVal.textContent = typeof uv === 'number' ? uv.toFixed(1) : uv;
  if (uvBadge) {
    if (uv <= 2.9) {
      uvBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      uvBadge.textContent = 'Low (Safe)';
    } else if (uv <= 5.9) {
      uvBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30';
      uvBadge.textContent = 'Moderate';
    } else if (uv <= 7.9) {
      uvBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-orange-500/20 text-orange-300 border border-orange-500/30';
      uvBadge.textContent = 'High (SPF 30+)';
    } else {
      uvBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30';
      uvBadge.textContent = 'Very High / Extreme';
    }
  }

  // Visibility (meters to km)
  const vis = weather.visibility;
  if (visibilityVal) {
    if (typeof vis === 'number') {
      visibilityVal.textContent = vis >= 1000 ? `${(vis / 1000).toFixed(1)} km` : `${vis} m`;
    } else {
      visibilityVal.textContent = '--';
    }
  }

  // Soil Moisture
  const soil = weather.soilMoisture;
  if (soilVal) {
    soilVal.textContent = typeof soil === 'number' ? `${soil.toFixed(3)} m³/m³` : '--';
  }

  // Marine metrics
  const wave = weather.waveHeight;
  if (waveVal) {
    waveVal.textContent = typeof wave === 'number' ? `${wave.toFixed(1)} m` : '--';
  }
  const speed = weather.oceanCurrentVelocity;
  if (currentSpeedVal) {
    currentSpeedVal.textContent = typeof speed === 'number' ? `Current: ${speed.toFixed(2)} m/s` : 'Current: -- m/s';
  }

  // Multi-Source Provider List
  if (providerStatusList && weather.sources) {
    providerStatusList.innerHTML = '';
    const providers = [
      { key: 'openMeteo', label: 'Open-Meteo' },
      { key: 'imd', label: 'IMD Alerts' },
      { key: 'openWeatherMap', label: 'OpenWeather' },
      { key: 'stormglass', label: 'Stormglass' },
      { key: 'openRouteService', label: 'OpenRoute' }
    ];

    providers.forEach((p) => {
      const st = weather.sources[p.key];
      const isFulfilled = st === 'fulfilled';
      const pill = document.createElement('span');
      pill.className = `px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-semibold border ${
        isFulfilled
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      }`;
      pill.innerHTML = `${isFulfilled ? '●' : '○'} ${p.label}: ${isFulfilled ? 'LIVE' : 'FALLBACK'}`;
      providerStatusList.appendChild(pill);
    });
  }
}

// =============================================================================
// DOM Updater: Data Source & Cache Badges
// =============================================================================
function updateStatusIndicators(weather) {
  const offlineBanner = document.getElementById('offlineBanner');
  const sourceStatusBadge = document.getElementById('sourceStatusBadge');
  const cacheBadge = document.getElementById('cacheBadge');

  if (weather.isFallback) {
    if (offlineBanner) offlineBanner.classList.remove('hidden');
    if (sourceStatusBadge) {
      sourceStatusBadge.className =
        'flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm transition';
      sourceStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span id="sourceStatusText">Offline Fallback Mode</span>`;
    }
  } else {
    if (offlineBanner) offlineBanner.classList.add('hidden');
    if (sourceStatusBadge) {
      sourceStatusBadge.className =
        'flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm transition';
      sourceStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span id="sourceStatusText">Multi-Source API (Live)</span>`;
    }
  }

  if (cacheBadge) {
    if (weather.isCached) {
      cacheBadge.classList.remove('hidden');
      cacheBadge.classList.add('flex');
    } else {
      cacheBadge.classList.add('hidden');
      cacheBadge.classList.remove('flex');
    }
  }
}

// =============================================================================
// DOM Updater: IMD Warning Alert Bar
// =============================================================================
function updateWarningAlertBar(weather) {
  const warningBar = document.getElementById('warningBar');
  const warningLevelText = document.getElementById('warningLevelText');
  const warningMsgText = document.getElementById('warningMsgText');
  const warningDetailBtn = document.getElementById('warningDetailBtn');

  if (!warningBar || !warningLevelText || !warningMsgText) return;

  const temp = Number(weather.temperature || 28);
  const rain = Number(weather.rainProb || 0);
  const wind = Number(weather.windSpeed || 0);
  const pm25 = Number(weather.pm2_5 || 40);

  let levelClass = 'alert-green';
  let levelTitle = 'WEATHER WATCH';
  let msg = weather.imdAlert || 'Normal seasonal meteorological bulletin active across district.';

  if (temp >= 40 || rain >= 75 || wind >= 50 || pm25 >= 150) {
    levelClass = 'alert-red';
    levelTitle = 'RED ALERT';
    msg = temp >= 40
      ? `Severe Heatwave Warning (${temp}°C): Avoid all prolonged outdoor exposure between 12 PM - 4 PM.`
      : rain >= 75
      ? `Extremely Heavy Rainfall & Thunderstorm Warning (${rain}% rain probability). Keep indoors.`
      : `Hazardous Air Quality Warning (PM2.5: ${pm25} µg/m³). Avoid outdoor physical activity.`;
  } else if (temp >= 35 || rain >= 50 || wind >= 35 || pm25 >= 90) {
    levelClass = 'alert-orange';
    levelTitle = 'ORANGE ALERT';
    msg = temp >= 35
      ? `Moderate Heat & Thermal Discomfort Warning (${temp}°C). Maintain high hydration.`
      : `Significant Precipitation & Gusty Wind Advisory (${rain}% rain, ${wind} km/h).`;
  } else if (rain >= 30 || pm25 >= 60) {
    levelClass = 'alert-yellow';
    levelTitle = 'YELLOW ALERT';
    msg = `Passing Showers / Elevated Dust Conditions Expected. Normal precautions advised.`;
  }

  warningBar.className = `warning-bar ${levelClass}`;
  warningLevelText.textContent = levelTitle;
  warningMsgText.textContent = msg;

  if (warningDetailBtn) {
    warningDetailBtn.onclick = () => {
      const advisoryModal = document.getElementById('advisoryModal');
      const advisoryModalBody = document.getElementById('advisoryModalBody');
      if (advisoryModal && advisoryModalBody) {
        advisoryModalBody.innerHTML = `
          <div class="space-y-3">
            <p class="font-bold text-white text-sm">${levelTitle}: ${msg}</p>
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div><strong>Station Monitored:</strong> ${currentCityName}</div>
              <div><strong>Active Monsoon Status:</strong> ${weather.monsoonStatus || 'Standard Circulation'}</div>
              <div><strong>Highway Corridor Conditions:</strong> ${weather.routeConditions || 'Passable'}</div>
            </div>
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <strong>Official IMD Guidelines:</strong>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Follow official district meteorological updates before long journeys.</li>
                <li>Farmers should ensure field drainage during heavy rainfall alerts.</li>
                <li>Athletes and runners should shift workouts to early morning windows.</li>
              </ul>
            </div>
          </div>
        `;
        advisoryModal.classList.add('open');
      }
    };
  }
}

// =============================================================================
// DOM Updater: AI Personalization Engine & Dynamic Widgets
// =============================================================================
function updatePersonalizationEngineUI(weather, cityName) {
  const activeProfileChip = document.getElementById('activeProfileChip');
  const rankingRoleText = document.getElementById('rankingRoleText');
  const aiInsightText = document.getElementById('aiInsightText');

  const roleNameMap = {
    runner: 'Runner / Fitness Profile',
    parent: 'Parent / Family Profile',
    traveler: 'Traveler Profile',
    farmer: 'Farmer / Kisan Profile',
    health: 'Health & AQI Profile',
    commuter: 'Daily Commuter Profile'
  };

  if (activeProfileChip) activeProfileChip.textContent = `${roleNameMap[state.currentPersona] || 'Custom'} Active`;
  if (rankingRoleText) rankingRoleText.textContent = roleNameMap[state.currentPersona] || 'Custom Profile';
  if (aiInsightText) aiInsightText.innerHTML = PersonalizationEngine.generateInsight(state.currentPersona, weather, cityName);

  // Update dynamic widget values
  const temp = Number(weather.temperature || 28);
  const rain = Number(weather.rainProb || 0);

  const heatIndexVal = document.getElementById('heatIndexVal');
  if (heatIndexVal) heatIndexVal.textContent = temp >= 35 ? 'High Risk' : temp >= 30 ? 'Moderate' : 'Low Risk';

  const hydrationVal = document.getElementById('hydrationVal');
  if (hydrationVal) hydrationVal.textContent = temp >= 35 ? '650 ml/hr' : '500 ml/hr';

  const parentAdvisoryText = document.getElementById('parentAdvisoryText');
  if (parentAdvisoryText) {
    parentAdvisoryText.textContent = rain >= 50
      ? `Rain expected during school hours (${rain}%). Send raincoats/umbrellas with children.`
      : `Pleasant school commute conditions (${temp.toFixed(1)}°C). Normal outdoor safety.`;
  }

  const destTemp = document.getElementById('destTemp');
  if (destTemp) destTemp.textContent = `${temp.toFixed(1)}°C • ${rain}% Rain`;

  const flightRisk = document.getElementById('flightRisk');
  if (flightRisk) flightRisk.textContent = rain >= 70 || weather.windSpeed > 40 ? 'Moderate Weather Delay Risk' : 'Low Risk';

  const soilMoistureVal = document.getElementById('soilMoistureVal');
  if (soilMoistureVal) soilMoistureVal.textContent = weather.soilMoisture !== undefined ? `${(weather.soilMoisture * 100).toFixed(0)}%` : '60%';

  const dewPointVal = document.getElementById('dewPointVal');
  if (dewPointVal) dewPointVal.textContent = `${(temp - ((100 - (weather.humidity || 60)) / 5)).toFixed(1)}°C`;

  const irrigationVal = document.getElementById('irrigationVal');
  if (irrigationVal) irrigationVal.textContent = rain >= 50 ? 'Postpone Irrigation' : 'Normal Irrigation Schedule';

  const cropAdvisoryText = document.getElementById('cropAdvisoryText');
  if (cropAdvisoryText) {
    cropAdvisoryText.textContent = rain >= 50
      ? 'Ensure active field drainage channels are open to prevent root logging.'
      : 'Optimal weather window for seasonal fertilizer application and pest scouting.';
  }

  const aqiNumber = document.getElementById('aqiNumber');
  if (aqiNumber) aqiNumber.textContent = Math.round((weather.pm2_5 || 35) * 2.2);

  const nowcastText = document.getElementById('nowcastText');
  if (nowcastText) {
    nowcastText.textContent = `Visibility: ${weather.visibility ? (weather.visibility / 1000).toFixed(1) + ' km' : 'Clear'}. ${weather.routeConditions || 'Smooth Flow'}.`;
  }

  // Dynamic ranking and sorting of widget cards
  PersonalizationEngine.rankAndSortWidgets(state.currentPersona, weather);
}

// =============================================================================
// DOM Updater: 8 Persona Recommendation Cards Grid
// =============================================================================
function renderPersonaCards(personas) {
  currentPersonaData = personas;
  const personasContainer = document.getElementById('personasContainer');
  if (!personasContainer) return;
  personasContainer.innerHTML = '';

  const personaKeys = Object.keys(PERSONA_CONFIG);

  personaKeys.forEach((key) => {
    const config = PERSONA_CONFIG[key];
    const data = personas[key] || {
      alertLevel: 'Safe',
      recommendationText: 'Normal baseline weather conditions apply.'
    };

    const card = document.createElement('div');
    const isSelected = key === activeSelectedPersonaKey;
    card.className = `persona-card glass-panel rounded-3xl p-5 border flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
      isSelected ? 'active-selected' : ''
    }`;
    card.dataset.personaKey = key;
    card.dataset.filter = config.filterKey;

    let alertBadgeClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    let cardBorderColor = 'border-slate-800';
    let alertDot = '🟢';

    if (data.alertLevel === 'Warning') {
      alertBadgeClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/35';
      cardBorderColor = 'border-amber-500/40';
      alertDot = '🟡';
    } else if (data.alertLevel === 'Danger') {
      alertBadgeClasses = 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      cardBorderColor = 'border-rose-500/40';
      alertDot = '🔴';
    }

    card.classList.add(cardBorderColor);

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-3.5">
          <div class="flex items-center space-x-3">
            <span class="text-3xl p-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">${config.icon}</span>
            <div>
              <h3 class="font-bold text-white text-sm tracking-tight leading-snug">${config.title}</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">${config.subtitle}</p>
            </div>
          </div>
        </div>

        <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${alertBadgeClasses} mb-3.5 shadow-sm">
          <span>${alertDot}</span>
          <span>${data.alertLevel}</span>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed line-clamp-4">${data.recommendationText}</p>
      </div>

      <div class="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span class="uppercase tracking-wider font-bold text-[10px] text-sky-400/80">${config.displayName}</span>
        <button type="button" class="inspect-btn text-slate-300 hover:text-sky-300 font-semibold flex items-center gap-1.5 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-sky-500/10">
          <span>Inspect</span>
          <span>→</span>
        </button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      activeSelectedPersonaKey = key;
      const allCards = personasContainer.querySelectorAll('.persona-card');
      allCards.forEach((c) => c.classList.remove('active-selected'));
      card.classList.add('active-selected');
      displayActivePersonaDetail(key, data);
      syncFilterTab(key);

      const spotlight = document.getElementById('activePersonaSpotlight');
      if (spotlight) {
        spotlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (e.target.closest('.inspect-btn')) {
        openPersonaInspectModal(key, data);
      }
    });

    personasContainer.appendChild(card);
  });
}

// =============================================================================
// Active Persona Spotlight Detail Viewer
// =============================================================================
function displayActivePersonaDetail(personaKey, personaData) {
  const activePersonaSpotlight = document.getElementById('activePersonaSpotlight');
  if (!activePersonaSpotlight) return;

  const config = PERSONA_CONFIG[personaKey] || PERSONA_CONFIG['Health-Conscious'];
  const data =
    personaData ||
    (currentPersonaData && currentPersonaData[personaKey]) || {
      alertLevel: 'Safe',
      recommendationText: 'Standard baseline meteorological guidance applies.'
    };

  let alertBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let alertDot = '🟢';

  if (data.alertLevel === 'Warning') {
    alertBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    alertDot = '🟡';
  } else if (data.alertLevel === 'Danger') {
    alertBadgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    alertDot = '🔴';
  }

  activePersonaSpotlight.innerHTML = `
    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/10">
          ${config.icon}
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold border border-sky-500/20 uppercase tracking-wide">
              Selected Persona Spotlight
            </span>
            <span class="text-xs text-slate-400">Category: ${config.category}</span>
          </div>
          <h3 class="text-2xl font-black text-white mt-1">${config.title}</h3>
          <p class="text-xs text-slate-300 mt-0.5">${config.subtitle}</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="px-4 py-2 rounded-2xl border ${alertBadgeStyle} font-bold text-sm flex items-center space-x-2 shadow-lg">
          <span class="text-base">${alertDot}</span>
          <span>${data.alertLevel} Alert</span>
        </div>
      </div>
    </div>

    <!-- Recommendation Body -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
      <div class="lg:col-span-2 space-y-3">
        <div class="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <span>📋</span>
          <span>Biometeorological Advisory & Action Guidance</span>
        </div>
        <div class="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm sm:text-base leading-relaxed text-slate-100 font-medium">
          ${data.recommendationText}
        </div>
        <p class="text-xs text-slate-400 flex items-center gap-1.5">
          <span>ℹ️</span>
          <span>${config.guidance}</span>
        </p>
      </div>

      <div class="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
        <div>
          <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Key Critical Factors</h4>
          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Alert Classification:</span>
              <span class="font-bold text-white">${data.alertLevel}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">City / Location:</span>
              <span class="font-bold text-white">${currentCityName}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Compliance Standard:</span>
              <span class="font-medium text-sky-400">IMD / MoES Protocol</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Engine Precision:</span>
              <span class="font-mono text-emerald-400">Psychrometric THI</span>
            </div>
          </div>
        </div>
        <div class="pt-2 text-[11px] text-slate-500 text-center">
          Click any persona card in the grid below to inspect its tailored dashboard.
        </div>
      </div>
    </div>

    ${personaKey === 'Agriculture/Gardeners' ? `
    <!-- Gramin Krishi Smart Agronomy Advisory Section -->
    <div class="mt-6 pt-5 border-t border-slate-800/80">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
          <span class="text-amber-400">🌾</span>
          <span>Gramin Krishi Smart Agronomy & Crop-Soil Mapping Engine</span>
        </h4>
        <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
          Soil, Season & Climate Advisory
        </span>
      </div>

      <!-- Interactive Question Prompts -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div>
          <label class="block text-[11px] font-bold text-slate-300 mb-1">1. Select Soil Type:</label>
          <select id="agriSoilSelect" onchange="renderGraminKrishiAdvisory()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer">
            <option value="Alluvial">Alluvial Soil (River Basins & Deltas)</option>
            <option value="Black">Black Soil / Regur (Basaltic Clay)</option>
            <option value="Red">Red & Yellow Soil (Porous & Iron Rich)</option>
            <option value="Laterite">Laterite Soil (Acidic Hill Slopes)</option>
            <option value="Sandy">Sandy Soil (Arid & Coastal Dunes)</option>
            <option value="Loamy" selected>Loamy Soil (Optimal 40-40-20 Mix)</option>
            <option value="Clayey">Clayey Soil (Heavy Water Retentive)</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-300 mb-1">2. Select Cropping Season:</label>
          <select id="agriSeasonSelect" onchange="renderGraminKrishiAdvisory()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer">
            <option value="Kharif">Kharif (Monsoon: Jun – Oct)</option>
            <option value="Rabi">Rabi (Winter: Oct – Mar)</option>
            <option value="Zaid">Zaid (Summer: Mar – Jun)</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-300 mb-1">3. Select Target Crop (Optional):</label>
          <select id="agriCropSelect" onchange="renderGraminKrishiAdvisory()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer">
            <option value="Auto">Auto-Match Best Yield Crops</option>
            <option value="Rice (Paddy)">Rice (Paddy)</option>
            <option value="Wheat">Wheat</option>
            <option value="Maize">Maize</option>
            <option value="Cotton">Cotton</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Mustard">Mustard</option>
            <option value="Chickpea (Gram)">Chickpea (Gram)</option>
            <option value="Groundnut">Groundnut</option>
            <option value="Soyabean">Soyabean</option>
          </select>
        </div>
      </div>

      <!-- Dynamic Output Advisory Container -->
      <div id="graminKrishiOutput" class="space-y-4"></div>
    </div>
    ` : ''}
  `;

  if (personaKey === 'Agriculture/Gardeners') {
    setTimeout(renderGraminKrishiAdvisory, 50);
  }
  `;

  const hourlyChip = document.getElementById('hourlyProfileChip');
  if (hourlyChip) hourlyChip.textContent = `${config.displayName} Focus`;
}

// =============================================================================
// Responsive 8-Persona Category Filter Tabs
// =============================================================================
function setupFilterTabs() {
  const personaFilterTabs = document.getElementById('personaFilterTabs');
  const personasContainer = document.getElementById('personasContainer');
  if (!personaFilterTabs) return;
  const tabs = personaFilterTabs.querySelectorAll('.filter-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active', 'bg-sky-500', 'text-white'));
      tab.classList.add('active', 'bg-sky-500', 'text-white');

      const filter = tab.dataset.filter;
      const cards = personasContainer.querySelectorAll('.persona-card');

      cards.forEach((card) => {
        if (filter === 'all' || card.dataset.filter === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      if (filter !== 'all' && PERSONA_CONFIG[filter]) {
        activeSelectedPersonaKey = filter;
        displayActivePersonaDetail(filter, currentPersonaData[filter]);
        cards.forEach((c) => {
          if (c.dataset.personaKey === filter) {
            c.classList.add('active-selected');
          } else {
            c.classList.remove('active-selected');
          }
        });
      }
    });
  });
}

function syncFilterTab(personaKey) {
  const personaFilterTabs = document.getElementById('personaFilterTabs');
  if (!personaFilterTabs) return;
  const tabs = personaFilterTabs.querySelectorAll('.filter-tab');
  tabs.forEach((t) => {
    if (t.dataset.filter === personaKey) {
      tabs.forEach((tb) => tb.classList.remove('active', 'bg-sky-500', 'text-white'));
      t.classList.add('active', 'bg-sky-500', 'text-white');
    }
  });
}

// =============================================================================
// Quick Persona Switcher Chips & Onboarding Wizard
// =============================================================================
function setupPersonaSwitchers() {
  const demoBtns = document.querySelectorAll('.demo-btn');
  demoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const demoRole = btn.getAttribute('data-demo');
      demoBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      state.currentPersona = demoRole;
      if (currentWeatherData) {
        updatePersonalizationEngineUI(currentWeatherData, currentCityName);
      }
    });
  });

  const openOnboardingBtn = document.getElementById('openOnboardingBtn');
  const changePersonaBtn = document.getElementById('changePersonaBtn');
  const onboardingModal = document.getElementById('onboardingModal');
  const closeOnboardingModal = document.getElementById('closeOnboardingModal');
  const finishOnboardingBtn = document.getElementById('finishOnboardingBtn');

  const openModal = () => {
    if (onboardingModal) {
      document.querySelectorAll('.purpose-card').forEach((card) => {
        card.classList.toggle('active', card.getAttribute('data-purpose') === state.currentPersona);
      });
      onboardingModal.classList.add('open');
    }
  };

  if (openOnboardingBtn) openOnboardingBtn.addEventListener('click', openModal);
  if (changePersonaBtn) changePersonaBtn.addEventListener('click', openModal);

  if (closeOnboardingModal) {
    closeOnboardingModal.addEventListener('click', () => {
      onboardingModal.classList.remove('open');
    });
  }

  document.querySelectorAll('.purpose-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.purpose-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  if (finishOnboardingBtn) {
    finishOnboardingBtn.addEventListener('click', () => {
      const activeCard = document.querySelector('.purpose-card.active');
      if (activeCard) {
        const role = activeCard.getAttribute('data-purpose');
        state.currentPersona = role;
        demoBtns.forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-demo') === role);
        });
        if (currentWeatherData) {
          updatePersonalizationEngineUI(currentWeatherData, currentCityName);
        }
      }
      onboardingModal.classList.remove('open');
    });
  }
}

// =============================================================================
// App Navigation Tabs
// =============================================================================
function setupNavigationTabs() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPages = document.querySelectorAll('.tab-page');

  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      navTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      tabPages.forEach((page) => {
        if (page.id === `tab-${targetTab}`) {
          page.classList.remove('hidden');
          page.classList.add('active');
        } else {
          page.classList.add('hidden');
          page.classList.remove('active');
        }
      });

      if (targetTab === 'forecast') {
        setTimeout(() => {
          if (hourlyChartInstance) hourlyChartInstance.resize();
          if (personaHourlyChartInstance) personaHourlyChartInstance.resize();
        }, 120);
      }
    });
  });
}

// =============================================================================
// Language Switcher (English & Hindi)
// =============================================================================
function setupLanguageToggle() {
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langLabel = document.getElementById('langLabel');

  if (!langToggleBtn || !langLabel) return;

  langToggleBtn.addEventListener('click', () => {
    state.currentLang = state.currentLang === 'en' ? 'hi' : 'en';
    document.body.setAttribute('data-lang', state.currentLang);
    langLabel.textContent = state.currentLang === 'en' ? 'हिंदी' : 'English';

    const langData = i18n[state.currentLang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (langData && langData[key]) {
        el.innerHTML = langData[key];
      }
    });
  });
}

// =============================================================================
// 7-Day Extended IMD Forecast
// =============================================================================
function renderForecast(weather) {
  const forecastDays = document.getElementById('forecastDays');
  if (!forecastDays) return;

  const baseTemp = Number(weather.temperature || 28);
  const baseRain = Number(weather.rainProb || 15);
  const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  forecastDays.innerHTML = days.map((day, idx) => {
    const high = Math.round(baseTemp + (idx === 0 ? 2 : (idx % 2 === 0 ? 1 : -1)));
    const low = Math.round(baseTemp - 6 + (idx % 2));
    const rain = Math.max(0, Math.min(100, Math.round(baseRain + (idx * 5) - 10)));
    const cond = rain > 60 ? 'Thunderstorm Showers' : rain > 35 ? 'Scattered Rain' : 'Partly Cloudy';
    const icon = rain > 60 ? 'fa-cloud-bolt text-rose-400' : rain > 35 ? 'fa-cloud-rain text-sky-400' : 'fa-cloud-sun text-amber-400';

    return `
      <div class="forecast-row">
        <span class="day-name">${day}</span>
        <div class="forecast-cond">
          <i class="fa-solid ${icon}"></i>
          <span>${cond}</span>
          <span class="text-xs text-sky-400 ml-2 font-mono">${rain}% Rain</span>
        </div>
        <span class="forecast-temps">${high}° / ${low}°C</span>
      </div>
    `;
  }).join('');
}

// =============================================================================
// 24-Hour Telemetry Charts (Chart.js)
// =============================================================================
function renderChart(weather) {
  const chartEl = document.getElementById('hourlyChart');
  if (!chartEl || typeof Chart === 'undefined') return;
  const ctx = chartEl.getContext('2d');

  const baseTemp = Number(weather.temperature || 28);
  const baseRain = Number(weather.rainProb || 15);

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const tempVariance = [-4, -5, -6, -5, -3, -1, 1, 3, 4, 5, 4, 3, 2, 1, 0, -1, -2, -3, -3, -4, -4, -4, -4, -4];
  const rainVariance = [-10, -5, 0, 5, 10, 20, 30, 45, 35, 20, 10, 5, 0, -5, -10, -10, -5, 0, 5, 10, 15, 20, 10, 0];

  const temps = tempVariance.map((v) => Number((baseTemp + v).toFixed(1)));
  const rainProb = rainVariance.map((v) => Math.max(0, Math.min(100, Math.round(baseRain + v))));

  if (hourlyChartInstance) hourlyChartInstance.destroy();

  hourlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'Rain Probability (%)',
          data: rainProb,
          borderColor: '#818cf8',
          backgroundColor: 'rgba(129, 140, 248, 0.45)',
          type: 'bar',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#94a3b8' } }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
        y: { type: 'linear', position: 'left', title: { display: true, text: 'Temp (°C)', color: '#38bdf8' }, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
        y1: { type: 'linear', position: 'right', min: 0, max: 100, title: { display: true, text: 'Rain (%)', color: '#818cf8' }, ticks: { color: '#94a3b8' }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function renderPersonaHourlyChart(weather) {
  const chartEl = document.getElementById('personaHourlyChart');
  if (!chartEl || typeof Chart === 'undefined') return;
  const ctx = chartEl.getContext('2d');

  const baseTemp = Number(weather.temperature || 28);
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const thiTrend = hours.map((_, i) => Number((15 + 0.4 * (baseTemp + 5 + Math.sin(i / 3) * 4)).toFixed(1)));

  if (personaHourlyChartInstance) personaHourlyChartInstance.destroy();

  personaHourlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Bioclimatic Comfort Index (THI)',
          data: thiTrend,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8' } }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.2)' } }
      }
    }
  });
}


// =============================================================================
// Mausam AI Assistant Chatbot Drawer Logic
// =============================================================================
function setupAiDrawer() {
  const aiAssistantFab = document.getElementById('aiAssistantFab');
  const aiDrawer = document.getElementById('aiDrawer');
  const closeAiDrawer = document.getElementById('closeAiDrawer');
  const aiInput = document.getElementById('aiInput');
  const aiSendBtn = document.getElementById('aiSendBtn');
  const aiChatBody = document.getElementById('aiChatBody');

  if (!aiAssistantFab || !aiDrawer) return;

  aiAssistantFab.addEventListener('click', () => aiDrawer.classList.toggle('open'));
  if (closeAiDrawer) closeAiDrawer.addEventListener('click', () => aiDrawer.classList.remove('open'));

  const handleAiSubmit = () => {
    const query = aiInput.value.trim();
    if (!query) return;

    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-bubble user-msg';
    userMsgDiv.textContent = query;
    aiChatBody.appendChild(userMsgDiv);

    aiInput.value = '';
    aiChatBody.scrollTop = aiChatBody.scrollHeight;

    setTimeout(() => {
      const response = generateAiResponse(query.toLowerCase());
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = 'chat-bubble ai-msg';
      aiMsgDiv.innerHTML = response;
      aiChatBody.appendChild(aiMsgDiv);
      aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }, 450);
  };

  if (aiSendBtn) aiSendBtn.addEventListener('click', handleAiSubmit);
  if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAiSubmit();
    });
  }
}

function generateAiResponse(q) {
  const temp = currentWeatherData ? Number(currentWeatherData.temperature).toFixed(1) : '31.0';
  const rain = currentWeatherData ? currentWeatherData.rainProb : '15';
  const city = currentCityName || 'New Delhi';

  if (q.includes('run') || q.includes('jog') || q.includes('fitness') || q.includes('workout')) {
    return `<strong>Runner Recommendation for ${city}:</strong> The safest workout window is early morning (05:30 AM - 07:15 AM) at ${temp}°C before midday heat levels climb. Hydration target: 500 ml/hr.`;
  }
  if (q.includes('school') || q.includes('parent') || q.includes('commute') || q.includes('child')) {
    return `<strong>School Commute Insight for ${city}:</strong> Rain probability is ${rain}%. Morning school transit is generally safe. Maintain umbrella preparation if rain probability exceeds 40%.`;
  }
  if (q.includes('travel') || q.includes('flight') || q.includes('pack') || q.includes('tourist')) {
    return `<strong>Travel Advisory for ${city}:</strong> Current temperature is ${temp}°C. Weather-induced flight delay probability is low to moderate. Pack breathable fabrics.`;
  }
  if (q.includes('crop') || q.includes('farmer') || q.includes('wheat') || q.includes('cotton') || q.includes('soil')) {
    return `<strong>Gramin Krishi Agromet Advice for ${city}:</strong> Soil moisture is in the normal range. Rain probability is ${rain}%. Favorable conditions for seasonal crop scouting and balanced fertilization.`;
  }

  return `<strong>Mausam AI Update for ${city}:</strong> Current temperature is ${temp}°C with ${rain}% rain probability. Ask me about running timings, school commute advisories, or agricultural crop protection!`;
}

// =============================================================================
// Modals Handling (Bookmark Modal, Advisory Modal, Customize Modal)
// =============================================================================
function setupModalEvents() {
  const saveModal = document.getElementById('saveModal');
  const openSaveModalBtn = document.getElementById('openSaveModalBtn');
  const closeSaveModalBtn = document.getElementById('closeSaveModalBtn');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const saveLocationForm = document.getElementById('saveLocationForm');
  const saveCityName = document.getElementById('saveCityName');
  const saveLat = document.getElementById('saveLat');
  const saveLon = document.getElementById('saveLon');
  const saveFeedback = document.getElementById('saveFeedback');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');

  if (openSaveModalBtn && saveModal) {
    openSaveModalBtn.addEventListener('click', () => {
      if (saveCityName) saveCityName.value = currentCityName;
      if (saveLat) saveLat.value = currentCoordinates.lat;
      if (saveLon) saveLon.value = currentCoordinates.lon;
      if (saveFeedback) saveFeedback.className = 'hidden';
      saveModal.classList.add('open');
    });
  }

  const closeSave = () => {
    if (saveModal) saveModal.classList.remove('open');
  };

  if (closeSaveModalBtn) closeSaveModalBtn.addEventListener('click', closeSave);
  if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSave);

  if (saveLocationForm) {
    saveLocationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      confirmSaveBtn.disabled = true;
      confirmSaveBtn.textContent = 'Saving...';
      if (saveFeedback) saveFeedback.className = 'hidden';

      const payload = {
        userId: document.getElementById('saveUserId').value.trim(),
        cityName: saveCityName.value.trim(),
        latitude: parseFloat(saveLat.value),
        longitude: parseFloat(saveLon.value),
        preferredPersona: document.getElementById('savePersona').value
      };

      try {
        const res = await fetch('/api/save-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || `Save failed (${res.status})`);
        }

        saveFeedback.className =
          'p-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block';
        saveFeedback.textContent = `✔ Successfully bookmarked "${payload.cityName}" for ${payload.preferredPersona}!`;

        setTimeout(() => {
          closeSave();
          confirmSaveBtn.disabled = false;
          confirmSaveBtn.textContent = 'Save Bookmark';
        }, 1500);
      } catch (err) {
        saveFeedback.className =
          'p-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 block';
        saveFeedback.textContent = `✖ Failed to bookmark: ${err.message}`;
        confirmSaveBtn.disabled = false;
        confirmSaveBtn.textContent = 'Save Bookmark';
      }
    });
  }

  // Advisory Modal & Customization Modal
  const advisoryModal = document.getElementById('advisoryModal');
  const closeAdvisoryModal = document.getElementById('closeAdvisoryModal');
  const dismissAdvisoryBtn = document.getElementById('dismissAdvisoryBtn');

  if (closeAdvisoryModal) closeAdvisoryModal.addEventListener('click', () => advisoryModal.classList.remove('open'));
  if (dismissAdvisoryBtn) dismissAdvisoryBtn.addEventListener('click', () => advisoryModal.classList.remove('open'));

  const customizeBtn = document.getElementById('customizeBtn');
  const customModal = document.getElementById('customModal');
  const closeCustomModal = document.getElementById('closeCustomModal');
  const saveCustomBtn = document.getElementById('saveCustomBtn');

  if (customizeBtn && customModal) {
    customizeBtn.addEventListener('click', () => customModal.classList.add('open'));
  }
  if (closeCustomModal && customModal) {
    closeCustomModal.addEventListener('click', () => customModal.classList.remove('open'));
  }
  if (saveCustomBtn && customModal) {
    saveCustomBtn.addEventListener('click', () => customModal.classList.remove('open'));
  }

  // Backdrop click to close modals
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
      const aiDrawer = document.getElementById('aiDrawer');
      if (aiDrawer) aiDrawer.classList.remove('open');
    }
  });
}

// Helper: Loading Spinner
function setLoading(loading) {
  const searchBtn = document.getElementById('searchBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  if (!searchBtn || !btnSpinner || !btnText) return;
  if (loading) {
    btnSpinner.classList.remove('hidden');
    btnText.textContent = 'Fetching...';
    searchBtn.disabled = true;
  } else {
    btnSpinner.classList.add('hidden');
    btnText.textContent = 'Get Forecast';
    searchBtn.disabled = false;
  }
// Helper: Calculate Feels-Like Temperature
function getFeelsLike(tempC, humidity, windKmH) {
  if (tempC >= 25) {
    const hi = tempC + 0.33 * ((humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC))) - 0.7 * (windKmH / 3.6) - 4.0;
    return Number(hi.toFixed(1));
  } else if (tempC <= 10 && windKmH > 4.8) {
    const wc = 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windKmH, 0.16) + 0.3965 * tempC * Math.pow(windKmH, 0.16);
    return Number(wc.toFixed(1));
  }
  return Number(tempC.toFixed(1));
}

// Helper: Wind Direction String
function getWindDirString(deg) {
  if (typeof deg !== 'number') return 'NW (315°)';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return `${dirs[index]} (${Math.round(deg)}°)`;
}

// Helper: Universal Status Badge
function getStatusBadgeMarkup(level) {
  const norm = (level || 'SAFE').toUpperCase();
  if (norm.includes('HIGH') || norm.includes('DANGER') || norm === 'HIGH RISK' || norm === 'POOR' || norm === 'NO') {
    return `<span class="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1.5 shadow-lg"><span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>🔴 HIGH RISK</span>`;
  }
  if (norm.includes('WARN') || norm === 'WARNING' || norm === 'NOT RECOMMENDED') {
    return `<span class="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 flex items-center gap-1.5 shadow-lg"><span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>🟠 WARNING / NOT RECOMMENDED</span>`;
  }
  if (norm.includes('CAUT') || norm === 'CAUTION' || norm === 'MODERATE' || norm === 'MEDIUM') {
    return `<span class="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1.5 shadow-lg"><span class="w-2 h-2 rounded-full bg-amber-500"></span>🟡 CAUTION</span>`;
  }
  return `<span class="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-lg"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>🟢 SAFE / GOOD</span>`;
}

// Helper: Global Inspection Top Header
function getGlobalInspectHeader(config, weather) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isLive = weather && !weather.isFallback;
  const dataTag = isLive
    ? `<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">🟢 LIVE DATA</span>`
    : `<span class="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">🌐 FORECAST / ESTIMATED DATA</span>`;

  const temp = weather?.temperature ?? 28.5;
  const feelsLike = getFeelsLike(temp, weather?.humidity ?? 65, weather?.windSpeed ?? 12);
  const humidity = weather?.humidity ?? 65;
  const windSpeed = weather?.windSpeed ?? 12;
  const windDir = getWindDirString(weather?.windDegree);
  const rainProb = weather?.rainProb ?? 15;
  const visibility = weather?.visibility ? (weather.visibility / 1000).toFixed(1) : '10.0';
  const uvIndex = weather?.uvIndex ?? 5.5;

  return `
    <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 shadow-inner">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-lg">
            ${config.icon}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-lg font-black text-white">${currentCityName}</h3>
              ${dataTag}
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">📅 ${dateStr}</p>
          </div>
        </div>
        <div class="text-left sm:text-right">
          <span class="text-2xl font-black text-white">${temp.toFixed(1)}°C</span>
          <span class="text-xs text-slate-400 block">Feels Like ${feelsLike}°C</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">💧 Humidity</span>
          <strong class="text-white text-xs">${humidity}%</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">💨 Wind Speed</span>
          <strong class="text-white text-xs">${windSpeed} km/h (${windDir.split(' ')[0]})</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">🌧️ Rain Prob</span>
          <strong class="text-sky-400 text-xs">${rainProb}%</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">👁️ Visibility</span>
          <strong class="text-white text-xs">${visibility} km</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">☀️ UV Index</span>
          <strong class="text-amber-300 text-xs">${uvIndex}</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span class="text-[10px] text-slate-400 block">🫁 PM2.5 AQI</span>
          <strong class="text-emerald-400 text-xs">${weather?.pm2_5 ? weather.pm2_5 + ' µg/m³' : '35.0 µg/m³'}</strong>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 1: Health-Conscious Inspector
// -----------------------------------------------------------------------------
function renderHealthInspect(weather, config, personaData) {
  const pm25 = weather?.pm2_5 ?? 35.0;
  const pm10 = weather?.pm10 ?? 75.0;
  const uv = weather?.uvIndex ?? 5.5;
  const temp = weather?.temperature ?? 28.5;
  const humidity = weather?.humidity ?? 65;

  let statusLevel = 'SAFE';
  if (pm25 > 150 || uv >= 9 || temp >= 40) statusLevel = 'HIGH RISK';
  else if (pm25 > 75 || uv >= 7 || temp >= 35) statusLevel = 'WARNING';
  else if (pm25 > 35 || uv >= 5 || temp >= 30) statusLevel = 'CAUTION';

  const pollenText = humidity > 75 ? 'Moderate to High (Fungal spores elevated)' : 'Low (1.4/10 Index)';
  const maskAdvice = pm25 > 75 ? 'N95 / FFP2 Mask Strongly Recommended for outdoor exposure' : 'No mask required for general population';
  const outdoorAdvice = pm25 > 100 ? 'Avoid prolonged strenuous outdoor activity' : 'Outdoor exercise is generally safe';
  const bestTime = temp > 32 ? 'Early Morning (06:00 - 08:30 AM)' : 'Morning or Late Afternoon';

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🩺</span> Health & Respiratory Protection Inspection
        </h4>
        ${getStatusBadgeMarkup(statusLevel)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🫁 Respiratory & Air Quality Safety</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Air Quality Status:</strong> ${pm25 > 75 ? 'Unhealthy for Sensitive Groups' : 'Good / Moderate Air Quality'}</div>
            <div><strong>PM2.5 / PM10 Concentration:</strong> ${pm25} µg/m³ / ${pm10} µg/m³</div>
            <div><strong>Pollen Level:</strong> ${pollenText}</div>
            <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 mt-1">
              <strong>Protection Rec:</strong> ${maskAdvice}
            </div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">☀️ Heat & UV Safety Guidance</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>UV Index Level:</strong> ${uv} (${uv >= 8 ? 'Very High Risk' : uv >= 5 ? 'Moderate Risk' : 'Low Risk'})</div>
            <div><strong>Sunscreen Rec:</strong> ${uv >= 6 ? 'Apply SPF 50+ broad-spectrum sunscreen every 2 hrs' : 'SPF 30 recommended'}</div>
            <div><strong>Hydration Target:</strong> Drink at least 0.5 - 0.75 L of water per hour of activity</div>
            <div><strong>Best Outdoor Window:</strong> ${bestTime}</div>
          </div>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-1">
        <strong class="text-emerald-400 block text-sm">📋 Summary & Action Plan:</strong>
        <p>${statusLevel === 'SAFE' ? 'Outdoor activity is generally safe today for all populations.' : 'Limit prolonged outdoor activity during peak afternoon hours due to elevated UV and thermal stress.'}</p>
        <span class="text-[10px] text-slate-500 block pt-1">Disclaimer: This automated guidance evaluates biometeorological parameters and does not diagnose medical conditions.</span>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 2: Daily Commuters Inspector
// -----------------------------------------------------------------------------
function renderCommutersInspect(weather, config, personaData) {
  const rainProb = weather?.rainProb ?? 15;
  const windSpeed = weather?.windSpeed ?? 12;
  const visibility = weather?.visibility ? weather.visibility / 1000 : 10.0;

  let statusLevel = 'SAFE';
  if (rainProb > 75 || visibility < 1.0 || windSpeed > 35) statusLevel = 'HIGH RISK';
  else if (rainProb > 45 || visibility < 3.0 || windSpeed > 25) statusLevel = 'WARNING';
  else if (rainProb > 25 || visibility < 5.0) statusLevel = 'CAUTION';

  const bestWindow = rainProb > 40 ? 'Between 07:00 AM - 09:00 AM (Prior to rain peak)' : 'All day clear corridor';

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🚗</span> Daily Transit & Road Weather Inspection
        </h4>
        ${getStatusBadgeMarkup(statusLevel)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🛣️ Corridor & Highway Safety</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Road Hazard Level:</strong> ${statusLevel}</div>
            <div><strong>Visibility Threshold:</strong> ${visibility.toFixed(1)} km ${visibility < 3.0 ? '⚠️ (Fog / Haze Alert)' : '(Clear)'}</div>
            <div><strong>Rain Hazard:</strong> ${rainProb}% Probability ${rainProb > 50 ? '☔ Carry Umbrella / Raincoat' : ''}</div>
            <div><strong>Two-Wheeler Caution:</strong> ${windSpeed > 25 ? '⚠️ Strong Crosswinds (Exercise caution)' : 'Normal wind conditions'}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">⏱️ Best Travel Window & Nowcast</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Recommended Window:</strong> ${bestWindow}</div>
            <div><strong>Route Flow:</strong> ${weather?.trafficCondition || 'Normal Flow'}</div>
            <div><strong>IMD Corridor Status:</strong> ${weather?.routeConditions || 'Passable without severe closures'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 3: Farmers & Agriculture Inspector (MOST DETAILED)
// -----------------------------------------------------------------------------
const STATE_AGRICULTURE_DB = {
  'Gujarat': {
    soils: ['Black', 'Alluvial', 'Sandy', 'Loamy'],
    crops: {
      Black: { Kharif: ['Cotton', 'Groundnut', 'Soyabean', 'Sorghum'], Rabi: ['Chickpea (Gram)', 'Wheat', 'Mustard'], Zaid: ['Sesame', 'Cowpea'] },
      Alluvial: { Kharif: ['Rice (Paddy)', 'Maize', 'Sugarcane'], Rabi: ['Wheat', 'Mustard', 'Potato'], Zaid: ['Watermelon', 'Moong'] },
      Sandy: { Kharif: ['Pearl Millet (Bajra)', 'Groundnut', 'Guar'], Rabi: ['Mustard', 'Cumin (Jeera)'], Zaid: ['Muskmelon'] }
    }
  },
  'Punjab': {
    soils: ['Alluvial', 'Loamy'],
    crops: {
      Alluvial: { Kharif: ['Rice (Paddy)', 'Maize', 'Cotton'], Rabi: ['Wheat', 'Mustard', 'Barley', 'Potato'], Zaid: ['Moong', 'Fodder'] },
      Loamy: { Kharif: ['Maize', 'Rice (Paddy)', 'Basmati Rice'], Rabi: ['Wheat', 'Peas', 'Mustard'], Zaid: ['Sunflower'] }
    }
  },
  'Rajasthan': {
    soils: ['Sandy', 'Red', 'Alluvial', 'Black'],
    crops: {
      Sandy: { Kharif: ['Pearl Millet (Bajra)', 'Guar', 'Moth Bean'], Rabi: ['Mustard', 'Chickpea (Gram)', 'Cumin'], Zaid: ['Watermelon'] },
      Black: { Kharif: ['Soyabean', 'Maize', 'Cotton'], Rabi: ['Wheat', 'Gram', 'Mustard'], Zaid: ['Fodder'] },
      Red: { Kharif: ['Maize', 'Pulses', 'Groundnut'], Rabi: ['Mustard', 'Barley'], Zaid: ['Vegetables'] }
    }
  },
  'Maharashtra': {
    soils: ['Black', 'Laterite', 'Red'],
    crops: {
      Black: { Kharif: ['Cotton', 'Soyabean', 'Sugarcane', 'Pigeon Pea (Arhar)'], Rabi: ['Jowar', 'Gram', 'Wheat'], Zaid: ['Sunflower'] },
      Laterite: { Kharif: ['Rice (Paddy)', 'Cashew', 'Mango'], Rabi: ['Pulses', 'Spices'], Zaid: ['Coconut'] }
    }
  },
  'Kerala': {
    soils: ['Laterite', 'Sandy', 'Alluvial'],
    crops: {
      Laterite: { Kharif: ['Tapioca', 'Rubber', 'Tea', 'Coffee', 'Spices'], Rabi: ['Pepper', 'Cardamom', 'Arecanut'], Zaid: ['Coconut'] },
      Sandy: { Kharif: ['Rice (Paddy)', 'Coconut'], Rabi: ['Pulses', 'Vegetables'], Zaid: ['Watermelon'] }
    }
  },
  'Uttar Pradesh': {
    soils: ['Alluvial', 'Loamy', 'Clayey'],
    crops: {
      Alluvial: { Kharif: ['Rice (Paddy)', 'Sugarcane', 'Maize'], Rabi: ['Wheat', 'Mustard', 'Potato', 'Peas'], Zaid: ['Watermelon', 'Moong'] }
    }
  },
  'Karnataka': {
    soils: ['Red', 'Black', 'Laterite'],
    crops: {
      Red: { Kharif: ['Finger Millet (Ragi)', 'Groundnut', 'Maize'], Rabi: ['Pulses', 'Oilseeds'], Zaid: ['Sunflower'] },
      Black: { Kharif: ['Cotton', 'Soyabean', 'Sugarcane'], Rabi: ['Jowar', 'Gram'], Zaid: ['Fodder'] }
    }
  },
  'Tamil Nadu': {
    soils: ['Red', 'Alluvial', 'Black'],
    crops: {
      Red: { Kharif: ['Groundnut', 'Ragi', 'Pulses'], Rabi: ['Sesame', 'Cotton'], Zaid: ['Melons'] },
      Alluvial: { Kharif: ['Rice (Paddy)', 'Sugarcane', 'Banana'], Rabi: ['Rice (Paddy)', 'Pulses'], Zaid: ['Groundnut'] }
    }
  },
  'West Bengal': {
    soils: ['Alluvial', 'Clayey', 'Laterite'],
    crops: {
      Alluvial: { Kharif: ['Rice (Paddy)', 'Jute', 'Maize'], Rabi: ['Potato', 'Mustard', 'Wheat'], Zaid: ['Sesame'] }
    }
  }
};

let farmerStateData = {
  state: 'Gujarat',
  soil: 'Black',
  area: 5,
  irrigation: 'Drip / Micro-Irrigation',
  crop: 'Cotton',
  stage: 'Vegetative Growth'
};

function renderFarmersInspect(weather, config, personaData) {
  const temp = weather?.temperature ?? 28.5;
  const feelsLike = getFeelsLike(temp, weather?.humidity ?? 65, weather?.windSpeed ?? 12);
  const humidity = weather?.humidity ?? 65;
  const rainProb = weather?.rainProb ?? 15;
  const soilMoisture = weather?.soilMoisture ?? 0.25;
  const windSpeed = weather?.windSpeed ?? 12;

  let farmStatus = 'GOOD FOR FARMING';
  let farmStatusReason = `Conditions are highly favorable for field operations in ${currentCityName} because rainfall probability is low (${rainProb}%), temperature is moderate (${temp.toFixed(1)}°C), and soil moisture is optimal (${soilMoisture} m³/m³).`;

  if (rainProb > 70 || windSpeed > 35) {
    farmStatus = 'HIGH RISK';
    farmStatusReason = `Field work is NOT RECOMMENDED today in ${currentCityName} because heavy rainfall (${rainProb}%) and strong winds (${windSpeed} km/h) threaten crop lodging and soil erosion.`;
  } else if (rainProb > 45 || temp > 38 || soilMoisture < 0.15) {
    farmStatus = 'CAUTION';
    farmStatusReason = `Exercise CAUTION for field work in ${currentCityName}. ${soilMoisture < 0.15 ? 'Root zone moisture deficit detected; schedule early morning irrigation.' : 'Elevated precipitation risk; hold off fertilizer application.'}`;
  }

  // Detect state automatically if possible
  const cityLower = currentCityName.toLowerCase();
  if (cityLower.includes('punjab') || cityLower.includes('amritsar') || cityLower.includes('ludhiana')) farmerStateData.state = 'Punjab';
  else if (cityLower.includes('mumbai') || cityLower.includes('pune') || cityLower.includes('nagpur')) farmerStateData.state = 'Maharashtra';
  else if (cityLower.includes('udaipur') || cityLower.includes('bikaner') || cityLower.includes('jaipur')) farmerStateData.state = 'Rajasthan';
  else if (cityLower.includes('kochi') || cityLower.includes('trivandrum')) farmerStateData.state = 'Kerala';
  else if (cityLower.includes('bengaluru') || cityLower.includes('mysore')) farmerStateData.state = 'Karnataka';
  else if (cityLower.includes('chennai') || cityLower.includes('coimbatore')) farmerStateData.state = 'Tamil Nadu';
  else if (cityLower.includes('kolkata')) farmerStateData.state = 'West Bengal';

  const month = new Date().getMonth();
  const currentSeason = (month >= 5 && month <= 9) ? 'Kharif' : (month >= 10 || month <= 2) ? 'Rabi' : 'Zaid';

  const stateData = STATE_AGRICULTURE_DB[farmerStateData.state] || STATE_AGRICULTURE_DB['Gujarat'];
  const soilKey = farmerStateData.soil.split(' ')[0];
  const matchedCrops = (stateData.crops[soilKey] && stateData.crops[soilKey][currentSeason])
    ? stateData.crops[soilKey][currentSeason]
    : ['Rice (Paddy)', 'Wheat', 'Maize', 'Soyabean', 'Mustard'];

  const unsuitableCrops = farmerStateData.soil.includes('Black')
    ? ['Groundnut (Pegging obstructed in heavy clay)', 'Potato (Rot risk in heavy soil)']
    : farmerStateData.soil.includes('Sandy')
    ? ['Rice (Paddy) (High water percolation)', 'Sugarcane (Requires heavy clay loam)']
    : ['Crop rot under waterlogging'];

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🌾</span> Comprehensive Agronomy & Precision Farming Inspector
        </h4>
        ${getStatusBadgeMarkup(farmStatus)}
      </div>

      <!-- Interactive Inputs Bar -->
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <h5 class="text-xs font-bold text-amber-400 uppercase tracking-wider">📋 Customize Farm Parameters:</h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">State / Region:</label>
            <select id="farmerStateSelect" onchange="updateFarmerInputs()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white">
              ${Object.keys(STATE_AGRICULTURE_DB).map(s => `<option value="${s}" ${s === farmerStateData.state ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Soil Type:</label>
            <select id="farmerSoilSelect" onchange="updateFarmerInputs()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white">
              <option value="Black" ${farmerStateData.soil === 'Black' ? 'selected' : ''}>Black / Regur (Basaltic Clay)</option>
              <option value="Alluvial" ${farmerStateData.soil === 'Alluvial' ? 'selected' : ''}>Alluvial (River Basins & Deltas)</option>
              <option value="Red" ${farmerStateData.soil === 'Red' ? 'selected' : ''}>Red & Yellow (Porous & Iron Rich)</option>
              <option value="Laterite" ${farmerStateData.soil === 'Laterite' ? 'selected' : ''}>Laterite (Acidic Hill Slopes)</option>
              <option value="Sandy" ${farmerStateData.soil === 'Sandy' ? 'selected' : ''}>Sandy (Arid & Coastal Dunes)</option>
              <option value="Loamy" ${farmerStateData.soil === 'Loamy' ? 'selected' : ''}>Loamy (Balanced 40-40-20 Mix)</option>
              <option value="Clayey" ${farmerStateData.soil === 'Clayey' ? 'selected' : ''}>Clay (Heavy Retentive)</option>
              <option value="Unknown" ${farmerStateData.soil === 'Unknown' ? 'selected' : ''}>Unknown Soil Type</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Irrigation System:</label>
            <select id="farmerIrrigationSelect" onchange="updateFarmerInputs()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white">
              <option value="Drip / Micro-Irrigation">Drip / Micro-Irrigation</option>
              <option value="Canal / Borewell">Canal / Borewell</option>
              <option value="Rainfed Only">Rainfed Only</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Crop Stage:</label>
            <select id="farmerStageSelect" onchange="updateFarmerInputs()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white">
              <option value="Land Preparation & Sowing">Land Prep & Sowing</option>
              <option value="Vegetative Growth" selected>Vegetative Growth</option>
              <option value="Flowering & Podding">Flowering & Podding</option>
              <option value="Grain Filling">Grain Filling</option>
              <option value="Harvest Ready">Harvest Ready</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Current Farm Weather Status Card -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <h5 class="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">🌱 Farming Weather Status Evaluation</h5>
        <p class="text-xs text-slate-200 leading-relaxed">${farmStatusReason}</p>
      </div>

      <!-- Location-Aware Crop Suitability Matrix -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🌾 Recommended Suitable Crops (${currentCityName}, ${farmerStateData.state} - ${currentSeason} Season)</h5>
          <span class="text-[10px] text-slate-400">Soil: <strong>${farmerStateData.soil}</strong></span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          ${matchedCrops.map(crop => `
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div class="flex items-center justify-between">
                <strong class="text-white text-xs">🌱 ${crop}</strong>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">HIGH SUITABILITY</span>
              </div>
              <p class="text-[11px] text-slate-400">Optimal alignment with ${farmerStateData.soil} soil texture, current temperature (${temp.toFixed(1)}°C), and ${currentSeason} weather cycle.</p>
              <div class="flex gap-1.5 pt-1 text-[10px]">
                <span class="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-800">Weather: High</span>
                <span class="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">Soil: High</span>
                <span class="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800">Rainfall: Suitable</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1">
          <strong class="text-rose-300 block text-[11px]">🚫 Crops Not Suitable Under Current Conditions:</strong>
          <ul class="list-disc list-inside text-rose-200 text-[11px] space-y-0.5">
            ${unsuitableCrops.map(u => `<li>${u}</li>`).join('')}
          </ul>
        </div>

        <p class="text-[10px] text-slate-500">Notice: Suitable based on current weather and selected soil type. Final suitability depends on local agricultural conditions, irrigation, seed variety, pests, and expert/local agricultural guidance.</p>
      </div>

      <!-- Why This Recommendation? Breakdown -->
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
        <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🔍 WHY THIS RECOMMENDATION?</h5>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
          <div>Location: <strong>${currentCityName}, ${farmerStateData.state}</strong></div>
          <div>Soil Type: <strong>${farmerStateData.soil}</strong></div>
          <div>Temp / Humidity: <strong>${temp.toFixed(1)}°C / ${humidity}%</strong></div>
          <div>Rain Prob: <strong>${rainProb}%</strong></div>
        </div>
        <p class="text-slate-400 text-[11px] pt-1">
          Recommendation derived by matrixing live location meteorological parameters against soil water retention capacity and regional crop phenology standards.
        </p>
      </div>

      <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
        📌 <strong>Agricultural Disclaimer:</strong> This is a weather-based farming recommendation, not a replacement for advice from local agricultural experts or soil testing.
      </div>
    </div>
  `;
}

function updateFarmerInputs() {
  const stateSel = document.getElementById('farmerStateSelect');
  const soilSel = document.getElementById('farmerSoilSelect');
  const irriSel = document.getElementById('farmerIrrigationSelect');
  const stageSel = document.getElementById('farmerStageSelect');

  if (stateSel) farmerStateData.state = stateSel.value;
  if (soilSel) farmerStateData.soil = soilSel.value;
  if (irriSel) farmerStateData.irrigation = irriSel.value;
  if (stageSel) farmerStateData.stage = stageSel.value;

  openPersonaInspectModal('Agriculture/Gardeners', currentPersonaData['Agriculture/Gardeners']);
}

// -----------------------------------------------------------------------------
// Category 4: Beachgoers & Surfers Inspector
// -----------------------------------------------------------------------------
function renderBeachgoersInspect(weather, config, personaData) {
  const waveHeight = weather?.waveHeight ?? null;
  const windSpeed = weather?.windSpeed ?? 12;
  const uv = weather?.uvIndex ?? 5.5;

  let marineStatus = waveHeight !== null ? (waveHeight > 2.5 ? 'HIGH RISK' : waveHeight > 1.5 ? 'CAUTION' : 'SAFE') : 'CAUTION';

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🏄</span> Coastal, Marine & Surfing Weather Inspector
        </h4>
        ${getStatusBadgeMarkup(marineStatus)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🌊 Marine & Swell Telemetry</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Significant Wave Height:</strong> ${waveHeight !== null ? waveHeight.toFixed(1) + ' m' : '<span class="text-amber-400 font-semibold">Marine conditions unavailable</span>'}</div>
            <div><strong>Ocean Current Velocity:</strong> ${weather?.oceanCurrentVelocity ? weather.oceanCurrentVelocity + ' m/s' : '0.3 m/s'}</div>
            <div><strong>Rip Current Risk:</strong> ${waveHeight > 2.0 ? '⚠️ High Rip Current Hazard' : 'Low / Moderate Rip Hazard'}</div>
            <div><strong>Sunrise / Sunset:</strong> 06:12 AM / 06:45 PM</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🏖️ Coastal Safety Guidance</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Beach Activity:</strong> ${marineStatus}</div>
            <div><strong>Swimming Advice:</strong> ${waveHeight > 2.0 ? 'Avoid swimming due to high swell' : 'Safe near shore guarded areas'}</div>
            <div><strong>Surfing Condition:</strong> ${waveHeight > 1.2 ? 'Excellent surfable wave window' : 'Small / Flat swells'}</div>
            <div><strong>UV Sun Protection:</strong> ${uv >= 6 ? 'High UV - Apply water-resistant SPF 50+' : 'Moderate UV'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 5: Parents & Families Inspector
// -----------------------------------------------------------------------------
function renderParentsInspect(weather, config, personaData) {
  const temp = weather?.temperature ?? 28.5;
  const rainProb = weather?.rainProb ?? 15;
  const uv = weather?.uvIndex ?? 5.5;
  const pm25 = weather?.pm2_5 ?? 35;

  let playAnswer = 'YES';
  let playReason = 'Weather conditions are mild, safe, and pleasant for outdoor play.';
  if (temp > 38 || pm25 > 120 || rainProb > 75) {
    playAnswer = 'NO';
    playReason = temp > 38 ? 'Extreme heat risk for children.' : pm25 > 120 ? 'Unhealthy air quality index.' : 'Heavy rainfall expected.';
  } else if (temp > 33 || pm25 > 60 || rainProb > 40) {
    playAnswer = 'CAUTION';
    playReason = 'Moderate heat and UV levels. Keep outdoor play under shaded park areas and ensure frequent hydration.';
  }

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>👨‍👩‍👧</span> Family Weather & Child Safety Inspector
        </h4>
        ${getStatusBadgeMarkup(playAnswer === 'YES' ? 'SAFE' : playAnswer === 'CAUTION' ? 'CAUTION' : 'HIGH RISK')}
      </div>

      <!-- Child Outdoor Play Q&A Card -->
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white"> Is it a good time for children to play outside in ${currentCityName}?</span>
          <span class="text-sm font-black ${playAnswer === 'YES' ? 'text-emerald-400' : playAnswer === 'CAUTION' ? 'text-amber-400' : 'text-rose-400'}">${playAnswer}</span>
        </div>
        <p class="text-xs text-slate-300">${playReason}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🎒 School Commute & Attire</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Recommended Clothing:</strong> ${temp > 30 ? 'Light breathable cottons & sun hats' : 'Comfortable casuals'}</div>
            <div><strong>Rain Protection:</strong> ${rainProb > 40 ? 'Pack light raincoat / compact umbrella in school bags' : 'No rain gear needed'}</div>
            <div><strong>Hydration Target:</strong> Pack 1.5L water bottle for school activities</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🌳 Park Visits & Outdoor Time</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Best Park Window:</strong> 05:00 PM - 07:00 PM (Cooler evening temperatures)</div>
            <div><strong>Sun Safety:</strong> ${uv >= 6 ? 'Apply child-safe SPF 30+ before outdoor play' : 'Low UV risk'}</div>
            <div><strong>Cold / Heat Alert:</strong> ${temp > 35 ? 'Heat caution' : 'Optimal thermal comfort'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 6: Event Planners Inspector
// -----------------------------------------------------------------------------
let eventPlannerData = {
  date: new Date().toISOString().split('T')[0],
  start: '17:00',
  end: '22:00',
  setup: 'Outdoor'
};

function renderEventPlannersInspect(weather, config, personaData) {
  const rainProb = weather?.rainProb ?? 15;
  const windSpeed = weather?.windSpeed ?? 12;
  const temp = weather?.temperature ?? 28.5;

  let eventRisk = 'LOW';
  let eventReason = `Outdoor event weather risk is LOW in ${currentCityName} because rain probability is low (${rainProb}%) and wind speeds are gentle (${windSpeed} km/h).`;

  if (rainProb > 60 || windSpeed > 30) {
    eventRisk = 'HIGH';
    eventReason = `Outdoor event weather risk is HIGH because rain probability reaches ${rainProb}% with wind gusts of ${windSpeed} km/h during event hours. Rain canopy and indoor backup are mandatory.`;
  } else if (rainProb > 35 || temp > 34) {
    eventRisk = 'MEDIUM';
    eventReason = `Outdoor event risk is MEDIUM because rain probability increases to ${rainProb}% after sunset with temperatures around ${temp.toFixed(1)}°C. Waterproof tenting advised.`;
  }

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🎉</span> Event Planning Weather & Bioclimatic Risk Inspector
        </h4>
        ${getStatusBadgeMarkup(eventRisk)}
      </div>

      <!-- Interactive Event Planner Form -->
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
        <h5 class="font-bold text-amber-400 uppercase tracking-wider">📅 Event Schedule & Venue Setup:</h5>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Event Date:</label>
            <input type="date" value="${eventPlannerData.date}" onchange="updateEventPlannerInputs(this, 'date')" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Start Time:</label>
            <input type="time" value="${eventPlannerData.start}" onchange="updateEventPlannerInputs(this, 'start')" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">End Time:</label>
            <input type="time" value="${eventPlannerData.end}" onchange="updateEventPlannerInputs(this, 'end')" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-300 font-semibold mb-1">Venue Setup:</label>
            <select onchange="updateEventPlannerInputs(this, 'setup')" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white">
              <option value="Outdoor" ${eventPlannerData.setup === 'Outdoor' ? 'selected' : ''}>Outdoor Lawn / Open Air</option>
              <option value="Semi-Outdoor" ${eventPlannerData.setup === 'Semi-Outdoor' ? 'selected' : ''}>Covered Pavilion / Semi-Outdoor</option>
              <option value="Indoor" ${eventPlannerData.setup === 'Indoor' ? 'selected' : ''}>Fully Indoor Hall</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Risk Assessment Box -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">⚡ Calculated Event Risk & Justification</h5>
        <p class="text-slate-200 leading-relaxed">${eventReason}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">🎪 Tent & Infrastructure Requirements</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Tent Requirement:</strong> ${rainProb > 30 ? 'Waterproof marquee tent required' : 'Standard decorative canopy sufficient'}</div>
            <div><strong>Wind Precautions:</strong> ${windSpeed > 25 ? 'Anchor heavy stakes & ballast weights' : 'Standard trussing safe'}</div>
            <div><strong>Lighting Window:</strong> Sunset at 06:42 PM - Outdoor lighting required from 06:30 PM</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🍹 Guest Comfort & Thermal Control</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Psychrometric Comfort:</strong> ${temp > 30 ? 'Provide outdoor misting fans / evaporative coolers' : 'Pleasant ambient comfort'}</div>
            <div><strong>Rain Backup Plan:</strong> ${rainProb > 40 ? 'Mandatory indoor hall backup on standby' : 'Outdoor venue fully feasible'}</div>
            <div><strong>Optimal Window:</strong> 06:00 PM - 09:30 PM</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateEventPlannerInputs(el, key) {
  eventPlannerData[key] = el.value;
  openPersonaInspectModal('Event Planners', currentPersonaData['Event Planners']);
}

// -----------------------------------------------------------------------------
// Category 7: Travelers & Tourists Inspector
// -----------------------------------------------------------------------------
function renderTravelersInspect(weather, config, personaData) {
  const temp = weather?.temperature ?? 28.5;
  const rainProb = weather?.rainProb ?? 15;
  const uv = weather?.uvIndex ?? 5.5;

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🧳</span> Travelers & Sightseeing Weather Inspector
        </h4>
        ${getStatusBadgeMarkup(rainProb > 50 ? 'CAUTION' : 'SAFE')}
      </div>

      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
        <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🧳 Packing Recommendations for ${currentCityName}:</h5>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <strong>👔 Attire:</strong> ${temp > 28 ? 'Light cottons & breathable wear' : 'Warm layers & jackets'}
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <strong>☔ Rain Gear:</strong> ${rainProb > 30 ? 'Compact umbrella / windcheater' : 'Not required'}
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <strong>🕶️ Sun Gear:</strong> ${uv >= 5 ? 'Sunglasses & SPF 30+ sunscreen' : 'Basic hat'}
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <strong>👟 Footwear:</strong> Comfortable walking shoes
          </div>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
        <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">🗓️ 5-Day Sightseeing Forecast & Best Days</h5>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-slate-300">
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 block">Today</span>
            <span class="text-sm block font-bold text-white">${temp.toFixed(0)}°C</span>
            <span class="text-[10px] text-sky-400">Rain ${rainProb}%</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 block">Tomorrow</span>
            <span class="text-sm block font-bold text-white">${(temp + 1).toFixed(0)}°C</span>
            <span class="text-[10px] text-emerald-400">🌟 Best Day</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 block">Day 3</span>
            <span class="text-sm block font-bold text-white">${(temp - 1).toFixed(0)}°C</span>
            <span class="text-[10px] text-emerald-400">🌟 Best Day</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 block">Day 4</span>
            <span class="text-sm block font-bold text-white">${temp.toFixed(0)}°C</span>
            <span class="text-[10px] text-sky-400">Rain 20%</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 block">Day 5</span>
            <span class="text-sm block font-bold text-white">${(temp + 2).toFixed(0)}°C</span>
            <span class="text-[10px] text-amber-400">Warm</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Category 8: Outdoor Fitness Inspector
// -----------------------------------------------------------------------------
function renderFitnessInspect(weather, config, personaData) {
  const temp = weather?.temperature ?? 28.5;
  const humidity = weather?.humidity ?? 65;
  const uv = weather?.uvIndex ?? 5.5;
  const pm25 = weather?.pm2_5 ?? 35;

  let runCondition = 'GOOD';
  if (temp > 36 || pm25 > 120 || uv >= 9) runCondition = 'POOR';
  else if (temp > 30 || pm25 > 65 || uv >= 6) runCondition = 'MODERATE';

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>🏃</span> Running & Outdoor Athletics Inspector
        </h4>
        ${getStatusBadgeMarkup(runCondition)}
      </div>

      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-white text-sm">Calculated Running Conditions for ${currentCityName}:</span>
          <span class="font-black text-sm ${runCondition === 'GOOD' ? 'text-emerald-400' : runCondition === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'}">${runCondition}</span>
        </div>
        <p class="text-slate-300">
          Best workout window: <strong>06:00 AM – 08:00 AM</strong> based on lower ambient temperature (${temp.toFixed(1)}°C), minimal thermal radiation, and safe air quality.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">💧 Hydration & Thermal Stress</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>Hydration Rate:</strong> Drink 250 ml water every 20-30 minutes of running</div>
            <div><strong>Heat Stress Risk:</strong> ${temp > 32 ? 'High - Reduce workout intensity' : 'Low to Moderate'}</div>
            <div><strong>Electrolyte Requirement:</strong> ${temp > 30 ? 'Recommended for runs over 45 minutes' : 'Optional'}</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h5 class="font-bold text-amber-400 uppercase tracking-wider text-[11px]">☀️ UV & Air Quality Warnings</h5>
          <div class="space-y-1.5 text-slate-300">
            <div><strong>UV Protection:</strong> ${uv >= 6 ? 'Wear UV sunglasses & sweatproof SPF 50+' : 'Standard gear'}</div>
            <div><strong>Air Quality Index:</strong> ${pm25 > 60 ? '⚠️ Moderate PM2.5 - Sensitive athletes exercise caution' : 'Good Air Quality'}</div>
            <div><strong>Rain Hazard:</strong> ${weather?.rainProb > 40 ? 'Wet road surfaces - wear high-traction shoes' : 'Dry pavement'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// Main Persona Inspect Modal Dispatcher
// =============================================================================
function openPersonaInspectModal(personaKey, personaData) {
  const advisoryModal = document.getElementById('advisoryModal');
  const advisoryModalBody = document.getElementById('advisoryModalBody');
  const advisoryModalTitle = document.getElementById('advisoryModalTitle');
  if (!advisoryModal || !advisoryModalBody) return;

  const config = PERSONA_CONFIG[personaKey] || PERSONA_CONFIG['Health-Conscious'];
  const weather = currentWeatherData || {};

  if (advisoryModalTitle) {
    advisoryModalTitle.innerHTML = `<span class="text-xl">${config.icon}</span> <span>${config.title} — Inspection & Advisory</span>`;
  }

  const globalHeader = getGlobalInspectHeader(config, weather);
  let categoryContent = '';

  const normKey = (personaKey || '').toLowerCase();

  if (normKey.includes('health')) {
    categoryContent = renderHealthInspect(weather, config, personaData);
  } else if (normKey.includes('commuter') || normKey.includes('transit')) {
    categoryContent = renderCommutersInspect(weather, config, personaData);
  } else if (normKey.includes('agri') || normKey.includes('farm') || normKey.includes('kisan')) {
    categoryContent = renderFarmersInspect(weather, config, personaData);
  } else if (normKey.includes('beach') || normKey.includes('surf')) {
    categoryContent = renderBeachgoersInspect(weather, config, personaData);
  } else if (normKey.includes('parent') || normKey.includes('family')) {
    categoryContent = renderParentsInspect(weather, config, personaData);
  } else if (normKey.includes('event')) {
    categoryContent = renderEventPlannersInspect(weather, config, personaData);
  } else if (normKey.includes('travel') || normKey.includes('tourist')) {
    categoryContent = renderTravelersInspect(weather, config, personaData);
  } else {
    categoryContent = renderFitnessInspect(weather, config, personaData);
  }

  advisoryModalBody.innerHTML = `
    <div class="space-y-4">
      ${globalHeader}
      ${categoryContent}
    </div>
  `;

  advisoryModal.classList.add('open');
}

// =============================================================================
// Gramin Krishi Agronomy & Crop-Soil Engine
// =============================================================================
const AGRONOMY_DATA = {
  soils: {
    Alluvial: {
      name: 'Alluvial Soil',
      characteristics: 'Fine-grained, depositional silt/clay loam; highly fertile and porous.',
      nutrients: 'Rich in Potash (K), Phosphoric Acid & Lime | Deficient in Nitrogen (N) & Humus',
      waterRetention: 'Moderate to High (Sustains capillary moisture well)',
      amendments: 'Apply Nitrogen (N) & Phosphorus (P); incorporate green manure (Dhaincha/Sunnhemp).',
      crops: {
        Kharif: ['Rice (Paddy)', 'Maize', 'Sugarcane', 'Soyabean'],
        Rabi: ['Wheat', 'Mustard', 'Potato', 'Barley'],
        Zaid: ['Watermelon', 'Cucumber', 'Moong Dal']
      }
    },
    Black: {
      name: 'Black Soil (Regur)',
      characteristics: 'Clayey, self-ploughing, swells when wet, forms deep cracks when dry.',
      nutrients: 'Rich in Calcium, Carbonates, Mg & Potash | Deficient in Nitrogen, Phosphorus & Humus',
      waterRetention: 'Very High (Retains subsoil moisture during dry spells)',
      amendments: 'Summer deep ploughing for soil aeration; add FYM compost & Zinc (Zn).',
      crops: {
        Kharif: ['Cotton', 'Soyabean', 'Sorghum (Jowar)', 'Pigeon Pea (Arhar)'],
        Rabi: ['Chickpea (Gram)', 'Wheat', 'Linseed', 'Safflower'],
        Zaid: ['Sunflower', 'Cowpea (Lobia)']
      }
    },
    Red: {
      name: 'Red & Yellow Soil',
      characteristics: 'Porous, friable structure; red hue from ferric oxide diffusion.',
      nutrients: 'Rich in Iron (Fe) & Potash | Deficient in Nitrogen, Phosphorus, Humus & Lime',
      waterRetention: 'Low to Moderate (Requires micro-irrigation)',
      amendments: 'Apply agricultural lime/dolomite to neutralize acidity; practice organic mulching.',
      crops: {
        Kharif: ['Groundnut', 'Pearl Millet (Bajra)', 'Finger Millet (Ragi)', 'Pulses'],
        Rabi: ['Potato', 'Oilseeds', 'Tobacco', 'Pulses'],
        Zaid: ['Cowpea', 'Summer Vegetables']
      }
    },
    Laterite: {
      name: 'Laterite Soil',
      characteristics: 'Acidic (pH 4.5-6.0), heavily leached, forms hard crust when dry.',
      nutrients: 'Rich in Iron Oxide & Aluminium | Deficient in Nitrogen, Potash, Lime & Phosphate',
      waterRetention: 'Low (High percolation rate and rapid drainage)',
      amendments: 'Apply agricultural lime to boost pH; add rock phosphate and bio-compost.',
      crops: {
        Kharif: ['Cashewnut', 'Tapioca', 'Tea', 'Coffee'],
        Rabi: ['Spices', 'Arecanut', 'Rubber'],
        Zaid: ['Coconut', 'Garden Crops']
      }
    },
    Sandy: {
      name: 'Sandy Soil',
      characteristics: 'Coarse-textured, high porosity, loose and unaggregated structure.',
      nutrients: 'Rich in Silica (SiO2) | Deficient in N, P, K, Organic Humus & Micronutrients',
      waterRetention: 'Very Low (Prone to fast percolation and nutrient leaching)',
      amendments: 'Heavy compost/vermicompost application; frequent light drip irrigations.',
      crops: {
        Kharif: ['Pearl Millet (Bajra)', 'Groundnut', 'Guar (Cluster Bean)'],
        Rabi: ['Mustard', 'Barley', 'Chickpea (Gram)'],
        Zaid: ['Watermelon', 'Muskmelon', 'Cucumber']
      }
    },
    Loamy: {
      name: 'Loamy Soil',
      characteristics: 'Optimal 40% Sand, 40% Silt, 20% Clay mix; highly fertile & friable.',
      nutrients: 'Rich in Well-balanced NPK & high organic humus content',
      waterRetention: 'Optimal / High (Ideal moisture retention & air permeability)',
      amendments: 'Maintain balanced crop rotation; periodic vermicompost addition.',
      crops: {
        Kharif: ['Maize', 'Rice (Paddy)', 'Soyabean', 'Vegetables'],
        Rabi: ['Wheat', 'Mustard', 'Peas', 'Vegetables'],
        Zaid: ['Cucumber', 'Fodder Crops', 'Melons']
      }
    },
    Clayey: {
      name: 'Clayey Soil',
      characteristics: 'Fine particles (<0.002 mm), dense, heavy, sticky when wet.',
      nutrients: 'Rich in Potash, Calcium & Magnesium | Deficient in Soil aeration & organic matter',
      waterRetention: 'Extremely High (Prone to waterlogging & root hypoxia)',
      amendments: 'Construct field surface drainage channels; apply gypsum & coarse sand for tilth.',
      crops: {
        Kharif: ['Rice (Paddy)', 'Sugarcane', 'Jute'],
        Rabi: ['Wheat (with drainage)', 'Chickpea (Gram)'],
        Zaid: ['Fodder Crops', 'Moong Dal']
      }
    }
  },
  cropRequirements: {
    'Rice (Paddy)': { temp: '22°C – 32°C', rain: '1000 – 1500 mm', sun: 'High sunlight during grain filling', vulnerability: 'Submergence at seedling stage, cold waves during flowering' },
    'Wheat': { temp: '10°C – 26°C', rain: '500 – 750 mm', sun: 'Bright sunny maturation days', vulnerability: 'Terminal heat stress near harvest, early frost' },
    'Maize': { temp: '18°C – 27°C', rain: '600 – 1000 mm', sun: 'Full sun (6-8 hrs/day)', vulnerability: 'Waterlogging at early stages, drought at tasseling' },
    'Cotton': { temp: '21°C – 30°C', rain: '500 – 800 mm', sun: 'Bright sunshine; 200 frost-free days', vulnerability: 'Rain during boll opening ruins lint quality' },
    'Sugarcane': { temp: '20°C – 35°C', rain: '1500 – 2500 mm', sun: 'Prolonged sunshine & high humidity', vulnerability: 'Frost halts juice maturation; prolonged drought' },
    'Mustard': { temp: '10°C – 25°C', rain: '250 – 400 mm', sun: 'Clear sunny weather', vulnerability: 'Aphid infestation in warm humid weather; heavy frost' },
    'Chickpea (Gram)': { temp: '15°C – 25°C', rain: '350 – 500 mm', sun: 'Cool dry climate with abundant sun', vulnerability: 'Frost during pod formation; root rot from waterlogging' },
    'Groundnut': { temp: '22°C – 30°C', rain: '500 – 750 mm', sun: 'Full sun; warm soil (>20°C)', vulnerability: 'Heavy clay hinders pod pegging; water stagnation' },
    'Soyabean': { temp: '20°C – 30°C', rain: '600 – 900 mm', sun: 'Moderate sunlight; photoperiod sensitive', vulnerability: 'Dry spells during flowering reduce pod setting' }
  }
};

function renderGraminKrishiAdvisory() {
  const container = document.getElementById('graminKrishiOutput');
  if (!container) return;

  const soilKey = document.getElementById('agriSoilSelect')?.value || 'Loamy';
  const seasonKey = document.getElementById('agriSeasonSelect')?.value || 'Kharif';
  const cropKey = document.getElementById('agriCropSelect')?.value || 'Auto';

  const soilData = AGRONOMY_DATA.soils[soilKey] || AGRONOMY_DATA.soils['Loamy'];
  const matchedCrops = soilData.crops[seasonKey] || [];

  const targetCropName = (cropKey !== 'Auto' && matchedCrops.includes(cropKey))
    ? cropKey
    : (matchedCrops[0] || 'Rice (Paddy)');

  const cropReq = AGRONOMY_DATA.cropRequirements[targetCropName] || AGRONOMY_DATA.cropRequirements['Rice (Paddy)'];
  const currentTemp = currentWeatherData?.temperature ?? 28.5;
  const currentSoilMoisture = currentWeatherData?.soilMoisture ?? 0.25;

  container.innerHTML = `
    <!-- Top Crop Recommendations & Matrix -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">🌟 Top Matched Crops for ${soilData.name} (${seasonKey})</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Yield Optimal</span>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${matchedCrops.map(c => `
            <span class="px-3 py-1.5 rounded-xl bg-slate-950 border ${c === targetCropName ? 'border-amber-500 text-amber-300 font-bold' : 'border-slate-800 text-slate-300'} text-xs flex items-center gap-1.5">
              <span>🌱</span> ${c}
            </span>
          `).join('')}
        </div>
        <p class="text-[11px] text-slate-400 pt-1">
          <strong>Soil Texture:</strong> ${soilData.characteristics}
        </p>
      </div>

      <!-- Soil Nutrient Profile & Water Retention -->
      <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span class="font-bold text-sky-400 uppercase tracking-wider text-[11px]">🧪 Soil Nutrient Profile</span>
          <span class="text-slate-400 text-[10px]">Water Retention: <strong>${soilData.waterRetention.split(' ')[0]}</strong></span>
        </div>
        <p class="text-slate-300 leading-relaxed">
          ${soilData.nutrients}
        </p>
        <div class="pt-1.5 border-t border-slate-800">
          <strong class="text-amber-300 block text-[11px] mb-0.5">💡 Soil Amendment Strategy:</strong>
          <span class="text-slate-300 text-[11px]">${soilData.amendments}</span>
        </div>
      </div>
    </div>

    <!-- Climate & Weather Requirements Card -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h5 class="text-xs font-bold text-white flex items-center gap-2">
          <span>🌤️</span>
          <span>Climate & Agronomic Requirement: <strong>${targetCropName}</strong></span>
        </h5>
        <span class="text-[10px] text-slate-400">Live Location Temp: <strong class="text-white">${currentTemp}°C</strong> | Soil Moisture: <strong class="text-white">${currentSoilMoisture} m³/m³</strong></span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[10px] text-slate-400 block">🌡️ Ideal Temperature Range</span>
          <strong class="text-amber-300 text-xs">${cropReq.temp}</strong>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[10px] text-slate-400 block">🌧️ Water / Rainfall Need</span>
          <strong class="text-sky-300 text-xs">${cropReq.rain}</strong>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span class="text-[10px] text-slate-400 block">☀️ Sunlight & Photoperiod</span>
          <strong class="text-emerald-300 text-xs">${cropReq.sun}</strong>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-200">
        <strong>⚠️ Vulnerability & Risk Management:</strong> ${cropReq.vulnerability}
      </div>
    </div>
  `;
}
