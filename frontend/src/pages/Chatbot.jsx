import React, { useState } from 'react'
import { queryChatbot } from '../api'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Ask me about fast moving products, low stock alerts, or expiry status.' },
  ])
  const [input, setInput] = useState('')

  const sendMessage = async (text) => {
    const userMessage = { role: 'user', text }
    setMessages((current) => [...current, userMessage])
    try {
      const response = await queryChatbot(text)
      setMessages((current) => [...current, { role: 'assistant', text: response.answer }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: 'Unable to load chat response.' }])
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="page-panel">
      <div className="panel card">
        <h2>Gemma SME Chatbot</h2>
        <p className="section-description">Ask the dashboard for live inventory and sales insights.</p>
      </div>
      <div className="panel card chatbot-panel">
        <div className="chatbot-content">
          {messages.map((message, idx) => (
            <div key={idx} className={`chat-message ${message.role}`}>
              <div className={`chat-message-bubble ${message.role}`}>{message.text}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="chatbot-input-form">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." />
          <button type="submit" className="button button--send">Send</button>
        </form>
      </div>
    </div>
  )
}
