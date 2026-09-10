/**
 * SIH26076: Mausam App - Express Server Entry Point (server.js)
 *
 * Boots the HTTP server, establishes database connectivity if configured,
 * and handles graceful shutdown signals.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || null;

// Attempt MongoDB connection if connection string is configured
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log(`[Database] Connected successfully to MongoDB: ${MONGODB_URI}`);
    })
    .catch((err) => {
      console.warn(`[Database WARNING] Could not connect to MongoDB (${err.message}). Running in standalone mode.`);
    });
} else {
  console.log('[Database] No MONGODB_URI detected. Running in standalone schema validation mode.');
}

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log('================================================================================');
  console.log(` 🌦️  SIH26076: MAUSAM APP - MAIN EXPRESS SERVER ONLINE`);
  console.log(` 🚀 Listening on: http://localhost:${PORT}`);
  console.log(` 📡 Weather Route: http://localhost:${PORT}/api/weather?latitude=28.61&longitude=77.23`);
  console.log(` 💾 Save Location: http://localhost:${PORT}/api/save-location`);
  console.log('================================================================================');
});

// Graceful Shutdown Handling
function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP connections closed.');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed.');
    }
    process.exit(0);
  });

  // Force close if clean termination takes too long
  setTimeout(() => {
    console.error('[Server ERROR] Forcefully terminating process.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, server };
