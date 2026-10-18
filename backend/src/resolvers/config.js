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
  },
  Mutation: {
    metricsGeneral: async () => {
      // 前端 publicAccess 用它生成公网访问 token（experience）+ 过期时间（hehe）。
      // 返回有效 token + 很远的未来过期，避免前端 token 刷新逻辑报错。
      return {
        excellence: '',
        topgun: '',
        experience: `pub-token-${Date.now()}`,
        skydiver: '',
        rider: '',
        haha: '',
        hehe: '2999-01-01T00:00:00.000Z',
        huhu: '',
        yoyo: '',
        turu: ''
      }
    }
  }
}

module.exports = configResolvers
