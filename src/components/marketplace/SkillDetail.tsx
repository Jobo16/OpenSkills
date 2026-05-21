interface MarketplaceSkill {
  id: string
  name: string
  description: string
  icon?: string
  author: string
  homepage?: string
  tags: string[]
  latest_version: string
  downloads: number
  created_at: string
  updated_at: string
  versions?: Array<{
    version: string
    min_app_version: string
    changelog: string
    published_at: string
  }>
}

interface SkillDetailProps {
  skill: MarketplaceSkill
  onClose: () => void
  onInstall: (skill: MarketplaceSkill) => void
}

export function SkillDetail({ skill, onClose, onInstall }: SkillDetailProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{skill.icon || "📦"}</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{skill.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">v{skill.latest_version} · {skill.author}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <p className="text-gray-600 dark:text-gray-400">{skill.description}</p>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{skill.downloads}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">下载次数</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{skill.versions?.length || 1}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">版本数</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{skill.tags.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">标签数</div>
            </div>
          </div>

          {/* 标签 */}
          {skill.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">标签</h3>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 版本历史 */}
          {skill.versions && skill.versions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">版本历史</h3>
              <div className="space-y-3">
                {skill.versions.slice().reverse().map((version, index) => (
                  <div
                    key={version.version}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        v{version.version}
                        {index === 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-green-600 bg-green-100 rounded">
                            最新
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(version.published_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    {version.changelog && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{version.changelog}</p>
                    )}
                    {version.min_app_version && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        需要应用版本 ≥ {version.min_app_version}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* 时间信息 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>创建时间: {new Date(skill.created_at).toLocaleString("zh-CN")}</p>
            <p>最后更新: {new Date(skill.updated_at).toLocaleString("zh-CN")}</p>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={() => onInstall(skill)}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            安装 v{skill.latest_version}
          </button>
        </div>
      </div>
    </div>
  )
}
