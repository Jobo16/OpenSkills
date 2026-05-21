import { useRef } from "react"
import { deleteSkill, importSkillsZip } from "../../lib/tauri"
import { useUpdates } from "../../hooks/useUpdates"

interface Skill {
  name: string
  description?: string
  location?: string
  version?: string
}

interface SkillPickerProps {
  skills: Skill[]
  onSelect: (name: string) => void
  onClose: () => void
  onRefresh: () => void
}

export function SkillPicker({ skills, onSelect, onClose, onRefresh }: SkillPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updates } = useUpdates()

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const zipContent = Array.from(new Uint8Array(arrayBuffer))
      await importSkillsZip(zipContent)
      onRefresh()
    } catch (err) {
      console.error("Failed to import skills:", err)
    }

    // 重置 input 以便再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await deleteSkill(name)
      onRefresh()
    } catch (err) {
      console.error("Failed to delete skill:", err)
    }
  }

  const hasUpdate = (skillName: string) => {
    return updates.some(u => u.skill_id === skillName)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-96 max-h-[60vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">选择 Skill</h3>
            <p className="text-xs text-gray-400 mt-1">选择一个 skill 开始对话</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {skills.length === 0 ? (
            <div className="text-sm text-gray-400 p-4 text-center">暂无可用 skills</div>
          ) : (
            skills.map(skill => (
              <div
                key={skill.name}
                className="group w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start gap-2 cursor-pointer"
                onClick={() => { onSelect(skill.name); onClose() }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    {hasUpdate(skill.name) && (
                      <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                        可更新
                      </span>
                    )}
                  </div>
                  {skill.description && (
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{skill.description}</div>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(skill.name, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0 mt-0.5"
                  title="删除 skill"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
