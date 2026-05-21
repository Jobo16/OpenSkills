import { useUpdates } from "../../hooks/useUpdates"

export function UpdateBadge() {
  const { hasUpdates, updates, loading } = useUpdates()

  if (loading || !hasUpdates) {
    return null
  }

  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full">
      {updates.length}
    </div>
  )
}
