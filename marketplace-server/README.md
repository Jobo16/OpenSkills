# AI Toolbox Marketplace Server

这是 AI Toolbox 的 Marketplace 服务器原型，提供 Skills 的集中管理和分发。

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 接口

### 1. 获取所有 Skills

**GET** `/api/skills`

查询参数：
- `tag` (可选): 按标签过滤
- `search` (可选): 搜索关键词
- `page` (可选, 默认 1): 页码
- `limit` (可选, 默认 20): 每页数量

响应：
```json
{
  "skills": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 2. 获取 Skill 详情

**GET** `/api/skills/:id`

响应：
```json
{
  "id": "skill-name",
  "name": "Skill 名称",
  "description": "描述",
  "icon": "📦",
  "author": "作者",
  "homepage": "https://...",
  "tags": ["tag1", "tag2"],
  "latest_version": "1.0.0",
  "downloads": 100,
  "created_at": "2026-05-20T10:00:00Z",
  "updated_at": "2026-05-21T12:00:00Z",
  "versions": [...]
}
```

### 3. 下载 Skill

**GET** `/api/skills/:id/:version/download`

响应：
```json
{
  "skill_id": "skill-name",
  "version": "1.0.0",
  "download_url": "/uploads/file.zip",
  "checksum": "sha256-hash",
  "size_bytes": 15000
}
```

### 4. 检查更新

**POST** `/api/skills/updates`

请求体：
```json
{
  "installed": {
    "skill-1": "1.0.0",
    "skill-2": "1.1.0"
  },
  "app_version": "1.0.0"
}
```

响应：
```json
{
  "updates": [
    {
      "skill_id": "skill-1",
      "current_version": "1.0.0",
      "latest_version": "1.2.0",
      "changelog": "添加新功能",
      "download_url": "/uploads/file.zip",
      "checksum": "abc123",
      "size_bytes": 15000,
      "min_app_version": "1.0.0"
    }
  ],
  "removed": [],
  "timestamp": "2026-05-21T12:00:00Z"
}
```

### 5. 获取分类

**GET** `/api/skills/categories`

响应：
```json
{
  "categories": ["education", "development", "data", "productivity"]
}
```

### 6. 发布新 Skill

**POST** `/api/skills`

表单数据（multipart/form-data）：
- `name` (必填): Skill 名称
- `description` (必填): 描述
- `icon` (可选): 图标 emoji
- `author` (必填): 作者
- `homepage` (可选): 主页链接
- `tags` (可选): 标签（逗号分隔）
- `version` (必填): 版本号
- `changelog` (可选): 变更日志
- `min_app_version` (可选): 最低应用版本
- `package` (可选): ZIP 文件

响应：新创建的 skill 详情

### 7. 添加新版本

**POST** `/api/skills/:id/versions`

表单数据（multipart/form-data）：
- `version` (必填): 版本号
- `changelog` (可选): 变更日志
- `min_app_version` (可选): 最低应用版本
- `package` (可选): ZIP 文件

响应：新创建的版本详情

## 数据结构

### Skill

```typescript
interface Skill {
  id: string;                    // 唯一标识符
  name: string;                  // 显示名称
  description: string;           // 描述
  icon: string;                  // 图标 emoji
  author: string;                // 作者
  homepage: string;              // 主页链接
  tags: string[];                // 标签列表
  latest_version: string;        // 最新版本
  downloads: number;             // 下载次数
  created_at: string;            // 创建时间 (ISO 8601)
  updated_at: string;            // 更新时间 (ISO 8601)
  versions: SkillVersion[];      // 版本列表
}
```

### SkillVersion

```typescript
interface SkillVersion {
  version: string;               // 版本号 (semver)
  min_app_version: string;       // 最低应用版本
  changelog: string;             // 变更日志
  download_url: string;          // 下载链接
  checksum: string;              // SHA-256 校验和
  size_bytes: number;            // 文件大小 (字节)
  published_at: string;          // 发布时间 (ISO 8601)
}
```

## 与客户端集成

### 配置客户端

在 AI Toolbox 应用的设置中配置 Marketplace URL：

```
http://localhost:3000
```

### 测试更新功能

1. 启动服务器：`npm start`
2. 在应用设置中配置 Marketplace URL
3. 应用会自动检查更新
4. 如果有可用更新，会显示更新指示器

## 开发

### 项目结构

```
marketplace-server/
├── index.js           # 主服务器文件
├── package.json       # 项目配置
├── uploads/           # 上传文件目录
└── README.md          # 本文档
```

### 添加测试数据

示例数据已在 `index.js` 的 `initSampleData()` 函数中定义。你可以修改这个函数来添加更多测试数据。

### 生产环境

在生产环境中，你应该：

1. 使用数据库（如 PostgreSQL、MongoDB）替代内存存储
2. 添加身份验证和授权
3. 使用云存储（如 AWS S3、Cloudflare R2）存储文件
4. 添加 Rate Limiting
5. 使用 PM2 或 Docker 运行服务器
6. 配置 HTTPS
7. 添加日志和监控

## 示例：使用 curl 测试 API

### 获取所有 Skills

```bash
curl http://localhost:3000/api/skills
```

### 获取特定 Skill

```bash
curl http://localhost:3000/api/skills/question-bank-uploader
```

### 检查更新

```bash
curl -X POST http://localhost:3000/api/skills/updates \
  -H "Content-Type: application/json" \
  -d '{"installed": {"question-bank-uploader": "1.0.0"}, "app_version": "1.0.0"}'
```

### 发布新 Skill

```bash
curl -X POST http://localhost:3000/api/skills \
  -F "name=my-skill" \
  -F "description=A new skill" \
  -F "author=my-name" \
  -F "version=1.0.0" \
  -F "package=@./my-skill.zip"
```

## 相关文档

- [AI Toolbox 文档](../README.md)
- [Skills 生态系统 PRD](../docs/MARKETPLACE_PROGRESS.md)
- [API 规范](https://docs.ai-toolbox.com/marketplace/api)

## 许可证

MIT License
