# 贡献指南

感谢你对 OpenSkill 项目的关注！本文档将帮助你了解如何参与项目开发。

## 开发环境搭建

### 前置要求

- **Node.js**: 18.0 或更高版本
- **Bun**: 最新版本（用于包管理）
- **Rust**: 1.70 或更高版本
- **Tauri CLI**: 最新版本

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd my-product
   ```

2. **安装依赖**
   ```bash
   bun install
   ```

3. **启动开发服务器**
   ```bash
   cargo tauri dev
   ```

## 开发工作流

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/*` - 新功能
- `fix/*` - 修复
- `docs/*` - 文档更新
- `refactor/*` - 重构
- `test/*` - 测试相关

### 2. 开发代码

#### 前端开发
- 使用 React 函数组件
- 使用 TypeScript 严格模式
- 使用 Tailwind CSS 样式
- 遵循组件规范

#### 后端开发
- 使用 Rust 编写 Tauri 命令
- 遵循 Rust 编码规范
- 使用 `rustfmt` 格式化代码

### 3. 代码检查

```bash
# TypeScript 检查
bun run build

# Rust 检查
cargo clippy

# 格式化
cargo fmt
```

### 4. 运行测试

```bash
# 前端测试
bun test

# Rust 测试
cargo test

# Tauri 测试
cargo test -p openskill
```

### 5. 提交代码

使用 Conventional Commits 规范：

```bash
git add .
git commit -m "feat: add new feature"
```

提交类型：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 6. 推送代码

```bash
git push origin feature/your-feature-name
```

### 7. 创建 Pull Request

1. 访问 GitHub 仓库页面
2. 点击 "New Pull Request"
3. 填写 PR 描述
4. 等待代码审查

## 代码规范

### TypeScript/React

- 使用 `const` 而非 `let`
- 优先使用函数组件
- 使用 TypeScript 严格模式
- 避免 `any` 类型
- 使用有意义的变量名

### Rust

- 使用 `rustfmt` 格式化
- 使用 `clippy` 检查
- 优先使用枚举而非布尔参数
- 避免 `unwrap()`
- 使用有意义的错误信息

### 提交信息

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(auth): add user login functionality

- Add login form component
- Implement authentication API
- Add error handling

Closes #123
```

## 测试指南

### 前端测试

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test --grep "ComponentName"

# 生成覆盖率报告
bun test --coverage
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

### Tauri 测试

```bash
# 运行 Tauri 测试
cargo test -p openskill
```

## 文档指南

### 代码文档

- 公共 API 必须有文档注释
- 复杂算法需要解释
- 配置选项需要说明

### 用户文档

- 更新 README.md
- 更新 CHANGELOG.md
- 更新 CONTRIBUTING.md

## 问题报告

### Bug 报告

1. 使用 Bug 报告模板
2. 提供复现步骤
3. 提供环境信息
4. 提供错误日志

### 功能请求

1. 使用功能请求模板
2. 描述使用场景
3. 描述期望行为
4. 提供替代方案

## 代码审查

### 审查要点

- 代码是否符合规范
- 测试是否充分
- 文档是否更新
- 性能是否考虑
- 安全是否考虑

### 审查流程

1. 自我审查
2. 提交 PR
3. 等待审查
4. 处理反馈
5. 合并代码

## 发布流程

### 版本号

使用语义化版本号：
- `MAJOR.MINOR.PATCH`
- `1.0.0` - 初始版本
- `1.1.0` - 新功能
- `1.0.1` - 修复

### 发布步骤

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 构建发布版本
5. 上传到发布平台

## 常见问题

### Q: 如何添加新的 Skill？

A: 在 `src-tauri/resources/skills/` 目录下创建新目录，添加 `SKILL.md` 文件，重新构建应用。

### Q: 如何添加新的 Tauri 命令？

A: 在 `commands.rs` 中添加函数，使用 `#[tauri::command]` 标记，然后在 `lib.rs` 中注册。

### Q: 如何调试 Tauri 应用？

A: 使用 `cargo tauri dev` 启动开发模式，查看控制台输出，使用浏览器开发者工具。

## 联系方式

- GitHub Issues: 问题报告
- GitHub Discussions: 讨论

## 许可证

本项目采用 MIT 许可证。贡献代码即表示你同意你的代码将在 MIT 许可证下发布。
