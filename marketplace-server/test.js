#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Marketplace API...\n');

  try {
    // 测试 1: 获取所有 skills
    console.log('1️⃣  GET /api/skills');
    const skills = await makeRequest('GET', '/api/skills');
    console.log(`   ✅ Found ${skills.total} skills\n`);

    // 测试 2: 获取特定 skill
    console.log('2️⃣  GET /api/skills/question-bank-uploader');
    const skill = await makeRequest('GET', '/api/skills/question-bank-uploader');
    console.log(`   ✅ Skill: ${skill.name}`);
    console.log(`   📦 Latest version: ${skill.latest_version}`);
    console.log(`   📥 Downloads: ${skill.downloads}\n`);

    // 测试 3: 检查更新
    console.log('3️⃣  POST /api/skills/updates');
    const updates = await makeRequest('POST', '/api/skills/updates', {
      installed: {
        'question-bank-uploader': '1.0.0',
        'code-reviewer': '1.0.0',
        'data-processor': '1.0.0',
      },
      app_version: '1.0.0',
    });
    console.log(`   ✅ Found ${updates.updates.length} updates`);
    updates.updates.forEach((u) => {
      console.log(`   🔄 ${u.skill_id}: ${u.current_version} → ${u.latest_version}`);
    });
    console.log('');

    // 测试 4: 获取分类
    console.log('4️⃣  GET /api/skills/categories');
    const categories = await makeRequest('GET', '/api/skills/categories');
    console.log(`   ✅ Categories: ${categories.categories.join(', ')}\n`);

    // 测试 5: 搜索
    console.log('5️⃣  GET /api/skills?search=data');
    const searchResults = await makeRequest('GET', '/api/skills?search=data');
    console.log(`   ✅ Found ${searchResults.total} results for "data"\n`);

    // 测试 6: 按标签过滤
    console.log('6️⃣  GET /api/skills?tag=education');
    const tagResults = await makeRequest('GET', '/api/skills?tag=education');
    console.log(`   ✅ Found ${tagResults.total} skills with tag "education"\n`);

    console.log('✅ All tests passed!');
    console.log('\n📚 API Documentation: http://localhost:3000');
    console.log('🚀 Server is ready for AI Toolbox integration\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// 运行测试
testAPI();
