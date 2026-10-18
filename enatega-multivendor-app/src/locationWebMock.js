// Web mock for expo-location.
// The native geolocation permission gate cannot be granted in automated /
// embedded browsers, which blocks the CurrentLocation screen forever on web.
// Provide a default US location (New York) and grant all permissions so the
// app proceeds to the restaurant list.
import { useState } from 'react'

export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6
}

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined'
}

const MOCK_COORDS = {
  latitude: 40.7128,
  longitude: -74.006,
  accuracy: 100,
  altitude: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null
}
const MOCK_LOC = { coords: MOCK_COORDS, timestamp: Date.now() }
const GRANTED = { status: 'granted', granted: true, canAskAgain: true }

export async function getCurrentPositionAsync() {
  return MOCK_LOC
}
export async function getLastKnownPositionAsync() {
  return MOCK_LOC
}
export async function getForegroundPermissionsAsync() {
  return GRANTED
}
export async function requestForegroundPermissionsAsync() {
  return GRANTED
}
export async function getBackgroundPermissionsAsync() {
  return GRANTED
}
export async function requestBackgroundPermissionsAsync() {
  return GRANTED
}
export function watchPositionAsync(options, callback) {
  if (callback) callback(MOCK_LOC)
  return { remove() {}, removeAsync() {} }
}
export async function reverseGeocodeAsync() {
  return [
    {
      name: 'New York',
      city: 'New York',
      region: 'NY',
      country: 'US',
      postalCode: '10001',
      formattedAddress: 'New York, NY, USA'
    }
  ]
}
export async function geocodeAsync() {
  return [{ latitude: 40.7128, longitude: -74.006 }]
}
export function useForegroundPermissions() {
  return [GRANTED, async () => GRANTED]
}

export default {
  Accuracy,
  PermissionStatus,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  getBackgroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  watchPositionAsync,
  reverseGeocodeAsync,
  geocodeAsync,
  useForegroundPermissions
}
