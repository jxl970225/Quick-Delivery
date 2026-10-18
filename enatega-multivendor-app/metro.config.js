const { getDefaultConfig } = require('@expo/metro-config')
const path = require('path')
const defaultConfig = getDefaultConfig(__dirname)
defaultConfig.resolver.sourceExts.push('cjs')
defaultConfig.useWatchman = false

const baseResolveRequest = defaultConfig.resolver.resolveRequest
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // @stripe/stripe-react-native has no web implementation; route web to a mock.
  if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
    return {
      filePath: path.join(__dirname, 'src', 'stripeWebMock.js'),
      type: 'sourceFile'
    }
  }
  if (platform === 'web' && moduleName === 'react-native-pager-view') {
    return {
      filePath: path.join(__dirname, 'src', 'pagerViewWebMock.js'),
      type: 'sourceFile'
    }
  }
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: path.join(__dirname, 'src', 'mapsWebMock.js'),
      type: 'sourceFile'
    }
  }
  if (platform === 'web' && moduleName === 'expo-location') {
    return {
      filePath: path.join(__dirname, 'src', 'locationWebMock.js'),
      type: 'sourceFile'
    }
  }
  if (baseResolveRequest) {
    return baseResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = defaultConfig
