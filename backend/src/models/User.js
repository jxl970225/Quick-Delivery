const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const addressSchema = new mongoose.Schema(
  {
    label: String,
    deliveryAddress: String,
    details: String,
    location: {
      coordinates: { type: [Number] }
    },
    selected: { type: Boolean, default: false }
  },
  { _id: true }
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, select: false },
    appleId: String,
    isActive: { type: Boolean, default: true },
    emailIsVerified: { type: Boolean, default: false },
    phoneIsVerified: { type: Boolean, default: false },
    notificationToken: String,
    isNewUser: { type: Boolean, default: true },
    addresses: [addressSchema]
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)
