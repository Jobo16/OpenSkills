# 开发环境搭建指南

本文档将帮助你快速搭建 AI 工具箱的开发环境。

## 前置要求

### 必需工具

- **Node.js**: 18.0 或更高版本
- **Bun**: 最新版本（用于包管理）
- **Rust**: 1.70 或更高版本
- **Tauri CLI**: 最新版本

### 推荐工具

- **VS Code**: 代码编辑器
- **Rust Analyzer**: Rust 语言服务器
- **ESLint**: JavaScript/TypeScript linter
- **Prettier**: 代码格式化工具

## 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd my-product
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
bun install

# 安装 Rust 依赖（自动）
cargo build
```

### 3. 启动开发服务器

```bash
# 启动 Tauri 开发模式
cargo tauri dev
```

## 开发工具

### 常用命令

```bash
# 安装依赖
bun install

# 启动开发服务器
cargo tauri dev

# 构建前端
bun run build

# 构建 Tauri 应用
cargo tauri build

# 代码检查
cargo clippy

# 格式化代码
cargo fmt
```

### npm 脚本

```bash
# 开发
bun run dev

# 构建
bun run build

# 检查
bun run check

# 测试
bun run test

# 格式化
bun run format

# Lint
bun run lint
```

## 项目结构

```
my-product/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── chat/          # 聊天相关
│   │   ├── layout/        # 布局组件
│   │   └── session/       # 会话相关
│   ├── hooks/              # React hooks
│   ├── lib/                # 工具库
│   │   ├── opencode-sdk/  # OpenCode SDK 客户端
│   │   ├── opencode.ts    # SDK 封装
│   │   └── tauri.ts       # Tauri 命令封装
│   └── types/              # 类型定义
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands.rs    # Tauri IPC 命令
│   │   ├── config.rs      # 配置管理
│   │   ├── lib.rs         # Tauri 入口
│   │   └── sidecar.rs     # OpenCode sidecar 管理
│   ├── resources/          # 打包资源
│   │   └── skills/        # 内置 Skills
│   └── Cargo.toml          # Rust 依赖
├── AGENTS.md               # 开发规范
├── CHANGELOG.md            # 更新日志
├── CLAUDE.md               # Claude 开发助手指南
├── CONTRIBUTING.md         # 贡献指南
└── DEVELOPMENT.md          # 本文件
```

## 配置说明

### TypeScript 配置

项目使用 TypeScript 严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Rust 配置

- 使用 `rustfmt` 格式化代码
- 使用 `clippy` 检查代码质量
- 使用 4 空格缩进
- 行宽 100 字符

## 测试

### 前端测试

```bash
# 运行所有测试
bun run test

# 运行测试 UI
bun run test:ui

# 生成覆盖率报告
bun run test:coverage
```

### Rust 测试

```bash
# 运行所有测试
cargo test

# 运行特定测试
cargo test test_name

# 运行集成测试
cargo test --test integration
```

## 代码检查

### TypeScript 检查

```bash
# 类型检查
bun run check

# Lint 检查
bun run lint

# 格式化检查
bun run format:check
```

### Rust 检查

```bash
# Clippy 检查
cargo clippy

# 格式化检查
cargo fmt --check
```

## 构建

### 开发构建

```bash
# 构建前端
bun run build

# 构建 Tauri 应用
cargo tauri build
```

### 构建产物

```bash
# Mac 应用
# - App: src-tauri/target/release/bundle/macos/AI 工具箱.app
# - DMG: src-tauri/target/release/bundle/dmg/AI 工具箱_1.0.0_aarch64.dmg
```

## 调试

### 前端调试

1. 启动开发服务器：`cargo tauri dev`
2. 打开浏览器开发者工具
3. 查看控制台输出
4. 使用 React DevTools

### Rust 调试

1. 使用 `println!` 调试
2. 使用 `tracing` 进行结构化日志
3. 使用 `cargo test` 测试特定功能

### Tauri 调试

1. 使用 `cargo tauri dev` 开发模式
2. 查看控制台输出
3. 检查 IPC 通信
4. 验证 sidecar 进程

## 常见问题

### 依赖问题

```bash
# 清理并重新安装
rm -rf node_modules target
bun install
cargo build
```

### 构建问题

```bash
# 检查 Rust 工具链
rustup update

# 检查 Tauri CLI
cargo install tauri-cli
```

## 文档

- [开发规范](AGENTS.md) - 开发规范和最佳实践
- [Claude 指南](CLAUDE.md) - Claude 开发助手指南
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发
- [更新日志](CHANGELOG.md) - 版本更新记录
