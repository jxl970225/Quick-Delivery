const User = require('../models/User')
const { signToken, getTokenExpiration, getUserFromContext } = require('../utils/auth')

// 简单内存 OTP（开发用）。生产应接入 Twilio / 邮件服务。
const otpStore = new Map()

function buildAuthPayload(user) {
  return {
    userId: user._id,
    token: signToken(user._id),
    tokenExpiration: getTokenExpiration(),
    isActive: user.isActive,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isNewUser: user.isNewUser
  }
}

const userResolvers = {
  Query: {
    user: async (_, __, context) => {
      const userId = getUserFromContext(context)
      if (!userId) return null
      return User.findById(userId)
    }
  },

  Mutation: {
    login: async (_, args) => {
      const { email, password, type, appleId } = args
      let user = null

      if (type === 'APPLE' && appleId) {
        user = await User.findOne({ appleId })
      } else if (email) {
        user = await User.findOne({ email: email.toLowerCase() }).select('+password')
      }

      if (!user) throw new Error('User not found')
      if (!user.isActive) throw new Error('User is deactivated')

      if (type === 'EMAIL') {
        const ok = await user.matchPassword(password)
        if (!ok) throw new Error('Incorrect password')
      }

      return buildAuthPayload(user)
    },

    createUser: async (_, { userInput }) => {
      const { email, phone, password, name, appleId, notificationToken } = userInput
      let existing = null
      if (email) existing = await User.findOne({ email: email.toLowerCase() })
      else if (phone) existing = await User.findOne({ phone })
      if (existing) throw new Error('User already exists')

      const user = await User.create({
        name: name || (email ? email.split('@')[0] : 'User'),
        email: email ? email.toLowerCase() : undefined,
        phone,
        password,
        appleId,
        notificationToken,
        isNewUser: true
      })

      return buildAuthPayload(user)
    },

    emailExist: async (_, { email }) => {
      const user = await User.findOne({ email: email.toLowerCase() })
      return user
    },

    phoneExist: async (_, { phone }) => {
      const user = await User.findOne({ phone })
      return !!user
    },

    sendOtpToEmail: async (_, { email }) => {
      otpStore.set(email, String(Math.floor(100000 + Math.random() * 900000)))
      // TODO: 生产接入邮件服务发送 OTP
      return { result: true }
    },

    sendOtpToPhoneNumber: async (_, { phone }) => {
      otpStore.set(phone, String(Math.floor(100000 + Math.random() * 900000)))
      // TODO: 生产接入 Twilio 发送 OTP
      return { result: true }
    },

    verifyOtp: async (_, { otp, email, phone }) => {
      const key = email || phone
      const stored = otpStore.get(key)
      // 开发模式：跳过真实校验（前端 skipEmailVerification 默认 true）
      if (!stored || stored === otp) return { result: true }
      return { result: false }
    },

    forgotPassword: async (_, { email }) => {
      const user = await User.findOne({ email: email.toLowerCase() })
      if (user) otpStore.set(email, String(Math.floor(100000 + Math.random() * 900000)))
      return { result: true }
    },

    resetPassword: async (_, { password, email }) => {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
      if (!user) throw new Error('User not found')
      user.password = password
      await user.save()
      return { result: true }
    },

    changePassword: async (_, { oldPassword, newPassword }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId).select('+password')
      if (!user) throw new Error('User not found')
      const ok = await user.matchPassword(oldPassword)
      if (!ok) throw new Error('Old password is incorrect')
      user.password = newPassword
      await user.save()
      return true
    },

    updateUser: async (_, { updateUserInput }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      if (updateUserInput.name !== undefined) user.name = updateUserInput.name
      if (updateUserInput.phone !== undefined) user.phone = updateUserInput.phone
      if (updateUserInput.phoneIsVerified !== undefined) user.phoneIsVerified = updateUserInput.phoneIsVerified
      if (updateUserInput.emailIsVerified !== undefined) user.emailIsVerified = updateUserInput.emailIsVerified
      await user.save()
      return user
    },

    pushToken: async (_, { token }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      user.notificationToken = token
      await user.save()
      return user
    },

    Deactivate: async (_, { isActive, email }) => {
      const user = await User.findOne({ email: email.toLowerCase() })
      if (user) {
        user.isActive = isActive
        await user.save()
      }
      return { isActive }
    },

    createAddress: async (_, { addressInput }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      const address = {
        label: addressInput.label,
        deliveryAddress: addressInput.deliveryAddress,
        details: addressInput.details,
        location: { coordinates: addressInput.coordinates || [0, 0] },
        selected: addressInput.selected || user.addresses.length === 0
      }
      user.addresses.push(address)
      await user.save()
      return user
    },

    editAddress: async (_, { addressInput }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      const idx = user.addresses.findIndex((a) => a._id.toString() === addressInput.id)
      if (idx < 0) throw new Error('Address not found')
      if (addressInput.label !== undefined) user.addresses[idx].label = addressInput.label
      if (addressInput.deliveryAddress !== undefined) user.addresses[idx].deliveryAddress = addressInput.deliveryAddress
      if (addressInput.details !== undefined) user.addresses[idx].details = addressInput.details
      if (addressInput.coordinates !== undefined) user.addresses[idx].location.coordinates = addressInput.coordinates
      await user.save()
      return user
    },

    deleteAddress: async (_, { id }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      user.addresses = user.addresses.filter((a) => a._id.toString() !== id)
      await user.save()
      return user
    },

    selectAddress: async (_, { id }, context) => {
      const userId = getUserFromContext(context)
      const user = await User.findById(userId)
      if (!user) throw new Error('User not found')
      user.addresses.forEach((a) => {
        a.selected = a._id.toString() === id
      })
      await user.save()
      return user
    }
  }
}

module.exports = userResolvers
