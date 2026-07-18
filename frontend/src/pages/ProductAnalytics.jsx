import React, { useEffect, useMemo, useState } from 'react'
import { getAnalytics } from '../api'

function LineChart({ data, color, title }) {
  const values = data.map((item) => item.value)
  const maxValue = Math.max(...values, 1)
  const width = 320
  const height = 180
  const padding = 24
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const points = values.map((value, index) => {
    const x = padding + index * stepX
    const y = height - padding - (value / maxValue) * (height - padding * 2)
    return { x, y, value }
  })

  const path = points.length > 1 ? `M ${points.map((point) => `${point.x},${point.y}`).join(' L ')}` : ''

  return (
    <div className="line-chart-card">
      <div className="line-chart-title">{title}</div>
      <div className="line-chart-axis-labels">
        <span>Value</span>
        <span>Label</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" role="img" aria-label={title}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="line-chart-axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="line-chart-axis" />
        {path && <path d={path} className={`line-chart-path line-chart-path--${color}`} />}
        {points.map((point, index) => (
          <g key={`${title}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              className={`line-chart-dot line-chart-dot--${color}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {hoveredIndex === index && (
              <g>
                <rect x={point.x - 26} y={point.y - 38} width="52" height="24" rx="8" className="line-chart-tooltip" />
                <text x={point.x} y={point.y - 20} textAnchor="middle" className="line-chart-tooltip-text">
                  {point.value}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <div className="line-chart-labels">
        {data.map((item) => (
          <span key={item.label} className="line-chart-label">{item.label}</span>
        ))}
      </div>
    </div>
  )
}

export default function ProductAnalytics() {
  const [analytics, setAnalytics] = useState(null)

  const fastMoving = analytics?.fast_moving ?? []
  const slowMoving = analytics?.slow_moving ?? []
  const popularity = analytics?.popularity ?? { week: {}, month: {} }

  const getDisplayPercent = (item, kind) => {
    const raw = kind === 'fast' ? item.pct_of_required_stock : item.pct_of_needed_stock
    const threshold = kind === 'fast'
      ? (item.reorder_level || item.maximum_stock || 1)
      : (item.maximum_stock || item.reorder_level || 1)

    if (raw === null || raw === undefined || raw === 0) {
      return Math.max(8, Math.min(100, Math.round(((item.current_stock || 0) / threshold) * 100)))
    }

    return Math.max(8, Math.min(100, Number(raw)))
  }

  const maxFast = useMemo(
    () => Math.max(...fastMoving.map((item) => getDisplayPercent(item, 'fast')), 1),
    [fastMoving],
  )
  const maxSlow = useMemo(
    () => Math.max(...slowMoving.map((item) => getDisplayPercent(item, 'slow')), 1),
    [slowMoving],
  )
  const fastSummary = useMemo(() => {
    const totalUnits = fastMoving.reduce((sum, item) => sum + (item.current_stock || 0), 0)
    const avgRatio = fastMoving.length
      ? fastMoving.reduce((sum, item) => sum + getDisplayPercent(item, 'fast'), 0) / fastMoving.length
      : 0
    return { totalUnits, avgRatio }
  }, [fastMoving])
  const slowSummary = useMemo(() => {
    const totalUnits = slowMoving.reduce((sum, item) => sum + (item.current_stock || 0), 0)
    const avgRatio = slowMoving.length
      ? slowMoving.reduce((sum, item) => sum + getDisplayPercent(item, 'slow'), 0) / slowMoving.length
      : 0
    return { totalUnits, avgRatio }
  }, [slowMoving])
  const weekEntries = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ label: day, value: popularity.week?.[day] ?? 0 })),
    [popularity],
  )
  const monthEntries = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => ({ label: month, value: popularity.month?.[month] ?? 0 })),
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
        <p className="section-description">Live analytics  showing fast moving and slow moving products plus popularity trends.</p>
      </div>

      <div className="grid-two-columns">
        <div className="panel card panel-chart-card">
          <div className="panel-card-header">
            <h3>Fast Moving Products</h3>
            <span>{fastMoving.length} items</span>
          </div>
          <div className="analytics-summary-pill">
            <span>{fastSummary.totalUnits} units in stock</span>
            <span>Avg. cover {fastSummary.avgRatio.toFixed(0)}%</span>
          </div>
          {fastMoving.length > 0 ? (
            fastMoving.map((item) => {
              const percent = getDisplayPercent(item, 'fast')
              return (
                <div key={item.product_id} className="analytics-card-row">
                  <div className="analytics-card-top">
                    <div>
                      <div className="analytics-card-title">{item.product_name}</div>
                      <div className="metric-caption">{item.category ?? 'General'}</div>
                    </div>
                    <div className="analytics-number">{percent.toFixed(0)}%</div>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill analytics-bar-fill--green"
                      style={{ width: `${(percent / maxFast) * 100}%` }}
                    />
                  </div>
                  <div className="analytics-footnote">
                    Stock {item.current_stock ?? 0} · Reorder {item.reorder_level ?? 0} · Need {item.recommended_reorder_qty ?? 0}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="empty-state">No fast moving data available</div>
          )}
        </div>

        <div className="panel card panel-chart-card">
          <div className="panel-card-header">
            <h3>Slow Moving Products</h3>
            <span>{slowMoving.length} items</span>
          </div>
          <div className="analytics-summary-pill analytics-summary-pill--warn">
            <span>{slowSummary.totalUnits} units in stock</span>
            <span>Avg. cover {slowSummary.avgRatio.toFixed(0)}%</span>
          </div>
          {slowMoving.length > 0 ? (
            slowMoving.map((item) => {
              const percent = getDisplayPercent(item, 'slow')
              return (
                <div key={item.product_id} className="analytics-card-row">
                  <div className="analytics-card-top">
                    <div>
                      <div className="analytics-card-title">{item.product_name}</div>
                      <div className="metric-caption">{item.category ?? 'General'}</div>
                    </div>
                    <div className="analytics-number">{percent.toFixed(0)}%</div>
                  </div>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill analytics-bar-fill--warn"
                      style={{ width: `${(percent / maxSlow) * 100}%` }}
                    />
                  </div>
                  <div className="analytics-footnote">
                    Stock {item.current_stock ?? 0} · Max {item.maximum_stock ?? 0} · Hold {item.recommended_reorder_qty ?? 0}
                  </div>
                </div>
              )
            })
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
          <div className="popularity-card">
            <h4>Week</h4>
            <LineChart data={weekEntries} color="blue" title="Weekly sales trend" />
          </div>

          <div className="popularity-card">
            <h4>Month</h4>
            <LineChart data={monthEntries} color="green" title="Monthly sales trend" />
          </div>
        </div>
      </div>
    </div>
  )
}
