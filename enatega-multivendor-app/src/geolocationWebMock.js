// Web-only mock for browser geolocation.
// Automated / embedded browsers often cannot grant the native geolocation
// permission prompt, which blocks the CurrentLocation gate on web and prevents
// ever reaching the restaurant list. Provide a default US location (New York)
// and grant the permission so the app proceeds past the location step.
if (typeof window !== 'undefined' && !window.__geolocationWebMockInstalled) {
  window.__geolocationWebMockInstalled = true

  const MOCK_POS = {
    coords: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 100,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  }

  // Force-override geolocation so expo-location never hits the browser's
  // native (denied) implementation nor prompts.
  const MOCK_IMPL = {
    getCurrentPosition: (success) => success && success(MOCK_POS),
    watchPosition: (success) => {
      if (success) success(MOCK_POS)
      return 1
    },
    clearWatch: () => {}
  }
  try {
    if (navigator.geolocation) {
      Object.assign(navigator.geolocation, MOCK_IMPL)
    } else {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: MOCK_IMPL
      })
    }
  } catch (e) {
    // best-effort
  }

  // Make expo-location's permission check pass without the native prompt.
  const perms = navigator.permissions
  if (perms && perms.query) {
    const origQuery = perms.query.bind(perms)
    perms.query = (desc) =>
      desc && desc.name === 'geolocation'
        ? Promise.resolve({ state: 'granted' })
        : origQuery(desc)
  }
}
