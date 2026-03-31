const mongoose = require('mongoose');
const { BET_TYPES } = require('../constants/betting');

const lotteryTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LotteryLeague',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  provider: {
    type: String,
    default: '',
    trim: true
  },
  supportedBetTypes: [{
    type: String,
    enum: BET_TYPES
  }],
  rateProfileIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RateProfile'
  }],
  defaultRateProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RateProfile',
    default: null
  },
  resultSource: {
    type: String,
    enum: ['manual', 'legacy', 'api'],
    default: 'manual'
  },
  schedule: {
    type: {
      type: String,
      enum: ['monthly', 'daily'],
      required: true
    },
    days: [{ type: Number }],
    weekdays: [{ type: Number }],
    openLeadDays: { type: Number, default: 1 },
    closeHour: { type: Number, required: true },
    closeMinute: { type: Number, default: 0 },
    drawHour: { type: Number, required: true },
    drawMinute: { type: Number, default: 0 }
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LotteryType', lotteryTypeSchema);
