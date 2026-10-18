// Web mock for expo-secure-store.
// The browser has no hardware-backed keystore, so fall back to localStorage
// so the session/token persistence and Apple-name storage keep working on web.
const mem = typeof localStorage !== 'undefined' ? localStorage : null

export const getItemAsync = async (key, _options) => {
  try {
    return mem ? mem.getItem(key) : null
  } catch {
    return null
  }
}

export const setItemAsync = async (key, value, _options) => {
  try {
    if (mem) mem.setItem(key, value)
  } catch {
    // storage full / disabled — non-fatal
  }
}

export const deleteItemAsync = async (key, _options) => {
  try {
    if (mem) mem.removeItem(key)
  } catch {
    // ignore
  }
}

export default { getItemAsync, setItemAsync, deleteItemAsync }
