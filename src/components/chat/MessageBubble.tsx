import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import type { Message, Part } from "../../hooks/useSession"
import { ToolCallCard } from "../progress/ToolCallCard"

interface MessageBubbleProps {
  message: Message
  parts: Part[]
}

export function MessageBubble({ message, parts }: MessageBubbleProps) {
  const isUser = message.role === "user"

  // 过滤出要渲染的 parts
  const textParts = parts.filter(p => p.type === "text")
  const toolParts = parts.filter(p => p.type === "tool")

  // 用户消息直接显示
  if (isUser) {
    const userText = textParts.map(p => p.text || "").join("")
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-blue-500 text-white overflow-hidden">
          <div className="whitespace-pre-wrap break-words text-sm">{userText}</div>
        </div>
      </div>
    )
  }

  // 助手消息：渲染 parts
  const hasContent = textParts.length > 0 || toolParts.length > 0

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
        {!hasContent && (
          <span className="text-gray-400 text-sm">思考中...</span>
        )}

        {/* 文本 parts */}
        {textParts.map(part => (
          <div key={part.id} className="prose prose-sm dark:prose-invert max-w-none break-words">
            {part.text ? (
              <Markdown rehypePlugins={[rehypeHighlight]}>{part.text}</Markdown>
            ) : (
              <span className="animate-pulse text-gray-400">...</span>
            )}
          </div>
        ))}

        {/* 工具调用 parts */}
        {toolParts.length > 0 && (
          <div className="mt-3 space-y-2">
            {toolParts.map(tool => (
              <ToolCallCard
                key={tool.id}
                tool={{
                  id: tool.id,
                  name: tool.tool || "unknown",
                  status: (tool.state?.status as any) || "running",
                  input: tool.state?.input ? JSON.stringify(tool.state.input) : undefined,
                  output: tool.state?.output,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
