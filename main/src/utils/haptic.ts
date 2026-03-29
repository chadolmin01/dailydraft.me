/**
 * Haptic feedback utility — calls navigator.vibrate() on supported devices (mostly Android).
 * Silently no-ops on iOS / desktop / SSR where the API is unavailable.
 */

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export function hapticLight() {
  if (canVibrate) navigator.vibrate(10)
}

export function hapticMedium() {
  if (canVibrate) navigator.vibrate(25)
}

export function hapticSuccess() {
  if (canVibrate) navigator.vibrate([15, 50, 15])
}

export function hapticError() {
  if (canVibrate) navigator.vibrate([30, 40, 30, 40, 30])
}
