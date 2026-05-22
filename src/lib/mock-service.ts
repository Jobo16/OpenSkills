import type { IOpencodeService } from "../hooks/useOpencode"
import type { OpencodeEvent, EventHandler } from "./opencode"

/**
 * Mock OpenCode Service — 浏览器模式下模拟 AI 响应
 */
export class MockOpencodeService implements IOpencodeService {
  private sessionId = 0
  private aborted = false
  private eventHandler: EventHandler | null = null

  onEvent(handler: EventHandler) {
    this.eventHandler = handler
  }

  startEventListener() {
    // mock 模式不需要真正的事件监听
  }

  stopEventListener() {
    // noop
  }

  abortSession(_sessionId: string): Promise<void> {
    this.aborted = true
    return Promise.resolve()
  }

  async updateSession(_sessionId: string, _title: string): Promise<void> {
    // mock 模式下不实际更新
  }

  async deleteSession(_sessionId: string): Promise<void> {
    // mock 模式下不实际删除
  }

  async createSession(_title?: string) {
    this.sessionId++
    const id = `mock-session-${this.sessionId}`
    return { id }
  }

  async listSessions() {
    return []
  }

  async listCommands() {
    return [
      { name: "hello-world", description: "简单测试 skill", template: "你好" },
      { name: "code-review", description: "代码审查工具", template: "审查代码" },
    ]
  }

  async listSkills() {
    return [
      { name: "hello-world", description: "简单测试 skill", location: "/mock/hello-world/SKILL.md", content: "" },
      { name: "code-reviewer", description: "代码审查工具", location: "/mock/code-reviewer/SKILL.md", content: "" },
      { name: "data-processor", description: "数据处理工具", location: "/mock/data-processor/SKILL.md", content: "" },
    ]
  }

  async getMessages(_sessionId: string) {
    return []
  }

  async sendPrompt(
    sessionId: string,
    parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mime: string; url: string }
    >,
  ): Promise<void> {
    this.aborted = false

    const textPart = parts.find(p => p.type === "text")
    const userText = textPart?.type === "text" ? textPart.text : ""

    // 模拟 user message 事件
    const userMsgId = crypto.randomUUID()
    this.emit({
      type: "message.updated",
      properties: {
        info: {
          id: userMsgId,
          role: "user",
          sessionID: sessionId,
          time: { created: Date.now() },
        },
      },
    })

    // 模拟 user text part
    const userPartId = crypto.randomUUID()
    this.emit({
      type: "message.part.updated",
      properties: {
        part: {
          id: userPartId,
          messageID: userMsgId,
          sessionID: sessionId,
          type: "text",
          text: userText,
        },
      },
    })

    // 模拟 session busy
    this.emit({
      type: "session.status",
      properties: { sessionID: sessionId, status: { type: "busy" } },
    })

    // 模拟 assistant message
    const assistantMsgId = crypto.randomUUID()
    this.emit({
      type: "message.updated",
      properties: {
        info: {
          id: assistantMsgId,
          role: "assistant",
          sessionID: sessionId,
          time: { created: Date.now() },
        },
      },
    })

    // 模拟 text part 创建
    const textPartId = crypto.randomUUID()
    this.emit({
      type: "message.part.updated",
      properties: {
        part: {
          id: textPartId,
          messageID: assistantMsgId,
          sessionID: sessionId,
          type: "text",
          text: "",
        },
      },
    })

    // 模拟流式输出
    const response = this.generateResponse(userText)
    for (const word of response) {
      if (this.aborted) break
      await this.delay(50)
      this.emit({
        type: "message.part.delta",
        properties: {
          messageID: assistantMsgId,
          partID: textPartId,
          field: "text",
          delta: word,
        },
      })
    }

    // 模拟 session idle
    this.emit({
      type: "session.status",
      properties: { sessionID: sessionId, status: { type: "idle" } },
    })
    this.emit({
      type: "session.idle",
      properties: { sessionID: sessionId },
    })
  }

  private emit(event: OpencodeEvent) {
    this.eventHandler?.(event)
  }

  private generateResponse(userText: string): string[] {
    const lower = userText.toLowerCase()
    if (lower.includes("你好") || lower.includes("hello") || lower.includes("hi")) {
      return ["你好", "！", " 有什么", "可以", "帮", "你的", "吗", "？"]
    }
    return ["收到", "你的", "消息：", userText, "\n\n", "这是", "Mock", "模式", "的", "响应", "。"]
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
