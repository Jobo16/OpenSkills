import type { ToolCall } from "../../types/skill"

interface ToolCallCardProps {
  tool: ToolCall
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const statusIcons = {
    pending: "⏳",
    running: "🔄",
    completed: "✅",
    error: "❌",
  }

  const statusColors = {
    pending: "text-gray-500",
    running: "text-blue-500 animate-spin",
    completed: "text-green-500",
    error: "text-red-500",
  }

  return (
    <div className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-900 rounded px-2 py-1">
      <span className={statusColors[tool.status]}>
        {statusIcons[tool.status]}
      </span>
      <span className="font-mono">{tool.name}</span>
      {tool.output && (
        <span className="text-gray-400 truncate ml-2">{tool.output}</span>
      )}
    </div>
  )
}
