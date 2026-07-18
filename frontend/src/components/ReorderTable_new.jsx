import React from 'react'

export function ReorderTable({ title, rows, labelKey }) {
  return (
    <div className="panel card panel--wide">
      <div className="panel-heading">{title}</div>
      <div className="table-scroll">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Current Stock</th>
              <th>{labelKey === 'required' ? 'Buy Qty' : 'Surplus Qty'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const actionQty = labelKey === 'required' ? (row.recommended_reorder_qty || 0) : (row.surplus_qty || row.current_stock || 0)
              const stockPct = labelKey === 'required'
                ? Math.max(8, Math.min(100, Math.round(((row.current_stock || 0) / (row.reorder_level || 1)) * 100)))
                : Math.max(8, Math.min(100, Math.round(((row.current_stock || 0) / (row.maximum_stock || 1)) * 100)))
              return (
                <tr key={row.product_id}>
                  <td>{row.product_name}</td>
                  <td>
                    <div className="progress-label">{row.current_stock || 0} units ({stockPct}%)</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${stockPct}%` }} />
                    </div>
                  </td>
                  <td>{actionQty}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
