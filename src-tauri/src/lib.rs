mod commands;
mod config;
mod marketplace;
mod sidecar;

use sidecar::SidecarManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            let config = config::AppConfig::load(&app_data_dir);

            let sidecar = SidecarManager::new();
            sidecar.set_app_handle(app.handle().clone());
            app.manage(sidecar);
            app.manage(Mutex::new(config));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_server,
            commands::get_server_info,
            commands::save_api_key,
            commands::get_api_key,
            commands::list_skills,
            commands::delete_skill,
            commands::import_skills_zip,
            commands::get_config,
            commands::save_config,
            commands::restart_server,
            commands::get_models,
            commands::save_file_to_temp,
            commands::check_for_updates,
            commands::install_marketplace_skill,
            commands::browse_marketplace,
            commands::set_marketplace_url,
            commands::get_update_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
