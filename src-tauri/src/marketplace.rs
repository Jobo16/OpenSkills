use crate::config::{AppConfig, SkillInfo, SkillSource};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::env;
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

// 默认的 Skills 仓库 URL
const DEFAULT_SKILLS_REPO: &str = "https://github.com/Jobo16/skills-kit";

/// 创建支持代理的 HTTP 客户端
fn create_http_client(timeout_secs: u64) -> Result<Client, String> {
    let mut builder = Client::builder()
        .timeout(Duration::from_secs(timeout_secs));

    // 检测系统代理环境变量
    if let Ok(proxy_url) = env::var("https_proxy").or_else(|_| env::var("HTTPS_PROXY")) {
        eprintln!("🌐 Using proxy: {}", proxy_url);
        let proxy = reqwest::Proxy::https(&proxy_url)
            .map_err(|e| format!("Failed to create proxy: {}", e))?;
        builder = builder.proxy(proxy);
    } else if let Ok(proxy_url) = env::var("http_proxy").or_else(|_| env::var("HTTP_PROXY")) {
        eprintln!("🌐 Using proxy: {}", proxy_url);
        let proxy = reqwest::Proxy::http(&proxy_url)
            .map_err(|e| format!("Failed to create proxy: {}", e))?;
        builder = builder.proxy(proxy);
    } else {
        eprintln!("⚠️ No proxy configured, trying direct connection");
    }

    builder.build().map_err(|e| format!("Failed to create HTTP client: {}", e))
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MarketplaceCache {
    pub last_checked_at: Option<String>,
    pub installed_skills: HashMap<String, InstalledSkillInfo>,
    pub known_skills: Vec<KnownSkillInfo>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct InstalledSkillInfo {
    pub installed_version: String,
    pub installed_at: String,
    pub source: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct KnownSkillInfo {
    pub id: String,
    pub latest_version: String,
    pub name: String,
    pub description: String,
}

// GitHub 仓库中的 skills.json 结构
#[derive(Clone, Serialize, Deserialize)]
pub struct SkillsManifest {
    pub skills: Vec<ManifestSkill>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ManifestSkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: Option<String>,
    pub author: String,
    pub version: String,
    pub path: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SkillUpdate {
    pub skill_id: String,
    pub current_version: String,
    pub latest_version: String,
    pub changelog: String,
    pub download_url: String,
    pub size_bytes: Option<u64>,
    pub min_app_version: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MarketplaceSkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: Option<String>,
    pub author: String,
    pub latest_version: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub available_updates: usize,
    pub last_checked_at: Option<String>,
}

impl MarketplaceCache {
    pub fn load(app_data_dir: &PathBuf) -> Self {
        let cache_dir = app_data_dir.join("marketplace");
        let cache_path = cache_dir.join("cache.json");

        if cache_path.exists() {
            let data = fs::read_to_string(&cache_path).unwrap_or_default();
            serde_json::from_str(&data).unwrap_or_else(|_| Self::new())
        } else {
            Self::new()
        }
    }

    pub fn save(&self, app_data_dir: &PathBuf) -> Result<(), String> {
        let cache_dir = app_data_dir.join("marketplace");
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

        let cache_path = cache_dir.join("cache.json");
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&cache_path, json).map_err(|e| e.to_string())?;

        Ok(())
    }

    fn new() -> Self {
        Self {
            last_checked_at: None,
            installed_skills: HashMap::new(),
            known_skills: Vec::new(),
        }
    }
}

pub fn parse_semver(v: &str) -> Option<(u32, u32, u32)> {
    let parts: Vec<&str> = v.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let major = parts[0].parse::<u32>().ok()?;
    let minor = parts[1].parse::<u32>().ok()?;
    let patch = parts[2].parse::<u32>().ok()?;
    Some((major, minor, patch))
}

pub fn semver_gt(a: &str, b: &str) -> bool {
    match (parse_semver(a), parse_semver(b)) {
        (Some(a), Some(b)) => a > b,
        _ => false,
    }
}

/// 从 GitHub 仓库获取 skills 清单
async fn fetch_skills_manifest(repo_url: &str) -> Result<SkillsManifest, String> {
    eprintln!("🔍 Fetching skills manifest from: {}", repo_url);

    let client = create_http_client(30)?;

    let raw_url = format!("{}/raw/main/skills.json", repo_url);
    eprintln!("📡 Requesting URL: {}", raw_url);

    let response = client
        .get(&raw_url)
        .send()
        .await
        .map_err(|e| {
            eprintln!("❌ Failed to send request: {}", e);
            if let Some(source) = e.source() {
                eprintln!("❌ Source: {}", source);
            }
            format!("Failed to fetch skills manifest: {}", e)
        })?;

    eprintln!("📥 Response status: {}", response.status());

    if !response.status().is_success() {
        let error_msg = format!(
            "Failed to fetch manifest: HTTP {}",
            response.status()
        );
        eprintln!("❌ {}", error_msg);
        return Err(error_msg);
    }

    let manifest: SkillsManifest = response
        .json()
        .await
        .map_err(|e| {
            eprintln!("❌ Failed to parse skills manifest: {}", e);
            format!("Failed to parse skills manifest: {}", e)
        })?;

    eprintln!("✅ Successfully fetched {} skills", manifest.skills.len());
    Ok(manifest)
}

/// 从 GitHub 下载 skill ZIP
async fn download_skill_zip(repo_url: &str, _skill_path: &str) -> Result<Vec<u8>, String> {
    let client = create_http_client(120)?;

    let zip_url = format!("{}/archive/main.zip", repo_url);
    eprintln!("📥 Downloading ZIP from: {}", zip_url);

    let response = client
        .get(&zip_url)
        .send()
        .await
        .map_err(|e| {
            eprintln!("❌ Failed to download skill ZIP: {}", e);
            format!("Failed to download skill ZIP: {}", e)
        })?;

    if !response.status().is_success() {
        let error_msg = format!("Failed to download ZIP: HTTP {}", response.status());
        eprintln!("❌ {}", error_msg);
        return Err(error_msg);
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    Ok(bytes.to_vec())
}

/// 从已安装的 skills 中提取版本信息
fn get_installed_versions(config: &AppConfig) -> Result<HashMap<String, String>, String> {
    Ok(config
        .discover_skills()?
        .into_iter()
        .filter_map(|skill| skill.version.map(|v| (skill.name.clone(), v)))
        .collect())
}

/// 检查更新
pub async fn check_for_updates(
    config: &AppConfig,
    _app_version: &str,
) -> Result<Vec<SkillUpdate>, String> {
    let repo_url = config
        .marketplace_url
        .as_deref()
        .unwrap_or(DEFAULT_SKILLS_REPO);

    let app_data_dir = config.get_app_data_dir();
    let cache = MarketplaceCache::load(app_data_dir);
    let installed_versions = get_installed_versions(config)?;

    let manifest = fetch_skills_manifest(repo_url).await?;

    let mut updates = Vec::new();

    for remote_skill in &manifest.skills {
        if let Some(current_version) = installed_versions.get(&remote_skill.id) {
            if semver_gt(&remote_skill.version, current_version) {
                updates.push(SkillUpdate {
                    skill_id: remote_skill.id.clone(),
                    current_version: current_version.clone(),
                    latest_version: remote_skill.version.clone(),
                    changelog: format!("Update to version {}", remote_skill.version),
                    download_url: format!(
                        "{}/archive/refs/heads/main.zip",
                        repo_url
                    ),
                    size_bytes: None,
                    min_app_version: None,
                });
            }
        }
    }

    let mut updated_cache = cache;
    updated_cache.last_checked_at = Some(get_timestamp());
    updated_cache.known_skills = manifest
        .skills
        .into_iter()
        .map(|s| KnownSkillInfo {
            id: s.id,
            latest_version: s.version,
            name: s.name,
            description: s.description,
        })
        .collect();
    updated_cache.save(app_data_dir)?;

    Ok(updates)
}

/// 安装 skill
pub async fn install_skill(
    config: &AppConfig,
    skill_id: &str,
    version: &str,
) -> Result<SkillInfo, String> {
    eprintln!("📦 Starting installation of skill: {} v{}", skill_id, version);

    let repo_url = config
        .marketplace_url
        .as_deref()
        .unwrap_or(DEFAULT_SKILLS_REPO);

    let app_data_dir = config.get_app_data_dir();
    let skills_dir = app_data_dir.join("skills");
    fs::create_dir_all(&skills_dir).map_err(|e| e.to_string())?;

    eprintln!("🔍 Fetching skill info from repository...");
    let manifest = fetch_skills_manifest(repo_url).await?;
    let remote_skill = manifest
        .skills
        .iter()
        .find(|s| s.id == skill_id)
        .ok_or_else(|| {
            let msg = format!("Skill '{}' not found in repository", skill_id);
            eprintln!("❌ {}", msg);
            msg
        })?;

    if remote_skill.version != version {
        let msg = format!(
            "Version mismatch: requested {} but found {}",
            version, remote_skill.version
        );
        eprintln!("❌ {}", msg);
        return Err(msg);
    }

    eprintln!("📥 Downloading skill package...");
    let zip_bytes = download_skill_zip(repo_url, &remote_skill.path).await?;
    eprintln!("✅ Download complete ({} bytes)", zip_bytes.len());

    let temp_dir = std::env::temp_dir().join("ai-toolbox-skills");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let zip_path = temp_dir.join(format!("{}-{}.zip", skill_id, version));
    fs::write(&zip_path, &zip_bytes).map_err(|e| e.to_string())?;

    eprintln!("📂 Extracting files...");
    let reader = std::io::Cursor::new(&zip_bytes);
    let mut archive =
        zip::ZipArchive::new(reader).map_err(|e| format!("Invalid ZIP file: {}", e))?;

    let target_dir = skills_dir.join(skill_id);
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    archive
        .extract(&target_dir)
        .map_err(|e| format!("Failed to extract ZIP: {}", e))?;

    // GitHub ZIP 解压后会多一层目录，需要处理
    let inner_dir = target_dir.join(format!("skills-kit-main/skills/{}", skill_id));
    if inner_dir.exists() {
        eprintln!("📁 Reorganizing directory structure...");
        for entry in fs::read_dir(&inner_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let src_path = entry.path();
            let dst_path = target_dir.join(entry.file_name());
            if src_path.is_dir() {
                fs::rename(&src_path, &dst_path).map_err(|e| e.to_string())?;
            } else {
                fs::copy(&src_path, &dst_path).map_err(|e| e.to_string())?;
            }
        }
        let _ = fs::remove_dir_all(target_dir.join("skills-kit-main"));
    }

    let skill_md = target_dir.join("SKILL.md");
    if !skill_md.exists() {
        eprintln!("❌ Invalid skill package: missing SKILL.md");
        fs::remove_dir_all(&target_dir).ok();
        fs::remove_file(&zip_path).ok();
        return Err("Invalid skill package: missing SKILL.md".to_string());
    }

    eprintln!("✅ Found SKILL.md, parsing...");
    let content = fs::read_to_string(&skill_md).map_err(|e| e.to_string())?;
    let skill =
        AppConfig::parse_skill_md(&content, &target_dir).ok_or("Failed to parse SKILL.md")?;

    eprintln!("💾 Updating cache...");
    let mut cache = MarketplaceCache::load(app_data_dir);
    cache.installed_skills.insert(
        skill_id.to_string(),
        InstalledSkillInfo {
            installed_version: version.to_string(),
            installed_at: get_timestamp(),
            source: "github".to_string(),
        },
    );
    cache.save(app_data_dir)?;

    fs::remove_file(&zip_path).ok();

    eprintln!("✅ Successfully installed skill: {} v{}", skill.name, version);
    Ok(SkillInfo {
        name: skill.name,
        description: skill.description,
        icon: skill.icon,
        path: skill.path,
        version: Some(version.to_string()),
        author: skill.author,
        source: SkillSource::Marketplace,
    })
}

/// 获取所有可用的 marketplace skills
pub async fn browse_marketplace(
    config: &AppConfig,
    _query: Option<String>,
    _tag: Option<String>,
) -> Result<Vec<MarketplaceSkill>, String> {
    let repo_url = config
        .marketplace_url
        .as_deref()
        .unwrap_or(DEFAULT_SKILLS_REPO);

    let manifest = fetch_skills_manifest(repo_url).await?;

    let skills = manifest
        .skills
        .into_iter()
        .map(|s| MarketplaceSkill {
            id: s.id,
            name: s.name,
            description: s.description,
            icon: s.icon,
            author: s.author,
            latest_version: s.version,
        })
        .collect();

    Ok(skills)
}

pub fn get_update_status(config: &AppConfig) -> Result<UpdateStatus, String> {
    let app_data_dir = config.get_app_data_dir();
    let cache = MarketplaceCache::load(app_data_dir);

    let installed_versions = get_installed_versions(config)?;
    let updates_available = cache
        .known_skills
        .iter()
        .filter(|known| {
            installed_versions
                .get(&known.id)
                .map(|v| semver_gt(&known.latest_version, v))
                .unwrap_or(false)
        })
        .count();

    Ok(UpdateStatus {
        available_updates: updates_available,
        last_checked_at: cache.last_checked_at,
    })
}

fn get_timestamp() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    let dt = chrono::DateTime::from_timestamp(secs as i64, 0)
        .unwrap_or_default();
    dt.to_rfc3339()
}
