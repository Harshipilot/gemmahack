import React, { useEffect, useMemo, useState } from 'react'
import { getAnalytics } from '../api'

export default function ProductAnalytics() {
  const [analytics, setAnalytics] = useState(null)

  const fastMoving = analytics?.fast_moving ?? []
  const slowMoving = analytics?.slow_moving ?? []
  const popularity = analytics?.popularity ?? { week: {}, month: {} }

  const maxFast = useMemo(
    () => Math.max(...fastMoving.map((item) => item.pct_of_required_stock || 0), 1),
    [fastMoving],
  )
  const maxSlow = useMemo(
    () => Math.max(...slowMoving.map((item) => item.pct_of_needed_stock || 0), 1),
    [slowMoving],
  )
  const weekEntries = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, value: popularity.week?.[day] ?? 0 })),
    [popularity],
  )
  const monthEntries = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => ({ month, value: popularity.month?.[month] ?? 0 })),
    [popularity],
  )

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(console.error)
  }, [])

  if (!analytics) {
    return <div className="page-placeholder card">Loading analytics...</div>
  }

  return (
    <div className="page-panel">
      <div className="panel card">
        <h2>Product Analytics</h2>
        <p className="section-description">Live analytics from supermarket.db showing fast moving and slow moving products plus popularity trends.</p>
      </div>

      <div className="grid-two-columns">
        <div className="panel card panel-chart-card">
          <div className="panel-card-header">
            <h3>Fast Moving Products</h3>
            <span>{fastMoving.length} items</span>
          </div>
          {fastMoving.length > 0 ? (
            fastMoving.map((item) => (
              <div key={item.product_id} className="metric-row">
                <div className="metric-label">
                  <div>{item.product_name}</div>
                  <div className="metric-caption">{item.category ?? 'General'}</div>
                </div>
                <div className="metric-track">
                  <div
                    className="metric-fill metric-fill--green"
                    style={{ width: `${((item.pct_of_required_stock || 0) / maxFast) * 100}%` }}
                  />
                </div>
                <div className="metric-value">{item.pct_of_required_stock?.toFixed(0) ?? 0}%</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No fast moving data available</div>
          )}
        </div>

        <div className="panel card panel-chart-card">
          <div className="panel-card-header">
            <h3>Slow Moving Products</h3>
            <span>{slowMoving.length} items</span>
          </div>
          {slowMoving.length > 0 ? (
            slowMoving.map((item) => (
              <div key={item.product_id} className="metric-row">
                <div className="metric-label">
                  <div>{item.product_name}</div>
                  <div className="metric-caption">{item.category ?? 'General'}</div>
                </div>
                <div className="metric-track">
                  <div
                    className="metric-fill metric-fill--warn"
                    style={{ width: `${((item.pct_of_needed_stock || 0) / maxSlow) * 100}%` }}
                  />
                </div>
                <div className="metric-value">{item.pct_of_needed_stock?.toFixed(0) ?? 0}%</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No slow moving data available</div>
          )}
        </div>
      </div>

      <div className="panel card panel-chart-card">
        <div className="panel-card-header">
          <h3>Sales Popularity</h3>
          <span>Week / Month</span>
        </div>
        <div className="popularity-grid">
          <div>
            <h4>Week</h4>
            {weekEntries.map((entry) => (
              <div key={entry.day} className="metric-row">
                <div className="metric-label">
                  <div>{entry.day}</div>
                </div>
                <div className="metric-track">
                  <div
                    className="metric-fill metric-fill--blue"
                    style={{ width: `${entry.value ? Math.min(100, (entry.value / Math.max(...weekEntries.map((e) => e.value), 1)) * 100) : 2}%` }}
                  />
                </div>
                <div className="metric-value">{entry.value}</div>
              </div>
            ))}
          </div>

          <div>
            <h4>Month</h4>
            {monthEntries.map((entry) => (
              <div key={entry.month} className="metric-row">
                <div className="metric-label">
                  <div>{entry.month}</div>
                </div>
                <div className="metric-track">
                  <div
                    className="metric-fill metric-fill--green"
                    style={{ width: `${entry.value ? Math.min(100, (entry.value / Math.max(...monthEntries.map((e) => e.value), 1)) * 100) : 2}%` }}
                  />
                </div>
                <div className="metric-value">{entry.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
