import { useState, useEffect } from "react"
import { MarketplaceskillCard } from "./SkillCard"
import { MarketplaceSearch } from "./MarketplaceSearch"
import { SkillDetail } from "./SkillDetail"
import { useUpdates } from "../../hooks/useUpdates"

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

interface MarketplacePageProps {
  onClose: () => void
}

export function MarketplacePage({ onClose }: MarketplacePageProps) {
  const [skills, setSkills] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<MarketplaceSkill | null>(null)
  const { updates, loading: updatesLoading } = useUpdates()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:3000/api/skills")
      if (!response.ok) {
        throw new Error("Failed to fetch skills")
      }
      const data = await response.json()
      setSkills(data.skills || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills")
    } finally {
      setLoading(false)
    }
  }

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      !searchQuery ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTag = !selectedTag || skill.tags.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(skills.flatMap((skill) => skill.tags))).sort()

  const handleInstall = async (skill: MarketplaceSkill) => {
    try {
      // 这里应该调用 Tauri 命令安装 skill
      console.log("Installing skill:", skill.id, skill.latest_version)
      alert(`安装 ${skill.name} v${skill.latest_version}`)
    } catch (err) {
      console.error("Failed to install skill:", err)
    }
  }

  const handleViewDetails = (skill: MarketplaceSkill) => {
    setSelectedSkill(skill)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96">
          <div className="animate-pulse text-gray-400 text-center">加载中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96">
          <div className="text-red-500 text-center mb-4">加载失败</div>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
          <button
            onClick={loadSkills}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Skills Marketplace</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                发现和安装新的 Skills
                {!updatesLoading && updates.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                    {updates.length} 个可更新
                  </span>
                )}
              </p>
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

          {/* 搜索和过滤 */}
          <MarketplaceSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            tags={allTags}
          />
        </div>

        {/* Skills 列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredSkills.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              {searchQuery || selectedTag ? "没有找到匹配的 Skills" : "暂无可用的 Skills"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <MarketplaceskillCard
                  key={skill.id}
                  skill={skill}
                  onInstall={handleInstall}
                  onViewDetails={handleViewDetails}
                  hasUpdate={updates.some((u) => u.skill_id === skill.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          共 {filteredSkills.length} 个 Skills
          {selectedTag && (
            <span className="ml-2">
              · 筛选: {selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-1 text-blue-500 hover:text-blue-600"
              >
                清除
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Skill 详情弹窗 */}
      {selectedSkill && (
        <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} onInstall={handleInstall} />
      )}
    </div>
  )
}
