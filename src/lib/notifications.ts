/**
 * Native "rest is over" notification via the Notifications API.
 *
 * Honest limits: there is no server in this app, so nothing can wake a
 * fully closed/killed app. The notification fires from the page's own
 * timer, which works while the app is open or merely backgrounded (Android
 * Chrome / installed PWA usually keeps it alive for a while), but browsers
 * throttle or suspend background pages — especially iOS Safari, where web
 * notifications only exist for a PWA added to the Home Screen (iOS 16.4+)
 * — so delivery can be late or missing when the phone is locked.
 */
export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied'

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Must be called from a user gesture (e.g. tapping a timer preset). */
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (getNotificationSupport() === 'unsupported') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function showRestOverNotification(vibrate: boolean): Promise<void> {
  if (getNotificationSupport() !== 'granted') return
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: 'Reprenez votre prochaine série.',
    tag: 'rest-timer',
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    ...(vibrate ? { vibrate: [200, 100, 200] } : {}),
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification('Repos terminé 💪', options)
      return
    }
    new Notification('Repos terminé 💪', options)
  } catch {
    // Unsupported constructor (e.g. Android requires the SW path) — nothing else to try.
  }
}
