/**
 * SIH26076: Mausam App - Database Schema Model (dbModel.js)
 *
 * Mongoose Schema & Data Model for storing user profiles, saved locations,
 * and persona preferences for the Mausam App.
 *
 * Fields:
 *  - userId: Unique user identifier (indexed, required)
 *  - savedLocations: Array of objects containing cityName, latitude, longitude, addedAt
 *  - preferredPersona: Preferred weather persona (e.g., 'Health', 'Agriculture', 'Outdoor Fitness')
 *  - timestamps: createdAt and updatedAt automatically managed
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for user's favorite/saved geographical locations
 */
const savedLocationSchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: [true, 'City name is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude cannot be less than -90'],
      max: [90, 'Latitude cannot exceed 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude cannot be less than -180'],
      max: [180, 'Longitude cannot exceed 180']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/**
 * Valid personas supported by SIH26076 Mausam app
 */
const VALID_PERSONAS = [
  'Health',
  'Health-Conscious',
  'Agriculture',
  'Agriculture/Gardeners',
  'Outdoor Fitness',
  'Beachgoers/Surfers',
  'Commuters',
  'Parents & Families',
  'Event Planners',
  'Travelers'
];

/**
 * Main User Schema
 */
const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    savedLocations: {
      type: [savedLocationSchema],
      default: []
    },
    preferredPersona: {
      type: String,
      required: [true, 'Preferred persona is required'],
      enum: {
        values: VALID_PERSONAS,
        message: '{VALUE} is not a recognized persona'
      },
      default: 'Health-Conscious'
    }
  },
  {
    timestamps: true // Automatically generates createdAt and updatedAt
  }
);

// Prevent overwrite errors if model is re-compiled in watch/test environments
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = {
  User,
  userSchema,
  savedLocationSchema,
  VALID_PERSONAS
};
