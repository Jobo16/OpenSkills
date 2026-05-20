# OpenCode 官方 App 调研报告

## 一、OpenCode 是什么

OpenCode 是由 SST (Serverless Stack) 团队开发的开源 AI 编程助手，提供终端 UI (TUI) 和桌面应用两种形态。

- **GitHub 仓库**: [https://github.com/sst/opencode](https://github.com/sst/opencode)
- **GitHub 数据**: 163k stars, 19.2k forks, 13,152 commits, 807 releases
- **主要语言**: TypeScript (65.1%), MDX (31.4%)
- **技术栈**: TypeScript/Bun, Turborepo monorepo, SST 基础设施
- **开源协议**: MIT
- **发布渠道**: npm (`opencode-ai`), Homebrew, Scoop, Chocolatey, Pacman, Nix
- **桌面应用**: macOS (ARM64/Intel), Windows, Linux (.deb, .rpm, .AppImage)

## 二、核心功能和特性

### 2.1 双 Agent 架构

OpenCode 内置两种 Agent:

1. **build Agent**: 默认的全功能开发 Agent，具有完整的文件编辑和命令执行权限
2. **plan Agent**: 只读分析 Agent，默认拒绝编辑操作，执行命令前需要用户确认
3. **general Subagent**: 处理复杂搜索和多步骤任务，可通过 `@general` 在消息中调用

Agent 可通过 `Tab` 键快速切换，每个 Agent 可配置独立的模型、温度、工具集和权限策略。

### 2.2 丰富的内置工具

- **文件操作**: `file.list`, `file.read`, `file.status` -- 文件浏览、读取、状态检查
- **代码搜索**: `find.text`, `find.files`, `find.symbols` -- 文本搜索、文件查找、符号查找
- **会话管理**: 创建、删除、更新、分享、fork、revert、summarize、diff 等
- **Shell 执行**: `session.shell` -- 运行 shell 命令
- **PTY 终端**: 完整的伪终端支持，可创建、连接、更新 PTY 会话
- **LSP 集成**: 语言服务器协议支持，提供代码诊断和符号信息
- **MCP 支持**: Model Context Protocol 服务器连接和管理
- **权限系统**: 细粒度的权限控制 (edit/bash/webfetch/doom_loop/external_directory)
- **代码格式化**: 自动代码格式化集成

### 2.3 会话管理设计

OpenCode 的会话系统非常丰富:

- **Session 完整生命周期**: 创建、更新、删除、分享、fork、revert、unrevert
- **子会话 (Children)**: 支持会话嵌套，可从父会话创建子会话
- **Todo 系统**: 会话级别的任务追踪 (pending/in_progress/completed/cancelled)
- **会话分享**: 支持会话分享和取消分享
- **会话 Diff**: 查看会话中文件变更的 diff
- **会话摘要**: 自动生成会话摘要
- **会话 Compaction**: 自动压缩长会话以节省 token
- **会话状态**: idle/retry/busy 三种状态
- **权限请求**: 会话级别的权限请求和响应机制

### 2.4 事件系统

OpenCode 采用 SSE (Server-Sent Events) 实现实时通信，事件类型包括:

- **会话事件**: `session.created`, `session.updated`, `session.deleted`, `session.status`, `session.idle`, `session.compacted`, `session.diff`, `session.error`
- **消息事件**: `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed`
- **工具事件**: Tool 状态更新 (pending/running/completed/error)
- **文件事件**: `file.edited`, `file.watcher.updated`
- **VCS 事件**: `vcs.branch.updated`
- **权限事件**: `permission.updated`, `permission.replied`
- **LSP 事件**: `lsp.client.diagnostics`, `lsp.updated`
- **PTY 事件**: `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted`
- **安装事件**: `installation.updated`, `installation.update-available`
- **TUI 事件**: `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`

### 2.5 配置系统

OpenCode 提供了高度可配置的系统:

- **Agent 配置**: 模型、温度、top_p、提示词、工具集、权限、最大步数、颜色
- **Provider 配置**: 多 AI 提供商支持 (Anthropic, OpenAI, AWS Bedrock, Google Gemini 等)
- **MCP 配置**: 本地和远程 MCP 服务器连接
- **LSP 配置**: 语言服务器集成
- **Formatter 配置**: 代码格式化工具
- **Keybinds 配置**: 丰富的快捷键自定义
- **TUI 配置**: 滚动速度、滚动加速、diff 渲染样式
- **Command 配置**: 自定义命令模板
- **Watcher 配置**: 文件监视忽略规则
- **Plugin 支持**: 插件系统
- **Snapshot 支持**: 快照功能
- **Share 配置**: 分享行为 (manual/auto/disabled)
- **Autoupdate 配置**: 自动更新策略

## 三、界面设计和交互模式

### 3.1 TUI 界面特点

OpenCode 的 TUI 设计遵循终端应用的最佳实践:

- **键盘优先**: 所有操作都可通过快捷键完成
- **Leader Key 机制**: 支持类似 vim 的 leader key 组合键
- **丰富的快捷键**: 覆盖消息导航、会话管理、模型切换、Agent 切换等
- **Toast 通知**: 信息、成功、警告、错误四种类型的 toast 通知
- **对话框系统**: 帮助、会话列表、主题选择、模型选择等对话框
- **Diff 渲染**: 支持 auto 和 stacked 两种 diff 渲染样式
- **滚动加速**: 可配置的滚动加速功能

### 3.2 消息模型

OpenCode 的消息模型采用 Message + Part 的组合设计:

- **Message**: 包含 UserMessage 和 AssistantMessage，携带元数据 (时间、成本、token 用量等)
- **Part**: 消息的组成部分，支持多种类型:
  - `text`: 文本内容
  - `reasoning`: 推理过程
  - `file`: 文件附件 (支持文件和符号两种来源)
  - `tool`: 工具调用 (包含完整的状态机: pending/running/completed/error)
  - `step-start`/`step-finish`: 步骤标记
  - `snapshot`: 快照
  - `patch`: 补丁
  - `agent`: Agent 调用
  - `retry`: 重试记录
  - `compaction`: 压缩记录
  - `subtask`: 子任务

## 四、技术架构和实现方式

### 4.1 架构模式

- **Monorepo**: 使用 Turborepo 管理多包仓库
- **Client-Server**: 前端 (TUI/Desktop) 通过 HTTP + SSE 与后端通信
- **Event-Driven**: 基于 SSE 的事件驱动架构
- **Agent-Based**: Agent 模式，支持多 Agent 并行和子任务委托

### 4.2 SDK 设计

OpenCode 提供了自动生成的 TypeScript SDK (`@hey-api/openapi-ts`)，基于 OpenAPI 规范:

- **类型安全**: 完整的 TypeScript 类型定义
- **请求/响应类型**: 每个 API 端点都有明确的数据类型
- **错误处理**: 结构化的错误类型 (BadRequest, NotFound, ProviderAuthError 等)
- **SSE 支持**: 内置 SSE 客户端支持

## 五、与当前 my-product 项目的对比分析

### 5.1 项目定位对比

| 维度 | OpenCode | my-product (AI 工具箱) |
|------|----------|----------------------|
| **定位** | 通用 AI 编程助手 | 基于 OpenCode SDK 的桌面应用 |
| **形态** | TUI + Desktop | Tauri Desktop |
| **核心能力** | 代码编辑、搜索、Shell 执行 | Skill 驱动的任务执行 |
| **技术栈** | TypeScript/Bun + Go | Tauri v2 + React + Tailwind |
| **AI 集成** | 内置 AI 引擎 | 通过 OpenCode SDK 调用 |

### 5.2 架构对比

**OpenCode 架构**:
- 完整的 AI 编程助手，包含 AI 引擎、工具系统、权限管理、LSP/MCP 集成
- 事件驱动的实时通信
- 丰富的会话管理 (fork, revert, share, diff, summarize)

**my-product 架构**:
- 作为 OpenCode 的客户端，通过 SDK 调用 OpenCode 服务
- 使用 Tauri sidecar 运行 OpenCode server
- 简化的会话管理 (创建、切换、删除、标题更新)

### 5.3 功能对比

**OpenCode 有但 my-product 缺少的功能**:

1. **Agent 系统**: OpenCode 支持多 Agent (build/plan/general) 和 Agent 切换
2. **权限管理**: OpenCode 有完整的权限请求/响应机制
3. **会话 Fork**: 从特定消息分叉会话
4. **会话 Revert/Unrevert**: 撤销/恢复会话操作
5. **会话 Share**: 会话分享功能
6. **会话 Diff**: 查看文件变更差异
7. **会话 Summarize**: 自动生成会话摘要
8. **会话 Compaction**: 自动压缩长会话
9. **Todo 系统**: 会话级别的任务追踪
10. **PTY 终端**: 内置终端支持
11. **LSP 集成**: 语言服务器支持
12. **MCP 支持**: Model Context Protocol 集成
13. **代码搜索**: find.text, find.files, find.symbols
14. **文件浏览**: 文件列表、文件读取、文件状态
15. **配置管理**: 运行时配置更新
16. **Provider 管理**: 多 AI 提供商切换
17. **Model 管理**: 模型选择和切换
18. **Keybinds 自定义**: 丰富的快捷键配置
19. **Snapshot 支持**: 会话快照
20. **Plugin 系统**: 插件扩展

**my-product 的特色功能**:

1. **Skill 系统**: 基于 Markdown 的 Skill 定义和执行
2. **Tauri Desktop**: 原生桌面应用体验
3. **文件拖放**: 支持文件拖放上传
4. **可视化 Skill 选择器**: 图形化的 Skill 选择界面

### 5.4 设计模式对比

**值得借鉴的 OpenCode 设计模式**:

1. **Event-Reducer 模式**: OpenCode 的事件驱动架构，my-product 已在 `opencode.ts` 注释中提到参考了此模式
2. **Message + Part 消息模型**: 灵活的消息组成部分设计
3. **Tool State Machine**: 工具调用的完整状态管理 (pending/running/completed/error)
4. **Agent 配置**: 可配置的 Agent 系统，支持权限、工具集、模型等
5. **Provider 抽象**: 多 AI 提供商的统一抽象层
6. **MCP 集成**: 标准化的工具扩展协议
7. **Session Fork/Revert**: 非破坏性的会话编辑
8. **Todo 追踪**: 内置的任务管理系统

### 5.5 可以改进的地方

**my-product 可以借鉴的改进方向**:

1. **增强会话管理**: 支持 fork、revert、share、diff、summarize 等高级功能
2. **Agent 系统**: 引入多 Agent 概念，支持不同场景的 Agent 切换
3. **权限管理**: 实现细粒度的权限控制机制
4. **Todo 系统**: 添加任务追踪功能
5. **PTY 集成**: 支持内置终端
6. **LSP/MCP 集成**: 增强代码理解和工具扩展能力
7. **配置管理**: 运行时配置更新界面
8. **Provider/Model 管理**: AI 提供商和模型切换界面
9. **快捷键系统**: 丰富的键盘快捷键支持
10. **Snapshot 支持**: 会话快照和恢复功能

**OpenCode 可以改进的地方**:

1. **Desktop 体验**: 桌面应用目前还是 beta，体验可能不如 TUI
2. **Skill 系统**: 没有 my-product 的 Skill 概念，依赖命令和配置
3. **可视化界面**: TUI 对新手不够友好，需要学习曲线

## 六、关键文件路径

### OpenCode 相关
- GitHub 仓库: [https://github.com/sst/opencode](https://github.com/sst/opencode)
- SDK 类型定义: `src/lib/opencode-sdk/gen/types.gen.ts`
- SDK 客户端: `src/lib/opencode-sdk/gen/sdk.gen.ts`

### my-product 项目
- 项目入口: `src/app.tsx`
- OpenCode 服务封装: `src/lib/opencode.ts`
- 会话管理 Hook: `src/hooks/useSession.ts`
- OpenCode 服务 Hook: `src/hooks/useOpencode.ts`
- SDK 客户端: `src/lib/opencode-sdk/client.ts`
- 会话页面: `src/components/session/SessionPage.tsx`
- 聊天输入: `src/components/session/ChatInput.tsx`
- 侧边栏: `src/components/layout/Sidebar.tsx`

## 七、代码规范和最佳实践

### 7.1 代码风格和规范

#### TypeScript / JavaScript

**Prettier 配置** (`.prettierrc`):
- 无分号 (`"semi": false`)
- 单引号 (`"singleQuote": true`)
- 2 空格缩进 (`"tabWidth": 2`)
- 行宽 100 (`"printWidth": 100`)
- ES5 尾逗号 (`"trailingComma": "es5"`)
- 箭头函数单参数不加括号 (`"arrowParens": "avoid"`)

**ESLint 规则** (`.eslintrc.json`):
- `prefer-const`: 强制使用 const
- `no-var`: 禁止 var
- `eqeqeq`: 强制全等
- `prefer-template`: 强制使用模板字符串
- `no-console`: 警告 console 调用
- `@typescript-eslint/no-explicit-any`: 警告 any 类型
- `@typescript-eslint/no-unused-vars`: 警告未使用变量
- `curly`: 多行代码块必须使用大括号

#### Rust

**rustfmt 配置** (`.rustfmt.toml`):
- 行宽 100 (`max_width = 100`)
- 4 空格缩进 (`tab_spaces = 4`)
- import 按 std/external/crate 分组排序

**Clippy 配置** (`clippy.toml`):
- 认知复杂度阈值 30
- 单函数最大行数 200
- 参数最大数量 10
- 禁止使用 foo/bar/baz/quux 命名

### 7.2 TypeScript 配置和类型定义模式

**tsconfig.json** 严格模式:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

**类型定义模式**:

1. **接口定义在独立文件中** - 如 `/src/types/skill.ts`:
```typescript
export interface SkillInfo {
  name: string
  description: string
  icon?: string
  path: string
}
```

2. **Hook 内定义接口** - 如 `/src/hooks/useSession.ts`:
```typescript
export interface Session {
  id: string
  title?: string
  time?: { created: number; updated?: number }
}
```

3. **接口优先于类型别名** - 项目主要使用 `interface` 而非 `type`

4. **使用 `import type` 导入类型**:
```typescript
import type { Message, Part } from "../../hooks/useSession"
```

### 7.3 错误处理模式

#### TypeScript

**Service 层错误处理** (`/src/lib/opencode.ts`):
```typescript
async createSession(title?: string) {
  const res = await this.client.session.create({ body: { title } })
  if (!res.data) throw new Error("Failed to create session")
  return res.data
}
```

**Hook 层错误处理** (`/src/hooks/useOpencode.ts`):
```typescript
try {
  setLoading(true)
  setError(null)
  // ... 业务逻辑
} catch (err) {
  setError(err instanceof Error ? err.message : String(err))
} finally {
  setLoading(false)
}
```

**事件流错误恢复** (`/src/lib/opencode.ts`):
```typescript
private async listenLoop() {
  while (!this.abortController?.signal.aborted) {
    try {
      const events = await this.client.event.subscribe({...})
      for await (const event of events.stream) { ... }
    } catch (err: any) {
      if (err?.name === "AbortError") return
      console.warn("[opencode] Event stream error, reconnecting...", err)
      await new Promise(r => setTimeout(r, 1000)) // 重连延迟
    }
  }
}
```

**错误拦截器** (`/src/lib/opencode-sdk/error-interceptor.ts`):
- 将各种错误格式统一包装为 `Error` 对象
- 提供有意义的错误描述 (method + url + status)

#### Rust

**Result 模式** (`/src-tauri/src/commands.rs`):
```rust
pub async fn start_server(...) -> Result<ServerInfo, String> {
  // 错误统一转换为 String
  sidecar.start(&config_json).await
}
```

**Mutex 锁错误处理**:
```rust
let config = config.lock().map_err(|e| e.to_string())?;
```

### 7.4 测试策略

项目配置了 **Vitest** (`package.json`):
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

建议添加测试文件到 `src/**/*.test.{ts,tsx}`。

### 7.5 文档规范

**注释风格**:

1. **Rust 使用 `///` 文档注释**:
```rust
/// 启动 OpenCode server
#[tauri::command]
pub async fn start_server(...) { ... }
```

2. **TypeScript 使用行内注释**:
```typescript
// 加载 skills
const loadSkills = useCallback(async () => { ... }, [service])
```

3. **SDK 封装使用 JSDoc 风格**:
```typescript
/**
 * OpenCode SDK 封装 -- 参考官方 app 的 event-reducer 模式
 */
```

### 7.6 Git 工作流

**提交消息格式** (从 git log):
```
refactor(app): 将 commands 迁移为 skills 并优化 UI 交互
refactor(tauri): 隔离opencode sidecar运行环境并重构会话页面
feat(settings): 支持多AI服务商和免费模型配置
feat: initial project setup
```

遵循 Conventional Commits: `type(scope): description`

### 7.7 包管理策略

**使用 Bun**:
- `tauri.conf.json` 中配置 `bun run build` / `bun run dev`
- package.json 有 `reinstall` 脚本: `rm -rf node_modules bun.lock && bun install`

**依赖分类**:
- `dependencies`: 运行时依赖 (React, Tauri API, markdown 渲染)
- `devDependencies`: 构建工具 (Vite, TypeScript, Tailwind CSS, Vitest)

### 7.8 代码组织结构

```
src/
  main.tsx          # 入口点
  app.tsx           # 路由和顶层组件
  index.css         # 全局样式 (Tailwind + 自定义)
  types/            # 共享类型定义
    skill.ts
  hooks/            # React hooks
    useOpencode.ts  # 服务初始化
    useSession.ts   # 会话状态管理
  lib/              # 业务逻辑层
    opencode.ts     # SDK 封装
    opencode-sdk/   # 生成的 SDK 客户端
    tauri.ts        # Tauri IPC 封装
    mock-service.ts # Mock 服务
  components/       # UI 组件
    layout/         # 布局组件
    session/        # 会话相关组件
    chat/           # 聊天消息组件
    progress/       # 进度/工具调用组件

src-tauri/
  src/
    lib.rs          # Tauri 入口
    commands.rs     # IPC 命令
    config.rs       # 配置管理
    sidecar.rs      # Sidecar 进程管理
```

**关键设计模式**:

1. **接口隔离** - `IOpencodeService` 接口定义服务契约，`OpencodeService` 和 `MockOpencodeService` 分别实现
2. **事件驱动** - 通过 SSE 事件流更新 UI 状态
3. **Ref 同步** - 使用 `useRef` 缓存最新状态，避免闭包过期
4. **环境检测** - `isTauri()` 检测运行环境，自动切换 Mock 模式

### 7.9 可借鉴的最佳实践

1. **严格 TypeScript**: `strict: true` + `noUnusedLocals` + `noUnusedParameters`
2. **无分号风格**: Prettier 配置 `semi: false`
3. **接口优先**: 使用 `interface` 而非 `type` 定义对象结构
4. **错误统一**: 前端 `try/catch` + `setError()`，后端 `Result<T, String>`
5. **Mock 优先**: 通过接口抽象实现浏览器 Mock 模式
6. **事件流重连**: 自动重连 + 1 秒延迟
7. **Rust 文档注释**: `///` 用于所有公共 API
