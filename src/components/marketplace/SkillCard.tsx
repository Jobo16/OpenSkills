import type { MarketplaceSkill } from "../../types/skill"

interface SkillCardProps {
  skill: MarketplaceSkill
  onInstall: (skill: MarketplaceSkill) => void
  onViewDetails: (skill: MarketplaceSkill) => void
  isInstalled: boolean
  hasUpdate: boolean
  isInstalling: boolean
}

export function SkillCard({ skill, onInstall, onViewDetails, isInstalled, hasUpdate, isInstalling }: SkillCardProps) {
  const getButtonText = () => {
    if (isInstalling) return "安装中..."
    if (hasUpdate) return "更新"
    if (isInstalled) return "已安装"
    return "安装"
  }

  const getButtonStyle = () => {
    if (isInstalling) {
      return "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-wait"
    }
    if (hasUpdate) {
      return "bg-green-500 text-white hover:bg-green-600"
    }
    if (isInstalled) {
      return "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
    }
    return "bg-blue-500 text-white hover:bg-blue-600"
  }

  return (
    <div
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(skill)}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl flex-shrink-0">{skill.icon || "📦"}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{skill.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{skill.description}</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isInstalling) {
                onInstall(skill)
              }
            }}
            disabled={isInstalling}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getButtonStyle()}`}
          >
            {isInstalling && (
              <span className="inline-block animate-spin mr-1">⟳</span>
            )}
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  )
}
