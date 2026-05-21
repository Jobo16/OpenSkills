# 数据类型

所有类型由 `@hey-api/openapi-ts` 从 OpenAPI 规范自动生成。可直接导入：

```ts
import type { Session, Message, Part, Event } from "@opencode-ai/sdk"
```

## Session（会话）

会话是 AI 对话的容器，包含消息列表和元数据。

```ts
type Session = {
  id: string                    // 唯一标识
  projectID: string             // 所属项目 ID
  directory: string             // 工作目录
  parentID?: string             // 父会话 ID（子任务场景）
  title: string                 // 会话标题
  version: string               // 版本号
  summary?: {                   // 会话摘要（AI 生成）
    additions: number           // 新增行数
    deletions: number           // 删除行数
    files: number               // 影响文件数
    diffs?: Array<FileDiff>     // 文件差异
  }
  share?: { url: string }       // 分享链接
  time: {
    created: number             // 创建时间戳
    updated: number             // 更新时间戳
    compacting?: number         // 压缩时间戳
  }
  revert?: {                    // 回滚信息
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}
```

## Message（消息）

消息分为用户消息和助手消息两种角色：

```ts
type Message = UserMessage | AssistantMessage
```

### UserMessage（用户消息）

```ts
type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: { created: number }
  agent: string                 // 使用的 agent 名称
  model: {                      // 使用的模型
    providerID: string          // 提供商 ID（如 "anthropic"）
    modelID: string             // 模型 ID（如 "claude-3-5-sonnet-20241022"）
  }
  system?: string               // 系统提示
  tools?: { [key: string]: boolean }  // 启用的工具
  summary?: {                   // 摘要（如果有）
    title?: string
    body?: string
    diffs: Array<FileDiff>
  }
}
```

### AssistantMessage（助手消息）

```ts
type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number          // 完成时间
  }
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError
           | MessageAbortedError | ApiError
  parentID: string
  modelID: string
  providerID: string
  mode: string                  // agent 模式
  path: {
    cwd: string                 // 当前工作目录
    root: string                // 项目根目录
  }
  summary?: boolean
  cost: number                  // 调用成本
  tokens: {                     // Token 用量
    input: number
    output: number
    reasoning: number           // 推理 token
    cache: {
      read: number
      write: number
    }
  }
  finish?: string               // 完成原因
}
```

## Part（消息部分）

一条消息可以包含多个 Part，每个 Part 代表不同类型的內容：

```ts
type Part =
  | TextPart          // 文本内容
  | ReasoningPart     // 推理过程
  | FilePart          // 文件附件
  | ToolPart          // 工具调用
  | StepStartPart     // 步骤开始
  | StepFinishPart    // 步骤结束
  | SnapshotPart      // 快照
  | PatchPart         // 补丁
  | AgentPart         // Agent 引用
  | RetryPart         // 重试信息
  | CompactionPart    // 压缩标记
  | { type: "subtask", prompt: string, description: string, agent: string }
```

### TextPart（文本）

```ts
type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string                  // 文本内容
  synthetic?: boolean           // 是否为合成内容
  ignored?: boolean             // 是否被忽略
  time?: { start: number; end?: number }
  metadata?: Record<string, unknown>
}
```

### ToolPart（工具调用）

```ts
type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: "tool"
  callID: string
  tool: string                  // 工具名称
  state: ToolState              // 工具状态（见下）
  metadata?: Record<string, unknown>
}

type ToolState =
  | ToolStatePending
  | ToolStateRunning
  | ToolStateCompleted
  | ToolStateError

type ToolStatePending = {
  status: "pending"
  input: Record<string, unknown>
  raw: string
}

type ToolStateRunning = {
  status: "running"
  input: Record<string, unknown>
  title?: string
  metadata?: Record<string, unknown>
  time: { start: number }
}

type ToolStateCompleted = {
  status: "completed"
  input: Record<string, unknown>
  output: string
  title: string
  metadata: Record<string, unknown>
  time: { start: number; end: number; compacted?: number }
  attachments?: Array<FilePart>
}

type ToolStateError = {
  status: "error"
  input: Record<string, unknown>
  error: string
  metadata?: Record<string, unknown>
  time: { start: number; end: number }
}
```

### ReasoningPart（推理）

```ts
type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"
  text: string                  // 推理文本
  metadata?: Record<string, unknown>
  time: { start: number; end?: number }
}
```

### FilePart（文件）

```ts
type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: "file"
  mime: string                  // MIME 类型
  filename?: string
  url: string                   // 文件 URL
  source?: FilePartSource       // 来源信息
}

type FilePartSource = FileSource | SymbolSource

type FileSource = {
  text: { value: string; start: number; end: number }
  type: "file"
  path: string
}

type SymbolSource = {
  text: { value: string; start: number; end: number }
  type: "symbol"
  path: string
  range: Range
  name: string
  kind: number
}
```

### StepStartPart / StepFinishPart（步骤）

```ts
type StepStartPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-start"
  snapshot?: string
}

type StepFinishPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-finish"
  reason: string
  snapshot?: string
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}
```

## FileDiff（文件差异）

```ts
type FileDiff = {
  file: string          // 文件路径
  before: string        // 变更前内容
  after: string         // 变更后内容
  additions: number     // 新增行数
  deletions: number     // 删除行数
}
```

## Todo（任务列表）

```ts
type Todo = {
  id: string
  content: string       // 任务描述
  status: string        // "pending" | "in_progress" | "completed" | "cancelled"
  priority: string      // "high" | "medium" | "low"
}
```

## Agent（Agent 配置）

```ts
type Agent = {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  builtIn: boolean
  temperature?: number
  topP?: number
  color?: string
  permission: {
    edit: "ask" | "allow" | "deny"
    bash: Record<string, "ask" | "allow" | "deny">
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  model?: { modelID: string; providerID: string }
  prompt?: string
  tools: Record<string, boolean>
  maxSteps?: number
}
```

## Provider（AI 提供商）

```ts
type Provider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: string[]
  key?: string
  options: Record<string, unknown>
  models: Record<string, Model>
}

type Model = {
  id: string
  providerID: string
  api: { id: string; url: string; npm: string }
  name: string
  capabilities: {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
    output: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
  }
  cost: {
    input: number; output: number
    cache: { read: number; write: number }
  }
  limit: { context: number; output: number }
  status: "alpha" | "beta" | "deprecated" | "active"
}
```

## Config（配置）

```ts
type Config = {
  $schema?: string
  theme?: string
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  model?: string               // 格式: "provider/model"
  small_model?: string         // 小模型（标题生成等）
  username?: string
  agent?: Record<string, AgentConfig>
  provider?: Record<string, ProviderConfig>
  mcp?: Record<string, McpLocalConfig | McpRemoteConfig>
  permission?: {
    edit?: "ask" | "allow" | "deny"
    bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">
    webfetch?: "ask" | "allow" | "deny"
  }
  tools?: Record<string, boolean>
  instructions?: string[]
  // ... 更多字段见 OpenAPI Spec
}
```

## 错误类型

```ts
type ProviderAuthError = {
  name: "ProviderAuthError"
  data: { providerID: string; message: string }
}

type ApiError = {
  name: "APIError"
  data: {
    message: string
    statusCode?: number
    isRetryable: boolean
    responseHeaders?: Record<string, string>
    responseBody?: string
  }
}

type MessageAbortedError = {
  name: "MessageAbortedError"
  data: { message: string }
}

type MessageOutputLengthError = {
  name: "MessageOutputLengthError"
  data: Record<string, unknown>
}

type UnknownError = {
  name: "UnknownError"
  data: { message: string }
}

type BadRequestError = {
  name: "BadRequest"
  data: { message: string; kind?: "Params" | "Headers" | "Query" | "Body" | "Payload" }
}

type NotFoundError = {
  name: "NotFoundError"
  data: { message: string }
}
```

## Prompt 输入类型

发送消息时，`parts` 数组支持以下输入类型：

```ts
type TextPartInput = {
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
}

type FilePartInput = {
  type: "file"
  mime: string
  filename?: string
  url: string
}

type AgentPartInput = {
  type: "agent"
  name: string
}

type SubtaskPartInput = {
  type: "subtask"
  prompt: string
  description: string
  agent: string
}
```
