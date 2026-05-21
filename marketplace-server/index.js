const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// 内存数据库（生产环境应使用数据库）
let skills = [];
let categories = ['education', 'development', 'data', 'productivity', 'other'];

// 初始化示例数据
function initSampleData() {
  skills = [
    {
      id: 'question-bank-uploader',
      name: '题库上传工具',
      description: '将 xlsx 题库文件解析并上传到题库系统',
      icon: '📚',
      author: 'jobo',
      homepage: 'https://github.com/jobo/ai-toolbox',
      tags: ['xlsx', 'upload', 'education'],
      latest_version: '1.2.0',
      downloads: 150,
      created_at: '2026-05-20T10:00:00Z',
      updated_at: '2026-05-21T08:30:00Z',
      versions: [
        {
          version: '1.0.0',
          min_app_version: '1.0.0',
          changelog: '初始版本',
          download_url: '/uploads/question-bank-uploader-1.0.0.zip',
          checksum: 'abc123',
          size_bytes: 15000,
          published_at: '2026-05-20T10:00:00Z'
        },
        {
          version: '1.1.0',
          min_app_version: '1.0.0',
          changelog: '添加新格式支持',
          download_url: '/uploads/question-bank-uploader-1.1.0.zip',
          checksum: 'def456',
          size_bytes: 16000,
          published_at: '2026-05-20T15:00:00Z'
        },
        {
          version: '1.2.0',
          min_app_version: '1.0.0',
          changelog: '优化性能和错误处理',
          download_url: '/uploads/question-bank-uploader-1.2.0.zip',
          checksum: 'ghi789',
          size_bytes: 17000,
          published_at: '2026-05-21T08:30:00Z'
        }
      ]
    },
    {
      id: 'code-reviewer',
      name: '代码审查工具',
      description: '代码审查工具。审查代码质量、安全性和最佳实践',
      icon: '🔍',
      author: 'jobo',
      homepage: 'https://github.com/jobo/ai-toolbox',
      tags: ['code', 'review', 'development'],
      latest_version: '1.0.0',
      downloads: 89,
      created_at: '2026-05-20T10:00:00Z',
      updated_at: '2026-05-20T10:00:00Z',
      versions: [
        {
          version: '1.0.0',
          min_app_version: '1.0.0',
          changelog: '初始版本',
          download_url: '/uploads/code-reviewer-1.0.0.zip',
          checksum: 'xyz789',
          size_bytes: 12000,
          published_at: '2026-05-20T10:00:00Z'
        }
      ]
    },
    {
      id: 'data-processor',
      name: '数据处理工具',
      description: '数据处理工具。处理 CSV、JSON 等数据文件',
      icon: '📊',
      author: 'jobo',
      homepage: 'https://github.com/jobo/ai-toolbox',
      tags: ['data', 'csv', 'json', 'processing'],
      latest_version: '1.1.0',
      downloads: 234,
      created_at: '2026-05-20T10:00:00Z',
      updated_at: '2026-05-21T12:00:00Z',
      versions: [
        {
          version: '1.0.0',
          min_app_version: '1.0.0',
          changelog: '初始版本',
          download_url: '/uploads/data-processor-1.0.0.zip',
          checksum: 'abc456',
          size_bytes: 18000,
          published_at: '2026-05-20T10:00:00Z'
        },
        {
          version: '1.1.0',
          min_app_version: '1.0.0',
          changelog: '添加新的数据格式支持',
          download_url: '/uploads/data-processor-1.1.0.zip',
          checksum: 'def789',
          size_bytes: 20000,
          published_at: '2026-05-21T12:00:00Z'
        }
      ]
    }
  ];
}

// 初始化示例数据
initSampleData();

// API 路由

// 获取所有 skills
app.get('/api/skills', (req, res) => {
  const { tag, search, page = 1, limit = 20 } = req.query;

  let filteredSkills = [...skills];

  // 按标签过滤
  if (tag) {
    filteredSkills = filteredSkills.filter(skill =>
      skill.tags.includes(tag)
    );
  }

  // 搜索过滤
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSkills = filteredSkills.filter(skill =>
      skill.name.toLowerCase().includes(searchLower) ||
      skill.description.toLowerCase().includes(searchLower) ||
      skill.author.toLowerCase().includes(searchLower)
    );
  }

  // 分页
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex);

  res.json({
    skills: paginatedSkills,
    total: filteredSkills.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredSkills.length / limit)
  });
});

// 获取 skill 详情
app.get('/api/skills/:id', (req, res) => {
  const skill = skills.find(s => s.id === req.params.id);

  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  res.json(skill);
});

// 下载 skill 版本
app.get('/api/skills/:id/:version/download', (req, res) => {
  const skill = skills.find(s => s.id === req.params.id);

  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  const version = skill.versions.find(v => v.version === req.params.version);

  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }

  // 增加下载计数
  skill.downloads++;

  // 在实际应用中，这里应该返回真实的文件
  // 这里只是返回模拟数据
  res.json({
    skill_id: skill.id,
    version: version.version,
    download_url: version.download_url,
    checksum: version.checksum,
    size_bytes: version.size_bytes
  });
});

// 批量更新检查
app.post('/api/skills/updates', (req, res) => {
  const { installed, app_version } = req.body;

  if (!installed || typeof installed !== 'object') {
    return res.status(400).json({ error: 'Invalid installed skills data' });
  }

  const updates = [];
  const removed = [];

  // 检查每个已安装的 skill 是否有更新
  for (const [skillId, currentVersion] of Object.entries(installed)) {
    const skill = skills.find(s => s.id === skillId);

    if (!skill) {
      // skill 已从 marketplace 移除
      removed.push(skillId);
      continue;
    }

    // 比较版本
    if (compareVersions(skill.latest_version, currentVersion) > 0) {
      const latestVersion = skill.versions.find(v => v.version === skill.latest_version);

      if (latestVersion) {
        // 检查 app 版本兼容性
        if (!latestVersion.min_app_version || compareVersions(app_version, latestVersion.min_app_version) >= 0) {
          updates.push({
            skill_id: skillId,
            current_version: currentVersion,
            latest_version: skill.latest_version,
            changelog: latestVersion.changelog,
            download_url: latestVersion.download_url,
            checksum: latestVersion.checksum,
            size_bytes: latestVersion.size_bytes,
            min_app_version: latestVersion.min_app_version
          });
        }
      }
    }
  }

  res.json({
    updates,
    removed,
    timestamp: new Date().toISOString()
  });
});

// 获取分类列表
app.get('/api/skills/categories', (req, res) => {
  const allTags = new Set();

  skills.forEach(skill => {
    skill.tags.forEach(tag => allTags.add(tag));
  });

  res.json({
    categories: Array.from(allTags).sort()
  });
});

// 发布新 skill（管理员接口）
app.post('/api/skills', upload.single('package'), (req, res) => {
  const { name, description, icon, author, homepage, tags, version, changelog, min_app_version } = req.body;

  if (!name || !description || !author || !version) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 检查是否已存在
  const existingSkill = skills.find(s => s.id === name.toLowerCase().replace(/[^a-z0-9]/g, '-'));

  if (existingSkill) {
    return res.status(409).json({ error: 'Skill already exists' });
  }

  // 计算校验和
  let checksum = '';
  let size_bytes = 0;
  let download_url = '';

  if (req.file) {
    const fileContent = fs.readFileSync(req.file.path);
    checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    size_bytes = req.file.size;
    download_url = `/uploads/${req.file.filename}`;
  }

  const skillId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const newSkill = {
    id: skillId,
    name,
    description,
    icon: icon || '📦',
    author,
    homepage: homepage || '',
    tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : [],
    latest_version: version,
    downloads: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    versions: [
      {
        version,
        min_app_version: min_app_version || '1.0.0',
        changelog: changelog || 'Initial release',
        download_url,
        checksum,
        size_bytes,
        published_at: new Date().toISOString()
      }
    ]
  };

  skills.push(newSkill);

  res.status(201).json(newSkill);
});

// 更新 skill 版本
app.post('/api/skills/:id/versions', upload.single('package'), (req, res) => {
  const skill = skills.find(s => s.id === req.params.id);

  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  const { version, changelog, min_app_version } = req.body;

  if (!version) {
    return res.status(400).json({ error: 'Version is required' });
  }

  // 检查版本是否已存在
  if (skill.versions.find(v => v.version === version)) {
    return res.status(409).json({ error: 'Version already exists' });
  }

  // 计算校验和
  let checksum = '';
  let size_bytes = 0;
  let download_url = '';

  if (req.file) {
    const fileContent = fs.readFileSync(req.file.path);
    checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    size_bytes = req.file.size;
    download_url = `/uploads/${req.file.filename}`;
  }

  const newVersion = {
    version,
    min_app_version: min_app_version || '1.0.0',
    changelog: changelog || '',
    download_url,
    checksum,
    size_bytes,
    published_at: new Date().toISOString()
  };

  skill.versions.push(newVersion);
  skill.latest_version = version;
  skill.updated_at = new Date().toISOString();

  res.status(201).json(newVersion);
});

// 版本比较辅助函数
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Marketplace server running on http://localhost:${PORT}`);
  console.log(`📚 API docs:`);
  console.log(`   GET  /api/skills              - List all skills`);
  console.log(`   GET  /api/skills/:id          - Get skill details`);
  console.log(`   GET  /api/skills/:id/:ver/download - Download skill`);
  console.log(`   POST /api/skills/updates      - Check for updates`);
  console.log(`   GET  /api/skills/categories   - List categories`);
  console.log(`   POST /api/skills              - Publish new skill`);
  console.log(`   POST /api/skills/:id/versions - Add new version`);
});
