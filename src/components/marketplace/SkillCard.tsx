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
}

interface SkillCardProps {
  skill: MarketplaceSkill
  onInstall: (skill: MarketplaceSkill) => void
  onViewDetails: (skill: MarketplaceSkill) => void
  hasUpdate?: boolean
}

export function MarketplaceskillCard({ skill, onInstall, onViewDetails, hasUpdate }: SkillCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{skill.icon || "📦"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{skill.name}</h3>
            {hasUpdate && (
              <span className="px-1.5 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                可更新
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{skill.description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span title="作者">👤 {skill.author}</span>
          <span title="下载次数">📥 {skill.downloads}</span>
          <span title="版本">v{skill.latest_version}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onViewDetails(skill)}
          className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          详情
        </button>
        <button
          onClick={() => onInstall(skill)}
          className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {hasUpdate ? "更新" : "安装"}
        </button>
      </div>

      {skill.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skill.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
          {skill.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
              +{skill.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
