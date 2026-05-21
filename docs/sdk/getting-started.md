# 快速开始

## 安装

```bash
# npm
npm install @opencode-ai/sdk

# bun
bun add @opencode-ai/sdk

# pnpm
pnpm add @opencode-ai/sdk
```

## 基础用法

### 1. 创建客户端

```js
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
  headers: { Authorization: `Basic ${btoa("opencode:your-password")}` }
})
```

### 2. 创建会话

```js
const session = await client.session.create()
// session.data → { id: "abc123", title: "", projectID: "...", ... }
```

### 3. 发送消息

```js
const result = await client.session.prompt({
  path: { id: session.data.id },
  body: {
    parts: [
      { type: "text", text: "你好，帮我写一段快速排序" }
    ]
  }
})
// result.data → { info: AssistantMessage, parts: Part[] }
```

### 4. 接收流式输出（SSE）

```js
const events = await client.event.subscribe()

for await (const event of events.stream) {
  if (event.type === "message.part.delta") {
    process.stdout.write(event.properties.delta)
  }
  if (event.type === "session.idle") {
    break
  }
}
```

### 5. 获取会话消息

```js
const messages = await client.session.messages({
  path: { id: session.data.id }
})
// messages.data → Array<{ info: Message, parts: Part[] }>
```

## 在 my-product 项目中的使用

本项目通过 Rust sidecar 管理 OpenCode Server 进程。前端使用封装好的 `OpencodeService`：

```
┌─────────────────────────────────────────────────────┐
│  React 前端                                          │
│                                                      │
│  useOpencode()                                       │
│    │                                                 │
│    ├── getServerInfo()  ←── Tauri IPC ──→ Rust       │
│    │                                                 │
│    ├── OpencodeService(url, password)                │
│    │     │                                           │
│    │     ├── client.session.create()                 │
│    │     ├── client.session.promptAsync()            │
│    │     ├── client.event.subscribe()  ←── SSE       │
│    │     └── ...                                     │
│    │                                                 │
│    └── MockOpencodeService()  ← 浏览器开发模式       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 启动流程

```
1. Tauri 应用启动
2. Rust 加载 AppConfig（API key、skills 路径等）
3. SidecarManager 启动 opencode serve --port=0（随机端口）
4. 解析 stdout 获取动态 URL
5. 生成随机密码，返回 { url, username, password }
6. 前端创建 SDK 客户端连接
7. 订阅 SSE 事件流
```

### OpencodeService 封装

```typescript
// src/lib/opencode.ts
class OpencodeService {
  private client: OpencodeClient

  constructor(baseUrl: string, password: string) {
    this.client = createOpencodeClient({
      baseUrl,
      headers: { Authorization: `Basic ${btoa(`opencode:${password}`)}` }
    })
  }

  // 全局事件监听（自动重连）
  startEventListener() { ... }

  // 异步发消息（立即返回）
  async sendPrompt(sessionId, parts) {
    await this.client.session.promptAsync({
      path: { id: sessionId },
      body: { parts }
    })
  }
}
```

### 浏览器开发模式

在非 Tauri 环境下（纯浏览器），自动降级到 MockOpencodeService：

```typescript
// src/hooks/useOpencode.ts
if (!window.__TAURI_INTERNALS__) {
  return { service: new MockOpencodeService(), isMock: true }
}
```

## 下一步

- [数据类型](./types.md) — 了解 Session、Message、Part 等核心类型
- [API 参考](./api-reference.md) — 完整的 API 方法列表
- [事件系统](./events.md) — SSE 事件流详解
- [代码示例](./examples.md) — 实际使用场景
