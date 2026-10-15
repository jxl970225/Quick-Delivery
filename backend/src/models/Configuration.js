const mongoose = require('mongoose')

const configurationSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    deliveryRate: { type: Number, default: 0 },
    twilioEnabled: { type: Boolean, default: false },
    appAmplitudeApiKey: String,
    customerAppSentryUrl: String,
    termsAndConditions: String,
    privacyPolicy: String,
    skipMobileVerification: { type: Boolean, default: true },
    skipEmailVerification: { type: Boolean, default: true },
    costType: { type: String, default: 'FIXED' },
    publishableKey: String,
    enableCustomerDemoMode: { type: Boolean, default: true },
    customerDemoZoneId: String
  },
  { timestamps: true }
)

module.exports = mongoose.model('Configuration', configurationSchema)
