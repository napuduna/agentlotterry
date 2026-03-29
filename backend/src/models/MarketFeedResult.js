const mongoose = require('mongoose');

const marketFeedResultSchema = new mongoose.Schema({
  lotteryTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LotteryType',
    default: null
  },
  lotteryCode: {
    type: String,
    required: true,
    trim: true
  },
  feedCode: {
    type: String,
    required: true,
    trim: true
  },
  marketName: {
    type: String,
    required: true,
    trim: true
  },
  roundCode: {
    type: String,
    required: true,
    trim: true
  },
  headline: {
    type: String,
    default: '',
    trim: true
  },
  firstPrize: {
    type: String,
    default: '',
    trim: true
  },
  twoTop: {
    type: String,
    default: '',
    trim: true
  },
  twoBottom: {
    type: String,
    default: '',
    trim: true
  },
  threeTop: {
    type: String,
    default: '',
    trim: true
  },
  threeBottom: {
    type: String,
    default: '',
    trim: true
  },
  threeTopHits: [{
    type: String
  }],
  twoTopHits: [{
    type: String
  }],
  twoBottomHits: [{
    type: String
  }],
  threeBottomHits: [{
    type: String
  }],
  runTop: [{
    type: String
  }],
  runBottom: [{
    type: String
  }],
  resultPublishedAt: {
    type: Date,
    default: null
  },
  isSettlementSafe: {
    type: Boolean,
    default: false
  },
  sourceUrl: {
    type: String,
    default: '',
    trim: true
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

marketFeedResultSchema.index({ feedCode: 1, roundCode: 1 }, { unique: true });
marketFeedResultSchema.index({ lotteryCode: 1, resultPublishedAt: -1 });

module.exports = mongoose.model('MarketFeedResult', marketFeedResultSchema);
