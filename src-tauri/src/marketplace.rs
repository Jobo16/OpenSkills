use crate::config::{AppConfig, SkillInfo, SkillSource};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[derive(Clone, Serialize, Deserialize)]
pub struct MarketplaceCache {
    pub last_checked_at: Option<String>,
    pub marketplace_url: Option<String>,
    pub installed_skills: HashMap<String, InstalledSkillInfo>,
    pub known_skills: Vec<KnownSkillInfo>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct InstalledSkillInfo {
    pub installed_version: String,
    pub installed_at: String,
    pub source: String,
    pub checksum: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct KnownSkillInfo {
    pub id: String,
    pub latest_version: String,
    pub name: String,
    pub description: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SkillUpdate {
    pub skill_id: String,
    pub current_version: String,
    pub latest_version: String,
    pub changelog: String,
    pub download_url: String,
    pub checksum: String,
    pub size_bytes: u64,
    pub min_app_version: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateManifest {
    pub updates: Vec<SkillUpdate>,
    pub removed: Vec<String>,
    pub timestamp: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct MarketplaceSkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: Option<String>,
    pub author: String,
    pub homepage: Option<String>,
    pub tags: Vec<String>,
    pub latest_version: String,
    pub downloads: u64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateStatus {
    pub available_updates: usize,
    pub last_checked_at: Option<String>,
    pub marketplace_url: Option<String>,
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
            marketplace_url: None,
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

pub async fn check_for_updates(
    config: &AppConfig,
    app_version: &str,
) -> Result<Vec<SkillUpdate>, String> {
    let marketplace_url = config
        .marketplace_url
        .as_ref()
        .ok_or("Marketplace URL not configured")?;

    let app_data_dir = config.get_app_data_dir();
    let cache = MarketplaceCache::load(app_data_dir);

    let installed_versions: HashMap<String, String> = config
        .discover_skills()?
        .into_iter()
        .filter_map(|skill| {
            skill.version.map(|v| (skill.name.clone(), v))
        })
        .collect();

    let client = Client::new();
    let response = client
        .post(format!("{}/api/skills/updates", marketplace_url))
        .json(&serde_json::json!({
            "installed": installed_versions,
            "app_version": app_version,
        }))
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to check for updates: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Server returned error status: {}",
            response.status()
        ));
    }

    let manifest: UpdateManifest = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse update manifest: {}", e))?;

    let mut updated_cache = cache;
    updated_cache.last_checked_at = Some(get_timestamp());
    updated_cache.known_skills = manifest
        .updates
        .iter()
        .map(|u| KnownSkillInfo {
            id: u.skill_id.clone(),
            latest_version: u.latest_version.clone(),
            name: u.skill_id.clone(),
            description: u.changelog.clone(),
        })
        .collect();
    updated_cache.save(app_data_dir)?;

    Ok(manifest.updates)
}

pub async fn install_skill(
    config: &AppConfig,
    skill_id: &str,
    version: &str,
    download_url: &str,
    checksum: &str,
) -> Result<SkillInfo, String> {
    let app_data_dir = config.get_app_data_dir();
    let skills_dir = app_data_dir.join("skills");
    fs::create_dir_all(&skills_dir).map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir().join("ai-toolbox-skills");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let zip_path = temp_dir.join(format!("{}-{}.zip", skill_id, version));

    let client = Client::new();
    let response = client
        .get(download_url)
        .timeout(Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("Failed to download skill: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to download skill: HTTP {}",
            response.status()
        ));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let calculated_checksum = format!("{:x}", hasher.finalize());

    if calculated_checksum != checksum {
        fs::remove_file(&zip_path).ok();
        return Err(format!(
            "Checksum mismatch: expected {}, got {}",
            checksum, calculated_checksum
        ));
    }

    fs::write(&zip_path, &bytes).map_err(|e| e.to_string())?;

    let reader = std::io::Cursor::new(&bytes);
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

    let skill_md = target_dir.join("SKILL.md");
    if !skill_md.exists() {
        fs::remove_dir_all(&target_dir).ok();
        fs::remove_file(&zip_path).ok();
        return Err("Invalid skill package: missing SKILL.md".to_string());
    }

    let content = fs::read_to_string(&skill_md).map_err(|e| e.to_string())?;
    let skill = AppConfig::parse_skill_md(&content, &target_dir)
        .ok_or("Failed to parse SKILL.md")?;

    let mut cache = MarketplaceCache::load(app_data_dir);
    cache.installed_skills.insert(
        skill_id.to_string(),
        InstalledSkillInfo {
            installed_version: version.to_string(),
            installed_at: get_timestamp(),
            source: "marketplace".to_string(),
            checksum: Some(checksum.to_string()),
        },
    );
    cache.save(app_data_dir)?;

    fs::remove_file(&zip_path).ok();

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

pub fn backup_skill(
    config: &AppConfig,
    skill_name: &str,
    version: &str,
) -> Result<(), String> {
    let app_data_dir = config.get_app_data_dir();
    let skills_dir = app_data_dir.join("skills");
    let skill_dir = skills_dir.join(skill_name);

    if !skill_dir.exists() {
        return Err(format!("Skill '{}' not found", skill_name));
    }

    let backups_dir = app_data_dir
        .join("marketplace")
        .join("backups");
    fs::create_dir_all(&backups_dir).map_err(|e| e.to_string())?;

    let backup_dir = backups_dir.join(format!("{}-{}", skill_name, version));
    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    }

    copy_dir_recursive(&skill_dir, &backup_dir)?;

    Ok(())
}

pub fn restore_skill(
    config: &AppConfig,
    skill_name: &str,
    version: &str,
) -> Result<SkillInfo, String> {
    let app_data_dir = config.get_app_data_dir();
    let backups_dir = app_data_dir
        .join("marketplace")
        .join("backups");
    let backup_dir = backups_dir.join(format!("{}-{}", skill_name, version));

    if !backup_dir.exists() {
        return Err(format!(
            "No backup found for skill '{}' version '{}'",
            skill_name, version
        ));
    }

    let skills_dir = app_data_dir.join("skills");
    let skill_dir = skills_dir.join(skill_name);

    if skill_dir.exists() {
        fs::remove_dir_all(&skill_dir).map_err(|e| e.to_string())?;
    }

    copy_dir_recursive(&backup_dir, &skill_dir)?;

    let skill_md = skill_dir.join("SKILL.md");
    if !skill_md.exists() {
        return Err("Backup is missing SKILL.md".to_string());
    }

    let content = fs::read_to_string(&skill_md).map_err(|e| e.to_string())?;
    let skill = AppConfig::parse_skill_md(&content, &skill_dir)
        .ok_or("Failed to parse restored SKILL.md")?;

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

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;

    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
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
