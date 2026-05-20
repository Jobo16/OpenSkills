import { useState, useEffect } from "react"
import { getConfig, saveConfig, getModels, restartServer } from "../../lib/tauri"
import type { AppConfig, ModelInfo } from "../../lib/tauri"

interface SettingsModalProps {
  onClose: () => void
  onSaved?: () => void
}

export function SettingsModal({ onClose, onSaved }: SettingsModalProps) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getConfig(), getModels()])
      .then(([cfg, mdl]) => {
        setConfig(cfg)
        setModels(mdl)
        setSelectedModel(cfg.model)
        setApiKey(cfg.api_key || "")
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  const currentModel = models.find(m => m.id === selectedModel)
  const needsApiKey = currentModel?.requiresApiKey ?? false

  const handleSave = async () => {
    if (!config) return
    if (needsApiKey && !apiKey.trim()) {
      setError("该模型需要配置 API Key")
      return
    }

    setSaving(true)
    setError("")

    try {
      const newConfig: AppConfig = {
        ...config,
        model: selectedModel,
        provider: currentModel?.provider || "opencode",
        api_key: needsApiKey ? apiKey.trim() : null,
      }
      await saveConfig(newConfig)
      // 重启 server 使配置生效
      await restartServer()
      onSaved?.()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">设置</h2>

        {/* 模型选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            AI 模型
          </label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} {model.requiresApiKey ? "" : "(无需 API Key)"}
              </option>
            ))}
          </select>
        </div>

        {/* API Key 输入 */}
        {needsApiKey && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="输入你的 API Key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              从 {currentModel?.provider === "deepseek" ? "platform.deepseek.com" : "对应平台"} 获取 API Key
            </p>
          </div>
        )}

        {!needsApiKey && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              该模型无需配置 API Key，可直接使用。
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  )
}
