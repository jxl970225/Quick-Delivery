const userResolvers = require('./user')
const configResolvers = require('./config')
const restaurantResolvers = require('./restaurant')
const orderResolvers = require('./order')

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...configResolvers.Query,
    ...restaurantResolvers.Query,
    ...orderResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...configResolvers.Mutation,
    ...restaurantResolvers.Mutation,
    ...orderResolvers.Mutation
  },
  Restaurant: {
    ...restaurantResolvers.Restaurant
  }
}

module.exports = resolvers
