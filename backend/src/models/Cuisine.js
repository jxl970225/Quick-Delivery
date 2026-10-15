const mongoose = require('mongoose')

const cuisineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    image: String,
    shopType: { type: String, default: 'restaurant' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Cuisine', cuisineSchema)
