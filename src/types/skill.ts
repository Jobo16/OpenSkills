export interface SkillInfo {
  name: string
  description: string
  icon?: string
  path: string
  version?: string
  author?: string
  source?: 'bundled' | 'user' | 'marketplace'
}

export interface SkillUpdate {
  skill_id: string
  current_version: string
  latest_version: string
  changelog: string
  download_url: string
  size_bytes?: number
  min_app_version?: string
}

export interface UpdateStatus {
  available_updates: number
  last_checked_at?: string
}

export interface MarketplaceSkill {
  id: string
  name: string
  description: string
  icon?: string
  author: string
  homepage?: string
  tags: string[]
  latest_version: string
  downloads: number
}

export interface SkillMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  status: "pending" | "running" | "completed" | "error"
  input?: string
  output?: string
}
