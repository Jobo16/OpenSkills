# 事件系统

OpenCode SDK 通过 Server-Sent Events (SSE) 实现实时通信。事件流是理解 SDK 的关键——大部分 AI 输出都通过事件推送。

## 订阅事件流

```js
const events = await client.event.subscribe()

for await (const event of events.stream) {
  console.log(event.type, event.properties)
}
```

事件流特性：
- 长连接，持续推送
- 支持 `Last-Event-ID` 头重连
- 断线自动重试（3s 初始，30s 最大退避）
- 可通过 `AbortController` 取消

## 事件总览

### 消息相关

| 事件类型 | 说明 | properties |
|---|---|---|
| `message.updated` | 消息更新（状态、完成等） | `{ info: Message }` |
| `message.removed` | 消息被删除 | `{ sessionID, messageID }` |
| `message.part.updated` | 消息部分更新 | `{ part: Part, delta?: string }` |
| `message.part.removed` | 消息部分被删除 | `{ sessionID, messageID, partID }` |

### 会话相关

| 事件类型 | 说明 | properties |
|---|---|---|
| `session.created` | 新会话创建 | `{ info: Session }` |
| `session.updated` | 会话更新 | `{ info: Session }` |
| `session.deleted` | 会话删除 | `{ info: Session }` |
| `session.status` | 会话状态变化 | `{ sessionID, status: SessionStatus }` |
| `session.idle` | 会话空闲（回复完成） | `{ sessionID }` |
| `session.compacted` | 会话上下文被压缩 | `{ sessionID }` |
| `session.diff` | 会话产生文件差异 | `{ sessionID, diff: FileDiff[] }` |
| `session.error` | 会话出错 | `{ sessionID, error }` |

### 权限相关

| 事件类型 | 说明 | properties |
|---|---|---|
| `permission.updated` | 权限请求 | `{ id, type, title, ... }` |
| `permission.replied` | 权限已回复 | `{ sessionID, permissionID, response }` |

### 文件相关

| 事件类型 | 说明 | properties |
|---|---|---|
| `file.edited` | 文件被编辑 | `{ file: string }` |
| `file.watcher.updated` | 文件系统变化 | `{ file, event: "add"|"change"|"unlink" }` |

### 其他

| 事件类型 | 说明 | properties |
|---|---|---|
| `todo.updated` | 任务列表更新 | `{ sessionID, todos: Todo[] }` |
| `command.executed` | 命令执行 | `{ name, sessionID, arguments, messageID }` |
| `vcs.branch.updated` | Git 分支变化 | `{ branch?: string }` |
| `installation.updated` | 安装更新 | `{ version }` |
| `installation.update-available` | 有新版本 | `{ version }` |
| `lsp.client.diagnostics` | LSP 诊断 | `{ serverID, path }` |
| `lsp.updated` | LSP 状态更新 | `{ ... }` |
| `pty.created` / `pty.updated` / `pty.exited` / `pty.deleted` | 伪终端事件 | 各有 `info: Pty` |
| `server.connected` | 服务连接 | `{ ... }` |
| `server.instance.disposed` | 实例销毁 | `{ directory }` |

### TUI 事件

| 事件类型 | 说明 | properties |
|---|---|---|
| `tui.prompt.append` | 提示追加 | `{ text }` |
| `tui.command.execute` | TUI 命令执行 | `{ command: string }` |
| `tui.toast.show` | Toast 通知 | `{ title?, message, variant, duration? }` |

## SessionStatus（会话状态）

```ts
type SessionStatus =
  | { type: "idle" }                        // 空闲
  | { type: "busy" }                        // 忙碌（AI 正在处理）
  | { type: "retry"; attempt: number; message: string; next: number }  // 重试中
```

## 核心使用模式：流式输出

这是最常见的事件消费模式——监听 AI 的流式文本输出：

```js
// 1. 启动事件监听
const events = await client.event.subscribe()

// 2. 异步发送消息（不阻塞）
await client.session.promptAsync({
  path: { id: sessionId },
  body: { parts: [{ type: "text", text: "解释闭包" }] }
})

// 3. 收集流式输出
let output = ""
for await (const event of events.stream) {
  switch (event.type) {
    case "message.part.delta":
      // 增量文本，每次推送一小段
      output += event.properties.delta
      break
    case "session.idle":
      // AI 回复完成
      console.log("完成:", output)
      break
    case "session.error":
      // 出错
      console.error("错误:", event.properties.error)
      break
  }
}
```

## 事件数据流图

```
用户发送 prompt
    │
    ▼
session.status → { type: "busy" }
    │
    ▼ (AI 开始处理)
message.part.updated → { part: { type: "text", text: "" } }
    │
    ▼ (流式输出)
message.part.delta → { delta: "你" }
message.part.delta → { delta: "好" }
message.part.delta → { delta: "，" }
message.part.delta → { delta: "闭包" }
...
    │
    ▼ (工具调用，如果有)
message.part.updated → { part: { type: "tool", tool: "bash", state: { status: "running" } } }
message.part.updated → { part: { type: "tool", state: { status: "completed" } } }
    │
    ▼ (继续输出)
message.part.delta → { delta: "闭包是..." }
...
    │
    ▼
message.updated → { info: { role: "assistant", cost: 0.001, tokens: {...} } }
session.status → { type: "idle" }
session.idle → { sessionID: "..." }
```

## 在 my-product 中的事件处理

本项目通过 `OpencodeService` 封装事件监听，支持自动重连：

```typescript
// src/lib/opencode.ts
class OpencodeService {
  private abortController: AbortController | null = null

  startEventListener() {
    this.abortController?.abort()
    this.abortController = new AbortController()
    this.listenLoop()
  }

  private async listenLoop() {
    while (!this.abortController?.signal.aborted) {
      try {
        const events = await this.client.event.subscribe({
          signal: this.abortController?.signal,
        })
        for await (const event of events.stream) {
          if (this.abortController?.signal.aborted) break
          this.eventHandler?.(event)  // 转发给 React 组件
        }
      } catch (err) {
        if (err?.name === "AbortError") return
        // 断线重连（1 秒延迟）
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }
}
```

React 组件通过 `useOpencode()` hook 获取 service，注册事件处理器：

```tsx
const { service } = useOpencode()

useEffect(() => {
  service.onEvent((event) => {
    if (event.type === "message.part.delta") {
      setOutput(prev => prev + event.properties.delta)
    }
  })
  service.startEventListener()
  return () => service.stopEventListener()
}, [service])
```
