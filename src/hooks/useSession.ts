import { useState, useCallback, useEffect, useRef } from "react"
import { useOpencode } from "./useOpencode"

const SKIP_PART_TYPES = new Set(["step-start", "step-finish", "patch", "snapshot"])

export interface Session {
  id: string
  title?: string
  slug?: string
  time?: { created: number; updated?: number; archived?: number }
  version?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  sessionID: string
  time?: { created: number; completed?: number }
}

export interface Part {
  id: string
  messageID: string
  sessionID: string
  type: "text" | "reasoning" | "tool" | "step-start" | "step-finish" | string
  text?: string
  tool?: string
  state?: { status: string; input?: any; output?: any }
}

export function useSession() {
  const { service, loading: serviceLoading, error: serviceError, isMock } = useOpencode()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [parts, setParts] = useState<Record<string, Part[]>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const messagesRef = useRef<Message[]>([])
  const partsRef = useRef<Record<string, Part[]>>({})
  const sessionsRef = useRef<Session[]>([])

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    if (!service) return
    try {
      const list = await service.listSessions()
      setSessions(list as Session[])
    } catch (err) {
      console.warn("Failed to load sessions:", err)
    }
  }, [service])

  // 加载指定会话的消息
  const loadMessages = useCallback(async (sid: string) => {
    if (!service) return
    try {
      const raw = await service.getMessages(sid) as any[]

      // API 返回 {info: Message, parts: Part[]}[] 格式
      const messageList: Message[] = []
      const partsMap: Record<string, Part[]> = {}

      for (const item of raw) {
        const msg = item.info ?? item
        messageList.push(msg)
        if (item.parts) {
          partsMap[msg.id] = item.parts.filter(
            (p: any) => !SKIP_PART_TYPES.has(p.type)
          )
        }
      }

      setMessages(messageList)
      setParts(partsMap)
    } catch (err) {
      console.warn("Failed to load messages:", err)
    }
  }, [service])

  // 同步 refs
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { partsRef.current = parts }, [parts])
  useEffect(() => { sessionsRef.current = sessions }, [sessions])

  // 查找空会话（没有消息的会话）
  const findEmptySession = useCallback(async (): Promise<Session | null> => {
    if (!service || sessionsRef.current.length === 0) return null
    const sorted = [...sessionsRef.current].sort((a, b) => {
      const ta = a.time?.updated || a.time?.created || 0
      const tb = b.time?.updated || b.time?.created || 0
      return tb - ta
    })
    for (const session of sorted) {
      try {
        const msgs = await service.getMessages(session.id)
        if (msgs.length === 0) return session
      } catch {
        // ignore
      }
    }
    return null
  }, [service])

  // 更新会话标题
  const updateSessionTitle = useCallback(async (sid: string, title: string) => {
    if (!service) return
    try {
      await service.updateSession(sid, title)
      setSessions(prev =>
        prev.map(s => (s.id === sid ? { ...s, title } : s))
      )
    } catch (err) {
      console.warn("Failed to update session title:", err)
    }
  }, [service])

  // 自动生成会话标题（取用户首条消息的前 30 字符）
  const autoGenerateTitle = useCallback((sid: string) => {
    const session = sessionsRef.current.find(s => s.id === sid)
    if (!session || (session.title && session.title !== "新会话")) return

    const userMsg = messagesRef.current.find(m => m.sessionID === sid && m.role === "user")
    if (!userMsg) return

    const userParts = partsRef.current[userMsg.id]
    const textPart = userParts?.find(p => p.type === "text" && p.text)
    if (!textPart?.text) return

    const title = textPart.text.slice(0, 30) + (textPart.text.length > 30 ? "..." : "")
    updateSessionTitle(sid, title)
  }, [updateSessionTitle])

  // 注册事件处理器
  useEffect(() => {
    if (!service) return

    service.onEvent((event) => {
      const props = event.properties as any
      if (!props) return

      switch (event.type) {
        case "session.updated": {
          const info = props.info as Session
          if (!info) break
          setSessions(prev =>
            prev.map(s => (s.id === info.id ? { ...s, ...info } : s))
          )
          break
        }

        case "message.updated": {
          const info = props.info as Message
          if (!info) break
          if (info.sessionID !== sessionIdRef.current) break
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === info.id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = { ...next[idx], ...info }
              return next
            }
            return [...prev, info]
          })
          break
        }

        case "message.part.updated": {
          const part = props.part as Part
          if (!part) break
          if (part.sessionID !== sessionIdRef.current) break
          if (SKIP_PART_TYPES.has(part.type)) break
          setParts(prev => {
            const list = prev[part.messageID] || []
            const idx = list.findIndex(p => p.id === part.id)
            if (idx >= 0) {
              const next = [...list]
              next[idx] = { ...next[idx], ...part }
              return { ...prev, [part.messageID]: next }
            }
            return { ...prev, [part.messageID]: [...list, part] }
          })
          break
        }

        case "message.part.delta": {
          const { sessionID, messageID, partID, field, delta } = props
          if (sessionID !== sessionIdRef.current) break
          if (field !== "text" || !delta) break
          setParts(prev => {
            const list = prev[messageID]
            if (!list) return prev
            const idx = list.findIndex(p => p.id === partID)
            if (idx < 0) return prev
            const part = list[idx]
            const next = [...list]
            next[idx] = { ...part, text: (part.text || "") + delta }
            return { ...prev, [messageID]: next }
          })
          break
        }

        case "session.status": {
          const status = props.status
          if (status?.type === "idle" && props.sessionID === sessionIdRef.current) {
            setIsProcessing(false)
          }
          break
        }

        case "session.idle": {
          if (props.sessionID === sessionIdRef.current) {
            setIsProcessing(false)
            // 自动生成会话标题
            autoGenerateTitle(props.sessionID)
          }
          break
        }

        case "session.deleted": {
          const deletedId = props.sessionID || props.info?.id
          if (!deletedId) break
          setSessions(prev => prev.filter(s => s.id !== deletedId))
          // 如果删除的是当前会话，清空
          if (deletedId === sessionIdRef.current) {
            setSessionId(null)
            sessionIdRef.current = null
            setMessages([])
            setParts({})
          }
          break
        }
      }
    })

    // 初始加载会话列表
    loadSessions()
  }, [service, loadSessions])

  // 切换到指定会话
  const switchSession = useCallback(async (sid: string) => {
    setSessionId(sid)
    sessionIdRef.current = sid
    setMessages([])
    setParts({})
    await loadMessages(sid)
  }, [loadMessages])

  // 创建新会话
  const createSession = useCallback(async (title?: string) => {
    if (!service) throw new Error("Service not ready")
    const session = await service.createSession(title)
    if (!session) throw new Error("Failed to create session")
    setSessionId(session.id)
    sessionIdRef.current = session.id
    setMessages([])
    setParts({})
    // 刷新会话列表
    await loadSessions()
    return session
  }, [service, loadSessions])

  // 发送消息
  const sendMessage = useCallback(async (
    parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mime: string; url: string }
    >,
  ) => {
    if (!service) throw new Error("Service not ready")

    let sid = sessionIdRef.current
    if (!sid) {
      const session = await createSession()
      sid = session.id
    }

    setIsProcessing(true)

    try {
      await service.sendPrompt(sid, parts)
    } catch (err) {
      setIsProcessing(false)
      throw err
    }
  }, [service, createSession])

  // 停止处理
  const stopProcessing = useCallback(async () => {
    const sid = sessionIdRef.current
    if (sid && service) {
      await service.abortSession(sid)
    }
    setIsProcessing(false)
  }, [service])

  // 删除会话
  const deleteSession = useCallback(async (sid: string) => {
    if (!service) return
    try {
      await service.deleteSession(sid)
      // 乐观移除
      setSessions(prev => prev.filter(s => s.id !== sid))
      if (sid === sessionIdRef.current) {
        setSessionId(null)
        sessionIdRef.current = null
        setMessages([])
        setParts({})
      }
    } catch (err) {
      console.warn("Failed to delete session:", err)
    }
  }, [service])

  // 当前会话的消息
  const currentMessages = sessionIdRef.current
    ? messages.filter(m => m.sessionID === sessionIdRef.current)
    : []

  return {
    sessions,
    sessionId,
    messages: currentMessages,
    parts,
    isProcessing,
    loading: serviceLoading,
    error: serviceError,
    isMock,
    loadSessions,
    createSession,
    switchSession,
    sendMessage,
    stopProcessing,
    findEmptySession,
    updateSessionTitle,
    deleteSession,
  }
}
