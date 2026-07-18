import React, { useEffect, useState } from 'react'
import { KPIBanner } from '../components/KPIBanner'
import { ReorderTable } from '../components/ReorderTable'
import { ExpiryAlerts } from '../components/ExpiryAlerts'
import { getDashboard, getLowStock, getOverstock, getExpiring } from '../api'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [overstock, setOverstock] = useState([])
  const [expiring, setExpiring] = useState({})

  useEffect(() => {
    getDashboard().then(setSummary).catch(console.error)
    getLowStock().then(setLowStock).catch(console.error)
    getOverstock().then(setOverstock).catch(console.error)
    getExpiring().then(setExpiring).catch(console.error)
  }, [])

  return (
    <div className="page-panel">
      <div className="panel card">
        <h1>Dashboard</h1>
        <p className="section-description">Live supermarket analytics from the SQLite database.</p>
      </div>

      {summary && <KPIBanner summary={summary} />}

      <section className="section-title">WHAT TO ORDER TODAY (Stock Intelligence)</section>
      <div className="grid-two-columns">
        <ReorderTable
          title="TOP 5: REORDER IMMEDIATELY (Critically Low Stock)"
          rows={lowStock.slice(0, 5)}
          labelKey="required"
        />
        <ReorderTable
          title="TOP 5: DO NOT ORDER (Overstocked/Excess)"
          rows={overstock.slice(0, 5)}
          labelKey="surplus"
        />
      </div>

      <ExpiryAlerts data={expiring} />
    </div>
  )
}
