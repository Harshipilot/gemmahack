import React from 'react'

export function ReorderTable({ title, rows, labelKey }) {
  const fieldValue = (row) => (labelKey === 'required' ? row.pct_of_required_stock : row.pct_of_needed_stock)
  const getDisplayPct = (row) => {
    const raw = fieldValue(row)
    const threshold = labelKey === 'required'
      ? (row.reorder_level || row.maximum_stock || 1)
      : (row.maximum_stock || row.reorder_level || 1)

    if (raw === null || raw === undefined || raw === 0) {
      return Math.max(8, Math.min(100, Math.round(((row.current_stock || 0) / threshold) * 100)))
    }

    return Math.max(8, Math.min(100, Number(raw)))
  }

  return (
    <div className="panel card panel--wide">
      <div className="panel-heading">{title}</div>
      <div className="table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>{labelKey === 'required' ? 'Required Stock' : 'Needed Stock'}</th>
              <th>{labelKey === 'required' ? 'Buy Qty' : 'Surplus Qty'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pct = getDisplayPct(row)
              return (
                <tr key={row.product_id}>
                  <td>{row.product_name}</td>
                  <td>
                    <div className="progress-label">{pct}%</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                    </div>
                  </td>
                  <td>{labelKey === 'required' ? row.recommended_reorder_qty ?? 'Buy' : row.current_stock}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
