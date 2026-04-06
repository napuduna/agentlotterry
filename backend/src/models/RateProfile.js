const mongoose = require('mongoose');
const { DEFAULT_GLOBAL_RATES } = require('../constants/betting');

const rateProfileSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  rates: {
    '3top': { type: Number, default: DEFAULT_GLOBAL_RATES['3top'] },
    '3bottom': { type: Number, default: DEFAULT_GLOBAL_RATES['3bottom'] },
    '3tod': { type: Number, default: DEFAULT_GLOBAL_RATES['3tod'] },
    '2top': { type: Number, default: DEFAULT_GLOBAL_RATES['2top'] },
    '2bottom': { type: Number, default: DEFAULT_GLOBAL_RATES['2bottom'] },
    '2tod': { type: Number, default: DEFAULT_GLOBAL_RATES['2tod'] },
    'run_top': { type: Number, default: DEFAULT_GLOBAL_RATES['run_top'] },
    'run_bottom': { type: Number, default: DEFAULT_GLOBAL_RATES['run_bottom'] },
    'lao_set4': { type: Number, default: DEFAULT_GLOBAL_RATES['lao_set4'] }
  },
  commissions: {
    '3top': { type: Number, default: 0 },
    '3bottom': { type: Number, default: 0 },
    '3tod': { type: Number, default: 0 },
    '2top': { type: Number, default: 0 },
    '2bottom': { type: Number, default: 0 },
    '2tod': { type: Number, default: 0 },
    'run_top': { type: Number, default: 0 },
    'run_bottom': { type: Number, default: 0 },
    'lao_set4': { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

rateProfileSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('RateProfile', rateProfileSchema);
