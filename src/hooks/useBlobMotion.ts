import { useSyncExternalStore } from 'react'

const key = 'mermaider-blob-motion'
const event = 'mermaider-appearance-change'
let fallback = true
let volatile = false
export function getBlobMotion(): boolean {
  if (volatile) return fallback
  try { return localStorage.getItem(key) !== 'off' } catch { return fallback }
}
export function setBlobMotion(enabled: boolean) {
  fallback = enabled
  try { localStorage.setItem(key, enabled ? 'on' : 'off'); volatile = false } catch { volatile = true }
  window.dispatchEvent(new Event(event))
}
function subscribe(listener: () => void) {
  window.addEventListener(event, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(event, listener)
    window.removeEventListener('storage', listener)
  }
}
const media = window.matchMedia('(prefers-reduced-motion: reduce)')
function subscribeMotion(listener: () => void) {
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
export function useBlobMotion() {
  const enabled = useSyncExternalStore(subscribe, getBlobMotion)
  const reduced = useSyncExternalStore(subscribeMotion, () => media.matches)
  return enabled && !reduced
}
