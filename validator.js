/**
 * SIH26076: Mausam App - Input Validator Module (validator.js)
 *
 * Uses Zod to strictly validate incoming query parameters and request payloads.
 * Ensures:
 *  - latitude is a valid finite number between -90 and 90
 *  - longitude is a valid finite number between -180 and 180
 *
 * Returns clean, descriptive 400 error structures when validation fails.
 */

const { z } = require('zod');

/**
 * Preprocessor helper to parse string/numeric inputs into numbers,
 * rejecting empty strings, non-numeric strings, and infinities.
 */
const coordinateNumberSchema = (fieldName, minVal, maxVal) =>
  z.preprocess(
    (raw) => {
      if (raw === undefined || raw === null) return raw;
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed === '') return NaN;
        return Number(trimmed);
      }
      return raw;
    },
    z.any()
      .superRefine((val, ctx) => {
        if (val === undefined || val === null) {
          ctx.addIssue({
            code: 'custom',
            message: `${fieldName} is required.`
          });
          return;
        }
        if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
          ctx.addIssue({
            code: 'custom',
            message: `${fieldName} must be a valid finite number.`
          });
          return;
        }
        if (val < minVal || val > maxVal) {
          ctx.addIssue({
            code: 'custom',
            message: `${fieldName} must be between ${minVal} and ${maxVal} degrees.`
          });
        }
      })
      .transform((val) => Number(val))
  );

/**
 * Zod schema supporting both standard keys (latitude, longitude)
 * and common abbreviations (lat, lon, lng).
 */
const coordinateQuerySchema = z
  .preprocess((input) => {
    if (!input || typeof input !== 'object') {
      return {};
    }
    return {
      latitude: input.latitude !== undefined ? input.latitude : input.lat,
      longitude:
        input.longitude !== undefined
          ? input.longitude
          : input.lon !== undefined
          ? input.lon
          : input.lng
    };
  }, z.object({
    latitude: coordinateNumberSchema('Latitude', -90, 90),
    longitude: coordinateNumberSchema('Longitude', -180, 180)
  }));

/**
 * Formats Zod errors into a clean, unified 400 HTTP error structure.
 *
 * @param {z.ZodError} zodError
 * @returns {Object} Clean descriptive 400 error payload
 */
function formatValidationError(zodError) {
  const rawIssues = zodError.issues || zodError.errors || [];
  const issues = rawIssues.map((err) => ({
    field: err.path && err.path.length > 0 ? err.path.join('.') : 'parameter',
    message: err.message
  }));

  const summaryMessage = issues.map((i) => i.message).join(' ') || zodError.message || 'Validation error';

  return {
    success: false,
    statusCode: 400,
    error: 'Bad Request: Validation Failed',
    message: summaryMessage,
    issues
  };
}

/**
 * Standalone validation helper.
 * Validates any coordinate input object (e.g. req.query, req.body, or raw dict).
 *
 * @param {Object} input - Object containing latitude/longitude or lat/lon
 * @returns {Object} { success: true, data: { latitude, longitude } } OR 400 error structure
 */
function validateCoordinates(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      success: false,
      statusCode: 400,
      error: 'Bad Request: Validation Failed',
      message: 'Input query must be a valid object containing latitude and longitude.',
      issues: [
        {
          field: 'query',
          message: 'Input query must be a valid object containing latitude and longitude.'
        }
      ]
    };
  }

  const result = coordinateQuerySchema.safeParse(input);

  if (!result.success) {
    return formatValidationError(result.error);
  }

  return {
    success: true,
    data: {
      latitude: result.data.latitude,
      longitude: result.data.longitude
    }
  };
}

/**
 * Express-compatible middleware for validating incoming query parameters.
 * If valid, attaches sanitized numerical coordinates to req.validatedCoordinates.
 * If invalid, halts request pipeline with HTTP 400.
 */
function validateCoordinatesMiddleware(req, res, next) {
  const queryParams = req.query || {};
  const validationResult = validateCoordinates(queryParams);

  if (!validationResult.success) {
    return res.status(400).json(validationResult);
  }

  req.validatedCoordinates = validationResult.data;
  if (typeof next === 'function') {
    next();
  }
}

module.exports = {
  coordinateQuerySchema,
  validateCoordinates,
  validateCoordinatesMiddleware,
  formatValidationError
};
