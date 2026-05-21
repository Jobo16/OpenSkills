# API 参考

所有 API 由 `OpencodeClient` 类暴露，按命名空间组织。每个方法对应一个 HTTP 端点。

## 通用说明

### 请求格式

所有方法遵循统一格式：

```js
await client.{namespace}.{method}({
  path: { id: "..." },    // 路径参数
  query: { key: value },  // 查询参数
  body: { ... }           // 请求体
})
```

### 返回值

所有方法返回 `{ data, error }` 元组：

```js
const result = await client.session.get({ path: { id: "xxx" } })
if (result.error) {
  console.error(result.error)
} else {
  console.log(result.data)
}
```

设置 `throwOnError: true` 可改为抛异常：

```js
try {
  const result = await client.session.get({
    path: { id: "xxx" },
    throwOnError: true
  })
} catch (error) {
  // error 是包装过的 Error 对象
}
```

### 目录参数

大部分 API 支持 `directory` 查询参数，用于指定工作目录。SDK 会自动将 `directory` 配置转换为 `x-opencode-directory` 请求头。

---

## global（全局）

### global.event()

获取全局事件流（包含所有目录的事件）。

```js
const events = await client.global.event()
for await (const event of events.stream) {
  // event: { directory: string, payload: Event }
}
```

### global.health()

检查服务器健康状态。

```js
const health = await client.global.health()
// { healthy: true, version: "1.15.6" }
```

### global.config.get()

获取全局配置。

### global.config.update()

更新全局配置。

### global.dispose()

销毁所有实例，释放资源。

### global.upgrade()

升级 OpenCode 到指定版本。

```js
await client.global.upgrade({ body: { target: "1.15.6" } })
```

---

## session（会话管理）

这是最核心的 API 命名空间。

### session.list()

列出所有会话。

```
GET /session
```

```js
const sessions = await client.session.list()
// data: Session[]
```

### session.create()

创建新会话。

```
POST /session
```

```js
const session = await client.session.create({
  body: {
    title: "我的会话",      // 可选
    parentID: "parent-id"   // 可选，创建子会话
  }
})
// data: Session
```

### session.get()

获取单个会话。

```
GET /session/{id}
```

```js
const session = await client.session.get({
  path: { id: "session-id" }
})
// data: Session
```

### session.delete()

删除会话及其所有数据。

```
DELETE /session/{id}
```

```js
await client.session.delete({ path: { id: "session-id" } })
// data: boolean
```

### session.update()

更新会话属性。

```
PATCH /session/{id}
```

```js
await client.session.update({
  path: { id: "session-id" },
  body: { title: "新标题" }
})
// data: Session
```

### session.status()

获取所有会话的状态。

```
GET /session/status
```

```js
const status = await client.session.status()
// data: { [sessionID]: SessionStatus }
```

### session.messages()

获取会话的所有消息。

```
GET /session/{id}/message
```

```js
const messages = await client.session.messages({
  path: { id: sessionId },
  query: { limit: 50 }  // 可选，限制返回数量
})
// data: Array<{ info: Message, parts: Part[] }>
```

### session.message()

获取单条消息。

```
GET /session/{id}/message/{messageID}
```

```js
const msg = await client.session.message({
  path: { id: sessionId, messageID: messageId }
})
// data: { info: Message, parts: Part[] }
```

### session.prompt()

发送消息并等待 AI 回复（**同步阻塞**，直到回复完成）。

```
POST /session/{id}/message
```

```js
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [
      { type: "text", text: "帮我分析这段代码" }
    ],
    // 可选参数：
    model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" },
    agent: "build",                    // 指定 agent
    noReply: false,                    // true 则不触发 AI 回复
    system: "你是代码助手",            // 系统提示
    tools: { bash: true, edit: false }, // 工具开关
  }
})
// data: { info: AssistantMessage, parts: Part[] }
```

支持文件附件：

```js
await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [
      { type: "file", mime: "text/plain", url: "file:///path/to/file.ts" },
      { type: "text", text: "为这个文件写测试" }
    ]
  }
})
```

支持结构化输出（JSON Schema）：

```js
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "分析公司信息" }],
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          company: { type: "string", description: "公司名称" },
          founded: { type: "number", description: "成立年份" }
        },
        required: ["company", "founded"]
      }
    }
  }
})
// result.data.info.structured_output → { company: "Anthropic", founded: 2021 }
```

使用 `noReply: true` 注入上下文但不触发回复：

```js
await client.session.prompt({
  path: { id: sessionId },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "你是一个 TypeScript 专家，用中文回复" }]
  }
})
```

### session.promptAsync()

发送消息但不等待回复（**异步非阻塞**，立即返回）。通过 SSE 事件获取结果。

```
POST /session/{id}/prompt_async
```

```js
await client.session.promptAsync({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "开始分析" }]
  }
})
// 立即返回（HTTP 204）
```

### session.command()

发送命令。

```
POST /session/{id}/command
```

```js
const result = await client.session.command({
  path: { id: sessionId },
  body: {
    command: "/help",        // 命令名称
    arguments: "",           // 命令参数
    agent: "build",          // 可选
    model: "claude-3-5-sonnet-20241022"  // 可选
  }
})
// data: { info: AssistantMessage, parts: Part[] }
```

### session.shell()

执行 shell 命令。

```
POST /session/{id}/shell
```

```js
const result = await client.session.shell({
  path: { id: sessionId },
  body: {
    command: "ls -la",
    agent: "build",
    model: { providerID: "anthropic", modelID: "claude-3-5-sonnet-20241022" }
  }
})
// data: AssistantMessage
```

### session.abort()

中止正在运行的会话。

```
POST /session/{id}/abort
```

```js
await client.session.abort({ path: { id: sessionId } })
// data: boolean
```

### session.children()

获取子会话列表。

```
GET /session/{id}/children
```

### session.todo()

获取会话的任务列表。

```
GET /session/{id}/todo
```

```js
const todos = await client.session.todo({ path: { id: sessionId } })
// data: Todo[]
```

### session.fork()

在指定消息处 fork 一个新会话。

```
POST /session/{id}/fork
```

### session.init()

分析应用并创建 AGENTS.md 文件。

```
POST /session/{id}/init
```

### session.summarize()

总结会话。

```
POST /session/{id}/summarize
```

### session.share() / session.unshare()

分享或取消分享会话。

```
POST /session/{id}/share
DELETE /session/{id}/share
```

### session.diff()

获取会话的文件差异。

```
GET /session/{id}/diff
```

```js
const diff = await client.session.diff({
  path: { id: sessionId },
  query: { messageID: "msg-id" }  // 可选，指定消息
})
// data: FileDiff[]
```

### session.revert() / session.unrevert()

回滚消息或恢复回滚。

```
POST /session/{id}/revert
POST /session/{id}/unrevert
```

### postSessionIdPermissionsPermissionId()

回复权限请求。

```
POST /session/{id}/permissions/{permissionID}
```

```js
await client.postSessionIdPermissionsPermissionId({
  path: { id: sessionId, permissionID: permId },
  body: { response: "always" }  // "once" | "always" | "reject"
})
```

---

## event（事件流）

### event.subscribe()

订阅项目级 SSE 事件流。

```
GET /event
```

```js
const events = await client.event.subscribe()
for await (const event of events.stream) {
  // event: Event
}
```

详见 [事件系统](./events.md)。

---

## config（配置）

### config.get()

```
GET /config
```

### config.update()

```
PATCH /config
```

### config.providers()

列出所有 AI 提供商和默认模型。

```
GET /config/providers
```

```js
const result = await client.config.providers()
// data: { providers: Provider[], default: { [providerID]: modelID } }
```

---

## provider（AI 提供商）

### provider.list()

```
GET /provider
```

```js
const result = await client.provider.list()
// data: { all: Provider[], default: {...}, connected: string[] }
```

### provider.auth()

获取各提供商的认证方式。

```
GET /provider/auth
```

```js
const result = await client.provider.auth()
// data: { [providerID]: ProviderAuthMethod[] }
// ProviderAuthMethod: { type: "oauth"|"api", label: string }
```

### provider.oauth.authorize()

发起 OAuth 认证。

```
POST /provider/{id}/oauth/authorize
```

### provider.oauth.callback()

处理 OAuth 回调。

```
POST /provider/{id}/oauth/callback
```

---

## auth（认证）

### auth.set()

设置提供商认证凭据。

```
PUT /auth/{id}
```

```js
// API Key 方式
await client.auth.set({
  path: { id: "anthropic" },
  body: { type: "api", key: "sk-ant-..." }
})

// OAuth 方式
await client.auth.set({
  path: { id: "github-copilot" },
  body: { type: "oauth", refresh: "...", access: "...", expires: 1234567890 }
})
```

---

## file（文件操作）

### file.list()

列出文件和目录。

```
GET /file
```

```js
const files = await client.file.list({
  query: { path: "src/" }
})
// data: FileNode[]
// FileNode: { name, path, absolute, type: "file"|"directory", ignored }
```

### file.read()

读取文件内容。

```
GET /file/content
```

```js
const file = await client.file.read({
  query: { path: "src/index.ts" }
})
// data: FileContent
// FileContent: { type: "text"|"binary", content: string, diff?: string, patch?: {...} }
```

### file.status()

获取文件状态（git status）。

```
GET /file/status
```

```js
const files = await client.file.status()
// data: File[]
// File: { path, added: number, removed: number, status: "added"|"deleted"|"modified" }
```

---

## find（搜索）

### find.text()

在文件中搜索文本（基于 ripgrep）。

```
GET /find
```

```js
const results = await client.find.text({
  query: { pattern: "function.*opencode" }
})
// data: Array<{
//   path: { text: string },
//   lines: { text: string },
//   line_number: number,
//   submatches: Array<{ match: { text: string }, start: number, end: number }>
// }>
```

### find.files()

按名称搜索文件。

```
GET /find/file
```

```js
const files = await client.find.files({
  query: { query: "*.ts", dirs: "false" }
})
// data: string[]
```

### find.symbols()

搜索工作区符号（LSP）。

```
GET /find/symbol
```

```js
const symbols = await client.find.symbols({
  query: { query: "MyComponent" }
})
// data: Symbol[]
// Symbol: { name, kind, location: { uri, range } }
```

---

## command（命令）

### command.list()

列出所有可用命令（包括内置和自定义）。

```
GET /command
```

```js
const commands = await client.command.list()
// data: Command[]
// Command: { name, description?, agent?, model?, template, subtask? }
```

---

## tool（工具）

### tool.ids()

列出所有工具 ID（内置 + 动态注册）。

```
GET /experimental/tool/ids
```

### tool.list()

列出工具及其 JSON Schema 参数。

```
GET /experimental/tool
```

```js
const tools = await client.tool.list({
  query: { provider: "anthropic", model: "claude-3-5-sonnet-20241022" }
})
// data: ToolList
// ToolList: Array<{ id, description, parameters: JSON Schema }>
```

---

## app（应用）

### app.log()

写入日志到服务器。

```
POST /log
```

```js
await client.app.log({
  body: {
    service: "my-app",
    level: "info",      // "debug" | "info" | "error" | "warn"
    message: "操作完成",
    extra: { key: "value" }  // 可选
  }
})
```

### app.agents()

列出所有可用 agent。

```
GET /agent
```

```js
const agents = await client.app.agents()
// data: Agent[]
```

---

## project（项目）

### project.list()

```
GET /project
```

### project.current()

```
GET /project/current
```

---

## mcp（Model Context Protocol）

### mcp.status()

获取所有 MCP 服务器状态。

```
GET /mcp
```

```js
const status = await client.mcp.status()
// data: { [name]: McpStatus }
// McpStatus: { status: "connected"|"disabled"|"failed"|"needs_auth"|"needs_client_registration" }
```

### mcp.add()

动态添加 MCP 服务器。

```
POST /mcp
```

```js
// 本地 MCP
await client.mcp.add({
  body: {
    name: "my-server",
    config: {
      type: "local",
      command: ["node", "server.js"],
      environment: { API_KEY: "xxx" },
      enabled: true
    }
  }
})

// 远程 MCP
await client.mcp.add({
  body: {
    name: "remote-server",
    config: {
      type: "remote",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer xxx" }
    }
  }
})
```

### mcp.connect() / mcp.disconnect()

```
POST /mcp/{name}/connect
POST /mcp/{name}/disconnect
```

### mcp.auth.*

MCP OAuth 认证流程：

```
POST /mcp/{name}/auth              → start（返回 authorizationUrl）
POST /mcp/{name}/auth/callback     → callback（传入 code）
POST /mcp/{name}/auth/authenticate → authenticate（打开浏览器）
DELETE /mcp/{name}/auth            → remove（删除凭据）
```

---

## lsp / formatter

### lsp.status()

```
GET /lsp
```

```js
const status = await client.lsp.status()
// data: LspStatus[]
// LspStatus: { id, name, root, status: "connected"|"error" }
```

### formatter.status()

```
GET /formatter
```

```js
const status = await client.formatter.status()
// data: FormatterStatus[]
// FormatterStatus: { name, extensions: string[], enabled: boolean }
```

---

## pty（伪终端）

| 方法 | HTTP | 说明 |
|---|---|---|
| `pty.list()` | `GET /pty` | 列出所有 PTY |
| `pty.create()` | `POST /pty` | 创建 PTY |
| `pty.get()` | `GET /pty/{id}` | 获取 PTY 信息 |
| `pty.update()` | `PUT /pty/{id}` | 更新 PTY（大小等） |
| `pty.remove()` | `DELETE /pty/{id}` | 删除 PTY |
| `pty.connect()` | `GET /pty/{id}/connect` | 连接 PTY（SSE 流） |

---

## tui（终端界面控制）

| 方法 | HTTP | 说明 |
|---|---|---|
| `tui.appendPrompt()` | `POST /tui/append-prompt` | 追加提示文本 |
| `tui.openHelp()` | `POST /tui/open-help` | 打开帮助对话框 |
| `tui.openSessions()` | `POST /tui/open-sessions` | 打开会话选择器 |
| `tui.openThemes()` | `POST /tui/open-themes` | 打开主题选择器 |
| `tui.openModels()` | `POST /tui/open-models` | 打开模型选择器 |
| `tui.submitPrompt()` | `POST /tui/submit-prompt` | 提交当前提示 |
| `tui.clearPrompt()` | `POST /tui/clear-prompt` | 清空提示 |
| `tui.executeCommand()` | `POST /tui/execute-command` | 执行命令 |
| `tui.showToast()` | `POST /tui/show-toast` | 显示 toast 通知 |
| `tui.publish()` | `POST /tui/publish` | 发布 TUI 事件 |
| `tui.control.next()` | `GET /tui/control/next` | 获取下一个 TUI 请求 |
| `tui.control.response()` | `POST /tui/control/response` | 回复 TUI 请求 |

---

## instance

### instance.dispose()

```
POST /instance/dispose
```

销毁当前实例。

---

## path / vcs

### path.get()

```
GET /path
```

```js
const path = await client.path.get()
// data: { state, config, worktree, directory }
```

### vcs.get()

```
GET /vcs
```

```js
const vcs = await client.vcs.get()
// data: { branch: string }
```
