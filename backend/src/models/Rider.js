const mongoose = require('mongoose')

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    // [lng, lat]
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    appVersion: String,
    lastLocationAt: Date
  },
  { timestamps: true }
)

riderSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Rider', riderSchema)
