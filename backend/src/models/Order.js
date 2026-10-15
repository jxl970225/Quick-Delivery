const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  title: String,
  food: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant.foods' },
  description: String,
  image: String,
  quantity: { type: Number, default: 1 },
  variation: {
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    price: { type: Number, default: 0 },
    discounted: { type: Number, default: 0 }
  },
  addons: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      description: String,
      options: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          title: String,
          description: String,
          price: { type: Number, default: 0 }
        }
      ],
      quantityMinimum: { type: Number, default: 1 },
      quantityMaximum: { type: Number, default: 10 }
    }
  ]
})

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
    deliveryAddress: {
      label: String,
      deliveryAddress: String,
      details: String,
      location: { coordinates: { type: [Number] } }
    },
    items: [orderItemSchema],
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    paymentMethod: { type: String, default: 'CARD' },
    paymentStatus: { type: String, default: 'PENDING' },
    paidAmount: { type: Number, default: 0 },
    orderAmount: { type: Number, default: 0 },
    orderStatus: { type: String, default: 'PENDING' },
    tipping: { type: Number, default: 0 },
    taxationAmount: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    orderDate: String,
    expectedTime: String,
    isPickedUp: { type: Boolean, default: false },
    instructions: String,
    couponCode: String,
    acceptedAt: Date,
    pickedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    assignedAt: Date,
    completionTime: Date,
    preparationTime: Date
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)
