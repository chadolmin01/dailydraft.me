'use client'

import { useState, useCallback } from 'react'

export interface GeolocationData {
  lat: number
  lng: number
  address?: string
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options

  const [location, setLocation] = useState<GeolocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(async (): Promise<GeolocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const data: GeolocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setLocation(data)
          setIsLoading(false)
          resolve(data)
        },
        (err) => {
          let message = 'Failed to get location'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Location permission denied'
              break
            case err.POSITION_UNAVAILABLE:
              message = 'Location unavailable'
              break
            case err.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          setError(message)
          setIsLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      )
    })
  }, [enableHighAccuracy, timeout, maximumAge])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
  }, [])

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearLocation,
  }
}
