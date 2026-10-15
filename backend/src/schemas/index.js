const typeDefs = `#graphql
  type Query {
    configuration: Configuration
    cuisines: [Cuisine]
    nearByRestaurants(latitude: Float, longitude: Float, shopType: String): NearByRestaurants
    nearByRestaurantsPreview(latitude: Float, longitude: Float, shopType: String, page: Int, limit: Int): NearByRestaurantsPreview
    restaurant(id: String): Restaurant
    myOrders(offset: Int): [Order]
    order(id: String): Order
    getUsersActiveOrders(page: Int, limit: Int, offset: Int): [Order]
    getUsersPastOrders(page: Int, limit: Int, offset: Int): [Order]
    taxes: [Tax]
    tips: [Tip]
    userFavourite(latitude: Float, longitude: Float): [Restaurant]
    user: User
  }

  type Mutation {
    login(email: String, password: String, type: String!, appleId: String, appleNonce: String, idToken: String, name: String, notificationToken: String): AuthPayload
    createUser(userInput: UserInput!): AuthPayload
    emailExist(email: String!): Boolean
    phoneExist(phone: String!): Boolean
    sendOtpToEmail(email: String!): OTPResult
    sendOtpToPhoneNumber(phone: String!): OTPResult
    verifyOtp(otp: String!, email: String, phone: String): OTPResult
    updateUser(updateUserInput: UpdateUserInput!): User
    placeOrder(restaurant: String!, orderInput: [OrderInput!]!, paymentMethod: String!, couponCode: String, tipping: Float!, taxationAmount: Float!, address: AddressInput!, orderDate: String!, isPickedUp: Boolean!, deliveryCharges: Float!, instructions: String): Order
    coupon(coupon: String!, restaurantId: ID!): CouponResult
    abortOrder(id: String!): Order
    createAddress(addressInput: AddressInput!): User
    editAddress(addressInput: AddressInput!): User
    deleteAddress(id: ID!): User
    selectAddress(id: String!): User
    reviewOrder(reviewInput: ReviewInput!): Order
    addFavourite(id: String!): User
    forgotPassword(email: String!): OTPResult
    resetPassword(password: String!, email: String!, otp: String!): OTPResult
    changePassword(oldPassword: String!, newPassword: String!): Boolean
    pushToken(token: String): User
    updateNotificationStatus(offerNotification: Boolean!, orderNotification: Boolean!): User
    Deactivate(isActive: Boolean!, email: String!): DeactivateResult
  }

  type Configuration {
    _id: ID
    currency: String
    currencySymbol: String
    deliveryRate: Float
    twilioEnabled: Boolean
    appAmplitudeApiKey: String
    customerAppSentryUrl: String
    termsAndConditions: String
    privacyPolicy: String
    skipMobileVerification: Boolean
    skipEmailVerification: Boolean
    costType: String
    publishableKey: String
    enableCustomerDemoMode: Boolean
    customerDemoZoneId: String
  }

  type Cuisine {
    _id: ID
    name: String
    description: String
    image: String
    shopType: String
  }

  type Tax {
    _id: ID
    taxationCharges: Float
    enabled: Boolean
  }

  type Tip {
    _id: ID
    tipVariations: [Float]
    enabled: Boolean
  }

  type AuthPayload {
    userId: ID
    token: String
    tokenExpiration: Int
    isActive: Boolean
    name: String
    email: String
    phone: String
    isNewUser: Boolean
  }

  type OTPResult {
    result: Boolean
  }

  type DeactivateResult {
    isActive: Boolean
  }

  type User {
    _id: ID
    name: String
    email: String
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    isActive: Boolean
    isNewUser: Boolean
    notificationToken: String
    addresses: [Address]
  }

  type Address {
    _id: ID
    label: String
    deliveryAddress: String
    details: String
    location: Coordinates
    selected: Boolean
  }

  type Coordinates {
    coordinates: [Float]
  }

  type NearByRestaurants {
    offers: [Offer]
    sections: [Section]
    restaurants: [Restaurant]
  }

  type NearByRestaurantsPreview {
    offers: [Offer]
    sections: [Section]
    restaurants: [RestaurantPreview]
  }

  type Offer {
    _id: ID
    name: String
    tag: String
    restaurants: [String]
  }

  type Section {
    _id: ID
    name: String
    restaurants: [String]
  }

  type RestaurantPreview {
    _id: ID
    name: String
    image: String
    logo: String
    deliveryTime: Int
    minimumOrder: Float
    isAvailable: Boolean
    tax: Float
    shopType: String
    cuisines: [String]
    tags: [String]
    reviewCount: Int
    reviewAverage: Float
    freeDelivery: Boolean
    acceptVouchers: Boolean
    location: Coordinates
    openingTimes: [OpeningTimes]
  }

  type Restaurant {
    _id: ID
    orderId: Int
    orderPrefix: String
    name: String
    image: String
    logo: String
    address: String
    location: Coordinates
    deliveryTime: Int
    minimumOrder: Float
    tax: Float
    reviewCount: Int
    reviewData: ReviewData
    categories: [Category]
    options: [Option]
    addons: [Addon]
    zone: Zone
    rating: Float
    isAvailable: Boolean
    openingTimes: [OpeningTimes]
    phone: String
    restaurantUrl: String
    cuisines: [String]
    stripeDetailsSubmitted: Boolean
    shopType: String
    freeDelivery: Boolean
    acceptVouchers: Boolean
  }

  type ReviewData {
    total: Int
    ratings: Float
    reviews: [Review]
  }

  type Review {
    _id: ID
    order: Order
    rating: Int
    description: String
    createdAt: String
  }

  type Zone {
    _id: ID
    title: String
    tax: Float
  }

  type Category {
    _id: ID
    title: String
    foods: [Food]
  }

  type Food {
    _id: ID
    title: String
    image: String
    description: String
    subCategory: String
    isOutOfStock: Boolean
    variations: [Variation]
  }

  type Variation {
    _id: ID
    title: String
    price: Float
    discounted: Float
    addons: [String]
  }

  type Option {
    _id: ID
    title: String
    description: String
    price: Float
  }

  type Addon {
    _id: ID
    title: String
    description: String
    options: [String]
    quantityMinimum: Int
    quantityMaximum: Int
  }

  type OpeningTimes {
    day: String
    times: [OpenTime]
  }

  type OpenTime {
    startTime: String
    endTime: String
  }

  type Order {
    _id: ID
    orderId: String
    restaurant: Restaurant
    deliveryAddress: Address
    items: [OrderItem]
    user: User
    rider: Rider
    review: Review
    paymentMethod: String
    paymentStatus: String
    paidAmount: Float
    orderAmount: Float
    orderStatus: String
    tipping: Float
    taxationAmount: Float
    orderDate: String
    expectedTime: String
    isPickedUp: Boolean
    deliveryCharges: Float
    discountAmount: Float
    instructions: String
    createdAt: String
    completionTime: String
    preparationTime: String
    acceptedAt: String
    pickedAt: String
    deliveredAt: String
    cancelledAt: String
    assignedAt: String
  }

  type OrderItem {
    _id: ID
    title: String
    food: ID
    description: String
    image: String
    quantity: Int
    variation: Variation
    addons: [Addon]
  }

  type Rider {
    _id: ID
    name: String
    phone: String
  }

  type CouponResult {
    coupon: Coupon
    message: String
    success: Boolean
  }

  type Coupon {
    _id: ID
    discount: Float
    enabled: Boolean
    title: String
    code: String
  }

  input UserInput {
    phone: String
    email: String
    password: String
    name: String
    notificationToken: String
    appleId: String
    emailIsVerified: Boolean
    isPhoneExists: Boolean
  }

  input UpdateUserInput {
    name: String!
    phone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
  }

  input AddressInput {
    label: String
    deliveryAddress: String
    details: String
    coordinates: [Float]
    id: String
    selected: Boolean
  }

  input OrderInput {
    title: String
    food: ID
    description: String
    image: String
    quantity: Int
    variation: VariationInput
    addons: [AddonInput]
  }

  input VariationInput {
    _id: ID
    title: String
    price: Float
    discounted: Float
  }

  input AddonInput {
    _id: ID
    title: String
    description: String
    options: [OptionInput]
    quantityMinimum: Int
    quantityMaximum: Int
  }

  input OptionInput {
    _id: ID
    title: String
    description: String
    price: Float
  }

  input ReviewInput {
    order: String!
    rating: Int!
    description: String
  }
`

module.exports = typeDefs
