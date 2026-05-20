import { useState, useRef, useCallback } from "react"

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  onShowSkillPicker: () => void
  onCancelCommand: () => void
  isProcessing: boolean
  pendingCommand: string | null
}

export function ChatInput({ onSend, onStop, onShowSkillPicker, onCancelCommand, isProcessing, pendingCommand }: ChatInputProps) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isProcessing) return
    onSend(trimmed)
    setText("")
    textareaRef.current?.focus()
  }, [text, isProcessing, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className="space-y-2">
      {/* 选中的 skill 标签 */}
      {pendingCommand && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm w-fit">
          <span className="text-blue-600 dark:text-blue-400 font-medium">/{pendingCommand}</span>
          <button
            onClick={onCancelCommand}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="取消选择"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        {/* Skills 按钮 */}
        <button
          onClick={onShowSkillPicker}
          className="px-3 py-3 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="选择 Skill"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L9.5 8.5L2 9.5L7 14L5.5 22L12 18L18.5 22L17 14L22 9.5L14.5 8.5L12 2Z"/>
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder={pendingCommand ? `输入 ${pendingCommand} 的参数...` : "输入消息... (Shift+Enter 换行)"}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          rows={2}
        />

        {isProcessing ? (
          <button
            onClick={onStop}
            className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            停止
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!text.trim() && !pendingCommand}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        )}
      </div>
    </div>
  )
}
