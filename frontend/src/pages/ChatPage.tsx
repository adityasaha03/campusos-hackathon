import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react'
import { sendChatMessage } from '../services/agent'
import { getErrorMessage, DEFAULT_STUDENT_NAME } from '../services/api'
import { useToast } from '../components/ToastContext'
import type { ChatTurn } from '../types'

interface DisplayMessage {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: string
}

const SAMPLE_QUERIES = [
  'When is my next class?',
  'What classes do I have on Wednesday?',
  'What assignments do I have due this week?',
  'Show me all high priority announcements.',
  "I'm free until 2 PM — is there anything on campus I could drop into?",
  'Which labs have a projector and can fit at least 30 people?',
  'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
  'Register me for the Guest Lecture on Deep Learning.',
  'I need a room for 5 people with a projector, tomorrow between 2 and 4.',
]

// Simple, safe Markdown formatter for AI responses
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="chat-markdown-content">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="chat-empty-line" />
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h5 key={idx} className="chat-h3">{renderFormattedSpans(trimmed.slice(4))}</h5>
        }
        if (trimmed.startsWith('## ')) {
          return <h4 key={idx} className="chat-h2">{renderFormattedSpans(trimmed.slice(3))}</h4>
        }
        if (trimmed.startsWith('# ')) {
          return <h3 key={idx} className="chat-h1">{renderFormattedSpans(trimmed.slice(2))}</h3>
        }

        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="chat-bullet-row">
              <span className="chat-bullet-dot">•</span>
              <span className="chat-bullet-text">{renderFormattedSpans(trimmed.slice(2))}</span>
            </div>
          )
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (numMatch) {
          return (
            <div key={idx} className="chat-bullet-row">
              <span className="chat-number-badge">{numMatch[1]}.</span>
              <span className="chat-bullet-text">{renderFormattedSpans(numMatch[2])}</span>
            </div>
          )
        }

        return (
          <p key={idx} className="chat-paragraph">
            {renderFormattedSpans(line)}
          </p>
        )
      })}
    </div>
  )
}

// Inline formatting helper for bold and code
function renderFormattedSpans(text: string): React.ReactNode[] {
  // Pattern matches **bold** or `code`
  const parts: React.ReactNode[] = []
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={match.index} className="chat-strong">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // Code
      parts.push(
        <code key={match.index} className="chat-code">
          {match[3]}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export const ChatPage: React.FC = () => {
  const { error, success } = useToast()
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Hello **${DEFAULT_STUDENT_NAME}**! I am your **CampusOS AI Assistant**.\n\nI have live direct access to:\n- Class timetables and instructor information\n- Room reservations and real-time availability\n- Upcoming campus events and attendance registration\n- Official department announcements and circulars\n- Coursework deadlines, requirements, and marks\n\nHow can I help you today? You can select a suggested question below or type your inquiry.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [historyTurns, setHistoryTurns] = useState<ChatTurn[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isSending) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: DisplayMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      text,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsSending(true)

    const newTurn: ChatTurn = {
      role: 'user',
      parts: [{ text }],
    }
    const updatedHistory = [...historyTurns, newTurn]

    try {
      const replyText = await sendChatMessage(text, historyTurns)
      const agentMsg: DisplayMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, agentMsg])
      setHistoryTurns([
        ...updatedHistory,
        {
          role: 'model',
          parts: [{ text: replyText }],
        },
      ])
    } catch (err) {
      const errorText = getErrorMessage(err)
      error(errorText)
      const errorMsg: DisplayMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        text: `⚠️ **Error connecting to AI Agent:** ${errorText}\n\nPlease verify that the backend server is running and the Gemini API service is mounted at \`POST /api/agent/chat\`.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: `Conversation reset. Ask any question about your classes, rooms, events, or assignments!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setHistoryTurns([])
    success('Chat history cleared')
  }

  const handleCopy = (msg: DisplayMessage) => {
    navigator.clipboard.writeText(msg.text)
    setCopiedId(msg.id)
    success('Message copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="page-container chat-page-container">
      {/* Chat Header */}
      <div className="chat-header-bar">
        <div className="chat-title-group">
          <div className="chat-bot-avatar">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="chat-title">CampusOS Intelligence Assistant</h2>
            <p className="chat-subtitle">
              Powered by Google Gemini 2.5/Flash & live Neon DB tool calling
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleResetChat}
            title="Clear chat history"
          >
            <RotateCcw size={14} />
            <span>Reset History</span>
          </button>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="sample-queries-section">
        <span className="sample-queries-label">
          <Sparkles size={14} />
          <span>Quick queries:</span>
        </span>
        <div className="sample-chips-row">
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="sample-query-chip"
              onClick={() => handleSendMessage(q)}
              disabled={isSending}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message History List */}
      <div className="chat-messages-scroll">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isUser ? 'user-message-row' : 'agent-message-row'}`}
            >
              <div className="chat-avatar">
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-bubble">
                <div className="chat-bubble-header">
                  <span className="chat-sender-name">
                    {isUser ? DEFAULT_STUDENT_NAME : 'CampusOS AI'}
                  </span>
                  <div className="chat-meta-actions">
                    <span className="chat-timestamp">{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        className="chat-copy-btn"
                        onClick={() => handleCopy(msg)}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="chat-text-body">
                  <FormattedMessage text={msg.text} />
                </div>
              </div>
            </div>
          )
        })}

        {isSending && (
          <div className="chat-message-row agent-message-row">
            <div className="chat-avatar">
              <Bot size={16} />
            </div>
            <div className="chat-bubble typing-indicator-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-status">Querying live campus database...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="chat-input-wrapper">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="chat-form"
        >
          <textarea
            className="chat-textarea"
            placeholder="Ask anything about classes, book a room, register for events, or check assignments..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isSending}
          />
          <button
            type="submit"
            className="btn btn-primary chat-send-btn"
            disabled={!inputMessage.trim() || isSending}
            title="Send query"
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
        <div className="chat-input-hint">
          <span>Press Enter to send, Shift+Enter for new line. Mutating tools will modify live database state.</span>
        </div>
      </div>
    </div>
  )
}
