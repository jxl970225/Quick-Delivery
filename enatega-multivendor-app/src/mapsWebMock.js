// Web mock for react-native-maps (native-only module, no web build)
// On web, map surfaces render as an empty placeholder so the rest of the
// app (ordering, checkout, order tracking UI) still works.
import React from 'react'
import { View } from 'react-native'

const MapView = ({ children, style, ...props }) => (
  <View style={style}>{children}</View>
)

export const Marker = ({ children, ...props }) => <View>{children}</View>
export const Polyline = () => null
export const Polygon = () => null
export const Circle = () => null
export const Overlay = () => null
export const UrlTile = () => null
export const Callout = ({ children }) => <View>{children}</View>

export const PROVIDER_DEFAULT = 'default'
export const PROVIDER_GOOGLE = 'google'
export const PROVIDER_APPLE = 'apple'

export const AnimatedRegion = function () {}

export const MapViewAnimated = MapView

export default MapView
