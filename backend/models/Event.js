const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  change: {
    type: String,
    required: true
  }
});

const eventSchema = new mongoose.Schema({
  profiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  }],
  timezone: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  logs: [eventLogSchema]
});

module.exports = mongoose.model('Event', eventSchema);