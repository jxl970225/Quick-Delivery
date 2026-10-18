// Web mock for react-native-pager-view (native-only module, no web build)
import React from 'react'
import { View } from 'react-native'

const PagerView = ({ children, style, ...props }) => (
  <View style={style}>{children}</View>
)

export default PagerView
