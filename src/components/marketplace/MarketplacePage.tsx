import { useState, useEffect } from "react"
import { SkillCard } from "./SkillCard"
import { SkillDetail } from "./SkillDetail"
import { useUpdates } from "../../hooks/useUpdates"
import { browseMarketplace, installMarketplaceSkill, listSkills } from "../../lib/tauri"
import type { MarketplaceSkill, SkillInfo } from "../../types/skill"

interface MarketplacePageProps {
  onClose: () => void
}

export function MarketplacePage({ onClose }: MarketplacePageProps) {
  const [skills, setSkills] = useState<MarketplaceSkill[]>([])
  const [installedSkills, setInstalledSkills] = useState<SkillInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSkill, setSelectedSkill] = useState<MarketplaceSkill | null>(null)
  const [installingSkillId, setInstallingSkillId] = useState<string | null>(null)
  const { updates } = useUpdates()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setLoading(true)
      const [marketplaceSkills, localSkills] = await Promise.all([
        browseMarketplace(),
        listSkills()
      ])
      setSkills(marketplaceSkills)
      setInstalledSkills(localSkills)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills")
    } finally {
      setLoading(false)
    }
  }

  const filteredSkills = skills.filter((skill) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query)
    )
  })

  const isInstalled = (skillId: string) => {
    return installedSkills.some(s => s.name === skillId)
  }

  const hasUpdate = (skillId: string) => {
    return updates.some(u => u.skill_id === skillId)
  }

  const handleInstall = async (skill: MarketplaceSkill) => {
    try {
      setInstallingSkillId(skill.id)
      await installMarketplaceSkill(skill.id, skill.latest_version)
      await loadSkills()
      alert(`✅ ${skill.name} 安装成功！`)
    } catch (err) {
      console.error("Failed to install skill:", err)
      alert(`❌ 安装失败: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setInstallingSkillId(null)
    }
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skills 商店</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Skills..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Skills 列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSkills.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              {searchQuery ? "没有找到匹配的 Skills" : "暂无可用的 Skills"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onInstall={handleInstall}
                  onViewDetails={setSelectedSkill}
                  isInstalled={isInstalled(skill.id)}
                  hasUpdate={hasUpdate(skill.id)}
                  isInstalling={installingSkillId === skill.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          共 {filteredSkills.length} 个 Skills
        </div>
      </div>

      {/* Skill 详情弹窗 */}
      {selectedSkill && (
        <SkillDetail
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onInstall={handleInstall}
          isInstalled={isInstalled(selectedSkill.id)}
          hasUpdate={hasUpdate(selectedSkill.id)}
        />
      )}
    </div>
  )
}
