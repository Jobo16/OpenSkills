import type { MarketplaceSkill } from "../../types/skill"

interface SkillDetailProps {
  skill: MarketplaceSkill
  onClose: () => void
  onInstall: (skill: MarketplaceSkill) => void
  isInstalled: boolean
  hasUpdate: boolean
}

export function SkillDetail({ skill, onClose, onInstall, isInstalled, hasUpdate }: SkillDetailProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{skill.icon || "📦"}</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{skill.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">v{skill.latest_version}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 描述 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">描述</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{skill.description}</p>
          </div>

          {/* 链接 */}
          {skill.homepage && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">链接</h3>
              <a
                href={skill.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                {skill.homepage}
              </a>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onInstall(skill)}
            className={`w-full px-4 py-3 text-white rounded-lg font-medium transition-colors ${
              hasUpdate
                ? "bg-green-500 hover:bg-green-600"
                : isInstalled
                ? "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {hasUpdate
              ? "更新"
              : isInstalled
              ? "已安装"
              : "安装"}
          </button>
        </div>
      </div>
    </div>
  )
}
