const mongoose = require('mongoose')

const openingTimesSchema = new mongoose.Schema({
  day: String,
  times: [
    {
      startTime: [Number],
      endTime: [Number]
    }
  ]
})

const variationSchema = new mongoose.Schema({
  title: String,
  price: { type: Number, default: 0 },
  discounted: { type: Number, default: 0 },
  addons: [String]
})

const foodSchema = new mongoose.Schema({
  title: String,
  image: String,
  description: String,
  subCategory: String,
  isOutOfStock: { type: Boolean, default: false },
  variations: [variationSchema]
})

const categorySchema = new mongoose.Schema({
  title: String,
  foods: [foodSchema]
})

const optionSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: { type: Number, default: 0 }
})

const addonSchema = new mongoose.Schema({
  title: String,
  description: String,
  options: [String],
  quantityMinimum: { type: Number, default: 1 },
  quantityMaximum: { type: Number, default: 10 }
})

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, default: 5 },
    description: String,
    createdAt: Date
  },
  { timestamps: true }
)

const restaurantSchema = new mongoose.Schema(
  {
    orderId: { type: Number, unique: true, sparse: true },
    orderPrefix: { type: String, default: 'RES' },
    name: { type: String, required: true },
    image: String,
    logo: String,
    address: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    deliveryTime: { type: Number, default: 30 },
    minimumOrder: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviewAverage: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    shopType: { type: String, default: 'restaurant' },
    cuisines: [String],
    tags: [String],
    freeDelivery: { type: Boolean, default: false },
    acceptVouchers: { type: Boolean, default: true },
    phone: String,
    restaurantUrl: String,
    stripeDetailsSubmitted: { type: Boolean, default: false },
    categories: [categorySchema],
    options: [optionSchema],
    addons: [addonSchema],
    reviews: [reviewSchema],
    openingTimes: [openingTimesSchema],
    zone: {
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      tax: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
)

restaurantSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Restaurant', restaurantSchema)
