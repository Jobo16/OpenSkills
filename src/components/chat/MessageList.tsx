import { useEffect, useRef } from "react"
import { MessageBubble } from "./MessageBubble"
import type { Message, Part } from "../../hooks/useSession"

interface MessageListProps {
  messages: Message[]
  parts: Record<string, Part[]>
}

export function MessageList({ messages, parts }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, parts])

  return (
    <div className="space-y-4">
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          message={message}
          parts={parts[message.id] || []}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
