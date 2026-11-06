const Order = require('../models/Order')
const Coupon = require('../models/Coupon')
const Restaurant = require('../models/Restaurant')
const Rider = require('../models/Rider')
const { getUserFromContext, getMerchantRestaurant, getRiderId } = require('../utils/auth')
const { priceOrder, round2 } = require('../utils/pricing')

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000)
}

// 合法的订单状态流转，防止乱序跳转
const FLOW = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['ASSIGNED'],
  ASSIGNED: ['PICKED', 'CANCELLED'],
  PICKED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: []
}

function assertTransition(order, next) {
  const allowed = FLOW[order.orderStatus] || []
  if (!allowed.includes(next)) {
    throw new Error(`Cannot change order status from ${order.orderStatus} to ${next}`)
  }
}

async function applyStatus(order, nextStatus, by, note) {
  assertTransition(order, nextStatus)
  order.orderStatus = nextStatus
  order.statusHistory = order.statusHistory || []
  order.statusHistory.push({ status: nextStatus, at: new Date(), by, note })
  const now = new Date()
  if (nextStatus === 'ACCEPTED') order.acceptedAt = now
  if (nextStatus === 'PREPARING') order.preparationTime = now
  if (nextStatus === 'READY') order.completionTime = now
  if (nextStatus === 'ASSIGNED') order.assignedAt = now
  if (nextStatus === 'PICKED') {
    order.pickedAt = now
    order.isPickedUp = true
  }
  if (nextStatus === 'COMPLETED') order.deliveredAt = now
  if (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') order.cancelledAt = now
  await order.save()
  return order
}

function orderStatuses() {
  return Object.keys(FLOW)
}

async function loadOrder(id) {
  const order = await Order.findById(id)
  if (!order) throw new Error('Order not found')
  return order
}

// 商家操作归属校验：只允许操作本店订单
function assertRestaurant(order, restaurantId) {
  if (!restaurantId) throw new Error('restaurantId is required for merchant operations')
  if (String(order.restaurant) !== String(restaurantId)) {
    throw new Error('This order does not belong to your restaurant')
  }
}

async function resolveCoupon(code, restaurantId, orderAmount) {
  if (!code) return { coupon: null, discountAmount: 0 }
  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
  if (!coupon || !coupon.enabled) {
    throw new Error('Invalid coupon code')
  }
  if (orderAmount < (coupon.minimumOrder || 0)) {
    throw new Error(`Minimum order of ${coupon.minimumOrder} required for this coupon`)
  }
  const discountAmount =
    coupon.discountType === 'PERCENTAGE'
      ? (orderAmount * coupon.discount) / 100
      : Math.min(coupon.discount, orderAmount)
  return { coupon, discountAmount: round2(discountAmount) }
}

const orderResolvers = {
  Query: {
    myOrders: async (_, { offset }, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      return Order.find({ user: userId }).sort({ createdAt: -1 }).skip(offset || 0)
    },

    order: async (_, { id }, context) => {
      const userId = getUserFromContext(context)
      return Order.findOne({ _id: id, user: userId })
    },

    getUsersActiveOrders: async (_, __, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      const active = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED']
      return Order.find({ user: userId, orderStatus: { $in: active } }).sort({ createdAt: -1 })
    },

    getUsersPastOrders: async (_, __, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return []
      const done = ['COMPLETED', 'CANCELLED', 'REJECTED']
      return Order.find({ user: userId, orderStatus: { $in: done } }).sort({ createdAt: -1 })
    },

    // ===== 商家端 =====
    restaurantOrders: async (_, { restaurantId, status }, context) => {
      const storeId = getMerchantRestaurant(context, restaurantId)
      const query = { restaurant: storeId }
      if (status) query.orderStatus = status
      return Order.find(query).sort({ createdAt: 1 })
    },

    pendingRestaurantOrders: async (_, { restaurantId }, context) => {
      const storeId = getMerchantRestaurant(context, restaurantId)
      return Order.find({ restaurant: storeId, orderStatus: 'PENDING' }).sort({ createdAt: 1 })
    },

    // ===== 骑手端 =====
    riderOrders: async (_, { riderId }, context) => {
      const rid = getRiderId(context, riderId)
      const active = ['ASSIGNED', 'PICKED']
      return Order.find({ rider: rid, orderStatus: { $in: active } }).sort({ createdAt: 1 })
    },

    availableDeliveryOrders: async (_, { latitude, longitude }) => {
      // 已出餐但还没派骑手的订单
      return Order.find({ orderStatus: 'READY' }).sort({ createdAt: 1 }).limit(50)
    },

    riderProfile: async (_, { riderId }, context) => {
      const rid = getRiderId(context, riderId)
      return Rider.findById(rid)
    },

    orderStatuses: () => orderStatuses()
  },

  Mutation: {
    placeOrder: async (_, args, context) => {
      const userId = getUserFromContext(context)
      if (!userId) throw new Error('Not authenticated')

      const {
        restaurant: restaurantId,
        orderInput,
        paymentMethod,
        couponCode,
        tipping,
        address,
        orderDate,
        isPickedUp,
        instructions
      } = args

      if (!address) throw new Error('A delivery address is required')

      // 前端 Web 版可能拿不到浏览器定位，坐标缺失时回退为餐厅坐标（税按下单门店所在区域算）
      const restaurantDoc = await Restaurant.findById(restaurantId)
      const coords =
        address.coordinates && address.coordinates.length === 2
          ? address.coordinates
          : (restaurantDoc && restaurantDoc.location && restaurantDoc.location.coordinates) || null

      const { coupon, discountAmount } = await resolveCoupon(
        couponCode,
        restaurantId,
        (orderInput || []).reduce((s, i) => s + (Number(i.variation && i.variation.price) || 0) * (Number(i.quantity) || 1), 0)
      )

      // 先按服务端规则定价（内部会用真实菜价重算 subtotal）
      const priced = await priceOrder({
        restaurantId,
        orderInput,
        deliveryCharges: args.deliveryCharges,
        taxationAmount: args.taxationAmount,
        tipping,
        discountAmount,
        pickup: !!isPickedUp,
        addressCoordinates: coords
      })

      // 优惠券门槛按服务端 subtotal 重新校验一次
      if (coupon && priced.subtotal < (coupon.minimumOrder || 0)) {
        throw new Error(`Minimum order of ${coupon.minimumOrder} required for this coupon`)
      }

      const order = await Order.create({
        orderId: generateOrderId(),
        restaurant: priced.restaurant._id,
        user: userId,
        items: priced.items,
        deliveryAddress: {
          label: address.label,
          deliveryAddress: address.deliveryAddress,
          details: address.details,
          location: { coordinates: coords ? [Number(coords[0]), Number(coords[1])] : undefined }
        },
        paymentMethod,
        paymentStatus: 'PENDING',
        paidAmount: priced.paidAmount,
        orderAmount: priced.subtotal,
        orderStatus: 'PENDING',
        tipping: priced.tipping,
        taxationAmount: priced.taxationAmount,
        deliveryCharges: priced.deliveryCharges,
        discountAmount: priced.discountAmount,
        couponCode: coupon ? coupon.code : null,
        orderDate,
        isPickedUp: !!isPickedUp,
        instructions,
        statusHistory: [{ status: 'PENDING', at: new Date(), by: 'customer', note: 'Order placed' }]
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

    // ===== 用户取消 =====
    abortOrder: async (_, { id }, context) => {
      const userId = getUserFromContext(context)
      const order = await Order.findOne({ _id: id, user: userId })
      if (!order) throw new Error('Order not found')
      // 骑手已取餐后用户不能自行取消
      if (['PICKED', 'COMPLETED'].includes(order.orderStatus)) {
        throw new Error('Order cannot be cancelled after pickup')
      }
      return applyStatus(order, 'CANCELLED', 'customer', 'Cancelled by customer')
    },

    // ===== 商家操作 =====
    acceptOrder: async (_, { id, restaurantId, preparationTime }, context) => {
      const order = await loadOrder(id)
      assertRestaurant(order, getMerchantRestaurant(context, restaurantId))
      if (preparationTime) order.expectedTime = String(preparationTime)
      return applyStatus(order, 'ACCEPTED', 'merchant', 'Accepted by merchant')
    },

    rejectOrder: async (_, { id, restaurantId, reason }, context) => {
      const order = await loadOrder(id)
      assertRestaurant(order, getMerchantRestaurant(context, restaurantId))
      return applyStatus(order, 'REJECTED', 'merchant', reason || 'Rejected by merchant')
    },

    markOrderPreparing: async (_, { id, restaurantId }, context) => {
      const order = await loadOrder(id)
      assertRestaurant(order, getMerchantRestaurant(context, restaurantId))
      return applyStatus(order, 'PREPARING', 'merchant', 'Preparing')
    },

    markOrderReady: async (_, { id, restaurantId }, context) => {
      const order = await loadOrder(id)
      assertRestaurant(order, getMerchantRestaurant(context, restaurantId))
      return applyStatus(order, 'READY', 'merchant', 'Ready for pickup')
    },

    // ===== 派单 / 骑手 =====
    createRider: async (_, { name, phone, email }) => {
      const existing = await Rider.findOne({ phone })
      if (existing) return existing
      return Rider.create({ name, phone, email })
    },

    assignRider: async (_, { orderId, riderId }) => {
      const order = await loadOrder(orderId)
      const rider = await Rider.findById(riderId)
      if (!rider) throw new Error('Rider not found')
      if (!rider.isActive) throw new Error('Rider is inactive')
      // 只有已出餐的订单可以派单
      assertTransition(order, 'ASSIGNED')
      order.rider = rider._id
      order.orderStatus = 'ASSIGNED'
      order.assignedAt = new Date()
      order.statusHistory = order.statusHistory || []
      order.statusHistory.push({ status: 'ASSIGNED', at: new Date(), by: 'system', note: `Assigned to ${rider.name}` })
      await order.save()
      return order
    },

    autoAssignRider: async (_, { orderId }) => {
      const order = await loadOrder(orderId)
      assertTransition(order, 'ASSIGNED')
      const rider = await Rider.findOne({ isActive: true, isAvailable: true }).sort({ updatedAt: 1 })
      if (!rider) throw new Error('No available rider right now')
      order.rider = rider._id
      order.orderStatus = 'ASSIGNED'
      order.assignedAt = new Date()
      order.statusHistory = order.statusHistory || []
      order.statusHistory.push({ status: 'ASSIGNED', at: new Date(), by: 'system', note: `Auto assigned to ${rider.name}` })
      await order.save()
      return order
    },

    riderPickUp: async (_, { id, riderId }, context) => {
      const order = await loadOrder(id)
      const rid = getRiderId(context, riderId)
      if (String(order.rider) !== String(rid)) throw new Error('This order is not assigned to you')
      return applyStatus(order, 'PICKED', 'rider', 'Picked up from restaurant')
    },

    riderDeliver: async (_, { id, riderId }, context) => {
      const order = await loadOrder(id)
      const rid = getRiderId(context, riderId)
      if (String(order.rider) !== String(rid)) throw new Error('This order is not assigned to you')
      const updated = await applyStatus(order, 'COMPLETED', 'rider', 'Delivered')
      if (updated.paymentMethod === 'COD') updated.paymentStatus = 'PAID'
      await updated.save()
      return updated
    },

    updateRiderLocation: async (_, { riderId, latitude, longitude, isAvailable }, context) => {
      const rid = getRiderId(context, riderId)
      const rider = await Rider.findById(rid)
      if (!rider) throw new Error('Rider not found')
      rider.location = { type: 'Point', coordinates: [Number(longitude), Number(latitude)] }
      rider.lastLocationAt = new Date()
      if (typeof isAvailable === 'boolean') rider.isAvailable = isAvailable
      await rider.save()
      return rider
    },

    // ===== 支付状态（Stripe webhook 接入前由后台调用） =====
    markOrderPaid: async (_, { id, transactionId }) => {
      const order = await loadOrder(id)
      order.paymentStatus = 'PAID'
      order.paymentMethod = order.paymentMethod || 'CARD'
      order.statusHistory = order.statusHistory || []
      order.statusHistory.push({ status: order.orderStatus, at: new Date(), by: 'system', note: `Payment captured ${transactionId || ''}` })
      await order.save()
      return order
    },

    // ===== 退款（平台操作） =====
    refundOrder: async (_, { id, amount, reason }) => {
      const order = await loadOrder(id)
      if (order.paymentStatus === 'REFUNDED') throw new Error('Order already refunded')
      const refundAmount = Math.min(
        Math.max(0, Number(amount) > 0 ? Number(amount) : order.paidAmount),
        order.paidAmount
      )
      order.refundAmount = round2(refundAmount)
      order.refundedAt = new Date()
      order.refundReason = reason || 'Refund issued'
      order.paymentStatus = 'REFUNDED'
      if (refundAmount >= order.paidAmount && !['COMPLETED'].includes(order.orderStatus)) {
        order.orderStatus = 'CANCELLED'
        order.cancelledAt = new Date()
      }
      order.statusHistory = order.statusHistory || []
      order.statusHistory.push({
        status: order.orderStatus,
        at: new Date(),
        by: 'platform',
        note: `Refund ${order.refundAmount} issued: ${reason || ''}`
      })
      await order.save()
      return order
    }
  }
}

module.exports = orderResolvers
