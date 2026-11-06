const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, select: false },
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

riderSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

riderSchema.methods.matchPassword = function (password) {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('Rider', riderSchema)
