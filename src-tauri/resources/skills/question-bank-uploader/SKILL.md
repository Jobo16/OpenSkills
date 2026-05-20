---
name: question-bank-uploader
description: 将 xlsx 题库文件解析并上传到题库系统。当用户上传 xlsx 文件或提到"上传题目"、"导入题库"、"题库"时使用。
icon: 📚
---

# 题库上传工具

## 工作流程

1. 用户提供 xlsx 文件和上传指令
2. 解析 xlsx 文件：
   - 使用 Python + openpyxl 读取 xlsx
   - 验证格式（表头、列数、数据完整性）
   - 展示解析结果供用户确认
3. 调用上传 API：
   ```bash
   python3 {skill_dir}/scripts/parse_and_upload.py "{file_path}" --api-url "https://api.example.com"
   ```
4. 返回上传结果

## xlsx 格式要求

| 列 | 说明 | 必填 |
|----|------|------|
| A | 题目类型 (choice/fill/judge) | ✓ |
| B | 题目内容 | ✓ |
| C | 选项A | 选择题必填 |
| D | 选项B | 选择题必填 |
| E | 选项C | |
| F | 选项D | |
| G | 正确答案 | ✓ |
| H | 解析 | |

## API 端点

- POST /api/questions/batch
- Body: JSON array of question objects
- Header: Authorization: Bearer {token}

## 错误处理

- xlsx 格式错误 → 提示用户下载模板
- 网络错误 → 自动重试 3 次
- 部分失败 → 展示失败行号和原因
