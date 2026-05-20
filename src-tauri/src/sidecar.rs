use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[derive(Clone, Serialize)]
pub struct ServerInfo {
    pub url: String,
    pub username: String,
    pub password: String,
}

pub struct SidecarManager {
    app_handle: Arc<Mutex<Option<AppHandle>>>,
    server_info: Arc<Mutex<Option<ServerInfo>>>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            app_handle: Arc::new(Mutex::new(None)),
            server_info: Arc::new(Mutex::new(None)),
        }
    }

    /// 在 setup 时注入 AppHandle
    pub fn set_app_handle(&self, handle: AppHandle) {
        *self.app_handle.lock().unwrap() = Some(handle);
    }

    /// 启动 OpenCode server（通过 Tauri shell sidecar）
    pub async fn start(&self, config_json: &str) -> Result<ServerInfo, String> {
        let handle = self
            .app_handle
            .lock()
            .unwrap()
            .clone()
            .ok_or("AppHandle not initialized")?;

        let password = uuid::Uuid::new_v4().to_string();

        // 获取 app 专属数据目录，用于隔离 opencode 实例
        let app_data_dir = handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from("."))
            .join("opencode-data");
        std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
        let data_dir_str = app_data_dir.to_string_lossy().to_string();

        // 通过 shell 插件启动 sidecar，设置隔离环境变量和工作目录
        let (mut rx, _child) = handle
            .shell()
            .sidecar("opencode")
            .map_err(|e| format!("Failed to create sidecar command: {}", e))?
            .args(["serve", "--hostname=127.0.0.1", "--port=0"])
            .env("OPENCODE_CONFIG_CONTENT", config_json)
            // 隔离：禁止 opencode 扫描外部 skills（~/.claude/skills/ 等）
            .env("OPENCODE_DISABLE_EXTERNAL_SKILLS", "1")
            // 隔离：让 opencode 使用 app 专属目录，不读取用户本机配置
            .env("XDG_STATE_HOME", &data_dir_str)
            .env("XDG_CONFIG_HOME", &data_dir_str)
            .env("XDG_DATA_HOME", &data_dir_str)
            .env("HOME", &data_dir_str)
            .current_dir(&app_data_dir)
            .spawn()
            .map_err(|e| format!("Failed to spawn opencode sidecar: {}", e))?;

        // 从 stdout 解析 server URL
        let mut url = None;
        while let Some(event) = rx.recv().await {
            use tauri_plugin_shell::process::CommandEvent;
            match event {
                CommandEvent::Stdout(line) => {
                    let line = String::from_utf8_lossy(&line);
                    if line.contains("opencode server listening on") {
                        url = Some(
                            line.split("listening on ")
                                .nth(1)
                                .unwrap_or("")
                                .trim()
                                .to_string(),
                        );
                        break;
                    }
                }
                CommandEvent::Stderr(line) => {
                    let line = String::from_utf8_lossy(&line);
                    eprintln!("[opencode stderr] {}", line);
                }
                CommandEvent::Terminated(_) => {
                    return Err("opencode process terminated".to_string());
                }
                _ => {}
            }
        }

        let url = url.ok_or("Failed to get server URL from opencode output")?;

        let info = ServerInfo {
            url,
            username: "opencode".to_string(),
            password,
        };

        *self.server_info.lock().unwrap() = Some(info.clone());

        Ok(info)
    }

    /// 获取 server info
    pub fn info(&self) -> Option<ServerInfo> {
        self.server_info.lock().unwrap().clone()
    }

    /// 重启 server（skills 变更后调用）
    pub async fn restart(&self, config_json: &str) -> Result<ServerInfo, String> {
        // 先停止旧 server
        *self.server_info.lock().unwrap() = None;
        // 重新启动
        self.start(config_json).await
    }
}
