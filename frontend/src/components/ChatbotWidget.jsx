import React, { useState } from 'react'

export function ChatbotWidget({ onSend, messages }) {
  const [input, setInput] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="chatbot card">
      <div className="chatbot-header">Gemma SME Chatbot Assistant</div>
      <div className="chatbot-subheader">Ask about stock, expiry alerts, suppliers, or growth opportunities.</div>
      <div className="chatbot-content">
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.role}`}>
            <div className={`chat-message-bubble ${message.role}`}>{message.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chatbot-input-form">
        <input
          className="chatbot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit" className="button button--send">
          Send
        </button>
      </form>
    </div>
  )
}
