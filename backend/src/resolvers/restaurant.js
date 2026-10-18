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
    },

    singleVendorDiscovery: async (_, { previewLimit = 4, dealLimit = 6 }) => {
      // SINGLE vendor 主商家：取第一个可用餐厅
      const restaurant = await Restaurant.findOne({ isAvailable: true }).sort({ createdAt: 1 })
      const emptyDeals = {
        limitedTime: { items: [] },
        weekly: { items: [] },
        newOffers: { items: [] }
      }
      if (!restaurant) {
        return { banners: [], categories: [], deals: emptyDeals }
      }
      const catId = (c) => (c._id ? c._id.toString() : '')
      const foodId = (f) => (f._id ? f._id.toString() : `${catId}-${f.title}`)
      const toVar = (f, v) => ({
        id: v._id ? v._id.toString() : `${foodId(f)}-${v.title}`,
        title: v.title,
        price: v.discounted || v.price,
        isOutOfStock: false,
        deal:
          v.discounted && v.price && v.discounted < v.price
            ? { id: `${foodId(f)}-${v.title}-deal`, discountType: 'PERCENTAGE', discountValue: 10, isActive: true }
            : null
      })
      const toHomeItem = (f, cid) => ({
        id: foodId(f),
        categoryId: cid,
        title: f.title,
        description: f.description || '',
        image: f.image || '',
        isOutOfStock: f.isOutOfStock || false,
        variations: (f.variations || []).map((v) => toVar(f, v))
      })
      const categories = (restaurant.categories || []).map((c) => ({
        id: catId(c),
        name: c.title,
        icon: '',
        image: restaurant.logo || '',
        description: '',
        itemCount: (c.foods || []).length,
        viewType: 'grid',
        items: (c.foods || []).map((f) => toHomeItem(f, catId(c)))
      }))
      const allFoods = (restaurant.categories || []).flatMap((c) =>
        (c.foods || []).map((f) => ({ f, cid: catId(c), value: 10 }))
      )
      const toDealItem = (x) => ({
        id: foodId(x.f),
        categoryId: x.cid,
        title: x.f.title,
        description: x.f.description || '',
        image: x.f.image || '',
        isOutOfStock: false,
        variations: (x.f.variations || []).map((v) => ({
          id: v._id ? v._id.toString() : `${foodId(x.f)}-${v.title}`,
          title: v.title,
          price: v.discounted || v.price,
          isOutOfStock: false,
          deal: { id: `${foodId(x.f)}-deal`, discountType: 'PERCENTAGE', discountValue: x.value, isActive: true }
        }))
      })
      const cut = (arr, start, n) => arr.slice(start, start + n).map(toDealItem)
      const marked = allFoods.map((x, i) => ({ ...x, value: 10 + (i % 3) * 5 }))
      return {
        banners: [],
        categories,
        deals: {
          limitedTime: { items: cut(marked, 0, dealLimit) },
          weekly: { items: cut(marked, dealLimit, dealLimit) },
          newOffers: { items: cut(marked, dealLimit * 2, dealLimit) }
        }
      }
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
