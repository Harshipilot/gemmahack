import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Product Analytics', path: '/analytics' },
  { label: 'AI Chatbot', path: '/chatbot' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">G</div>
        <div>
          <div className="sidebar-title">Vriddhi</div>
          <div className="sidebar-subtitle">Supermarket Analytics</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            end={item.path === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
