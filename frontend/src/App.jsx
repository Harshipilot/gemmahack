import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ProductAnalytics from './pages/ProductAnalytics'
import Chatbot from './pages/Chatbot'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<ProductAnalytics />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
