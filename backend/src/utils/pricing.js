const Restaurant = require('../models/Restaurant')
const Zone = require('../models/Zone')

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100

function findFood(restaurant, foodId) {
  for (const category of restaurant.categories || []) {
    for (const food of category.foods || []) {
      if (String(food._id) === String(foodId)) return food
    }
  }
  return null
}

/**
 * 服务端重算订单金额。客户端传来的价格一律忽略。
 * 返回 { items, subtotal, deliveryCharges, taxationAmount, paidAmount, restaurant }
 * 抛出错误表示订单不合法（菜品不存在/规格不存在/停售）。
 */
async function priceOrder({
  restaurantId,
  orderInput,
  deliveryCharges: clientDeliveryCharges,
  taxationAmount: clientTax,
  tipping,
  discountAmount,
  pickup = false,
  addressCoordinates
}) {
  const restaurant = await Restaurant.findById(restaurantId)
  if (!restaurant) throw new Error('Restaurant not found')
  if (restaurant.isAvailable === false) throw new Error('Restaurant is not accepting orders right now')

  const pricedItems = []
  let subtotal = 0

  for (const line of orderInput || []) {
    const food = findFood(restaurant, line.food)
    if (!food) throw new Error(`Item is no longer available: ${line.title || 'unknown'}`)
    if (food.isOutOfStock) throw new Error(`${food.title} is out of stock`)

    const variations = food.variations || []
    const variation =
      variations.find((v) => String(v._id) === String(line.variation && line.variation._id)) ||
      variations[0]
    if (!variation) throw new Error(`No purchasable variation for ${food.title}`)

    // 有折扣价时以折扣价为准
    const unitPrice =
      Number(variation.discounted) > 0 ? Number(variation.discounted) : Number(variation.price) || 0

    const quantity = Math.max(1, Math.min(99, Number(line.quantity) || 1))

    // addons：MVP 阶段没有独立的 addon 定价表，按客户端传入但限制单单价 <= 菜品单价的 200%，
    // 避免用 addon 把金额虚高/虚低。
    const addons = (line.addons || []).map((addon) => ({
      _id: addon._id,
      title: addon.title,
      description: addon.description,
      quantityMinimum: addon.quantityMinimum,
      quantityMaximum: addon.quantityMaximum,
      options: (addon.options || []).map((opt) => ({
        _id: opt._id,
        title: opt.title,
        description: opt.description,
        price: Math.max(0, Math.min(Number(opt.price) || 0, unitPrice * 2))
      }))
    }))

    const addonTotal = addons.reduce(
      (sum, addon) =>
        sum + (addon.options || []).reduce((s, o) => s + (Number(o.price) || 0), 0),
      0
    )

    const lineTotal = round2((unitPrice + addonTotal) * quantity)
    subtotal = round2(subtotal + lineTotal)

    pricedItems.push({
      title: food.title,
      food: food._id,
      description: food.description || line.description,
      image: food.image || line.image,
      quantity,
      variation: {
        _id: variation._id,
        title: variation.title,
        price: Number(variation.price) || 0,
        discounted: Number(variation.discounted) || 0
      },
      addons
    })
  }

  if (!pricedItems.length) throw new Error('Cart is empty')

  // 配送费：服务端以餐厅配置为准，仅在自取时为 0
  const restaurantDelivery = Number(restaurant.deliveryCharges) || 0
  // 客户端传入的配送费不参与计算，避免被改成 0 或负数
  const deliveryCharges = pickup ? 0 : round2(restaurantDelivery)

  // 税：取配送地址附近（50km 内）的生效区域税率
  let taxationAmount = 0
  if (!pickup && addressCoordinates && addressCoordinates.length === 2) {
    const zone = await Zone.findOne({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(addressCoordinates[0]), Number(addressCoordinates[1])]
          },
          $maxDistance: 50000
        }
      }
    }).catch(() => null)
    const taxRate = zone && Number(zone.tax) > 0 ? Number(zone.tax) : 0
    taxationAmount = round2((subtotal * taxRate) / 100)
  }

  const tip = Math.max(0, Number(tipping) || 0)
  const discount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal)

  const paidAmount = round2(subtotal - discount + taxationAmount + tip + deliveryCharges)

  return {
    restaurant,
    items: pricedItems,
    subtotal,
    discountAmount: discount,
    taxationAmount,
    tipping: tip,
    deliveryCharges,
    paidAmount
  }
}

module.exports = { priceOrder, round2 }
