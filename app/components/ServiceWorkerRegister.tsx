'use client'

import { useEffect } from 'react'

const SERVICE_WORKER_PATH = '/sw.js'
const SERVICE_WORKER_SCOPE = '/'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    if (!('serviceWorker' in navigator)) {
      return
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: SERVICE_WORKER_SCOPE,
        })
      } catch (error) {
        console.error('Service worker registration failed', error)
      }
    }

    register()
  }, [])

  return null
}
