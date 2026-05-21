# OpenSkill - Claude 开发助手指南

## 项目背景

这是 OpenSkill - 一个可扩展的 AI Skills 桌面应用，通过 Skills Marketplace 扩展 AI 能力。用户可以通过自然语言指令完成各种任务，如题库上传、代码审查、数据处理等。

## 技术架构

### 前端层 (React)
- **框架**: React 19 + TypeScript
- **样式**: Tailwind CSS v4
- **构建**: Vite
- **状态**: React Context + hooks
- **通信**: Tauri IPC + OpenCode SDK

### 后端层 (Rust/Tauri)
- **框架**: Tauri v2
- **IPC**: Tauri commands
- **配置**: JSON 配置文件（App 级别隔离）
- **Sidecar**: OpenCode server 进程

### AI 层 (OpenCode)
- **SDK**: OpenCode SDK (client only)
- **协议**: HTTP + SSE
- **Skills**: Markdown 指令文件

## 核心流程

### 启动流程
1. Tauri 应用启动
2. 读取配置文件（API key、skills 路径）
3. 启动 OpenCode server 作为 sidecar
4. 前端连接到 server
5. 加载可用 skills

### 任务执行流程
1. 用户选择 skill
2. 用户上传文件或输入指令
3. 前端通过 SDK 发送消息到 server
4. Server 调用 LLM 处理请求
5. LLM 读取 skill 并执行相应工具
6. 结果通过 SSE 实时返回前端
7. 前端展示结果

### Skills 管理流程
1. **发现 Skills**: 扫描 bundled skills 目录和用户配置的路径
2. **导入 Skills**: 用户上传 zip 文件，解压到 `app_data_dir/skills/`
3. **删除 Skills**: 删除对应的目录
4. **重启 Server**: 导入/删除后重启 OpenCode server，确保 AI 感知变更

## 代码结构

### 前端组件
```
src/
├── components/
│   ├── chat/           # 聊天界面
│   │   ├── MessageInput.tsx    # 消息输入
│   │   ├── MessageList.tsx     # 消息列表
│   │   └── FileDropZone.tsx    # 文件拖放
│   ├── skills/         # Skills 界面
│   │   ├── SkillDashboard.tsx  # Skills 首页
│   │   ├── SkillCard.tsx       # Skill 卡片
│   │   └── SkillRunner.tsx     # Skill 执行器
│   ├── layout/         # 布局组件
│   │   ├── Sidebar.tsx         # 侧边栏
│   │   └── Header.tsx          # 头部
│   └── settings/       # 设置界面
│       └── SettingsPage.tsx    # 设置页面
├── hooks/              # 自定义 hooks
│   ├── useOpencode.ts  # OpenCode 服务管理
│   ├── useSession.ts   # 会话管理
│   └── useSkills.ts    # Skills 管理
├── lib/                # 工具库
│   ├── opencode-sdk/   # OpenCode SDK 客户端
│   ├── opencode.ts     # SDK 封装
│   └── tauri.ts        # Tauri 命令封装
└── types/              # 类型定义
    └── skill.ts        # Skill 相关类型
```

### 后端模块
```
src-tauri/src/
├── commands.rs         # Tauri IPC 命令
├── config.rs           # 配置管理
├── lib.rs              # Tauri 入口
└── sidecar.rs          # OpenCode sidecar 管理
```

### 资源文件
```
src-tauri/resources/
├── scripts/            # Python 脚本
│   └── parse_and_upload.py
└── skills/             # 内置 Skills 文件
    ├── question-bank-uploader/
    │   └── SKILL.md
    ├── code-reviewer/
    │   └── SKILL.md
    ├── data-processor/
    │   └── SKILL.md
    └── hello-world/
        └── SKILL.md
```

## 开发指南

### 添加新 Skill

1. 在 `src-tauri/resources/skills/` 创建目录
2. 创建 `SKILL.md` 文件，包含 YAML frontmatter（name、description）
3. 重新构建应用

### 添加新 Tauri 命令

1. 在 `commands.rs` 中添加函数
2. 使用 `#[tauri::command]` 标记
3. 在 `lib.rs` 的 `invoke_handler` 中注册
4. 在 `tauri.ts` 中添加封装函数
5. 在前端组件中使用

### 修改配置结构

1. 更新 `config.rs` 中的 `AppConfig` 结构体
2. 更新 `to_opencode_json()` 方法
3. 更新 `load_from_disk()` 和 `save_to_disk()` 方法
4. 更新前端类型定义

## 调试技巧

### 前端调试
- 使用 React DevTools
- 使用浏览器开发者工具
- 检查控制台输出

### Rust 调试
- 使用 `println!` 调试
- 使用 `cargo test` 测试
- 检查 Tauri 日志

### Tauri 调试
- 使用 `cargo tauri dev` 开发模式
- 检查 IPC 通信
- 验证 sidecar 进程

## 常见任务

### 修复 TypeScript 错误
1. 检查类型定义
2. 更新导入路径
3. 添加类型注解
4. 运行 `bun run build` 验证

### 修复 Rust 错误
1. 检查错误信息
2. 更新依赖版本
3. 修复类型不匹配
4. 运行 `cargo check` 验证

### 优化性能
1. 使用 React.memo
2. 使用 useMemo/useCallback
3. 懒加载组件
4. 优化 Rust 代码

## 代码规范

### TypeScript
- 使用严格模式
- 优先使用 const
- 使用函数组件
- 避免 any 类型

### Rust
- 使用 rustfmt 格式化
- 使用 clippy 检查
- 优先使用枚举
- 避免 unwrap()

### 提交规范
- 使用 Conventional Commits
- 一行不超过 100 字符
- 提交前运行测试
- 更新相关文档

## 工具链

### 必需工具
- Node.js 18+
- Bun (包管理器)
- Rust 1.70+
- Tauri CLI

### 推荐工具
- VS Code
- Rust Analyzer
- ESLint
- Prettier

## 更新日志

- 2026-05-20: 初始版本
- 2026-05-20: 修复 Skills 删除/导入功能，优化文档
