import { useState, useEffect, useCallback } from "react"
import { OpencodeService } from "../lib/opencode"
import { MockOpencodeService } from "../lib/mock-service"
import { startServer, getServerInfo, type ServerInfo } from "../lib/tauri"

const isTauri = () => "__TAURI_INTERNALS__" in window

export interface IOpencodeService {
  createSession(title?: string): Promise<{ id: string }>
  listSessions(): Promise<any[]>
  listCommands(): Promise<any[]>
  listSkills(): Promise<any[]>
  getMessages(sessionId: string): Promise<any[]>
  sendPrompt(sessionId: string, parts: Array<{ type: "text"; text: string } | { type: "file"; mime: string; url: string }>): Promise<void>
  abortSession(sessionId: string): Promise<void>
  updateSession(sessionId: string, title: string): Promise<void>
  deleteSession(sessionId: string): Promise<void>
  startEventListener(): void
  stopEventListener(): void
  onEvent(handler: (event: { type: string; properties?: any }) => void): void
}

export function useOpencode() {
  const [service, setService] = useState<IOpencodeService | null>(null)
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)

  const init = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isTauri()) {
        const svc = new MockOpencodeService()
        svc.startEventListener()
        setService(svc)
        setIsMock(true)
        setLoading(false)
        return
      }

      let info: ServerInfo
      try {
        info = await getServerInfo()
      } catch {
        info = await startServer()
      }

      setServerInfo(info)
      const svc = new OpencodeService(info.url, info.password)
      svc.startEventListener()
      setService(svc)
      setIsMock(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    init()
    return () => {
      // 清理时停止事件监听
    }
  }, [init])

  return { service, serverInfo, loading, error, isMock, reconnect: init }
}
