import React from 'react'

const badgeClass = (value) =>
  value >= 0 ? 'badge badge--positive' : 'badge badge--negative'

export function KPIBanner({ summary }) {
  return (
    <section className="kpi-banner card">
      <div className="kpi-item">
        <div className="kpi-label">Net Profit Margin</div>
        <div className="kpi-value">{summary.net_profit_margin_pct.toFixed(1)}%</div>
        <div className={badgeClass(summary.net_profit_margin_pct)}>
          {summary.net_profit_margin_pct >= 0 ? 'Up' : 'Down'} {Math.abs(summary.net_profit_margin_pct).toFixed(1)}%
        </div>
      </div>
      <div className="kpi-item">
        <div className="kpi-label">Total Net Loss Impact</div>
        <div className="kpi-value">{summary.total_net_loss_impact_pct.toFixed(1)}%</div>
        <div className={badgeClass(summary.total_net_loss_impact_pct)}>
          {summary.total_net_loss_impact_pct >= 0 ? 'Up' : 'Down'} {Math.abs(summary.total_net_loss_impact_pct).toFixed(1)}%
        </div>
      </div>
    </section>
  )
}
