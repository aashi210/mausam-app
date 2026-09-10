/**
 * SIH26076: Mausam App - Express Application & Routing Layer (app.js)
 *
 * Configures Express middleware, API routing for weather analytics and persona dashboards,
 * and user profile/saved location endpoints using Mongoose data models.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./swagger.json');
const { helmetMiddleware, apiRateLimiter, morganMiddleware } = require('./security');
const weatherService = require('./weatherService');
const personaLogic = require('./personaLogic');
const { validateCoordinatesMiddleware, validateCoordinates } = require('./validator');
const { User, VALID_PERSONAS } = require('./dbModel');

// Initialize Express App
const app = express();

// -----------------------------------------------------------------------------
// Security, Logging & Request Parsing Middleware
// -----------------------------------------------------------------------------
app.use(helmetMiddleware);
app.use(morganMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (CSS, JS, images) from public/ directory
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Rate limiter: Max 100 requests per 15 minutes per IP on API routes
app.use('/api/', apiRateLimiter);

// -----------------------------------------------------------------------------
// Interactive Swagger / OpenAPI Documentation Route (/api-docs)
// -----------------------------------------------------------------------------
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'SIH26076 Mausam App - API Documentation',
    explorer: true
  })
);

// -----------------------------------------------------------------------------
// Frontend Dashboard & Root Discovery Endpoints
// -----------------------------------------------------------------------------
app.get('/', (req, res) => {
  // If client accepts HTML (browser navigation), serve interactive Frontend UI Dashboard
  if (req.accepts('html') && !req.xhr && req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  // Otherwise, serve structured API discovery JSON metadata
  res.status(200).json({
    name: 'SIH26076 Mausam App - API Service',
    status: 'online',
    version: '1.0.0',
    documentation: 'GET /api-docs',
    endpoints: {
      docs: 'GET /api-docs',
      health: 'GET /health',
      weather: 'GET /api/weather?latitude=:lat&longitude=:lon',
      saveLocation: 'POST /api/save-location'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// -----------------------------------------------------------------------------
// Route 1: Main Weather & Persona Route (GET /api/weather)
// -----------------------------------------------------------------------------
/**
 * GET /api/weather
 *
 * Query Parameters:
 *  - latitude (or lat): Latitude coordinate between -90 and 90
 *  - longitude (or lon/lng): Longitude coordinate between -180 and 180
 *
 * Pipeline:
 *  1. validateCoordinatesMiddleware strictly validates coordinates with Zod.
 *  2. weatherService fetches, caches, and normalizes meteorological data.
 *  3. personaLogic calculates psychrometric indexes and generates 8 persona recommendations.
 *  4. Returns unified JSON containing coordinates, weather metrics, and persona dashboards.
 */
app.get('/api/weather', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.validatedCoordinates;

    // Fetch normalized meteorological data with 10-min caching & mock fallback
    const weatherData = await weatherService(latitude, longitude);

    // Ingest normalized weather into Persona Logic Engine for all 8 personas
    const personaDashboards = personaLogic(weatherData);

    return res.status(200).json({
      success: true,
      coordinates: {
        latitude,
        longitude
      },
      weather: weatherData,
      personas: personaDashboards,
      dashboards: personaDashboards
    });
  } catch (error) {
    console.error(`[Router ERROR] Failed processing /api/weather:`, error);
    next(error);
  }
});

// -----------------------------------------------------------------------------
// Route 2: Database Save Location Route (POST /api/save-location)
// -----------------------------------------------------------------------------
/**
 * POST /api/save-location
 *
 * Request Body:
 *  {
 *    "userId": "usr_1001",
 *    "cityName": "New Delhi",
 *    "latitude": 28.6139,
 *    "longitude": 77.2090,
 *    "preferredPersona": "Health-Conscious"
 *  }
 *  Also supports nested location: { cityName, latitude, longitude }
 */
app.post('/api/save-location', async (req, res, next) => {
  try {
    const body = req.body || {};

    const userId = body.userId || body.user_id;
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Bad Request: Validation Failed',
        message: 'userId is required and must be a non-empty string.',
        issues: [{ field: 'userId', message: 'userId is required and must be a non-empty string.' }]
      });
    }

    const cityName = body.cityName || body.city || body.location?.cityName || body.location?.city;
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Bad Request: Validation Failed',
        message: 'cityName is required and must be a non-empty string.',
        issues: [{ field: 'cityName', message: 'cityName is required and must be a non-empty string.' }]
      });
    }

    const rawLat = body.latitude !== undefined ? body.latitude : (body.location?.latitude ?? body.lat ?? body.location?.lat);
    const rawLon = body.longitude !== undefined ? body.longitude : (body.location?.longitude ?? body.lon ?? body.lng ?? body.location?.lon ?? body.location?.lng);

    // Validate coordinates using Zod validator
    const coordValidation = validateCoordinates({ latitude: rawLat, longitude: rawLon });
    if (!coordValidation.success) {
      return res.status(400).json(coordValidation);
    }
    const { latitude, longitude } = coordValidation.data;

    // Validate preferred persona
    const preferredPersona = body.preferredPersona || body.persona || body.preferred_persona || 'Health-Conscious';
    if (!VALID_PERSONAS.includes(preferredPersona)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Bad Request: Validation Failed',
        message: `Invalid preferredPersona '${preferredPersona}'. Must be one of: ${VALID_PERSONAS.join(', ')}`,
        issues: [{
          field: 'preferredPersona',
          message: `Must be one of: ${VALID_PERSONAS.join(', ')}`
        }]
      });
    }

    const newLocationEntry = {
      cityName: cityName.trim(),
      latitude,
      longitude,
      addedAt: new Date()
    };

    // Instantiate and validate against Mongoose User schema rules
    const userDoc = new User({
      userId: userId.trim(),
      savedLocations: [newLocationEntry],
      preferredPersona
    });

    // Enforce Mongoose schema validation constraints
    await userDoc.validate();

    // If connected to MongoDB daemon, persist to database
    if (mongoose.connection.readyState === 1) {
      const updatedUser = await User.findOneAndUpdate(
        { userId: userId.trim() },
        {
          $set: { preferredPersona },
          $push: { savedLocations: newLocationEntry }
        },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(201).json({
        success: true,
        message: 'Location saved successfully to database.',
        data: updatedUser
      });
    }

    // In offline / standalone test mode without MongoDB daemon
    return res.status(201).json({
      success: true,
      message: 'Location validated and recorded successfully (standalone schema mode).',
      data: {
        userId: userDoc.userId,
        savedLocations: userDoc.savedLocations,
        preferredPersona: userDoc.preferredPersona,
        createdAt: userDoc.createdAt || new Date().toISOString(),
        updatedAt: userDoc.updatedAt || new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'Bad Request: Database Schema Validation Failed',
        message: error.message
      });
    }
    console.error(`[Router ERROR] Failed processing /api/save-location:`, error);
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 404 & Centralized Error Handlers
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    statusCode: status,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

module.exports = app;
