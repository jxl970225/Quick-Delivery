const mongoose = require('mongoose')

const zoneSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  isActive: { type: Boolean, default: true },
  tax: { type: Number, default: 0 }
})

zoneSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Zone', zoneSchema)
