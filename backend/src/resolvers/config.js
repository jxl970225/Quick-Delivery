const Configuration = require('../models/Configuration')
const Cuisine = require('../models/Cuisine')

const configResolvers = {
  Query: {
    configuration: async () => {
      let config = await Configuration.findOne()
      if (!config) {
        config = await Configuration.create({
          currency: 'USD',
          currencySymbol: '$',
          deliveryRate: 0,
          skipMobileVerification: true,
          skipEmailVerification: true,
          costType: 'FIXED',
          enableCustomerDemoMode: true
        })
      }
      return config
    },

    cuisines: async () => {
      return Cuisine.find()
    },

    taxes: async () => {
      // MVP：返回默认税费配置
      return [{ _id: 'default-tax', taxationCharges: 0, enabled: false }]
    },

    tips: async () => {
      // MVP：返回默认小费配置
      return [{ _id: 'default-tip', tipVariations: [5, 10, 15], enabled: true }]
    }
  }
}

module.exports = configResolvers
