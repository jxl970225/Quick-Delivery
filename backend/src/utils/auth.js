const jwt = require('jsonwebtoken')

const signToken = (userId) =>
  jwt.sign({ userId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' })

const signMerchantToken = (merchantId, restaurantId) =>
  jwt.sign({ merchantId, restaurantId, role: 'merchant' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  })

const signRiderToken = (riderId) =>
  jwt.sign({ riderId, role: 'rider' }, process.env.JWT_SECRET, { expiresIn: '30d' })

const getTokenExpiration = () => Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

// 从 context 中提取当前登录用户 id
const getUserFromContext = (context) => (context && context.userId) || null

/**
 * 商家操作鉴权：以 token 里的门店为准。
 * 兼容期：未登录时若开启 ALLOW_ANON_MERCHANT，才允许使用客户端传入的 restaurantId。
 */
const getMerchantRestaurant = (context, clientRestaurantId) => {
  if (context && context.role === 'merchant' && context.restaurantId) {
    return String(context.restaurantId)
  }
  if (process.env.ALLOW_ANON_MERCHANT === 'true' && clientRestaurantId) {
    return String(clientRestaurantId)
  }
  throw new Error('Merchant login required')
}

/** 骑手操作鉴权：以 token 里的骑手为准。 */
const getRiderId = (context, clientRiderId) => {
  if (context && context.role === 'rider' && context.riderId) {
    return String(context.riderId)
  }
  if (process.env.ALLOW_ANON_MERCHANT === 'true' && clientRiderId) {
    return String(clientRiderId)
  }
  throw new Error('Rider login required')
}

module.exports = {
  signToken,
  signMerchantToken,
  signRiderToken,
  getTokenExpiration,
  getUserFromContext,
  getMerchantRestaurant,
  getRiderId
}
