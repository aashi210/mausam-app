# SIH26076: Mausam App - API Integration Module

## 1. Project Overview
The API Integration Module for **SIH26076 (Mausam App)** is a resilient backend micro-service designed to fetch, normalize, and cache real-time meteorological, air quality, and marine data for 8 distinct user personas in India.

---

## 2. Technology Stack & Key Dependencies
- **Runtime**: Node.js (CommonJS)
- **HTTP Client**: `axios`
- **In-Memory Caching**: `node-cache` (TTL: 600s / 10 minutes)
- **Environment**: `dotenv` (`PORT=3000`)
- **External Data Source**: Open-Meteo Free APIs (Forecast, Air Quality, Marine)

---

## 3. Architecture & Core Modules

### File Structure
```text
new work/
├── .env                # Environment configuration (PORT=3000)
├── package.json        # Project metadata, scripts, and dependencies (helmet, rate-limit, swagger, etc.)
├── app.js              # Express app instance, security middleware, Swagger UI, and route handlers
├── server.js           # Server bootstrap, port binding, and graceful shutdown handling
├── security.js         # Production security layer: Helmet, Express-Rate-Limit, Morgan
├── swagger.json        # OpenAPI 3.0 interactive documentation specification
├── testServer.js       # End-to-end automated test suite for API endpoints (32 assertions)
├── testSecurity.js     # Security, rate limiting & Swagger UI automated test suite (25 assertions)
├── testFrontend.js     # Frontend dashboard & static asset automated test suite (20 assertions)
├── testAggregator.js   # Multi-Source Aggregator automated test suite (29 assertions)
├── testResilience.js   # Extreme failure & blackout automated test suite (29 assertions)
├── public/             # Modern frontend UI dashboard assets
│   ├── index.html      # Responsive Tailwind CSS dashboard interface
│   ├── app.js          # Client-side controller (weather fetcher, DOM updater, bookmarks)
│   └── styles.css      # Glassmorphic custom styles and animations
├── mockData.js         # Realistic baseline meteorological fallback data
├── weatherService.js   # Core service: fetch, timeout, cache, normalize
├── personaLogic.js     # Persona Logic Engine: 8 persona rules & THI calculation
├── testLogic.js        # Comprehensive unit test suite: 8 persona rules & psychrometric formulas (59 assertions)
├── validator.js        # Input validation middleware & Zod coordinate validation
├── dbModel.js          # Mongoose data model for user preferences & saved locations
├── validateTest.js     # Automated test suite for validation & database schema (37 assertions)
├── index.js            # API integration test harness (Delhi queries)
└── GEMINI.md           # Workspace documentation and persona contracts
```

### Data Feeds & External Providers Queried
The module implements a **Multi-Source Aggregator Pattern** querying 5 independent data feeds concurrently via `Promise.allSettled()`:
1. **OpenWeatherMap API** (`https://api.openweathermap.org/data/2.5/`):
   - Key: `process.env.OWM_KEY`
   - Metrics: Air temperature (°C), relative humidity (%), visibility (m), PM2.5 & PM10 air pollution, UV Index.
2. **Open-Meteo API** (`https://api.open-meteo.com/v1/forecast` & `air-quality`):
   - Key: Free (No API key required)
   - Metrics: Volumetric soil moisture (m³/m³), relative humidity (%), wind speed (km/h), precipitation probability (%), secondary marine backup.
3. **Stormglass API** (`https://api.stormglass.io/v2/weather/point`):
   - Key: `process.env.STORMGLASS_KEY`
   - Metrics: Significant ocean wave height (m), ocean surface current velocity (m/s).
4. **OpenRouteService / Mapbox API** (`https://api.openrouteservice.org/`):
   - Key: `process.env.ORS_KEY` or `process.env.MAPBOX_KEY`
   - Metrics: Transit corridor visibility (m), road traffic conditions (`trafficCondition`), route weather advisory (`routeConditions`).
5. **India Meteorological Department (IMD) Public Feed** (`https://mausam.imd.gov.in/`):
   - Public Bulletin Feed (No API key required)
   - Metrics: National meteorological warnings (`imdAlert`), seasonal monsoon trough circulation status (`monsoonStatus`).

---

## 4. Multi-Source Aggregator Pattern & Resiliency Rules

- **Promise.allSettled() Concurrent Execution**: All 5 external endpoints are invoked in parallel. No single slow or failing provider blocks the others.
- **5-Second Strict Timeout**: Every individual external API request enforces `timeout: 5000` to prevent hanging during network congestion.
- **Field-by-Field Graceful Fallback Substitution**: If any specific third-party provider fails, times out, or lacks an environment key, fallback values for those specific metrics are automatically substituted from baseline [`mockData.js`](file:///c:/Users/Dell/Downloads/new%20work/mockData.js) or secondary providers without failing the entire request.
- **Provider Status Tracking (`sources`)**: Output payload details the exact status (`fulfilled` vs `fallback`) for each of the 5 providers.
- **10-Minute In-Memory Caching**: Caches normalized responses using `node-cache` (`stdTTL: 600`) keyed by `${latitude}_${longitude}` to eliminate duplicate calls and protect against rate limits during demonstrations.

---

## 5. Normalized JSON Schema (Contract for Persona Logic)

The function `normalizeAggregatedData(...)` produces a clean, flat JSON object:

```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "temperature": 33.9,
  "humidity": 51,
  "soilMoisture": 0.366,
  "visibility": 12140,
  "pm2_5": 49.0,
  "pm10": 105.0,
  "uvIndex": 6.5,
  "waveHeight": 0.8,
  "oceanCurrentVelocity": 0.25,
  "windSpeed": 10.0,
  "rainProb": 15,
  "trafficCondition": "Normal Flow",
  "routeConditions": "Passable - No severe road weather closures",
  "imdAlert": "Green Alert: Normal seasonal meteorological bulletin active",
  "monsoonStatus": "Active Monsoon Trough / Standard Circulation",
  "isFallback": false,
  "timestamp": "2026-09-10T07:30:00.000Z",
  "isCached": false,
  "source": "multi-source-aggregator",
  "sources": {
    "openWeatherMap": "fulfilled",
    "openMeteo": "fulfilled",
    "stormglass": "fallback",
    "openRouteService": "fallback",
    "imd": "fulfilled"
  }
}
```

---

## 6. The 8 User Personas Mapping

| # | Persona | Critical Metrics Used | Primary Use Case |
|---|---|---|---|
| 1 | **Farmer / Agriculturist** | `soilMoisture`, `temperature`, `humidity`, `uvIndex` | Irrigation scheduling, sowing advisory, crop protection |
| 2 | **Fisherman / Coastal Worker** | `waveHeight`, `oceanCurrentVelocity`, `visibility` | Sea voyage safety, offshore hazard warnings |
| 3 | **Daily Commuter / Transport** | `visibility`, `humidity`, `temperature` | Fog/smog alerts, route visibility, transit conditions |
| 4 | **Outdoor Athlete / Sports** | `pm2_5`, `pm10`, `uvIndex`, `temperature` | Safe training windows, heatstroke/sunburn prevention |
| 5 | **Respiratory / Sensitive Patient** | `pm2_5`, `pm10`, `humidity` | High air pollution alerts, advisory to stay indoors |
| 6 | **Solar Energy Operator** | `uvIndex`, `visibility`, `temperature` | Solar panel generation estimation & efficiency tracking |
| 7 | **Disaster Response Team** | `waveHeight`, `soilMoisture`, `visibility` | Flood risk assessment, coastal surge, storm alert |
| 8 | **Tourism & Event Organizer** | `temperature`, `humidity`, `uvIndex`, `visibility` | Outdoor event planning, comfort index analysis |

---

## 7. Developer & Execution Guide

### Starting the Express Server
```powershell
node server.js
# or using npm
npm.cmd start
```

### Running the Full Server & API Test Suite
```powershell
node testServer.js
# or using npm
npm.cmd test
```

### Running the Security & Swagger Documentation Test Suite
```powershell
node testSecurity.js
# or using npm
npm.cmd run test:security
```

### Running the Frontend Dashboard Test Suite
```powershell
node testFrontend.js
# or using npm
npm.cmd run test:frontend
```

### Running the Multi-Source Aggregator Test Suite
```powershell
node testAggregator.js
# or using npm
npm.cmd run test:aggregator
```

### Running the Extreme Failure & Blackout Test Suite
```powershell
node testResilience.js
# or using npm
npm.cmd run test:resilience
```

### Running All Automated Test Suites (231 Assertions)
```powershell
npm.cmd run test:all
```

### Running the Validation & Database Test Harness
```powershell
node validateTest.js
```

### Running the Persona Engine Test Harness
```powershell
node testLogic.js
```

### Running the API Integration Test Harness
```powershell
node index.js
```

### Windows PowerShell Note
On Windows systems where running `.ps1` scripts is disabled by default ExecutionPolicy, always use `npm.cmd` rather than `npm`:
```powershell
npm.cmd install <package>
```

---

## 8. Persona Logic Engine Contract (`personaLogic.js`)

Exports `generatePersonaDashboards(weatherData)` returning:
```json
{
  "Health-Conscious": { "alertLevel": "Warning", "recommendationText": "..." },
  "Outdoor Fitness": { "alertLevel": "Warning", "recommendationText": "..." },
  "Beachgoers/Surfers": { "alertLevel": "Safe", "recommendationText": "..." },
  "Agriculture/Gardeners": { "alertLevel": "Safe", "recommendationText": "..." },
  "Commuters": { "alertLevel": "Safe", "recommendationText": "..." },
  "Parents & Families": { "alertLevel": "Safe", "recommendationText": "..." },
  "Event Planners": { "alertLevel": "Warning", "recommendationText": "..." },
  "Travelers": { "alertLevel": "Safe", "recommendationText": "..." }
}
```
- **Status:** Completed and verified against baseline mock data and comprehensive 59-assertion unit test suite (59/59 passing).

---

## 9. Database & Input Validation Module (`validator.js`, `dbModel.js`)

- **Input Validator (`validator.js`)**:
  - Validates latitude (-90 to 90) and longitude (-180 to 180) using Zod.
  - Coerces numerical strings, supports shorthand aliases (`lat`/`lon`/`lng`), and rejects empty strings, non-numeric strings, and out-of-range values.
  - Provides Express middleware `validateCoordinatesMiddleware(req, res, next)` returning standardized HTTP 400 JSON on error.
- **Database Schema Model (`dbModel.js`)**:
  - Mongoose `User` schema storing `userId`, `savedLocations` (`cityName`, `latitude`, `longitude`, `addedAt`), and `preferredPersona`.
  - Automatic `createdAt` and `updatedAt` timestamps.
- **Automated Test Suite (`validateTest.js`)**:
  - 37 automated tests covering valid/boundary coordinates, out-of-bounds, injection attacks, Express middleware, and Mongoose schema constraints.
- **Status:** Completed and verified (37/37 tests passing).

---

## 10. Express Server & Routing Layer (`app.js`, `server.js`, `testServer.js`)

The application routing layer coordinates data fetching, psychrometric calculation, input validation, and user profile persistence into clean RESTful APIs.

### Endpoints
1. **Service Status & Health**:
   - `GET /`: Discovery endpoint with API metadata and route list.
   - `GET /health`: Uptime, ISO timestamp, and MongoDB connection status.
2. **Weather & Persona Engine (`GET /api/weather`)**:
   - Query Parameters: `latitude` (-90 to 90), `longitude` (-180 to 180) (or aliases `lat`, `lon`, `lng`).
   - Middleware: `validateCoordinatesMiddleware` strictly checks coordinates via Zod before invoking backend services.
   - Core Processing: Calls `weatherService(lat, lon)` and routes normalized metrics into `personaLogic(weatherData)`.
   - Response:
     ```json
     {
       "success": true,
       "coordinates": { "latitude": 28.61, "longitude": 77.23 },
       "weather": { ... },
       "personas": { ... }
     }
     ```
3. **Save User Location (`POST /api/save-location`)**:
   - Payload:
     ```json
     {
       "userId": "usr_1001",
       "cityName": "New Delhi",
       "latitude": 28.6139,
       "longitude": 77.2090,
       "preferredPersona": "Health-Conscious"
     }
     ```
     *(Also supports nested `location: { cityName, latitude, longitude }`)*
   - Validates coordinates and persona enums using `validator.js` and `dbModel.js`.
   - Saves/upserts into MongoDB if `MONGODB_URI` is connected; otherwise performs schema validation and returns verified document structure.
   - Responds with HTTP 201 Created on success.

### Automated Test Suite (`testServer.js`)
- 32 automated assertions verifying health endpoints, Delhi live weather data, all 8 persona outputs, 10-minute caching hits, parameter aliases, 400 validation error responses, database save endpoints, and 404 handling.
- **Status:** Completed and verified (32/32 tests passing).

---

## 11. Production Hardening, Security & OpenAPI Documentation (`security.js`, `swagger.json`, `testSecurity.js`)

The production hardening layer protects the API from common attack vectors, enforces rate limits, logs requests, and exposes interactive OpenAPI 3.0 documentation for developers.

### Security Defenses (`security.js`)
1. **Helmet HTTP Header Security**:
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing exploits)
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks)
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS enforcement)
   - `X-DNS-Prefetch-Control: off`
   - `Referrer-Policy: no-referrer`
   - Relaxed Content Security Policy (CSP) allowing inline styles/scripts necessary for Swagger UI rendering while protecting API endpoints.
2. **Rate Limiting (`express-rate-limit`)**:
   - Standard rule: Max **100 requests per 15-minute window** per IP applied to all `/api/` endpoints.
   - Emits standardized RFC `RateLimit-*` headers (`RateLimit-Limit: 100`, `RateLimit-Remaining`, `RateLimit-Reset`).
   - When threshold is exceeded, returns standardized HTTP 429 Too Many Requests JSON:
     ```json
     {
       "success": false,
       "statusCode": 429,
       "error": "Too Many Requests",
       "message": "Too many requests from this IP, please try again after 15 minutes."
     }
     ```
3. **Morgan HTTP Request Logger**:
   - Configured with standard Apache `'combined'` format for detailed terminal logging during production and development.
   - Auto-skips logging during test harness execution (`NODE_ENV === 'test'`) to preserve clean test assertion outputs.

### Interactive Swagger UI Documentation (`swagger.json`, `app.js`)
- Exposes interactive Swagger documentation at **`GET /api-docs`**.
- OpenAPI 3.0 specification covering:
  - `GET /health` (System Health Diagnostic)
  - `GET /api/weather` (Meteorological metrics, 8 persona dashboards, query aliases, validation schemas)
  - `POST /api/save-location` (User profile bookmarking, schema constraints, persona enum definitions)
- Accessible via browser or direct API discovery link at `GET /`.

### Security Automated Test Suite (`testSecurity.js`)
- 18 automated assertions validating:
  - Helmet headers (`nosniff`, `SAMEORIGIN`, `HSTS`, `off`)
  - Rate limiting standard headers and availability tracking
  - Throttling enforcement (triggering HTTP 429)
  - Swagger UI HTML rendering, JavaScript bundles (`swagger-ui-bundle.js`), and stylesheets (`swagger-ui.css`)
  - Weather and save-location endpoint functionality under active security layers
- **Status:** Completed and verified (25/25 tests passing).

---

## 12. Frontend UI Dashboard Layer (`public/`, `testFrontend.js`)

The Frontend Dashboard provides a modern, responsive single-page client interface styled with Tailwind CSS specifically customized for the SIH26076 Mausam application.

### Key Capabilities & Components
1. **Search & Preset Location Selector**:
   - Quick-select pill chips for 8 Indian regional presets: Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Shimla, Kochi, and Hyderabad.
   - Manual coordinate input (latitude/longitude with boundary validation).
   - HTML5 GPS Auto-Detection (`navigator.geolocation`) with one-click coordinate population.
2. **Primary Weather Summary Card**:
   - Real-time temperature (°C) and qualitative biometeorological classification badge (Severe Heatwave, Hot & Humid, Pleasant, Chilly, Frost Warning).
   - 6-metric secondary parameter grid: Relative Humidity (%), PM2.5 with CPCB AQI status tag, Solar UV Index (Safe to Extreme), Visibility (km/m), Volumetric Soil Moisture (m³/m³), and Significant Wave Height & Ocean Current Velocity.
3. **8-Persona Tailored Recommendation Cards**:
   - Dynamic grid rendering actionable advisories for all 8 user personas:
     1. *Health-Conscious / Sensitive Patients*
     2. *Outdoor Fitness & Athletes*
     3. *Beachgoers, Surfers & Marine Workers*
     4. *Farmers, Agriculture & Gardeners*
     5. *Daily Commuters & Transit Drivers*
     6. *Parents & Families (School Commute)*
     7. *Event Planners (Thom THI Index)*
     8. *Travelers & Tourists (Adaptive Packing)*
   - Color-coded alert badges (`Safe` in green, `Warning` in amber, `Danger` in red).
   - Category filtering tabs: *All (8)*, *Health & Fitness*, *Marine & Agro*, *Commute & Family*, and *Events & Travel*.
4. **Resiliency & Status Indicators**:
   - **Data Source Indicator**: Displays `"🟢 Open-Meteo API (Live)"` during live fetches and automatically switches to `"🟡 Offline Mock Data (Fallback)"` with an alert banner when the backend detects API timeouts or outages.
   - **Cache Badge**: Displays `"⚡ Cached (10-Min)"` whenever data is served from the in-memory cache without hitting external endpoints.
5. **Bookmark Location Modal**:
   - Modal form allowing users to save the current city and preferred persona to `POST /api/save-location`.
6. **Content Negotiation**:
   - `GET /` serves `index.html` for browser navigations (`Accept: text/html`) while preserving JSON API discovery metadata for programmatic API clients (`Accept: application/json`).

### Frontend Automated Test Suite (`testFrontend.js`)
- 20 automated assertions validating:
  - HTML dashboard serving and title/meta verification
  - Presence of all UI components (Tailwind, search form, presets, 8 persona container, fallback alert)
  - Static asset serving (`/app.js`, `/styles.css`)
  - Content negotiation backwards compatibility on `GET /`
  - Client-targeted `/api/weather` response integration
- **Status:** Completed and verified (20/20 tests passing).

---

## 13. Extreme Failure & Resilience Module (`testResilience.js`)

The resilience testing layer rigorously exercises the backend microservice under hostile network conditions and upstream infrastructure breakdowns to ensure 100% uptime and zero unhandled exceptions.

### Simulated Failure Scenarios
1. **Total External Network Blackout**:
   - Mocks `ECONNREFUSED` connection rejections across all 5 third-party meteorological providers.
   - Verifies `weatherService` intercepts network failures cleanly without unhandled rejections.
   - Verifies automatic transition to `isFallback: true` and `source: 'mockData_fallback'`.
   - Confirms all 5 provider statuses in `sources` are set to `'fallback'`.
   - Asserts integrity of fallback baseline values (temperature, humidity, soil moisture, PM2.5, wave height, traffic condition, IMD alert).
2. **Express Server Route Stability (HTTP 200 OK Guarantee)**:
   - Verifies `GET /api/weather` responds with `HTTP 200 OK` (never `HTTP 500`) during total network blackouts.
   - Confirms all 8 user personas (`Health-Conscious`, `Outdoor Fitness`, `Beachgoers/Surfers`, `Agriculture/Gardeners`, `Commuters`, `Parents & Families`, `Event Planners`, `Travelers`) are completely evaluated and populated with valid alert levels and recommendation advisories.
3. **Extreme DNS Resolution Failure (`ENOTFOUND`)**:
   - Simulates complete DNS resolver outage for external API hosts (`api.open-meteo.com`, etc.).
   - Confirms server returns `HTTP 200 OK` and cleanly engages fallback data without crashing.
4. **Upstream 504 Gateway Timeouts & 500 Server Crashes**:
   - Simulates upstream edge gateway timeouts (`HTTP 504`) and upstream server exceptions.
   - Confirms server gracefully absorbs the errors, returns `HTTP 200 OK`, and flags `isFallback: true`.

### Automated Test Suite (`testResilience.js`)
- 29 automated assertions across 4 failure scenarios.
- **Status:** Completed and verified (29/29 tests passing).
- **Total Project Test Suite:** 231/231 tests passing across all 7 modules (`npm.cmd run test:all`).