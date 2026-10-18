require('dotenv').config()
const connectDB = require('./config/db')
const User = require('./models/User')
const Restaurant = require('./models/Restaurant')
const Coupon = require('./models/Coupon')
const Cuisine = require('./models/Cuisine')
const Configuration = require('./models/Configuration')
const Zone = require('./models/Zone')

async function seed() {
  await connectDB()
  await Configuration.deleteMany({})
  await Configuration.create({
    currency: 'USD',
    currencySymbol: '$',
    deliveryRate: 2.99,
    skipMobileVerification: true,
    skipEmailVerification: true,
    costType: 'FIXED',
    enableCustomerDemoMode: true
  })

  // 测试用户
  await User.deleteMany({ email: 'test@example.com' })
  await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '+15551234567',
    emailIsVerified: true,
    isNewUser: false
  })

  // 优惠券
  await Coupon.deleteMany({})
  await Coupon.create([
    { title: 'Save 10%', code: 'SAVE10', discount: 10, discountType: 'PERCENTAGE', enabled: true },
    { title: '$5 Off', code: 'FIVE', discount: 5, discountType: 'FIXED', enabled: true, minimumOrder: 20 }
  ])

  // 菜系
  await Cuisine.deleteMany({})
  await Cuisine.create([
    { name: 'American', image: 'https://placehold.co/200', shopType: 'restaurant' },
    { name: 'Italian', image: 'https://placehold.co/200', shopType: 'restaurant' },
    { name: 'Sushi', image: 'https://placehold.co/200', shopType: 'restaurant' }
  ])

  // 示例餐厅（纽约坐标）
  await Restaurant.deleteMany({})
  const restaurantData = [
    {
      name: 'Blue Burrito',
      orderPrefix: 'BB',
      image: 'https://placehold.co/400',
      logo: 'https://placehold.co/120',
      address: '123 Main St, New York',
      location: { type: 'Point', coordinates: [-74.006, 40.7128] },
      deliveryTime: 25,
      minimumOrder: 10,
      tax: 8.875,
      shopType: 'restaurant',
      cuisines: ['Mexican', 'American'],
      freeDelivery: true,
      acceptVouchers: true,
      isAvailable: true,
      rating: 4.5,
      reviewCount: 120,
      openingTimes: [
        { day: 'SUN', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'MON', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'TUE', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'WED', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'THU', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'FRI', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'SAT', times: [{ startTime: [0, 0], endTime: [23, 59] }] }
      ],
      reviewAverage: 4.5,
      categories: [
        {
          title: 'Burritos',
          foods: [
            {
              title: 'Classic Chicken Burrito',
              image: 'https://placehold.co/300',
              description: 'Grilled chicken, rice, beans, cheese, salsa',
              variations: [{ title: 'Regular', price: 11.99, discounted: 0 }],
              subCategory: 'Main'
            },
            {
              title: 'Veggie Burrito',
              image: 'https://placehold.co/300',
              description: 'Black beans, rice, avocado, pico de gallo',
              variations: [{ title: 'Regular', price: 10.49, discounted: 9.99 }],
              subCategory: 'Main'
            }
          ]
        },
        {
          title: 'Tacos',
          foods: [
            {
              title: 'Street Tacos (3)',
              image: 'https://placehold.co/300',
              description: 'Three corn tortillas with choice of meat',
              variations: [{ title: 'Standard', price: 8.99, discounted: 0 }],
              subCategory: 'Main'
            }
          ]
        }
      ],
      options: [{ title: 'Add Guacamole', description: 'Fresh guacamole', price: 1.99 }],
      addons: [{ title: 'Extras', description: 'Pick your extras', options: ['Extra Cheese'], quantityMinimum: 0, quantityMaximum: 5 }]
    },
    {
      name: 'Pasta Palace',
      orderPrefix: 'PP',
      image: 'https://placehold.co/400',
      logo: 'https://placehold.co/120',
      address: '456 Broadway, New York',
      location: { type: 'Point', coordinates: [-73.98, 40.759] },
      deliveryTime: 35,
      minimumOrder: 15,
      tax: 8.875,
      shopType: 'restaurant',
      cuisines: ['Italian'],
      freeDelivery: false,
      acceptVouchers: true,
      isAvailable: true,
      rating: 4.8,
      reviewCount: 200,
      openingTimes: [
        { day: 'SUN', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'MON', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'TUE', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'WED', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'THU', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'FRI', times: [{ startTime: [0, 0], endTime: [23, 59] }] },
        { day: 'SAT', times: [{ startTime: [0, 0], endTime: [23, 59] }] }
      ],
      reviewAverage: 4.8,
      categories: [
        {
          title: 'Pasta',
          foods: [
            {
              title: 'Spaghetti Carbonara',
              image: 'https://placehold.co/300',
              description: 'Pancetta, egg, parmesan, black pepper',
              variations: [{ title: 'Regular', price: 15.99, discounted: 0 }],
              subCategory: 'Main'
            },
            {
              title: 'Fettuccine Alfredo',
              image: 'https://placehold.co/300',
              description: 'Creamy alfredo sauce with parmesan',
              variations: [{ title: 'Regular', price: 14.49, discounted: 12.99 }],
              subCategory: 'Main'
            }
          ]
        }
      ],
      options: [{ title: 'Extra Parmesan', description: 'Grated parmesan', price: 0.99 }],
      addons: [{ title: 'Add On', description: 'Additional toppings', options: ['Mushrooms'], quantityMinimum: 0, quantityMaximum: 4 }]
    }
  ]

  await Restaurant.create(restaurantData)

  // 配送区域（zones）—— 前端将 zones 展示为城市列表
  await Zone.deleteMany({})
  await Zone.create([
    {
      title: 'New York',
      description: 'Greater New York delivery area',
      location: { type: 'Point', coordinates: [-74.006, 40.7128] },
      isActive: true,
      tax: 8.875
    }
  ])

  console.log('✅ Seed 完成：测试账号 test@example.com / password123')
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed 失败:', e)
  process.exit(1)
})
