const mongoose = require('mongoose')
const Order = require('../models/Order')
const Coupon = require('../models/Coupon')
const { getUserFromContext } = require('../utils/auth')

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000)
}

function calculateItemsTotal(items) {
  return items.reduce((sum, item) => {
    const base = (item.variation && item.variation.price) || 0
    let addonTotal = 0
    if (item.addons && item.addons.length) {
      addonTotal = item.addons.reduce((s, addon) => {
        let o = 0
        if (addon.options && addon.options.length) {
          o = addon.options.reduce((x, opt) => x + (opt.price || 0), 0)
        }
        return s + o
      }, 0)
    }
    return sum + (base + addonTotal) * (item.quantity || 1)
  }, 0)
}

// 校验并返回优惠券（折扣后金额）
async function resolveCoupon(code, restaurantId, orderAmount) {
  if (!code) return { coupon: null, discountAmount: 0 }
  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
  if (!coupon || !coupon.enabled) {
    return { coupon: null, discountAmount: 0, error: 'Invalid coupon' }
  }
  if (orderAmount < coupon.minimumOrder) {
    return { coupon: null, discountAmount: 0, error: `Minimum order ${coupon.minimumOrder} required` }
  }
  const discountAmount =
    coupon.discountType === 'PERCENTAGE'
      ? (orderAmount * coupon.discount) / 100
      : Math.min(coupon.discount, orderAmount)
  return { coupon, discountAmount: Math.round(discountAmount * 100) / 100 }
}

const orderResolvers = {
  Query: {
    myOrders: async (_, { offset }, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      return Order.find({ user: userId }).sort({ createdAt: -1 }).skip(offset || 0)
    },

    order: async (_, { id }) => {
      return Order.findById(id)
    },

    getUsersActiveOrders: async (_, __, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      const active = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'PICKED', 'PREPARING', 'ENROUTE']
      return Order.find({ user: userId, orderStatus: { $in: active } }).sort({ createdAt: -1 })
    },

    getUsersPastOrders: async (_, __, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      const done = ['COMPLETED', 'CANCELLED', 'REJECTED']
      return Order.find({ user: userId, orderStatus: { $in: done } }).sort({ createdAt: -1 })
    }
  },

  Mutation: {
    placeOrder: async (_, args, context) => {
      const userId = getUserFromContext(context)
      if (!userId) throw new Error('Not authenticated')

      const {
        restaurant,
        orderInput,
        paymentMethod,
        couponCode,
        tipping,
        taxationAmount,
        address,
        orderDate,
        isPickedUp,
        deliveryCharges,
        instructions
      } = args

      const orderAmount = calculateItemsTotal(orderInput)
      const { coupon, discountAmount } = await resolveCoupon(couponCode, restaurant, orderAmount)
      const paidAmount = Math.round(
        (orderAmount - discountAmount + (taxationAmount || 0) + (tipping || 0) + (deliveryCharges || 0)) * 100
      ) / 100

      const items = orderInput.map((i) => ({
        title: i.title,
        food: i.food,
        description: i.description,
        image: i.image,
        quantity: i.quantity,
        variation: i.variation,
        addons: i.addons
      }))

      const order = await Order.create({
        orderId: generateOrderId(),
        restaurant,
        user: userId,
        items,
        deliveryAddress: {
          label: address.label,
          deliveryAddress: address.deliveryAddress,
          details: address.details,
          location: { coordinates: address.coordinates || [0, 0] }
        },
        paymentMethod,
        paymentStatus: 'PENDING',
        paidAmount,
        orderAmount,
        orderStatus: 'PENDING',
        tipping: tipping || 0,
        taxationAmount: taxationAmount || 0,
        deliveryCharges: deliveryCharges || 0,
        discountAmount,
        couponCode: coupon ? coupon.code : null,
        orderDate,
        isPickedUp,
        instructions
      })

      if (coupon) {
        coupon.usedCount = (coupon.usedCount || 0) + 1
        await coupon.save()
      }

      return order
    },

    coupon: async (_, { coupon: code, restaurantId }) => {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() })
      if (!coupon || !coupon.enabled) {
        return { coupon: null, message: 'Invalid coupon', success: false }
      }
      return {
        coupon: { _id: coupon._id, discount: coupon.discount, enabled: coupon.enabled, title: coupon.title },
        message: 'Coupon applied',
        success: true
      }
    },

    abortOrder: async (_, { id }, context) => {
      const userId = getUserFromContext(context)
      const order = await Order.findOne({ _id: id, user: userId })
      if (!order) throw new Error('Order not found')
      order.orderStatus = 'CANCELLED'
      order.cancelledAt = new Date()
      await order.save()
      return order
    }
  }
}

module.exports = orderResolvers
