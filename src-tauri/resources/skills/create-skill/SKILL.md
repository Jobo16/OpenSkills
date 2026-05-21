---
name: create-skill
description: AI 辅助创建新的 Skill。通过对话生成 SKILL.md 文档和目录结构。
icon: "✨"
version: "1.0.0"
author: "AI Toolbox"
tags: ["skill", "creation", "ai", "assistant"]
---

# AI 辅助创建 Skill

这个 Skill 帮助你通过对话创建新的 Skill。AI 会询问你关于 Skill 的需求，然后生成完整的 SKILL.md 文档和目录结构。

## 工作流程

### 1. 收集需求

首先，AI 会询问以下信息：

- **Skill 名称**：简洁明了的名称（例如：`code-formatter`、`doc-translator`）
- **功能描述**：这个 Skill 做什么？解决什么问题？
- **使用场景**：什么时候会使用这个 Skill？
- **输入类型**：需要处理什么格式的数据？（文件、文本、JSON 等）
- **预期输出**：处理完成后期望得到什么结果？
- **特殊要求**：是否需要网络访问、特定工具、特殊权限等？

### 2. 生成 SKILL.md

基于你的回答，AI 会生成包含以下内容的 SKILL.md 文档：

```yaml
---
name: your-skill-name
description: 简短的描述
icon: "🎯"
version: "1.0.0"
author: "你的名字"
tags: ["tag1", "tag2", "tag3"]
min_app_version: "1.0.0"
---

# Skill 标题

详细说明这个 Skill 的功能和使用方法。

## 使用场景

说明什么时候应该使用这个 Skill。

## 输入

描述期望的输入格式和内容。

## 处理步骤

1. 步骤一
2. 步骤二
3. 步骤三

## 输出

描述预期的输出结果。

## 注意事项

任何重要的注意事项或限制。
```

### 3. 生成目录结构

AI 会建议创建以下目录结构：

```
your-skill/
├── SKILL.md              # 主文档
├── scripts/              # 可选：脚本文件
│   └── main.py          # 可选：Python 脚本
└── templates/            # 可选：模板文件
    └── template.txt     # 可选：模板
```

### 4. 验证和优化

AI 会：
- 验证 SKILL.md 格式是否正确
- 检查 frontmatter 是否完整
- 优化描述使其更清晰
- 建议改进点

### 5. 导出选项

生成完成后，你可以选择：

1. **保存到本地**：将 Skill 保存到本地目录
2. **导出为 ZIP**：打包为 ZIP 文件供导入
3. **提交到 Marketplace**：发布到 Marketplace 供其他人使用（需要配置 Marketplace）

## 最佳实践

### 命名规范
- 使用小写字母和连字符（例如：`code-formatter`）
- 名称应该简洁但描述性强
- 避免使用特殊字符

### 描述编写
- 在第一行写一个简短的摘要（< 100 字符）
- 在正文中提供详细说明
- 使用清晰的标题和小节

### 流程设计
- 将复杂的处理分解为多个步骤
- 每个步骤应该清晰明确
- 包含错误处理和边界情况

### 测试建议
- 在开发过程中多次测试 Skill
- 尝试不同的输入场景
- 验证输出是否符合预期

## 示例

### 示例 1：代码格式化 Skill

**需求**：自动格式化 Python 代码

**生成的 SKILL.md**：
```yaml
---
name: python-formatter
description: 自动格式化 Python 代码，遵循 PEP 8 规范
icon: "🐍"
version: "1.0.0"
author: "Developer"
tags: ["python", "formatting", "code"]
---

# Python 代码格式化工具

自动格式化 Python 代码，确保遵循 PEP 8 编码规范。

## 使用场景

- 代码审查前自动格式化
- 提交代码前统一格式
- 团队代码风格统一

## 输入

Python 源代码文件（.py）

## 处理步骤

1. 读取 Python 文件内容
2. 使用 black 或 autopep8 进行格式化
3. 保留原有的注释和文档字符串
4. 返回格式化后的代码

## 输出

格式化后的 Python 代码，可以直接替换原文件或保存为新文件。

## 注意事项

- 格式化不会改变代码逻辑
- 建议在版本控制下使用
- 可以配置特定的格式化规则
```

### 示例 2：文档翻译 Skill

**需求**：将 Markdown 文档翻译成其他语言

**生成的 SKILL.md**：
```yaml
---
name: doc-translator
description: 将 Markdown 文档翻译成指定语言，保持格式不变
icon: "🌍"
version: "1.0.0"
author: "Translator"
tags: ["translation", "markdown", "localization"]
---

# Markdown 文档翻译工具

将 Markdown 格式的文档翻译成其他语言，同时保持文档格式和结构不变。

## 使用场景

- 项目文档国际化
- 技术文档翻译
- 多语言支持

## 输入

- Markdown 格式的文档内容
- 目标语言（例如：en、ja、ko）

## 处理步骤

1. 解析 Markdown 结构
2. 提取需要翻译的文本部分
3. 保持代码块、链接、图片等格式不变
4. 翻译文本内容
5. 重新组装文档

## 输出

翻译后的 Markdown 文档，格式和结构保持不变。

## 注意事项

- 代码块中的代码不会被翻译
- 链接和图片 URL 保持不变
- 某些技术术语可能需要保留原文
```

## 故障排除

### 问题：SKILL.md 格式错误
**解决**：确保 frontmatter 在 `---` 之间，所有字段正确

### 问题：Skill 无法被识别
**解决**：检查目录名和 name 字段是否一致

### 问题：AI 无法执行 Skill
**解决**：确保描述清晰，步骤详细，没有歧义

## 进阶用法

### 高级 frontmatter 字段

```yaml
---
name: advanced-skill
description: 高级 Skill 示例
icon: "⚡"
version: "2.0.0"
author: "Expert"
tags: ["advanced", "example"]
min_app_version: "1.1.0"  # 最低应用版本要求
homepage: "https://github.com/..."  # 相关链接
---
```

### 依赖其他 Skills

如果 Skill 需要其他 Skill 的功能，在描述中说明：

```markdown
## 依赖

这个 Skill 需要以下 Skills：
- `data-processor`：用于数据处理
- `file-manager`：用于文件操作
```

### 配置选项

如果 Skill 需要配置，在文档中说明：

```markdown
## 配置

这个 Skill 支持以下配置选项：

- `output_format`：输出格式（json、csv、xml）
- `encoding`：字符编码（utf-8、ascii）
- `timeout`：超时时间（秒）
```

## 贡献

如果你想将创建的 Skill 贡献到 Marketplace：

1. 确保 Skill 经过充分测试
2. 编写清晰的文档
3. 遵循命名和格式规范
4. 提交到 Marketplace 进行审核

## 相关资源

- [Skill 创建指南](https://docs.ai-toolbox.com/skills/creating)
- [Marketplace 提交规范](https://docs.ai-toolbox.com/marketplace/submitting)
- [最佳实践](https://docs.ai-toolbox.com/skills/best-practices)
