/**
 * Wraps a dynamic import to handle ChunkLoadError after deployments.
 * If the chunk hash changed (new deploy) and the browser has stale references,
 * this catches the error and reloads the page to fetch fresh assets.
 */
export function retryImport<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch(() => {
    window.location.reload()
    return new Promise(() => {}) // never resolves; page is reloading
  })
}
