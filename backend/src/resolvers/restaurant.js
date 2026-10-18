const Restaurant = require('../models/Restaurant')
const Zone = require('../models/Zone')

const restaurantResolvers = {
  Query: {
    zones: async () => {
      return await Zone.find({ isActive: true })
    },
    nearByRestaurants: async (_, { latitude, longitude, shopType }) => {
      const query = {}
      if (shopType) query.shopType = shopType
      if (latitude !== undefined && longitude !== undefined) {
        query.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: 100000
          }
        }
      }
      const restaurants = await Restaurant.find(query)
      return { offers: [], sections: [], restaurants }
    },

    nearByRestaurantsPreview: async (_, { latitude, longitude, shopType, page, limit }) => {
      const query = {}
      if (shopType) query.shopType = shopType
      if (latitude !== undefined && longitude !== undefined) {
        query.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: 100000
          }
        }
      }
      const restaurants = await Restaurant.find(query).limit(limit || 20).skip(((page || 1) - 1) * (limit || 20))
      return { offers: [], sections: [], restaurants }
    },

    restaurant: async (_, { id }) => {
      return Restaurant.findById(id)
    },

    userFavourite: async () => {
      // MVP：返回所有可用餐厅作为收藏占位
      return Restaurant.find({ isAvailable: true })
    }
  },

  Restaurant: {
    reviewData: async (restaurant) => {
      const reviews = restaurant.reviews || []
      const total = reviews.length
      const ratings = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : restaurant.reviewAverage || 0
      return { total, ratings, reviews }
    }
  }
}

module.exports = restaurantResolvers
