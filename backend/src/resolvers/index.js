const userResolvers = require('./user')
const configResolvers = require('./config')
const restaurantResolvers = require('./restaurant')
const orderResolvers = require('./order')
const authResolvers = require('./auth')

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...configResolvers.Query,
    ...restaurantResolvers.Query,
    ...orderResolvers.Query,
    ...authResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...configResolvers.Mutation,
    ...restaurantResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...authResolvers.Mutation
  },
  Restaurant: {
    ...restaurantResolvers.Restaurant
  }
}

module.exports = resolvers
