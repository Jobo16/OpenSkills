import { useState, useRef, useEffect, useCallback } from "react"
import type { Session } from "../../hooks/useSession"

interface SidebarProps {
  sessions: Session[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onUpdateTitle: (id: string, title: string) => void
  onDeleteSession: (id: string) => void
  onOpenSettings: () => void
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onUpdateTitle,
  onDeleteSession,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = [...sessions].sort((a, b) => {
    const ta = a.time?.updated || a.time?.created || 0
    const tb = b.time?.updated || b.time?.created || 0
    return tb - ta
  })

  // 进入编辑模式
  const startEdit = useCallback((session: Session) => {
    setEditingId(session.id)
    setEditValue(session.title || "")
  }, [])

  // 提交编辑
  const commitEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onUpdateTitle(editingId, editValue.trim())
    }
    setEditingId(null)
  }, [editingId, editValue, onUpdateTitle])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  // 自动聚焦输入框
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  return (
    <div className="w-60 h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* 新会话 */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 新会话
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1">会话</div>
        {sorted.length === 0 ? (
          <div className="text-sm text-gray-400 px-2 py-2">暂无会话</div>
        ) : (
          sorted.map(session => (
            <div
              key={session.id}
              className={`group w-full text-left px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
                session.id === currentSessionId
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {editingId === session.id ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => {
                    if (e.key === "Enter") commitEdit()
                    if (e.key === "Escape") cancelEdit()
                  }}
                  className="w-full bg-white dark:bg-gray-800 text-sm px-1 py-0.5 rounded border border-blue-400 outline-none"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <div
                    className="flex-1 truncate cursor-pointer"
                    onClick={() => onSelectSession(session.id)}
                    onDoubleClick={() => startEdit(session)}
                    title="双击编辑名称"
                  >
                    {session.title || "新会话"}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                    title="删除会话"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 设置按钮 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          设置
        </button>
      </div>
    </div>
  )
}
