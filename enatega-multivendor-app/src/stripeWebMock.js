// Web mock for @stripe/stripe-react-native
// @stripe/stripe-react-native is a native-only module (no web build).
// This mock lets the web bundle compile and the app render; payment flows
// are stubbed (the project treats payments as a simulation anyway).
import React from 'react'

export const StripeProvider = ({ children }) => <>{children}</>

export const CardField = () => null

export const useStripe = () => ({
  initPaymentSheet: async () => ({}),
  presentPaymentSheet: async () => ({ error: null }),
  confirmPayment: async () => ({ error: null }),
  createPaymentMethod: async () => ({}),
  retrievePaymentMethod: async () => ({}),
  handleNextAction: async () => ({}),
  handleCardAction: async () => ({}),
  confirmSetupIntent: async () => ({}),
  createToken: async () => ({})
})

export const PaymentSheet = {
  present: async () => ({ error: null })
}

export const ApplePayButton = () => null

export default { StripeProvider, CardField, useStripe }
