export interface SkillInfo {
  name: string
  description: string
  icon?: string
  path: string
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
