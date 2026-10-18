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

    getVersions: async () => {
      // 与 app.config.js 当前版本一致，避免前端强制更新弹窗
      const v = { android: '1.1.42', ios: '1.1.42' }
      return {
        customerAppVersion: v,
        riderAppVersion: v,
        restaurantAppVersion: v
      }
    },

    banners: async () => {
      // MVP：暂无 banner
      return []
    },

    fetchAllShopTypes: async () => {
      // MVP：暂无 shop type 分类
      return { data: [] }
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
