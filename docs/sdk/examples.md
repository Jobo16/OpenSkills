# 代码示例

## 1. 基础对话

```js
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
  headers: { Authorization: `Basic ${btoa("opencode:password")}` }
})

// 创建会话
const session = await client.session.create()
const sessionId = session.data.id

// 发送消息（同步，等待回复完成）
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "用 Python 写一个快速排序" }]
  }
})

// 获取回复文本
const assistantParts = result.data.parts.filter(p => p.type === "text")
const text = assistantParts.map(p => p.text).join("")
console.log(text)
```

## 2. 流式输出（SSE 实时推送）

```js
const session = await client.session.create()

// 先启动事件监听
const events = await client.event.subscribe()

// 异步发送消息（立即返回）
await client.session.promptAsync({
  path: { id: session.data.id },
  body: {
    parts: [{ type: "text", text: "解释什么是闭包，举个例子" }]
  }
})

// 实时接收输出
let output = ""
for await (const event of events.stream) {
  if (event.type === "message.part.delta") {
    output += event.properties.delta
    process.stdout.write(event.properties.delta)
  }
  if (event.type === "session.idle") {
    console.log("\n--- 回复完成 ---")
    break
  }
  if (event.type === "session.error") {
    console.error("\n错误:", event.properties.error)
    break
  }
}
```

## 3. 带文件的 Prompt

```js
import { pathToFileURL } from "url"

const session = await client.session.create()

const result = await client.session.prompt({
  path: { id: session.data.id },
  body: {
    parts: [
      {
        type: "file",
        mime: "text/plain",
        url: pathToFileURL("/path/to/code.ts").href
      },
      {
        type: "text",
        text: "为这个文件的每个公开函数写单元测试，使用 vitest"
      }
    ]
  }
})
```

## 4. 结构化输出（JSON Schema）

```js
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "分析 Node.js 和 Deno 的核心区别" }],
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          comparison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                feature: { type: "string", description: "对比维度" },
                nodejs: { type: "string", description: "Node.js 的表现" },
                deno: { type: "string", description: "Deno 的表现" }
              },
              required: ["feature", "nodejs", "deno"]
            }
          },
          summary: { type: "string", description: "总结" }
        },
        required: ["comparison", "summary"]
      }
    }
  }
})

console.log(result.data.info.structured_output)
// { comparison: [...], summary: "..." }
```

## 5. 批量处理多个文件

```js
import { pathToFileURL } from "url"

const files = ["src/a.ts", "src/b.ts", "src/c.ts"]

// 并行处理
await Promise.all(
  files.map(async (file) => {
    const session = await client.session.create()
    await client.session.promptAsync({
      path: { id: session.data.id },
      body: {
        parts: [
          { type: "file", mime: "text/plain", url: pathToFileURL(file).href },
          { type: "text", text: `审查 ${file} 的代码质量，列出问题和建议` }
        ]
      }
    })
  })
)
```

## 6. 注入系统上下文

```js
const session = await client.session.create()

// 先注入角色设定（不触发 AI 回复）
await client.session.prompt({
  path: { id: session.data.id },
  body: {
    noReply: true,
    parts: [
      { type: "text", text: "你是一个资深的 TypeScript 专家，所有回复使用中文" }
    ]
  }
})

// 再正常提问
await client.session.prompt({
  path: { id: session.data.id },
  body: {
    parts: [{ type: "text", text: "这个类型定义有什么问题？\n\ninterface User {\n  name: string\n  age: string\n}" }]
  }
})
```

## 7. 搜索文件和内容

```js
// 正则搜索文本
const textResults = await client.find.text({
  query: { pattern: "TODO|FIXME|HACK" }
})
for (const match of textResults.data) {
  console.log(`${match.path.text}:${match.line_number} ${match.lines.text}`)
}

// 搜索文件
const tsFiles = await client.find.files({
  query: { query: "*.ts", dirs: "false" }
})

// 搜索符号
const symbols = await client.find.symbols({
  query: { query: "OpencodeService" }
})

// 读取文件
const content = await client.file.read({
  query: { path: "src/index.ts" }
})
console.log(content.data.content)
```

## 8. 会话管理

```js
// 列出所有会话
const sessions = await client.session.list()
for (const s of sessions.data) {
  console.log(`${s.id} - ${s.title} (${new Date(s.time.created).toLocaleString()})`)
}

// 获取会话消息
const messages = await client.session.messages({
  path: { id: sessionId },
  query: { limit: 10 }
})

for (const msg of messages.data) {
  const role = msg.info.role === "user" ? "用户" : "AI"
  const textParts = msg.parts.filter(p => p.type === "text")
  console.log(`[${role}] ${textParts.map(p => p.text).join("")}`)
}

// 中止会话
await client.session.abort({ path: { id: sessionId } })

// 删除会话
await client.session.delete({ path: { id: sessionId } })
```

## 9. 权限处理

当 AI 需要执行敏感操作（编辑文件、运行 bash）时，会触发权限请求：

```js
const events = await client.event.subscribe()

await client.session.promptAsync({
  path: { id: sessionId },
  body: { parts: [{ type: "text", text: "修改 src/index.ts" }] }
})

for await (const event of events.stream) {
  if (event.type === "permission.updated") {
    const perm = event.properties
    console.log(`权限请求: ${perm.title} (${perm.type})`)

    // 自动批准
    await client.postSessionIdPermissionsPermissionId({
      path: { id: sessionId, permissionID: perm.id },
      body: { response: "always" }  // "once" | "always" | "reject"
    })
  }
}
```

## 10. 配置管理

```js
// 获取当前配置
const config = await client.config.get()

// 更新模型
await client.config.update({
  body: { model: "anthropic/claude-3-5-sonnet-20241022" }
})

// 查看可用提供商
const providers = await client.config.providers()
for (const p of providers.data.providers) {
  console.log(`${p.id}: ${Object.keys(p.models).length} 个模型`)
}

// 设置 API Key
await client.auth.set({
  path: { id: "anthropic" },
  body: { type: "api", key: "sk-ant-..." }
})
```

## 11. 在 React 中使用

```tsx
import { useEffect, useState, useCallback } from "react"
import { createOpencodeClient } from "@opencode-ai/sdk"

function Chat({ baseUrl, password }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)

  const client = createOpencodeClient({
    baseUrl,
    headers: { Authorization: `Basic ${btoa(`opencode:${password}`)}` }
  })

  useEffect(() => {
    client.session.create().then(({ data }) => {
      setSessionId(data.id)
    })
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId) return
    setLoading(true)

    // 添加用户消息
    setMessages(prev => [...prev, { role: "user", content: input }])
    const userMsg = input
    setInput("")

    // 异步发送
    await client.session.promptAsync({
      path: { id: sessionId },
      body: { parts: [{ type: "text", text: userMsg }] }
    })

    // 添加 AI 消息占位
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    // 监听流式输出
    const events = await client.event.subscribe()
    for await (const event of events.stream) {
      if (event.type === "message.part.delta") {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + event.properties.delta }]
        })
      }
      if (event.type === "session.idle") {
        setLoading(false)
        break
      }
    }
  }, [input, sessionId])

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            <strong>{msg.role === "user" ? "你" : "AI"}</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="input">
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button onClick={sendMessage} disabled={loading}>发送</button>
      </div>
    </div>
  )
}
```

## 12. 错误处理

```js
// 方式 1：返回值模式（默认）
const result = await client.session.get({ path: { id: "invalid" } })
if (result.error) {
  console.error("错误:", result.error)
  // result.error 可能是: BadRequestError, NotFoundError 等
}

// 方式 2：异常模式
try {
  const result = await client.session.get({
    path: { id: "invalid" },
    throwOnError: true
  })
} catch (error) {
  console.error(error.message)  // 可读的错误信息
  console.error(error.cause)    // { body:原始错误, status:HTTP状态码 }
}

// 方式 3：监听 SSE 错误事件
for await (const event of events.stream) {
  if (event.type === "session.error") {
    const err = event.properties.error
    switch (err.name) {
      case "ProviderAuthError":
        console.error("认证失败:", err.data.message)
        break
      case "APIError":
        console.error(`API 错误 (${err.data.statusCode}):`, err.data.message)
        if (err.data.isRetryable) {
          // 可以重试
        }
        break
      case "MessageAbortedError":
        console.log("消息被中止")
        break
    }
  }
}
```

## 13. 监控工具调用

```js
const events = await client.event.subscribe()

await client.session.promptAsync({
  path: { id: sessionId },
  body: { parts: [{ type: "text", text: "查看当前目录文件" }] }
})

for await (const event of events.stream) {
  if (event.type === "message.part.updated") {
    const part = event.properties.part
    if (part.type === "tool") {
      switch (part.state.status) {
        case "running":
          console.log(`工具调用: ${part.tool}`, part.state.input)
          break
        case "completed":
          console.log(`工具完成: ${part.tool}`, part.state.output.slice(0, 100))
          break
        case "error":
          console.error(`工具错误: ${part.tool}`, part.state.error)
          break
      }
    }
  }
}
```
