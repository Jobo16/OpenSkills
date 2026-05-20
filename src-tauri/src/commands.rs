use std::sync::Mutex;
use tauri::State;

use crate::config::{AppConfig, SkillInfo};
use crate::sidecar::{SidecarManager, ServerInfo};

/// 启动 OpenCode server
#[tauri::command]
pub async fn start_server(
    sidecar: State<'_, SidecarManager>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<ServerInfo, String> {
    let config_json = {
        let config = config.lock().map_err(|e| e.to_string())?;
        config.to_opencode_json()
    };
    sidecar.start(&config_json).await
}

/// 获取 server 信息
#[tauri::command]
pub fn get_server_info(
    sidecar: State<'_, SidecarManager>,
) -> Result<ServerInfo, String> {
    sidecar.info().ok_or_else(|| "Server not started".to_string())
}

/// 保存 API key
#[tauri::command]
pub fn save_api_key(
    config: State<'_, Mutex<AppConfig>>,
    key: String,
) -> Result<(), String> {
    let mut config = config.lock().map_err(|e| e.to_string())?;
    config.set_api_key(&key)
}

/// 获取 API key（前端用）
#[tauri::command]
pub fn get_api_key(
    config: State<'_, Mutex<AppConfig>>,
) -> Result<Option<String>, String> {
    let config = config.lock().map_err(|e| e.to_string())?;
    Ok(config.get_api_key())
}

/// 获取可用 skill 列表
#[tauri::command]
pub fn list_skills(
    config: State<'_, Mutex<AppConfig>>,
) -> Result<Vec<SkillInfo>, String> {
    let config = config.lock().map_err(|e| e.to_string())?;
    config.discover_skills()
}

/// 删除 skill（按名称）
#[tauri::command]
pub async fn delete_skill(
    sidecar: State<'_, SidecarManager>,
    config: State<'_, Mutex<AppConfig>>,
    name: String,
) -> Result<(), String> {
    {
        let config = config.lock().map_err(|e| e.to_string())?;
        config.delete_skill(&name)?;
    }
    // 重启 server 让 skills 变更生效
    let config_json = {
        let config = config.lock().map_err(|e| e.to_string())?;
        config.to_opencode_json()
    };
    sidecar.restart(&config_json).await?;
    Ok(())
}

/// 从 zip 导入 skills
#[tauri::command]
pub async fn import_skills_zip(
    sidecar: State<'_, SidecarManager>,
    config: State<'_, Mutex<AppConfig>>,
    zip_content: Vec<u8>,
) -> Result<Vec<SkillInfo>, String> {
    let imported = {
        let mut config = config.lock().map_err(|e| e.to_string())?;
        config.import_skills_zip(&zip_content)?
    };
    // 重启 server 让 skills 变更生效
    let config_json = {
        let config = config.lock().map_err(|e| e.to_string())?;
        config.to_opencode_json()
    };
    sidecar.restart(&config_json).await?;
    Ok(imported)
}

/// 获取所有配置
#[tauri::command]
pub fn get_config(
    config: State<'_, Mutex<AppConfig>>,
) -> Result<AppConfig, String> {
    let config = config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

/// 保存配置
#[tauri::command]
pub fn save_config(
    config: State<'_, Mutex<AppConfig>>,
    new_config: AppConfig,
) -> Result<(), String> {
    let mut config = config.lock().map_err(|e| e.to_string())?;
    *config = new_config;
    config.save_to_disk()
}

/// 重启 server（配置变更后调用）
#[tauri::command]
pub async fn restart_server(
    sidecar: State<'_, SidecarManager>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<ServerInfo, String> {
    let config_json = {
        let config = config.lock().map_err(|e| e.to_string())?;
        config.to_opencode_json()
    };
    sidecar.restart(&config_json).await
}

/// 获取可用模型列表
#[tauri::command]
pub fn get_models() -> Result<Vec<serde_json::Value>, String> {
    Ok(crate::config::get_available_models())
}

/// 保存文件到临时目录，返回 file:// URL
#[tauri::command]
pub fn save_file_to_temp(
    file_name: String,
    file_content: Vec<u8>,
) -> Result<String, String> {
    let temp_dir = std::env::temp_dir().join("ai-toolbox-uploads");
    std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let file_path = temp_dir.join(&file_name);
    std::fs::write(&file_path, &file_content).map_err(|e| e.to_string())?;

    // 返回 file:// URL
    Ok(format!("file://{}", file_path.to_string_lossy()))
}
