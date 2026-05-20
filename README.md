# AI 工具箱

基于 Tauri v2 + React + Tailwind CSS 的桌面应用，通过 OpenCode SDK 集成 AI 能力。

## 特性

- **开箱即用**: 预配置 API key 和 Skills，安装即可使用
- **多 Skill 支持**: 内置多种 Skill，覆盖不同场景
- **文件上传**: 支持拖放上传文件
- **实时进度**: 实时展示 AI 处理进度
- **可扩展**: 易于添加新的 Skill
- **App 级别隔离**: 配置、Skills、数据完全隔离，不影响用户本机环境

## 内置 Skills

| Skill | 描述 |
|-------|------|
| `question-bank-uploader` | 题库上传工具 |
| `code-reviewer` | 代码审查工具 |
| `data-processor` | 数据处理工具 |
| `hello-world` | 简单测试 Skill |

## 快速开始

### 安装

#### macOS
1. 下载 DMG 文件
2. 双击打开，将应用拖入 Applications 文件夹
3. 首次运行可能需要在"系统偏好设置 > 安全性与隐私"中允许

#### Windows
1. 下载 MSI 安装程序
2. 双击运行安装向导

#### Linux
1. 下载 AppImage 或 deb 包
2. 安装并运行

### 使用

1. 启动应用
2. 首次使用需要配置 API key（可选，已有内置免费模型）
3. 点击"导入"按钮导入 Skill（zip 格式）
4. 选择要使用的 Skill
5. 上传文件或输入指令
6. 等待 AI 处理完成

## 开发

### 环境要求

- Node.js 18+
- Bun（包管理器）
- Rust 1.70+
- Tauri CLI

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
cargo tauri dev
```

### 构建应用

```bash
# 构建 Mac 应用
cargo tauri build

# 构建产物位置
# - App: src-tauri/target/release/bundle/macos/AI 工具箱.app
# - DMG: src-tauri/target/release/bundle/dmg/AI 工具箱_1.0.0_aarch64.dmg
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
├── CLAUDE.md               # Claude 开发助手指南
├── CONTRIBUTING.md         # 贡献指南
├── CHANGELOG.md            # 更新日志
└── DEVELOPMENT.md          # 开发环境指南
```

## 配置

### API Key 配置

应用支持两种方式配置 API key：

1. **内置 key**: 应用已内置默认 key，可直接使用
2. **自定义 key**: 在设置页面配置自己的 key

### Skills 配置

Skills 可以通过两种方式添加：

1. **内置 Skills**: 位于 `src-tauri/resources/skills/` 目录，构建时自动打包
2. **用户导入**: 通过应用界面导入 zip 格式的 Skill 包

添加新的内置 Skill：
1. 创建目录 `src-tauri/resources/skills/your-skill/`
2. 创建 `SKILL.md` 文件，包含 YAML frontmatter（name、description）
3. 重新构建应用

## 文档

- [开发规范](AGENTS.md) - 开发规范和最佳实践
- [Claude 指南](CLAUDE.md) - Claude 开发助手指南
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发
- [更新日志](CHANGELOG.md) - 版本更新记录
- [开发环境](DEVELOPMENT.md) - 开发环境搭建指南

## 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

## 许可证

本项目采用 MIT 许可证。

## 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [React](https://react.dev/) - 用户界面库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [OpenCode](https://opencode.ai/) - AI 编码代理
