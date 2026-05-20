# AI 工具箱 - 开发规范

## 项目概述

基于 Tauri v2 + React + Tailwind CSS 的桌面应用，通过 OpenCode SDK 集成 AI 能力。

## 技术栈

- **后端**: Rust (Tauri v2)
- **前端**: React 19 + TypeScript + Tailwind CSS v4
- **构建**: Vite + Cargo
- **打包**: Tauri bundler (macOS/Win/Linux)

## 目录结构

```
my-product/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── chat/          # 聊天相关组件
│   │   ├── layout/        # 布局组件
│   │   ├── progress/      # 进度展示
│   │   ├── settings/      # 设置页面
│   │   └── skills/        # Skills 相关组件
│   ├── hooks/             # React hooks
│   ├── lib/               # 工具库
│   │   ├── opencode-sdk/  # OpenCode SDK 客户端
│   │   ├── opencode.ts    # SDK 封装
│   │   └── tauri.ts       # Tauri 命令封装
│   └── types/             # TypeScript 类型定义
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   ├── commands.rs    # Tauri IPC 命令
│   │   ├── config.rs      # 配置管理
│   │   ├── lib.rs         # Tauri 入口
│   │   └── sidecar.rs     # OpenCode sidecar 管理
│   ├── resources/         # 打包资源
│   │   ├── scripts/       # Python 脚本
│   │   └── skills/        # Skills 文件
│   └── Cargo.toml         # Rust 依赖
└── package.json           # Node.js 依赖
```

## Rust 开发规范

### 代码风格

- 使用 `rustfmt` 格式化代码
- 使用 `clippy` 检查代码质量
- 优先使用枚举而非布尔参数
- 避免创建只使用一次的小方法
- 模块不超过 500 行（不含测试）

### 命名约定

- Crate 名称以 `ai-toolbox-` 为前缀
- 使用 `snake_case` 作为变量和函数名
- 使用 `PascalCase` 作为类型和结构体名
- 使用 `SCREAMING_SNAKE_CASE` 作为常量

### 异步处理

- 使用 `async fn` 而非 `#[async_trait]`
- 使用 `impl Future<Output = T> + Send` 作为 trait 方法返回类型
- 避免在 trait 中使用 `#[allow(async_fn_in_trait)]`

### 测试

- 使用 `pretty_assertions::assert_eq` 进行清晰的差异对比
- 优先进行整体对象比较而非逐字段比较
- 避免在测试中修改进程环境

### 错误处理

- 使用 `Result<T, String>` 作为 Tauri 命令返回类型
- 提供清晰的错误信息
- 使用 `map_err(|e| e.to_string())` 转换错误

## React/TypeScript 开发规范

### 代码风格

- 使用 ESLint + Prettier 格式化代码
- 使用 TypeScript 严格模式
- 优先使用函数组件和 hooks
- 使用 `const` 而非 `let`（除非需要重新赋值）

### 组件规范

- 每个组件文件不超过 300 行
- 使用 `PascalCase` 作为组件名
- 使用 `camelCase` 作为函数和变量名
- 将复杂逻辑提取到 hooks 中

### 状态管理

- 使用 React Context 进行全局状态管理
- 使用 `useState` 管理本地状态
- 使用 `useCallback` 和 `useMemo` 优化性能

### 类型定义

- 在 `types/` 目录中定义共享类型
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型和工具类型

## Tauri 开发规范

### IPC 命令

- 使用 `#[tauri::command]` 标记命令函数
- 返回 `Result<T, String>` 类型
- 使用 `State<'_, T>` 访问共享状态
- 命令名使用 `snake_case`

### 配置管理

- 使用 `app_data_dir` 存储配置文件
- 配置文件使用 JSON 格式
- 提供默认配置和验证

### Sidecar 管理

- 使用 `std::process::Command` 启动 sidecar
- 管理进程生命周期（启动、停止、重启）
- 处理进程崩溃和重启

## Skills 开发规范

### 文件格式

- 文件名必须是 `SKILL.md`
- 必须包含 YAML frontmatter（name 和 description）
- 使用 Markdown 编写指令

### 命名规范

- 使用 `kebab-case` 命名 skill
- 名称长度 1-64 字符
- 描述长度 1-1024 字符

### 内容结构

```markdown
---
name: skill-name
description: 简短描述
---

# Skill 名称

## 工作流程
1. 步骤一
2. 步骤二

## 输入格式
描述输入要求

## 输出格式
描述输出格式

## 错误处理
描述错误情况
```

## 开发工作流

### 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 启动 Tauri 开发模式
cargo tauri dev
```

### 代码检查

```bash
# TypeScript 检查
bun run build

# Rust 检查
cargo clippy

# 格式化
cargo fmt
```

### 测试

```bash
# 前端测试
bun test

# Rust 测试
cargo test

# Tauri 测试
cargo test -p ai-toolbox
```

### 构建

```bash
# 构建前端
bun run build

# 构建 Tauri 应用
cargo tauri build

# 构建特定平台
cargo tauri build --target universal-apple-darwin
```

## Git 工作流

### 分支命名

- `main` - 生产分支
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `release/*` - 发布分支

### 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 代码审查

- 所有代码变更需要通过 PR
- PR 需要至少一个审批
- CI 检查必须通过
- 测试必须通过

## 文档要求

### 代码文档

- 公共 API 必须有文档注释
- 复杂算法需要解释
- 配置选项需要说明

### 用户文档

- README.md 包含快速开始
- CHANGELOG.md 记录变更
- CONTRIBUTING.md 说明贡献流程

## 性能优化

### 前端优化

- 使用 React.memo 优化组件
- 使用虚拟滚动处理大列表
- 懒加载非关键组件
- 优化图片和资源

### Rust 优化

- 使用 `Arc<Mutex<T>>` 共享状态
- 避免不必要的克隆
- 使用 `async/await` 处理异步操作
- 优化序列化和反序列化

## 安全考虑

### 输入验证

- 验证所有用户输入
- 使用参数化查询
- 防止路径遍历攻击
- 限制文件大小和类型

### 权限控制

- 最小权限原则
- 安全的 IPC 通信
- 敏感数据加密存储
- 定期更新依赖

## 调试技巧

### 前端调试

- 使用 React DevTools
- 使用浏览器开发者工具
- 添加 console.log 调试

### Rust 调试

- 使用 `println!` 调试
- 使用 `tracing` 进行结构化日志
- 使用 `cargo test` 测试特定功能

### Tauri 调试

- 使用 `cargo tauri dev` 开发模式
- 查看控制台输出
- 检查 IPC 通信

## 常见问题

### 依赖问题

- 清理 `node_modules` 和 `target`
- 更新依赖版本
- 检查兼容性

### 构建问题

- 检查 Rust 工具链
- 验证 Tauri CLI 版本
- 检查系统依赖

### 运行时问题

- 检查日志输出
- 验证配置文件
- 测试 IPC 通信

## 更新日志

- 2026-05-20: 初始版本
