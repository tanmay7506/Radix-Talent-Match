import { useState, useRef, useEffect, useId } from 'react'
import { MessageSquare, X, Send, Bot, Sparkles, User, AlertCircle } from 'lucide-react'
import './Chatbot.css'

/**
 * Floating Chatbot component.
 *
 * Backend status: No chatbot API endpoint exists in the current backend.
 * This component provides a complete UI and a clearly marked integration point
 * (sendToBackend) that can be wired to a future LLM/chatbot endpoint.
 *
 * It is completely honest with users: an explicit disclaimer is shown at the bottom
 * of the panel stating that responses are stubbed.
 */

// Integration point: swap this function body with a real fetch when an endpoint is added.
async function sendToBackend(_message) {
  // e.g.:
  // const res = await fetch('/api/chat', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message }),
  // })
  // return (await res.json()).reply
  throw new Error('No chatbot endpoint configured')
}

const STUB_RESPONSES = [
  "RADIX Talent Match extracts your core skill categories from your resume and matches them against job description requirements.",
  "To get the best match score, ensure your profile has your top technical skills, hackathons, and certifications listed.",
  "Check the 'Company & Match' tab to see detailed skill overlaps and gap analysis for your target role.",
  "You can update a job description on the Company & Match page to see its RADIX categories and required technologies.",
]

let stubIdx = 0

export default function Chatbot() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hi! I'm the RADIX Talent Match Assistant. I can help answer questions about your profile, resume parsing, and skill match scoring.",
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const panelId        = useId()

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) setHasUnread(false)
      return next
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const reply = await sendToBackend(text)
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }])
    } catch {
      // Transparent stub response
      const stub = STUB_RESPONSES[stubIdx % STUB_RESPONSES.length]
      stubIdx++
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: stub,
          isStub: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Floating toggle button ─────────────────────────────── */}
      <button
        id="chatbot-toggle-btn"
        className="chatbot-toggle"
        aria-label={open ? 'Close RADIX assistant' : 'Open RADIX assistant'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
      >
        {open ? <X size={22} strokeWidth={2.2} /> : <MessageSquare size={22} strokeWidth={2.2} />}
        {hasUnread && !open && (
          <span className="chatbot-badge" aria-label="Unread message" role="status" />
        )}
      </button>

      {/* ── Chat panel ────────────────────────────────────────── */}
      {open && (
        <div
          id={panelId}
          className="chatbot-panel"
          role="dialog"
          aria-modal="true"
          aria-label="RADIX Talent Match assistant"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar" aria-hidden="true">
              <Bot size={16} strokeWidth={2.2} />
            </div>
            <div className="chatbot-header-info">
              <div className="chatbot-header-name">RADIX Assistant</div>
              <div className="chatbot-header-status">
                <span className="chatbot-status-dot" aria-hidden="true"/>
                <span>RADIX Talent Match</span>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Conversation">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg ${msg.role}`}>
                <div className="chatbot-msg-avatar" aria-hidden="true">
                  {msg.role === 'assistant' ? <Sparkles size={13} strokeWidth={2} /> : <User size={13} strokeWidth={2} />}
                </div>
                <div className="chatbot-msg-bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br/>}</span>
                  ))}
                  {msg.isStub && (
                    <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.65, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={11} strokeWidth={2} aria-hidden="true" />
                      <span>Stub response · backend not yet connected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chatbot-msg assistant" role="status" aria-label="Assistant is typing">
                <div className="chatbot-msg-avatar" aria-hidden="true">
                  <Sparkles size={13} strokeWidth={2} />
                </div>
                <div className="chatbot-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true"/>
          </div>

          {/* Input */}
          <div className="chatbot-input-row">
            <textarea
              ref={inputRef}
              id="chatbot-input"
              className="chatbot-input"
              placeholder="Ask about your skill match…"
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Message input"
              disabled={loading}
            />
            <button
              id="chatbot-send-btn"
              className="chatbot-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <Send size={15} strokeWidth={2.2} />
            </button>
          </div>

          {/* Transparency notice */}
          <div className="chatbot-notice">
            Not connected to a live AI · responses are placeholder answers
          </div>
        </div>
      )}
    </>
  )
}
