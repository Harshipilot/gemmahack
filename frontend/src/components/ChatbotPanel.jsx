import React, { useEffect, useMemo, useRef, useState } from 'react'
import { queryChatbot } from '../api'

const suggestedQuestions = [
  'What should I reorder?',
  'Fast moving products',
  'Slow moving products',
  "Today's revenue",
  "Today's profit",
  'Dashboard summary',
  'Expiry alerts',
  'Top selling products',
  'How can I improve profit margin?',
  'How to reduce expiry waste?',
  'How to negotiate with suppliers?',
  'How much should I order for low-stock items?',
  'How to reduce stockouts?',
  'Business growth suggestions',
]

const formatTimestamp = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const hasProductResults = (results) => Array.isArray(results) && results.length > 0

export default function ChatbotPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Welcome to Vriddhi. I can help you analyze inventory, revenue, profit, sales trends, expiry alerts, stock health, and reorder recommendations.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const addMessage = (message) => {
    setMessages((current) => [...current, message])
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return

    setError('')
    addMessage({ role: 'user', text, timestamp: new Date() })
    setInput('')
    setIsLoading(true)

    try {
      const response = await queryChatbot(text)
      addMessage({ role: 'assistant', text: response.answer, results: response.results || [], timestamp: new Date() })
    } catch (err) {
      setError('Unable to load chat response. Please try again.')
      addMessage({ role: 'assistant', text: 'Unable to load chat response. Please try again.', timestamp: new Date() })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (question) => {
    sendMessage(question)
  }

  const messageNodes = useMemo(
    () =>
      messages.map((message, idx) => {
        const isUser = message.role === 'user'
        return (
          <div key={idx} className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
            <div className={`chat-message-bubble ${isUser ? 'user' : 'assistant'}`}>
              <div className="chat-message-text">{message.text}</div>
              <div className="chat-message-meta">{formatTimestamp(new Date(message.timestamp))}</div>
            </div>
            {message.results && hasProductResults(message.results) && (
              <div className="chat-result-grid">
                {message.results.map((product, index) => (
                  <div key={index} className="chat-result-card">
                    <div className="chat-result-title">{product.product_name || product.product_name}</div>
                    <div className="chat-result-row">
                      <span>{product.category || 'Unknown'}</span>
                      <span>{product.current_stock != null ? `Stock: ${product.current_stock}` : 'Stock: n/a'}</span>
                    </div>
                    <div className="chat-result-row">
                      <span>{product.reorder_level != null ? `Reorder: ${product.reorder_level}` : 'Reorder: n/a'}</span>
                      <span>{product.sales_velocity != null ? `Velocity: ${product.sales_velocity}` : 'Velocity: n/a'}</span>
                    </div>
                    {product.expiry_date && <div className="chat-result-expiry">Expires: {product.expiry_date}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }),
    [messages]
  )

  return (
    <div className="page-panel chatbot-page">
      <div className="panel card chatbot-panel-modern">
        <div className="chatbot-top">
          <div>
            <div className="chatbot-title">🤖 Vriddhi AI Business Advisor</div>
            <div className="chatbot-subtitle">
              Ask about inventory, sales, revenue, profit, stock health, expiry alerts, or reorder recommendations.
            </div>
          </div>
          <div className="chatbot-status">🟢 Assistant Ready</div>
        </div>

        <div className="chatbot-suggestions">
          {suggestedQuestions.map((question) => (
            <button key={question} type="button" className="chatbot-chip" onClick={() => handleSuggestion(question)}>
              {question}
            </button>
          ))}
        </div>

        <div className="chatbot-content-modern" ref={containerRef}>
          {messageNodes}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="chat-message-bubble assistant">
                <div className="typing-indicator">
                  Analyzing your inventory...
                  <span className="typing-dots" aria-hidden>
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="chatbot-error">{error}</div>}

        <form onSubmit={handleSubmit} className="chatbot-input-form-modern">
          <input
            className="chatbot-input-modern"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a business question..."
            disabled={isLoading}
            aria-label="Ask a business question"
          />
          <button type="submit" className="button button--send" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
