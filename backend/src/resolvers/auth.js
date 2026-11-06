const Merchant = require('../models/Merchant')
const Rider = require('../models/Rider')
const {
  signMerchantToken,
  signRiderToken,
  getTokenExpiration
} = require('../utils/auth')

const authResolvers = {
  Query: {
    merchantMe: async (_, __, context) => {
      if (context.role !== 'merchant' || !context.merchantId) throw new Error('Merchant login required')
      return Merchant.findById(context.merchantId).populate('restaurant')
    }
  },

  Mutation: {
    merchantLogin: async (_, { email, password }) => {
      if (!email || !password) throw new Error('Email and password are required')
      const merchant = await Merchant.findOne({ email: String(email).toLowerCase() }).select('+password')
      if (!merchant) throw new Error('Merchant not found')
      if (!merchant.isActive) throw new Error('Merchant account is disabled')
      const ok = await merchant.matchPassword(password)
      if (!ok) throw new Error('Incorrect password')

      return {
        userId: merchant._id,
        token: signMerchantToken(merchant._id, merchant.restaurant),
        tokenExpiration: getTokenExpiration(),
        isActive: true,
        name: merchant.name,
        email: merchant.email
      }
    },

    riderLogin: async (_, { phone, password }) => {
      if (!phone || !password) throw new Error('Phone and password are required')
      const rider = await Rider.findOne({ phone }).select('+password')
      if (!rider) throw new Error('Rider not found')
      if (!rider.isActive) throw new Error('Rider account is disabled')
      if (!rider.password) throw new Error('Rider has no login credential yet')
      const ok = await rider.matchPassword(password)
      if (!ok) throw new Error('Incorrect password')

      return {
        userId: rider._id,
        token: signRiderToken(rider._id),
        tokenExpiration: getTokenExpiration(),
        isActive: true,
        name: rider.name,
        phone: rider.phone,
        email: rider.email
      }
    }
  }
}

module.exports = authResolvers
