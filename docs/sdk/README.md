# OpenCode SDK 文档

## 概述

OpenCode SDK 是一个类型安全的 JavaScript/TypeScript 客户端，用于与 OpenCode Server 通信。SDK 通过 `@hey-api/openapi-ts` 从 OpenAPI 规范自动生成，所有类型定义来自服务端。

## 架构

```
你的应用 (React / Node.js / 任意 JS 环境)
    │
    ├── createOpencodeClient()  ─── 客户端工厂函数
    │       │
    │       ├── HTTP 请求 ──────→ OpenCode Server (localhost:动态端口)
    │       │                       │
    │       │                       ├── 调用 LLM API (DeepSeek/Anthropic/OpenAI)
    │       │                       ├── 管理会话、消息、工具调用
    │       │                       └── 执行 Skills
    │       │
    │       └── SSE 事件流 ←─────  实时推送 (message.delta, session.status 等)
    │
    └── 安装方式
            ├── npm: @opencode-ai/sdk
            ├── 源码: src/lib/opencode-sdk/ (本项目内嵌)
            └── GitHub: packages/sdk/js/ (opencode 仓库)
```

## 两种使用模式

### 模式 1：完整模式（Server + Client）

SDK 内部启动 OpenCode Server 进程，适合独立应用或测试：

```js
import { createOpencode } from "@opencode-ai/sdk"

const { client, server } = await createOpencode({
  hostname: "127.0.0.1",
  port: 4096,
  config: { model: "anthropic/claude-3-5-sonnet-20241022" }
})

// client 可以直接使用
const session = await client.session.create()

// 用完关闭
server.close()
```

`createOpencodeServer()` 选项：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `hostname` | `string` | `127.0.0.1` | 监听地址 |
| `port` | `number` | `4096` | 监听端口 |
| `signal` | `AbortSignal` | `undefined` | 取消信号 |
| `timeout` | `number` | `5000` | 启动超时（ms） |
| `config` | `Config` | `{}` | OpenCode 配置（覆盖 opencode.json） |

### 模式 2：客户端模式（仅 Client）

连接到已运行的 OpenCode Server：

```js
import { createOpencodeClient } from "@opencode-ai/sdk"

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
  headers: {
    Authorization: `Basic ${btoa("opencode:<password>")}`
  }
})
```

`createOpencodeClient()` 选项：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `baseUrl` | `string` | `http://localhost:4096` | Server URL |
| `fetch` | `function` | `globalThis.fetch` | 自定义 fetch |
| `directory` | `string` | - | 工作目录（影响 `x-opencode-directory` header） |
| `headers` | `object` | - | 自定义请求头 |

> **本项目 (my-product) 使用模式 2**：Rust 后端管理 OpenCode Server 进程，前端只创建客户端连接。

## 认证

所有请求需要 Basic 认证：

```
Authorization: Basic base64("opencode:<password>")
```

在 my-product 中，密码由 Rust 后端生成随机 UUIDv4，通过 `getServerInfo()` 返回给前端。

## 目录

- [快速开始](./getting-started.md) — 安装、基础用法、项目集成
- [数据类型](./types.md) — Session、Message、Part、Event 等核心类型
- [API 参考](./api-reference.md) — 所有 API 方法和参数
- [事件系统](./events.md) — SSE 事件流详解
- [代码示例](./examples.md) — 实际使用场景

## 参考资源

- [官方文档](https://opencode.ai/docs/sdk/)
- [npm 包](https://www.npmjs.com/package/@opencode-ai/sdk)
- [OpenAPI Spec](https://opencode.ai/openapi.json) — 完整 API 定义
- 源码：`packages/sdk/js/`（opencode 仓库）
- 本项目内嵌：`src/lib/opencode-sdk/`
