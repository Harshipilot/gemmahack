import React, { useState } from 'react'

const buckets = ["1 month", "2 months", "3 months", "4 months"]

export function ExpiryAlerts({ data }) {
  const [expanded, setExpanded] = useState(null)

  const toggleBucket = (bucket) => {
    setExpanded((current) => (current === bucket ? null : bucket))
  }

  return (
    <div className="panel card panel--expiry">
      <div className="panel-heading">Critical Expiry Alerts</div>
      <div className="expiry-grid">
        {buckets.map((bucket, index) => {
          const items = data?.[bucket] || []
          const item = items[0]
          const isOpen = expanded === bucket
          return (
            <div key={bucket} className={`expiry-card expiry-card--month-${index + 1}`}>
              <div className="expiry-title">{bucket}</div>
              <div className="expiry-content">
                {item ? (
                  <>
                    <div className="expiry-name">{item.product_name}</div>
                    <div className="expiry-meta">Remaining Qty {item.current_stock ?? 0}</div>
                    <div className="expiry-meta">Expiry in {item.days_to_expiry} days</div>
                    {items.length > 1 && (
                      <div className="expiry-meta">+{items.length - 1} more expiring items</div>
                    )}
                  </>
                ) : (
                  <div className="expiry-name expiry-name--empty">No expiring items</div>
                )}
              </div>
              <button
                className="button button--show-items"
                onClick={() => toggleBucket(bucket)}
                type="button"
              >
                {isOpen ? 'Hide items' : 'Show items'}
              </button>
              {isOpen && (
                <div className="expiry-item-list">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.product_id} className="expiry-item-row">
                        <div className="expiry-item-name">{item.product_name}</div>
                        <div className="expiry-item-meta">
                          Qty {item.current_stock ?? 0} · Expires in {item.days_to_expiry} days
                        </div>
                        <div className="expiry-item-meta">Expiry Date: {item.expiry_date ?? 'Unknown'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="expiry-item-row expiry-item-empty">No expiring products in this bucket</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
