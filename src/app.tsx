import { useEffect, useState, useCallback } from "react"
import { Routes, Route, useNavigate, useParams } from "react-router-dom"
import { useSession } from "./hooks/useSession"
import { useOpencode } from "./hooks/useOpencode"
import { Sidebar } from "./components/layout/Sidebar"
import { SessionPage } from "./components/session/SessionPage"
import { SkillPicker } from "./components/session/SkillPicker"
import { SettingsModal } from "./components/settings/SettingsModal"
import { MarketplacePage } from "./components/marketplace/MarketplacePage"
import { listSkills as tauriListSkills } from "./lib/tauri"

function SessionRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loading: serviceLoading, error: serviceError } = useOpencode()
  const {
    sessions,
    sessionId,
    messages,
    parts,
    isProcessing,
    createSession,
    switchSession,
    sendMessage,
    stopProcessing,
    findEmptySession,
    updateSessionTitle,
    deleteSession,
  } = useSession()

  const [skills, setSkills] = useState<any[]>([])
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<string | null>(null)

  // 加载 skills（统一通过 Tauri 后端读取，与删除操作一致）
  const loadSkills = useCallback(async () => {
    try {
      const list = await tauriListSkills()
      setSkills(list)
    } catch (err) {
      console.warn("Failed to load skills:", err)
    }
  }, [])

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  // 切换会话
  useEffect(() => {
    if (id && id !== sessionId) {
      switchSession(id)
    }
  }, [id, sessionId, switchSession])

  // 创建新会话并导航（如果存在空会话则复用）
  const handleNewSession = useCallback(async () => {
    const empty = await findEmptySession()
    if (empty) {
      navigate(`/session/${empty.id}`)
    } else {
      const session = await createSession()
      navigate(`/session/${session.id}`)
    }
  }, [createSession, navigate, findEmptySession])

  // 选择会话
  const handleSelectSession = useCallback((sid: string) => {
    navigate(`/session/${sid}`)
  }, [navigate])

  // 选择 command
  const handleSelectCommand = useCallback((name: string) => {
    setPendingCommand(name)
    setShowSkillPicker(false)
  }, [])

  // 取消 command
  const handleCancelCommand = useCallback(() => {
    setPendingCommand(null)
  }, [])

  // 发送消息
  const handleSend = useCallback(async (text: string) => {
    const finalText = pendingCommand ? `/${pendingCommand} ${text}` : text
    setPendingCommand(null)

    if (!sessionId) {
      const session = await createSession()
      navigate(`/session/${session.id}`)
    }

    await sendMessage([{ type: "text", text: finalText }])
  }, [sessionId, pendingCommand, createSession, navigate, sendMessage])

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (serviceError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        连接失败: {serviceError}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <Sidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onUpdateTitle={updateSessionTitle}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMarketplace={() => setShowMarketplace(true)}
      />
      <SessionPage
        sessionId={sessionId}
        messages={messages}
        parts={parts}
        isProcessing={isProcessing}
        pendingCommand={pendingCommand}
        onSend={handleSend}
        onStop={stopProcessing}
        onCancelCommand={handleCancelCommand}
        onShowSkillPicker={() => setShowSkillPicker(true)}
      />
      {showSkillPicker && (
        <SkillPicker
          skills={skills}
          onSelect={handleSelectCommand}
          onClose={() => setShowSkillPicker(false)}
          onRefresh={loadSkills}
        />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={loadSkills}
        />
      )}
      {showMarketplace && (
        <MarketplacePage onClose={() => setShowMarketplace(false)} />
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionRoute />} />
      <Route path="/session" element={<SessionRoute />} />
      <Route path="/session/:id" element={<SessionRoute />} />
    </Routes>
  )
}

export default App
