use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Clone, Serialize, Deserialize, PartialEq)]
pub enum SkillSource {
    Bundled,
    User,
    Marketplace,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    pub icon: Option<String>,
    pub path: String,
    pub version: Option<String>,
    pub author: Option<String>,
    pub source: SkillSource,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_key: Option<String>,
    pub bundled_api_key: Option<String>,
    pub provider: String,
    pub model: String,
    pub skills_paths: Vec<String>,
    pub marketplace_url: Option<String>,
    #[serde(skip)]
    app_data_dir: PathBuf,
}

impl AppConfig {
    /// 从 app data 目录加载配置
    pub fn load(app_data_dir: &PathBuf) -> Self {
        let config_path = app_data_dir.join("config.json");
        let mut config = if config_path.exists() {
            let data = fs::read_to_string(&config_path).unwrap_or_default();
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        };
        config.app_data_dir = app_data_dir.clone();
        config
    }

    /// 获取有效的 API key（用户 key 优先，否则用内置 key）
    pub fn get_effective_api_key(&self) -> Option<String> {
        self.api_key
            .clone()
            .or_else(|| self.bundled_api_key.clone())
    }

    /// 获取 API key
    pub fn get_api_key(&self) -> Option<String> {
        self.api_key.clone()
    }

    /// 设置 API key
    pub fn set_api_key(&mut self, key: &str) -> Result<(), String> {
        self.api_key = Some(key.to_string());
        self.save_to_disk()
    }

    /// 生成 OpenCode config JSON（传给 opencode serve）
    pub fn to_opencode_json(&self) -> String {
        // 构建 skills paths
        let mut skills_paths = self.skills_paths.clone();

        // 添加打包的 skills 目录
        if let Some(bundled_skills) = Self::find_bundled_skills_dir() {
            skills_paths.push(bundled_skills.to_string_lossy().to_string());
        }

        // 如果用户配置了 API key，使用用户配置的 provider
        // 否则使用 opencode 内置的免费模型
        let api_key = self.get_effective_api_key();
        let provider_config = if let Some(key) = api_key {
            get_provider_config(&self.provider, &key)
        } else {
            // 使用 opencode 内置免费模型，无需 API key
            serde_json::json!({})
        };

        serde_json::json!({
            "provider": provider_config,
            "model": self.model.clone(),
            "skills": {
                "paths": skills_paths
            },
            "permission": {
                "*": "allow"
            }
        })
        .to_string()
    }

    /// 发现可用的 skills
    pub fn discover_skills(&self) -> Result<Vec<SkillInfo>, String> {
        let mut skills = Vec::new();

        // 扫描打包的 skills 目录
        let bundled_skills_dir = std::env::current_exe()
            .ok()
            .and_then(|p| {
                p.parent()
                    .map(|pp| pp.join("resources").join("skills"))
            })
            .filter(|p| p.exists());

        if let Some(dir) = bundled_skills_dir {
            Self::scan_skills_dir(&dir, &mut skills)?;
        }

        // 扫描额外配置的 skills 路径
        for path in &self.skills_paths {
            let dir = PathBuf::from(path);
            if dir.exists() {
                Self::scan_skills_dir(&dir, &mut skills)?;
            }
        }

        Ok(skills)
    }

    /// 扫描目录中的 skills
    fn scan_skills_dir(dir: &PathBuf, skills: &mut Vec<SkillInfo>) -> Result<(), String> {
        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let content =
                        fs::read_to_string(&skill_md).map_err(|e| e.to_string())?;

                    // 解析 frontmatter
                    if let Some(skill) = Self::parse_skill_md(&content, &path) {
                        skills.push(skill);
                    }
                }
            }
        }

        Ok(())
    }

    /// 删除 skill（按名称，删除对应的目录）
    pub fn delete_skill(&self, name: &str) -> Result<(), String> {
        // 扫描所有 skills 目录，找到匹配的 skill 并删除
        let all_dirs = self.get_skill_dirs();

        for dir in &all_dirs {
            if !dir.exists() {
                continue;
            }
            let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
            for entry in entries {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.is_dir() {
                    let skill_md = path.join("SKILL.md");
                    if skill_md.exists() {
                        let content = fs::read_to_string(&skill_md).unwrap_or_default();
                        if let Some(skill) = Self::parse_skill_md(&content, &path) {
                            if skill.name == name {
                                fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
                                return Ok(());
                            }
                        }
                    }
                }
            }
        }

        Err(format!("Skill '{}' not found", name))
    }

    /// 获取所有 skills 扫描目录
    fn get_skill_dirs(&self) -> Vec<PathBuf> {
        let mut dirs = Vec::new();

        // 打包的 skills 目录（检查多个可能的位置）
        if let Some(skills_dir) = Self::find_bundled_skills_dir() {
            dirs.push(skills_dir);
        }

        // 用户配置的额外路径
        for path in &self.skills_paths {
            let dir = PathBuf::from(path);
            if dir.exists() {
                dirs.push(dir);
            }
        }

        dirs
    }

    /// 查找 bundled skills 目录
    fn find_bundled_skills_dir() -> Option<PathBuf> {
        let exe = std::env::current_exe().ok()?;
        let exe_dir = exe.parent()?;

        // 检查多个可能的位置：
        // 1. MacOS 目录下（开发模式）: exe_dir/resources/skills
        // 2. Resources 目录下（打包模式）: exe_dir/../Resources/resources/skills
        let candidates = vec![
            exe_dir.join("resources").join("skills"),
            exe_dir
                .join("..")
                .join("Resources")
                .join("resources")
                .join("skills"),
        ];

        for path in candidates {
            if path.exists() {
                return Some(path);
            }
        }

        None
    }

    /// 从 zip 内容导入 skills
    pub fn import_skills_zip(&mut self, zip_content: &[u8]) -> Result<Vec<SkillInfo>, String> {
        use std::io::Read;

        let reader = std::io::Cursor::new(zip_content);
        let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;

        // 确定导入目标目录：app_data_dir/skills/
        let skills_dir = self.app_data_dir.join("skills");
        fs::create_dir_all(&skills_dir).map_err(|e| e.to_string())?;

        let mut imported = Vec::new();
        let mut seen_skills: std::collections::HashSet<String> = std::collections::HashSet::new();

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let file_path = file.mangled_name();

            // 跳过目录和隐藏文件
            let path_str = file_path.to_string_lossy().to_string();
            if file.is_dir() || path_str.starts_with('.') || path_str.contains("/.") {
                continue;
            }

            // 提取所有文件（不只是 SKILL.md）
            if let Some(parent) = file_path.parent() {
                let skill_name = parent
                    .file_name()
                    .map(|f| f.to_string_lossy().to_string())
                    .unwrap_or_else(|| format!("skill-{}", i));

                // 只处理位于顶层目录下的文件（避免嵌套目录问题）
                if !parent.parent().map(|p| p.file_name().is_some()).unwrap_or(false) {
                    let target_dir = skills_dir.join(&skill_name);
                    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

                    // 获取文件在 skill 目录内的相对路径
                    let relative_path = file_path
                        .strip_prefix(parent)
                        .unwrap_or(&file_path);

                    // 创建子目录（如果需要）
                    if let Some(rel_parent) = relative_path.parent() {
                        if !rel_parent.as_os_str().is_empty() {
                            fs::create_dir_all(target_dir.join(rel_parent))
                                .map_err(|e| e.to_string())?;
                        }
                    }

                    let target_file = target_dir.join(relative_path);
                    let mut content = Vec::new();
                    file.read_to_end(&mut content).map_err(|e| e.to_string())?;
                    fs::write(&target_file, &content).map_err(|e| e.to_string())?;

                    // 如果是 SKILL.md，解析并收集 skill 信息
                    if file_path.file_name().map(|f| f == "SKILL.md").unwrap_or(false) {
                        if !seen_skills.contains(&skill_name) {
                            let content_str = String::from_utf8_lossy(&content).to_string();
                            if let Some(skill) = Self::parse_skill_md(&content_str, &target_dir) {
                                imported.push(skill);
                                seen_skills.insert(skill_name);
                            }
                        }
                    }
                }
            }
        }

        // 将 skills 目录加入配置（如果还没加）
        let skills_dir_str = skills_dir.to_string_lossy().to_string();
        if !self.skills_paths.contains(&skills_dir_str) {
            self.skills_paths.push(skills_dir_str);
            self.save_to_disk()?;
        }

        Ok(imported)
    }

    /// 解析 SKILL.md 文件
    pub fn parse_skill_md(content: &str, path: &PathBuf) -> Option<SkillInfo> {
        // 简单的 frontmatter 解析
        if !content.starts_with("---") {
            return None;
        }

        let end = content[3..].find("---")?;
        let frontmatter = &content[3..end + 3];

        let mut name = None;
        let mut description = None;
        let mut icon = None;
        let mut version = None;
        let mut author = None;

        for line in frontmatter.lines() {
            let line = line.trim();
            if let Some(val) = line.strip_prefix("name:") {
                name = Some(val.trim().to_string());
            } else if let Some(val) = line.strip_prefix("description:") {
                description = Some(val.trim().to_string());
            } else if let Some(val) = line.strip_prefix("icon:") {
                icon = Some(val.trim().to_string());
            } else if let Some(val) = line.strip_prefix("version:") {
                version = Some(val.trim().to_string());
            } else if let Some(val) = line.strip_prefix("author:") {
                author = Some(val.trim().to_string());
            }
        }

        Some(SkillInfo {
            name: name?,
            description: description.unwrap_or_default(),
            icon,
            path: path.to_string_lossy().to_string(),
            version,
            author,
            source: SkillSource::User,
        })
    }

    /// 保存到磁盘
    pub fn save_to_disk(&self) -> Result<(), String> {
        let config_path = self.app_data_dir.join("config.json");
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&config_path, json).map_err(|e| e.to_string())
    }

    /// 获取 app data 目录
    pub fn get_app_data_dir(&self) -> &PathBuf {
        &self.app_data_dir
    }

    /// 设置 app data 目录
    pub fn set_app_data_dir(&mut self, dir: PathBuf) {
        self.app_data_dir = dir;
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_key: None,
            bundled_api_key: option_env!("BUNDLED_API_KEY").map(|s| s.to_string()),
            provider: "opencode".to_string(),
            model: "opencode/deepseek-v4-flash-free".to_string(),
            skills_paths: vec![],
            marketplace_url: None,
            app_data_dir: PathBuf::new(),
        }
    }
}

/// 可用的模型列表
pub fn get_available_models() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({
            "id": "opencode/deepseek-v4-flash-free",
            "name": "DeepSeek V4 Flash (免费)",
            "provider": "opencode",
            "requiresApiKey": false
        }),
        serde_json::json!({
            "id": "deepseek-v4-flash",
            "name": "DeepSeek V4 Flash",
            "provider": "deepseek",
            "requiresApiKey": true
        }),
        serde_json::json!({
            "id": "deepseek-chat",
            "name": "DeepSeek Chat",
            "provider": "deepseek",
            "requiresApiKey": true
        }),
    ]
}

/// 支持的 provider 配置
pub fn get_provider_config(provider: &str, api_key: &str) -> serde_json::Value {
    match provider {
        "deepseek" => serde_json::json!({
            "deepseek": {
                "api": api_key,
                "baseURL": "https://api.deepseek.com"
            }
        }),
        "anthropic" => serde_json::json!({
            "anthropic": {
                "api": api_key
            }
        }),
        "openai" => serde_json::json!({
            "openai": {
                "api": api_key
            }
        }),
        _ => serde_json::json!({})
    }
}
