const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const merchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

merchantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

merchantSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('Merchant', merchantSchema)
