import { useState, useEffect, useCallback, useRef } from "react"
import { checkForUpdates, getUpdateStatus, setMarketplaceUrl } from "../lib/tauri"
import type { SkillUpdate, UpdateStatus } from "../types/skill"

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 小时

export function useUpdates() {
  const [updates, setUpdates] = useState<SkillUpdate[]>([])
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const updateStatus = await getUpdateStatus()
      setStatus(updateStatus)
    } catch (err) {
      console.error("Failed to load update status:", err)
    }
  }, [])

  const checkUpdates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const availableUpdates = await checkForUpdates()
      setUpdates(availableUpdates)
      await loadStatus()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check for updates"
      setError(message)
      console.error("Failed to check for updates:", err)
    } finally {
      setLoading(false)
    }
  }, [loadStatus])

  useEffect(() => {
    loadStatus()
    checkUpdates()

    intervalRef.current = setInterval(checkUpdates, CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loadStatus, checkUpdates])

  const updateMarketplaceUrl = useCallback(async (url: string) => {
    try {
      await setMarketplaceUrl(url)
      await loadStatus()
      await checkUpdates()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update marketplace URL"
      setError(message)
      console.error("Failed to update marketplace URL:", err)
    }
  }, [loadStatus, checkUpdates])

  return {
    updates,
    status,
    loading,
    error,
    checkUpdates,
    updateMarketplaceUrl,
    hasUpdates: updates.length > 0,
  }
}
