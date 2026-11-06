require('dotenv').config()
const http = require('http')
const path = require('path')
const express = require('express')
const cors = require('cors')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')
const jwt = require('jsonwebtoken')
const connectDB = require('./config/db')
const typeDefs = require('./schemas')
const { registerImageRoutes } = require('./utils/images')
const resolvers = require('./resolvers')

async function startServer() {
  await connectDB()

  const app = express()
  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  })

  await server.start()

  app.use(cors())
  app.use(express.json())
  // 商家接单台 / 骑手配送台（轻量 Web 操作端）
  app.use(express.static(path.join(__dirname, '..', 'public')))
  app.get('/', (req, res) => res.redirect('/merchant.html'))
  registerImageRoutes(app)
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const header = req.headers.authorization || ''
        const ctx = { userId: null, role: null, merchantId: null, restaurantId: null, riderId: null }
        if (header.startsWith('Bearer ')) {
          try {
            const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
            if (decoded.role === 'merchant' || decoded.merchantId) {
              ctx.role = 'merchant'
              ctx.merchantId = decoded.merchantId
              ctx.restaurantId = decoded.restaurantId
            } else if (decoded.role === 'rider' || decoded.riderId) {
              ctx.role = 'rider'
              ctx.riderId = decoded.riderId
            } else {
              ctx.role = 'customer'
              ctx.userId = decoded.userId
            }
          } catch (e) {
            // token 无效时保持未登录
          }
        }
        return ctx
      }
    })
  )

  const PORT = process.env.PORT || 8001
  httpServer.listen(PORT, () => {
    console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`)
  })
}

startServer()
