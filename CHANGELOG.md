# 更新日志

本文档记录 AI 工具箱项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.1] - 2026-05-20

### 修复
- 修复 Skills 删除功能不生效的问题
  - 删除操作现在会重启 OpenCode server，确保 AI 感知到变更
  - Skills 列表现在通过 Tauri 后端直接读取文件系统，与删除操作保持一致
- 修复打包后找不到内置 Skills 的问题
  - Skills 目录现在支持多个可能的位置（MacOS 和 Resources 目录）
- 修复导入 Skills 后 AI 无法感知的问题
  - 导入/删除 Skills 后会自动重启 OpenCode server

### 变更
- 优化 Skills 加载逻辑，统一使用 Tauri 后端读取

## [1.0.0] - 2026-05-20

### 新增
- 项目初始化
- Tauri v2 + React + Tailwind CSS 技术栈
- OpenCode SDK 集成
- 多 Skill 支持
- 文件上传功能
- 实时进度展示
- 配置管理（API key、provider 等）
- App 级别配置隔离
- 内置 Skills 支持
- 用户导入 Skills 功能

---

## 版本说明

### 版本格式

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能性新增
- **PATCH**: 向后兼容的问题修正

### 变更类型

- **新增**: 新功能
- **变更**: 对现有功能的变更
- **废弃**: 即将移除的功能
- **移除**: 已移除的功能
- **修复**: 问题修复
- **安全**: 安全相关的变更

### 示例

```markdown
## [1.2.0] - 2026-06-01

### 新增
- 添加用户认证功能
- 添加数据导出功能

### 变更
- 优化界面布局
- 更新依赖版本

### 修复
- 修复登录失败的问题
- 修复数据同步错误
```

---

## 如何更新此文档

1. 在 `[未发布]` 部分添加新变更
2. 发布新版本时，将 `[未发布]` 内容移到新版本部分
3. 更新版本号和日期
4. 确保格式一致

## 相关链接

- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
