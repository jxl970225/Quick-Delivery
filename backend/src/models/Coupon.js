const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discount: { type: Number, default: 0 }, // percentage or fixed
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    enabled: { type: Boolean, default: true },
    minimumOrder: { type: Number, default: 0 },
    restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    expiresAt: Date,
    isSingleUse: { type: Boolean, default: false },
    usedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Coupon', couponSchema)
