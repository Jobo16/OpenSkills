# 开发环境设置指南

本指南将帮助你在不同平台上搭建 OpenSkill 的开发环境。

## 前置要求

### 必需工具

- **Node.js**: 18.0 或更高版本
- **Bun**: 最新版本（用于包管理）
- **Rust**: 1.70 或更高版本
- **Tauri CLI**: 最新版本

### 平台特定要求

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Windows
- Visual Studio Build Tools（包含 C++ 构建工具）
- Windows SDK
- 参考: https://v2.tauri.app/start/prerequisites/#windows

#### Linux (Ubuntu/Debian)
```bash
# 安装系统依赖
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Jobo16/ai-toolbox.git
cd ai-toolbox
```

### 2. 一键设置（推荐）

```bash
bun run setup
```

这个命令会：
- 安装所有 npm 依赖
- 安装 Tauri CLI
- 下载 OpenCode 二进制文件（适用于你的平台）

### 3. 手动设置（如果一键设置失败）

#### 安装依赖

```bash
# 安装 Node.js 依赖
bun install

# 安装 Tauri CLI
cargo install tauri-cli
```

#### 下载 OpenCode 二进制文件

```bash
# 自动检测平台并下载
bash scripts/download-opencode.sh

# 或指定版本
bash scripts/download-opencode.sh v0.1.0
```

### 4. 启动开发服务器

```bash
bun run tauri:dev
```

## 常见问题

### Windows 问题

#### 问题: 构建失败，找不到 OpenCode 二进制文件

**原因**: 二进制文件没有下载

**解决**:
```bash
bun run setup:opencode
```

#### 问题: 构建失败，缺少 Visual Studio Build Tools

**原因**: 缺少 C++ 构建工具

**解决**:
1. 下载 Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. 安装 "C++ 构建工具" 工作负载
3. 重启命令行

#### 问题: 链接错误

**原因**: 缺少 Windows SDK 或构建工具版本不匹配

**解决**:
```bash
# 清理构建缓存
cargo clean

# 重新构建
bun run tauri:build
```

### macOS 问题

#### 问题: 构建失败，找不到 Xcode

**原因**: 没有安装 Xcode Command Line Tools

**解决**:
```bash
xcode-select --install
```

### Linux 问题

#### 问题: 缺少系统依赖

**解决**:
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## 开发流程

### 启动开发服务器

```bash
bun run tauri:dev
```

这会启动：
- Vite 开发服务器（前端）
- Tauri 开发窗口（桌面应用）

### 构建生产版本

```bash
# 构建当前平台
bun run tauri:build

# 构建特定平台
bun run tauri:build:mac    # macOS
bun run tauri:build:win    # Windows
bun run tauri:build:linux  # Linux
```

### 运行测试

```bash
# 运行所有测试
bun test

# 运行测试并生成覆盖率报告
bun run test:coverage
```

## 项目结构

```
openskill/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/             # React hooks
│   ├── lib/               # 工具库
│   └── types/             # TypeScript 类型
├── src-tauri/             # Rust 后端
│   ├── src/               # Rust 源码
│   ├── binaries/          # OpenCode 二进制文件（下载）
│   ├── resources/         # 资源文件
│   └── icons/             # 应用图标
├── scripts/               # 构建和设置脚本
├── package.json           # npm 配置
├── Cargo.toml             # Rust 配置
└── tauri.conf.json        # Tauri 配置
```

## 故障排除

### 清理构建缓存

```bash
# 清理所有构建产物
bun run clean

# 重新安装依赖
bun run reinstall

# 重新设置
bun run setup
```

### 重置 OpenCode 二进制文件

```bash
# 删除现有的二进制文件
rm -rf src-tauri/binaries/

# 重新下载
bun run setup:opencode
```

### 查看详细日志

```bash
# 启动开发服务器并查看详细日志
RUST_LOG=debug bun run tauri:dev
```

## 获取帮助

如果遇到问题：

1. 检查 [GitHub Issues](https://github.com/Jobo16/ai-toolbox/issues)
2. 创建新的 Issue 并包含：
   - 操作系统和版本
   - 错误信息
   - 已尝试的解决方案

## 相关资源

- [Tauri v2 文档](https://v2.tauri.app/)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)
