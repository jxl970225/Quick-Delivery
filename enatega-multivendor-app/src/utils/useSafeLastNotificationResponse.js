// Safe wrapper around expo-notifications useLastNotificationResponse.
// The expo-notifications web build throws UnavailabilityError for
// getLastNotificationResponse, which crashes the app on web. On web there
// are no push notifications, so return null and never call the native hook.
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

export const useSafeLastNotificationResponse = () => {
  if (Platform.OS === 'web') return null
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return Notifications.useLastNotificationResponse()
}
