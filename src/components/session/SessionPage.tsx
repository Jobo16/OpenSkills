import { useEffect, useRef } from "react"
import { MessageList } from "../chat/MessageList"
import { ChatInput } from "./ChatInput"
import type { Message, Part } from "../../hooks/useSession"

interface SessionPageProps {
  sessionId: string | null
  messages: Message[]
  parts: Record<string, Part[]>
  isProcessing: boolean
  pendingCommand: string | null
  onSend: (text: string) => void
  onStop: () => void
  onCancelCommand: () => void
  onShowSkillPicker: () => void
}

export function SessionPage({
  sessionId,
  messages,
  parts,
  isProcessing,
  pendingCommand,
  onSend,
  onStop,
  onCancelCommand,
  onShowSkillPicker,
}: SessionPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, parts])

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm text-gray-500">
          {sessionId ? "会话" : "新会话"}
        </h2>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">开始对话</p>
              <p className="text-sm">输入消息或点击下方 Skills 按钮选择工具</p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} parts={parts} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          onShowSkillPicker={onShowSkillPicker}
          onCancelCommand={onCancelCommand}
          isProcessing={isProcessing}
          pendingCommand={pendingCommand}
        />
      </div>
    </div>
  )
}
