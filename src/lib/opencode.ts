/**
 * OpenCode SDK 封装 — 参考官方 app 的 event-reducer 模式
 */
import { createOpencodeClient } from "./opencode-sdk/client.js"

export type OpencodeEvent = {
  type: string
  properties?: any
}

export type EventHandler = (event: OpencodeEvent) => void

export class OpencodeService {
  private client: ReturnType<typeof createOpencodeClient>
  private baseUrl: string
  private authHeader: string
  private abortController: AbortController | null = null
  private eventHandler: EventHandler | null = null

  constructor(baseUrl: string, password: string) {
    this.baseUrl = baseUrl
    this.authHeader = `Basic ${btoa(`opencode:${password}`)}`
    this.client = createOpencodeClient({
      baseUrl,
      headers: {
        Authorization: this.authHeader,
      },
    })
  }

  /// 注册全局事件处理器
  onEvent(handler: EventHandler) {
    this.eventHandler = handler
  }

  /// 创建会话
  async createSession(title?: string) {
    const res = await this.client.session.create({ body: { title } })
    if (!res.data) throw new Error("Failed to create session")
    return res.data
  }

  /// 获取会话列表
  async listSessions() {
    const res = await this.client.session.list()
    return res.data || []
  }

  /// 获取会话消息
  async getMessages(sessionId: string) {
    const res = await this.client.session.messages({
      path: { id: sessionId },
    })
    return res.data || []
  }

  /// 获取可用命令/skills 列表
  async listCommands() {
    const res = await this.client.command.list()
    return res.data || []
  }

  /// 获取 skills 列表
  async listSkills() {
    const res = await fetch(`${this.baseUrl}/skill`, {
      headers: { Authorization: this.authHeader },
    })
    if (!res.ok) return []
    return await res.json()
  }

  /// 发送消息（异步，立即返回）
  async sendPrompt(
    sessionId: string,
    parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mime: string; url: string }
    >,
  ) {
    await this.client.session.promptAsync({
      path: { id: sessionId },
      body: { parts },
    })
  }

  /// 更新会话标题
  async updateSession(sessionId: string, title: string) {
    await this.client.session.update({
      path: { id: sessionId },
      body: { title },
    })
  }

  /// 删除会话
  async deleteSession(sessionId: string) {
    await this.client.session.delete({
      path: { id: sessionId },
    })
  }

  /// 中止当前会话
  async abortSession(sessionId: string) {
    try {
      await (this.client.session as any).abort({
        path: { id: sessionId },
      })
    } catch {
      // ignore
    }
  }

  /// 启动全局事件监听（应在连接建立后调用一次）
  startEventListener() {
    this.abortController?.abort()
    this.abortController = new AbortController()
    this.listenLoop()
  }

  /// 停止事件监听
  stopEventListener() {
    this.abortController?.abort()
    this.abortController = null
  }

  private async listenLoop() {
    while (!this.abortController?.signal.aborted) {
      try {
        const events = await this.client.event.subscribe({
          signal: this.abortController?.signal,
        })

        for await (const event of events.stream) {
          if (this.abortController?.signal.aborted) break
          this.eventHandler?.(event as OpencodeEvent)
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.warn("[opencode] Event stream error, reconnecting...", err)
        // 等待后重连
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }
}
