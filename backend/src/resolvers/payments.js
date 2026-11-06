require('dotenv').config()
const express = require('express')
const Order = require('../models/Order')
const { getUserFromContext } = require('../utils/auth')
const { round2 } = require('../utils/pricing')

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  // 延迟加载，未配置密钥时不影响服务启动
  return require('stripe')(key)
}

const paymentResolvers = {
  Mutation: {
    /**
     * 创建支付意图。前端拿到 clientSecret 后用 Stripe SDK 确认支付；
     * 支付成功由 /webhook/stripe 回写订单状态。
     */
    createPaymentIntent: async (_, { orderId }, context) => {
      const userId = getUserFromContext(context)
      if (!userId) throw new Error('Not authenticated')

      const order = await Order.findOne({ _id: orderId, user: userId })
      if (!order) throw new Error('Order not found')
      if (order.paymentStatus === 'PAID') throw new Error('Order already paid')
      if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED') {
        throw new Error('Order is closed')
      }

      const amount = round2(order.paidAmount)
      if (amount <= 0) throw new Error('Order amount must be greater than 0')

      const stripe = stripeClient()
      if (!stripe) {
        throw new Error(
          'Stripe is not configured: set STRIPE_SECRET_KEY in the server environment to enable card payments'
        )
      }

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // 分
        currency: process.env.STRIPE_CURRENCY || 'usd',
        metadata: { orderId: order._id.toString(), orderNumber: order.orderId || '' },
        automatic_payment_methods: { enabled: true }
      })

      order.paymentIntentId = intent.id
      order.paymentMethod = 'CARD'
      await order.save()

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        amount,
        currency: intent.currency,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
      }
    }
  }
}

/** Stripe webhook：必须挂在 express.json() 之前，因为它要拿原始 body 验签 */
function registerPaymentRoutes(app) {
  app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = stripeClient()
    const whsec = process.env.STRIPE_WEBHOOK_SECRET
    if (!stripe || !whsec) {
      return res.status(503).json({ error: 'Stripe webhook is not configured' })
    }
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], whsec)
    } catch (e) {
      return res.status(400).send(`Webhook Error: ${e.message}`)
    }

    try {
      if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object
        const orderId = intent.metadata && intent.metadata.orderId
        if (orderId) {
          await Order.updateOne(
            { _id: orderId },
            { $set: { paymentStatus: 'PAID', paymentIntentId: intent.id } }
          )
        }
      }
      if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object
        const orderId = intent.metadata && intent.metadata.orderId
        if (orderId) await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'FAILED' } })
      }
      res.json({ received: true })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
}

module.exports = { paymentResolvers, registerPaymentRoutes }
