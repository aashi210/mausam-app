/**
 * SIH26076: Mausam App - Automated Validation & Database Model Test Suite
 *
 * Runs comprehensive test cases against validator.js and dbModel.js:
 *  - Valid coordinates (numbers, numerical strings, boundary poles)
 *  - Invalid coordinates (out-of-bounds lat/lon, non-numeric strings, malicious injections, NaNs)
 *  - Express middleware behavior
 *  - Mongoose Database Schema constraints (valid instances & validation errors)
 */

const { validateCoordinates, validateCoordinatesMiddleware } = require('./validator');
const { User } = require('./dbModel');

console.log('================================================================================');
console.log(' SIH26076: MAUSAM APP - VALIDATION & DATABASE TEST SUITE');
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
    throw new Error(`Test failed: ${description}`);
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: VALID COORDINATE INPUT TESTS
// -----------------------------------------------------------------------------
console.log('--- Section 1: Valid Coordinate Scenarios ---');

// 1. Standard numbers (Delhi)
const test1 = validateCoordinates({ latitude: 28.6139, longitude: 77.209 });
assertTest(
  'Valid Delhi coordinates (numeric)',
  test1.success === true &&
    test1.data.latitude === 28.6139 &&
    test1.data.longitude === 77.209
);

// 2. Numeric strings from URL query params (Mumbai)
const test2 = validateCoordinates({ latitude: '19.0760', longitude: '72.8777' });
assertTest(
  'Valid Mumbai coordinates passed as query strings',
  test2.success === true &&
    test2.data.latitude === 19.076 &&
    test2.data.longitude === 72.8777
);

// 3. Shorthand parameter aliases (lat/lon)
const test3 = validateCoordinates({ lat: '12.9716', lon: '77.5946' });
assertTest(
  'Support shorthand query aliases (lat/lon)',
  test3.success === true &&
    test3.data.latitude === 12.9716 &&
    test3.data.longitude === 77.5946
);

// 4. Boundary extremes: North Pole (+90), South Pole (-90), Antimeridian (+/-180)
const test4a = validateCoordinates({ latitude: 90, longitude: 180 });
const test4b = validateCoordinates({ latitude: -90, longitude: -180 });
const test4c = validateCoordinates({ latitude: 0, longitude: 0 });
const test4d = validateCoordinates({ latitude: -90, longitude: 180 });
const test4e = validateCoordinates({ latitude: 90, longitude: -180 });
assertTest(
  'Boundary limits: exact +90/+180, -90/-180, 0/0, and cross-pole extremes',
  test4a.success && test4b.success && test4c.success && test4d.success && test4e.success
);

// 5. Whitespace padding trimming in query strings
const testTrim = validateCoordinates({ latitude: '  28.6139  ', longitude: '\t77.2090\n' });
assertTest(
  'Trims leading/trailing whitespace and newlines from numerical coordinate strings',
  testTrim.success === true &&
    testTrim.data.latitude === 28.6139 &&
    testTrim.data.longitude === 77.209
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 2: INVALID & MALICIOUS INPUT TESTS
// -----------------------------------------------------------------------------
console.log('--- Section 2: Invalid, Malicious & Edge-Case Inputs ---');

// 5. Latitude out of bounds (> 90)
const test5 = validateCoordinates({ latitude: 500, longitude: 77.23 });
assertTest(
  'Rejects latitude = 500 (out of bounds)',
  test5.success === false &&
    test5.statusCode === 400 &&
    test5.message.includes('Latitude must be between -90 and 90 degrees')
);

// 6. Latitude out of bounds (< -90)
const test6 = validateCoordinates({ latitude: -90.0001, longitude: 77.23 });
assertTest(
  'Rejects latitude = -90.0001 (below minimum)',
  test6.success === false &&
    test6.statusCode === 400 &&
    test6.message.includes('Latitude must be between -90 and 90 degrees')
);

// 7. Longitude out of bounds (> 180)
const test7 = validateCoordinates({ latitude: 28.61, longitude: 180.05 });
assertTest(
  'Rejects longitude = 180.05 (above maximum)',
  test7.success === false &&
    test7.statusCode === 400 &&
    test7.message.includes('Longitude must be between -180 and 180 degrees')
);

// 8. Non-numeric strings
const test8 = validateCoordinates({ latitude: 'invalid_lat', longitude: 77.23 });
assertTest(
  'Rejects non-numeric string for latitude ("invalid_lat")',
  test8.success === false &&
    test8.statusCode === 400 &&
    test8.message.includes('Latitude must be a valid finite number')
);

// 9. Empty strings
const test9 = validateCoordinates({ latitude: '', longitude: '77.23' });
assertTest(
  'Rejects empty string ("")',
  test9.success === false &&
    test9.statusCode === 400 &&
    test9.message.includes('Latitude must be a valid finite number')
);

// 10. Malicious SQL Injection / Script payload
const test10 = validateCoordinates({
  latitude: '28.61; DROP TABLE users;--',
  longitude: '<script>alert("hack")</script>'
});
assertTest(
  'Rejects malicious injection strings',
  test10.success === false &&
    test10.statusCode === 400 &&
    test10.message.includes('must be a valid finite number')
);

// 11. Missing parameters
const test11 = validateCoordinates({});
assertTest(
  'Rejects empty object missing latitude and longitude',
  test11.success === false &&
    test11.statusCode === 400 &&
    test11.message.includes('Latitude is required') &&
    test11.message.includes('Longitude is required')
);

// 12. Non-object/Null/Undefined query
const test12 = validateCoordinates(null);
assertTest(
  'Rejects null or non-object query parameter',
  test12.success === false &&
    test12.statusCode === 400 &&
    test12.message.includes('must be a valid object')
);

// 13. Infinity / NaN
const test13 = validateCoordinates({ latitude: Infinity, longitude: 77.23 });
assertTest(
  'Rejects Infinity for latitude',
  test13.success === false &&
    test13.statusCode === 400 &&
    test13.message.includes('Latitude must be a valid finite number')
);

// 14. Missing latitude only
const test14 = validateCoordinates({ longitude: 77.209 });
assertTest(
  'Rejects request with missing latitude parameter',
  test14.success === false &&
    test14.statusCode === 400 &&
    test14.message.includes('Latitude is required')
);

// 15. Missing longitude only
const test15 = validateCoordinates({ latitude: 28.6139 });
assertTest(
  'Rejects request with missing longitude parameter',
  test15.success === false &&
    test15.statusCode === 400 &&
    test15.message.includes('Longitude is required')
);

// 16. Longitude below minimum (< -180)
const test16 = validateCoordinates({ latitude: 28.61, longitude: -180.0001 });
assertTest(
  'Rejects longitude = -180.0001 (below minimum -180)',
  test16.success === false &&
    test16.statusCode === 400 &&
    test16.message.includes('Longitude must be between -180 and 180 degrees')
);

// 17. Extreme numerical bounds (+999999 / -999999)
const test17 = validateCoordinates({ latitude: 999999, longitude: -999999 });
assertTest(
  'Rejects extreme out-of-bounds numbers (+999999 / -999999)',
  test17.success === false &&
    test17.statusCode === 400 &&
    test17.issues.length >= 2
);

// 18. Whitespace-only strings
const test18 = validateCoordinates({ latitude: '   ', longitude: '77.23' });
assertTest(
  'Rejects whitespace-only string for latitude ("   ")',
  test18.success === false &&
    test18.statusCode === 400 &&
    test18.message.includes('Latitude must be a valid finite number')
);

// 19. Special string tokens ('NaN', 'null', 'undefined')
const test19a = validateCoordinates({ latitude: 'NaN', longitude: 77.23 });
const test19b = validateCoordinates({ latitude: 28.61, longitude: 'null' });
const test19c = validateCoordinates({ latitude: 'undefined', longitude: 77.23 });
assertTest(
  'Rejects literal string tokens ("NaN", "null", "undefined")',
  test19a.success === false && test19b.success === false && test19c.success === false
);

// 20. Non-numeric special characters & symbols
const test20 = validateCoordinates({ latitude: '$%^&*!', longitude: 77.23 });
assertTest(
  'Rejects special non-numeric symbol strings ("$%^&*!")',
  test20.success === false &&
    test20.statusCode === 400 &&
    test20.message.includes('Latitude must be a valid finite number')
);

// 21. Boolean type parameter injection
const test21 = validateCoordinates({ latitude: true, longitude: false });
assertTest(
  'Rejects boolean values (true / false) for coordinates',
  test21.success === false &&
    test21.statusCode === 400 &&
    test21.message.includes('must be a valid finite number')
);

// 22. Array parameter injection
const test22 = validateCoordinates({ latitude: [28.61, 29.0], longitude: 77.23 });
assertTest(
  'Rejects array parameter injection for coordinates',
  test22.success === false &&
    test22.statusCode === 400 &&
    test22.message.includes('Latitude must be a valid finite number')
);

// 23. Object parameter injection
const test23 = validateCoordinates({ latitude: { lat: 28.61 }, longitude: 77.23 });
assertTest(
  'Rejects nested object injection for coordinates',
  test23.success === false &&
    test23.statusCode === 400 &&
    test23.message.includes('Latitude must be a valid finite number')
);

// 24. Exponential notation exceeding boundaries
const test24 = validateCoordinates({ latitude: '1e3', longitude: 77.23 });
assertTest(
  'Rejects exponential notation exceeding boundaries ("1e3" = 1000 > 90)',
  test24.success === false &&
    test24.statusCode === 400 &&
    test24.message.includes('Latitude must be between -90 and 90 degrees')
);

// 25. Array or primitive root query payload
const test25a = validateCoordinates(['28.61', '77.23']);
const test25b = validateCoordinates(12345);
assertTest(
  'Rejects non-object root query types (array / primitive number)',
  test25a.success === false && test25b.success === false
);

// 26. Unified 400 Error Structure Contract Verification
const test26 = validateCoordinates({ latitude: 'invalid' });
assertTest(
  'Validates unified 400 error structure contract (success, statusCode, error, issues)',
  test26.success === false &&
    test26.statusCode === 400 &&
    test26.error === 'Bad Request: Validation Failed' &&
    typeof test26.message === 'string' &&
    Array.isArray(test26.issues) &&
    test26.issues.length > 0 &&
    typeof test26.issues[0].field === 'string' &&
    typeof test26.issues[0].message === 'string'
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 3: EXPRESS MIDDLEWARE TEST
// -----------------------------------------------------------------------------
console.log('--- Section 3: Express Middleware Pipeline ---');

// 14. Middleware accepts valid query and invokes next()
let nextCalled = false;
const mockReqValid = { query: { lat: '28.61', lon: '77.23' } };
const mockResValid = {};
validateCoordinatesMiddleware(mockReqValid, mockResValid, () => {
  nextCalled = true;
});
assertTest(
  'Middleware calls next() and populates req.validatedCoordinates for valid query',
  nextCalled &&
    mockReqValid.validatedCoordinates.latitude === 28.61 &&
    mockReqValid.validatedCoordinates.longitude === 77.23
);

// 15. Middleware sends 400 response and halts pipeline for invalid query
let middlewareBlocked = false;
let sentStatusCode = null;
let sentJsonData = null;
const mockReqInvalid = { query: { latitude: '999', longitude: '77.23' } };
const mockResInvalid = {
  status: function (code) {
    sentStatusCode = code;
    return this;
  },
  json: function (data) {
    sentJsonData = data;
    middlewareBlocked = true;
    return this;
  }
};
validateCoordinatesMiddleware(mockReqInvalid, mockResInvalid, () => {
  throw new Error('Middleware should not have called next() for invalid input!');
});
assertTest(
  'Middleware halts and responds with status 400 for out-of-bounds latitude (999)',
  middlewareBlocked &&
    sentStatusCode === 400 &&
    sentJsonData.success === false &&
    sentJsonData.statusCode === 400
);

// 28. Middleware rejects empty query ({}) with 400
let emptyBlocked = false;
let emptyStatus = null;
validateCoordinatesMiddleware({ query: {} }, {
  status: function(c) { emptyStatus = c; return this; },
  json: function() { emptyBlocked = true; return this; }
}, () => {});
assertTest(
  'Middleware halts and responds 400 when all query parameters are missing ({})',
  emptyBlocked && emptyStatus === 400
);

// 29. Middleware rejects SQL injection string with 400
let sqlBlocked = false;
let sqlStatus = null;
validateCoordinatesMiddleware({ query: { lat: "28.6; DROP TABLE users;--", lon: "77.2" } }, {
  status: function(c) { sqlStatus = c; return this; },
  json: function() { sqlBlocked = true; return this; }
}, () => {});
assertTest(
  'Middleware halts and responds 400 for SQL injection query attempt',
  sqlBlocked && sqlStatus === 400
);

// 30. Middleware sanitization: strips untrusted extra parameters
const mockReqExtra = { query: { lat: '28.61', lon: '77.23', maliciousField: '<script>', admin: true } };
validateCoordinatesMiddleware(mockReqExtra, {}, () => {});
assertTest(
  'Middleware sanitizes input: strips untrusted extra fields and attaches only validated numerical coordinates',
  mockReqExtra.validatedCoordinates &&
    mockReqExtra.validatedCoordinates.latitude === 28.61 &&
    mockReqExtra.validatedCoordinates.longitude === 77.23 &&
    mockReqExtra.validatedCoordinates.maliciousField === undefined &&
    mockReqExtra.validatedCoordinates.admin === undefined
);

console.log('');

// -----------------------------------------------------------------------------
// SECTION 4: DATABASE SCHEMA MODEL TESTS (Mongoose User Schema)
// -----------------------------------------------------------------------------
console.log('--- Section 4: Database Schema Model Tests (dbModel.js) ---');

async function runDatabaseModelTests() {
  // 31. Valid User Document creation & schema validation
  const validUserDoc = new User({
    userId: 'usr_sih_1001',
    savedLocations: [
      {
        cityName: 'New Delhi',
        latitude: 28.6139,
        longitude: 77.209
      },
      {
        cityName: 'Shimla',
        latitude: 31.1048,
        longitude: 77.1734
      }
    ],
    preferredPersona: 'Agriculture'
  });

  let validError = null;
  try {
    await validUserDoc.validate();
  } catch (err) {
    validError = err;
  }
  assertTest(
    'User document with saved locations and preferredPersona validates successfully without schema errors',
    validError === null
  );

  // 32. User Document rejection on invalid latitude in savedLocations
  const invalidUserDoc = new User({
    userId: 'usr_sih_1002',
    savedLocations: [
      {
        cityName: 'Invalid City',
        latitude: 500, // Invalid latitude
        longitude: 77.209
      }
    ],
    preferredPersona: 'Health'
  });

  let invalidLatError = null;
  try {
    await invalidUserDoc.validate();
  } catch (err) {
    invalidLatError = err;
  }
  assertTest(
    'User schema catches and rejects out-of-bounds latitude (500) in savedLocations',
    invalidLatError !== null &&
      Boolean(invalidLatError.errors['savedLocations.0.latitude'])
  );

  // 33. User Document rejection on longitude out-of-bounds (> 180) in savedLocations
  const invalidLonDoc = new User({
    userId: 'usr_sih_1002_lon',
    savedLocations: [
      {
        cityName: 'Pacific Extreme',
        latitude: 10,
        longitude: 185 // Invalid longitude > 180
      }
    ],
    preferredPersona: 'Travelers'
  });
  let invalidLonError = null;
  try {
    await invalidLonDoc.validate();
  } catch (err) {
    invalidLonError = err;
  }
  assertTest(
    'User schema catches and rejects out-of-bounds longitude (185 > 180) in savedLocations',
    invalidLonError !== null &&
      Boolean(invalidLonError.errors['savedLocations.0.longitude'])
  );

  // 34. User Document rejection on longitude below minimum (< -180) in savedLocations
  const invalidLonMinDoc = new User({
    userId: 'usr_sih_1002_lonmin',
    savedLocations: [
      {
        cityName: 'Atlantic Extreme',
        latitude: 10,
        longitude: -185 // Invalid longitude < -180
      }
    ],
    preferredPersona: 'Travelers'
  });
  let invalidLonMinError = null;
  try {
    await invalidLonMinDoc.validate();
  } catch (err) {
    invalidLonMinError = err;
  }
  assertTest(
    'User schema catches and rejects below-minimum longitude (-185 < -180) in savedLocations',
    invalidLonMinError !== null &&
      Boolean(invalidLonMinError.errors['savedLocations.0.longitude'])
  );

  // 35. User Document rejection on missing cityName in savedLocations
  const missingCityDoc = new User({
    userId: 'usr_sih_1002_nocity',
    savedLocations: [
      {
        latitude: 28.61,
        longitude: 77.209
      }
    ],
    preferredPersona: 'Commuters'
  });
  let missingCityError = null;
  try {
    await missingCityDoc.validate();
  } catch (err) {
    missingCityError = err;
  }
  assertTest(
    'User schema rejects savedLocation missing required cityName',
    missingCityError !== null &&
      Boolean(missingCityError.errors['savedLocations.0.cityName'])
  );

  // 36. User Document rejection on invalid persona
  const invalidPersonaDoc = new User({
    userId: 'usr_sih_1003',
    savedLocations: [],
    preferredPersona: 'NonExistentPersona'
  });

  let invalidPersonaError = null;
  try {
    await invalidPersonaDoc.validate();
  } catch (err) {
    invalidPersonaError = err;
  }
  assertTest(
    'User schema rejects unrecognized preferredPersona enum',
    invalidPersonaError !== null &&
      Boolean(invalidPersonaError.errors['preferredPersona'])
  );

  // 37. User Document rejection on missing userId
  const missingUserIdDoc = new User({
    savedLocations: [],
    preferredPersona: 'Health'
  });

  let missingUserIdError = null;
  try {
    await missingUserIdDoc.validate();
  } catch (err) {
    missingUserIdError = err;
  }
  assertTest(
    'User schema rejects document missing required userId',
    missingUserIdError !== null &&
      Boolean(missingUserIdError.errors['userId'])
  );
}

runDatabaseModelTests().then(() => {
  console.log('\n================================================================================');
  console.log(` ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================================\n');

  console.log('Sample Clean 400 Error Payload Example for lat=500:');
  console.log(JSON.stringify(test5, null, 2));
}).catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
