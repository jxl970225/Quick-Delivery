/**
 * 创建商家 / 骑手演示账号（幂等，只增改账号，不动订单与餐厅数据）
 * 用法：MONGODB_URI="..." node src/scripts/seed-accounts.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Merchant = require('../models/Merchant')
const Rider = require('../models/Rider')
const Restaurant = require('../models/Restaurant')

const MERCHANTS = [
  { name: 'Blue Burrito 店长', email: 'merchant@demo.com', password: 'merchant123', restaurantName: 'Blue Burrito' },
  { name: 'Pasta Palace 店长', email: 'pasta@demo.com', password: 'merchant123', restaurantName: 'Pasta Palace' }
]

const RIDERS = [
  { name: 'Alex Rider', phone: '+15550001111', password: 'rider123' }
]

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('connected')

  for (const m of MERCHANTS) {
    const restaurant = await Restaurant.findOne({ name: m.restaurantName })
    if (!restaurant) {
      console.log('skip, restaurant missing:', m.restaurantName)
      continue
    }
    const existing = await Merchant.findOne({ email: m.email }).select('+password')
    if (existing) {
      existing.name = m.name
      existing.restaurant = restaurant._id
      existing.password = m.password
      existing.isActive = true
      await existing.save()
      console.log('updated merchant:', m.email, '->', restaurant.name)
    } else {
      await Merchant.create({
        name: m.name,
        email: m.email,
        password: m.password,
        restaurant: restaurant._id
      })
      console.log('created merchant:', m.email, '->', restaurant.name)
    }
  }

  for (const r of RIDERS) {
    const existing = await Rider.findOne({ phone: r.phone }).select('+password')
    if (existing) {
      existing.name = r.name
      existing.password = r.password
      existing.isActive = true
      await existing.save()
      console.log('updated rider:', r.phone, existing._id.toString())
    } else {
      const created = await Rider.create({ name: r.name, phone: r.phone, password: r.password })
      console.log('created rider:', r.phone, created._id.toString())
    }
  }

  await mongoose.disconnect()
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
