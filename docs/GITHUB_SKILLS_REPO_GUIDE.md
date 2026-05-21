# GitHub Skills 仓库设置指南

## 概述

本指南帮助你设置一个公开的 GitHub 仓库作为 AI Toolbox 的 Skills 商店。

## 快速开始

### 1. 创建仓库

1. 在 GitHub 上创建新仓库（例如：`skills-kit`）
2. 设置为 Public（公开）
3. 克隆到本地

### 2. 仓库结构

```
skills-kit/
├── skills/                           # Skills 目录
│   ├── question-bank-uploader/
│   │   ├── SKILL.md
│   │   └── ...
│   ├── code-reviewer/
│   │   ├── SKILL.md
│   │   └── ...
│   └── data-processor/
│       ├── SKILL.md
│       └── ...
├── skills.json                       # Skills 清单文件
└── README.md                         # 仓库说明
```

### 3. 创建 skills.json

在仓库根目录创建 `skills.json`，格式如下：

```json
{
  "skills": [
    {
      "id": "question-bank-uploader",
      "name": "题库上传工具",
      "description": "将 xlsx 题库文件解析并上传到题库系统",
      "icon": "📚",
      "author": "jobo",
      "homepage": "https://github.com/your-username/skills-kit",
      "tags": ["xlsx", "upload", "education"],
      "version": "1.2.0",
      "path": "skills/question-bank-uploader"
    }
  ]
}
```

**字段说明：**

| 字段 | 必需 | 说明 |
|------|------|------|
| `id` | ✓ | 唯一标识符，使用小写字母和连字符 |
| `name` | ✓ | 显示名称 |
| `description` | ✓ | 简短描述 |
| `icon` | ✗ | Emoji 图标 |
| `author` | ✓ | 作者名 |
| `homepage` | ✗ | 仓库链接 |
| `tags` | ✓ | 标签数组（用于过滤） |
| `version` | ✓ | 语义化版本号（MAJOR.MINOR.PATCH） |
| `path` | ✓ | skill 在仓库中的相对路径 |

### 4. 添加 Skill

1. 在 `skills/` 目录下创建新目录
2. 添加 `SKILL.md` 文件（包含 YAML frontmatter）
3. 更新根目录的 `skills.json` 清单
4. 提交并推送

**SKILL.md 示例：**

```markdown
---
name: my-new-skill
description: 这是我的新 skill
icon: "🚀"
version: "1.0.0"
author: "your-name"
tags: ["example", "demo"]
---

# My New Skill

这个 skill 做什么...

## 使用方法

1. 第一步
2. 第二步
```

### 5. 在 AI Toolbox 中使用

1. 打开 AI Toolbox 应用
2. 点击"设置"
3. 找到"Marketplace URL"字段
4. 输入你的仓库 URL：
   ```
   https://github.com/your-username/skills-kit
   ```
5. 保存设置
6. 点击"Marketplace"按钮浏览和安装 skills

## 最佳实践

### 版本管理

使用 [Semantic Versioning](https://semver.org/)：

- **MAJOR** (1.0.0 → 2.0.0)：破坏性变更
- **MINOR** (1.0.0 → 1.1.0)：新功能
- **PATCH** (1.0.0 → 1.0.1)：Bug 修复

### Tags 建议

使用描述性的标签，便于用户发现：

```json
"tags": ["education", "upload", "xlsx", "data-processing"]
```

### 文档

为每个 skill 编写清晰的 SKILL.md：

- 简洁的描述
- 清晰的使用方法
- 示例
- 故障排除

## 高级用法

### 多个仓库支持

AI Toolbox 支持指向任何公开的 GitHub 仓库。你可以：

- 创建组织级仓库
- 为特定领域创建专门的仓库
- Fork 其他人的仓库并添加自己的 skills

### 社区贡献

鼓励社区贡献：

1. Fork 你的仓库
2. 创建新 skill 或改进现有 skill
3. 提交 Pull Request
4. 审核后合并

### 自动化

使用 GitHub Actions 自动化：

```yaml
name: Validate Skills

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate skills.json
        run: |
          node -e "const data = require('./skills.json'); console.log('Skills count:', data.skills.length);"
```

## 故障排除

### 常见问题

**Q: Marketplace 显示"无法加载 skills"**

A: 检查：
1. 仓库 URL 是否正确
2. 仓库是否为 Public
3. `skills.json` 是否存在且格式正确

**Q: 安装 skill 失败**

A: 检查：
1. skill 目录中是否包含 `SKILL.md`
2. `SKILL.md` 的 YAML frontmatter 是否正确
3. 网络连接是否正常

**Q: 版本更新没有显示**

A: 检查：
1. `skills.json` 中的版本号是否已更新
2. 是否已推送到 GitHub
3. 等待几分钟让缓存更新

## 示例仓库

参考示例：
- [Jobo16/skills-kit](https://github.com/Jobo16/skills-kit)

## 支持

如有问题，请查看：
- [AI Toolbox 文档](https://github.com/your-username/ai-toolbox)
- [GitHub Issues](https://github.com/your-username/skills-kit/issues)
