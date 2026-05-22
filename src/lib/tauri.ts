import type { SkillInfo, SkillUpdate, UpdateStatus, MarketplaceSkill } from "../types/skill"

// 检测是否在 Tauri 环境中
const isTauri = () => "__TAURI_INTERNALS__" in window

// 动态导入 Tauri API
async function getInvoke() {
  if (!isTauri()) return null
  const { invoke } = await import("@tauri-apps/api/core")
  return invoke
}

export interface ServerInfo {
  url: string
  username: string
  password: string
}

export interface AppConfig {
  api_key: string | null
  bundled_api_key: string | null
  provider: string
  model: string
  skills_paths: string[]
  marketplace_url: string | null
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  requiresApiKey: boolean
}

// 浏览器模式下的 mock 数据
const MOCK_SKILLS: SkillInfo[] = [
  {
    name: "hello-world",
    description: "简单测试 skill。当用户说你好或测试时使用。",
    icon: "👋",
    path: "resources/skills/hello-world/SKILL.md",
    source: "bundled",
  },
  {
    name: "question-bank-uploader",
    description: "将 xlsx 题库文件解析并上传到题库系统。",
    icon: "📚",
    path: "resources/skills/question-bank-uploader/SKILL.md",
    source: "bundled",
  },
  {
    name: "code-reviewer",
    description: "代码审查工具。审查代码质量、安全性和最佳实践。",
    icon: "🔍",
    path: "resources/skills/code-reviewer/SKILL.md",
    source: "bundled",
  },
  {
    name: "data-processor",
    description: "数据处理工具。处理 CSV、JSON 等数据文件。",
    icon: "📊",
    path: "resources/skills/data-processor/SKILL.md",
    source: "bundled",
  },
]

/// 启动 OpenCode server
export async function startServer(): Promise<ServerInfo> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<ServerInfo>("start_server")
}

/// 获取 server 信息
export async function getServerInfo(): Promise<ServerInfo> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<ServerInfo>("get_server_info")
}

/// 保存 API key
export async function saveApiKey(key: string): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke("save_api_key", { key })
}

/// 获取 API key
export async function getApiKey(): Promise<string | null> {
  const invoke = await getInvoke()
  if (!invoke) return null
  return invoke<string | null>("get_api_key")
}

/// 获取可用 skill 列表
export async function listSkills(): Promise<SkillInfo[]> {
  const invoke = await getInvoke()
  if (!invoke) return MOCK_SKILLS
  return invoke<SkillInfo[]>("list_skills")
}

/// 删除 skill
export async function deleteSkill(name: string): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke("delete_skill", { name })
}

/// 从 zip 导入 skills
export async function importSkillsZip(zipContent: number[]): Promise<SkillInfo[]> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<SkillInfo[]>("import_skills_zip", { zipContent })
}

/// 获取所有配置
export async function getConfig(): Promise<AppConfig> {
  const invoke = await getInvoke()
  if (!invoke) {
    return {
      api_key: null,
      bundled_api_key: null,
      provider: "opencode",
      model: "opencode/deepseek-v4-flash-free",
      skills_paths: [],
      marketplace_url: "https://github.com/Jobo16/skills-kit",
    }
  }
  return invoke<AppConfig>("get_config")
}

/// 保存配置
export async function saveConfig(config: AppConfig): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke("save_config", { newConfig: config })
}

/// 重启 server（配置变更后调用）
export async function restartServer(): Promise<ServerInfo> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<ServerInfo>("restart_server")
}

/// 获取可用模型列表
export async function getModels(): Promise<ModelInfo[]> {
  const invoke = await getInvoke()
  if (!invoke) {
    return [
      { id: "opencode/deepseek-v4-flash-free", name: "DeepSeek V4 Flash (免费)", provider: "opencode", requiresApiKey: false },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "deepseek", requiresApiKey: true },
      { id: "deepseek-chat", name: "DeepSeek Chat", provider: "deepseek", requiresApiKey: true },
    ]
  }
  return invoke<ModelInfo[]>("get_models")
}

/// 保存文件到临时目录，返回 file:// URL
export async function saveFileToTemp(fileName: string, fileContent: number[]): Promise<string> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<string>("save_file_to_temp", { fileName, fileContent })
}

/// 检查 marketplace 更新
export async function checkForUpdates(): Promise<SkillUpdate[]> {
  const invoke = await getInvoke()
  if (!invoke) return []
  return invoke<SkillUpdate[]>("check_for_updates")
}

/// 从 marketplace 安装 skill
export async function installMarketplaceSkill(
  skillId: string,
  version: string,
): Promise<SkillInfo> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke<SkillInfo>("install_marketplace_skill", {
    skillId,
    version,
  })
}

/// 浏览 marketplace skills
export async function browseMarketplace(
  query?: string,
  tag?: string,
): Promise<MarketplaceSkill[]> {
  const invoke = await getInvoke()
  if (!invoke) {
    // 返回 mock 数据
    return [
      {
        id: "question-bank-uploader",
        name: "题库上传工具",
        description: "将 xlsx 题库文件解析并上传到题库系统",
        icon: "📚",
        author: "jobo",
        latest_version: "1.2.0",
      },
      {
        id: "code-reviewer",
        name: "代码审查工具",
        description: "代码审查工具。审查代码质量、安全性和最佳实践",
        icon: "🔍",
        author: "jobo",
        latest_version: "1.0.0",
      },
    ]
  }
  return invoke<MarketplaceSkill[]>("browse_marketplace", { query, tag })
}

/// 设置 marketplace URL
export async function setMarketplaceUrl(url: string): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error("Tauri 环境不可用")
  return invoke("set_marketplace_url", { url })
}

/// 获取更新状态
export async function getUpdateStatus(): Promise<UpdateStatus> {
  const invoke = await getInvoke()
  if (!invoke) {
    return {
      available_updates: 0,
      last_checked_at: undefined,
    }
  }
  return invoke<UpdateStatus>("get_update_status")
}
