const jwt = require('jsonwebtoken')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })

const getTokenExpiration = () =>
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

// 从 context 中提取当前登录用户 id
const getUserFromContext = (context) => (context && context.userId) || null

module.exports = { signToken, getTokenExpiration, getUserFromContext }
