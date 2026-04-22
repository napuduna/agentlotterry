const mongoose = require('mongoose');

const catalogOverviewSnapshotSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true, default: () => ({}) },
  builtAt: { type: Date, required: true, default: Date.now },
  version: { type: Number, required: true, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('CatalogOverviewSnapshot', catalogOverviewSnapshotSchema);
