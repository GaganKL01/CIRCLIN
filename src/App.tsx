
import { useState } from 'react'
import './App.css'
import MaterialScanner from './MaterialScanner'
import ARTrainingStudio from './ARTrainingStudio'
import EligibilityCentre from './EligibilityCentre'
import RecoveryRecords from './RecoveryRecords'
import Analytics from './Analytics'

type RecoveryRecord = {
  id: string
  material: string
  category: string
  weight: number
  destination: string
  status: string
  date: string
}

const storageKey = 'circlin-recovery-records-v1'

const navigation = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Material Scanner', icon: '⌕' },
  { name: 'AR Training Studio', icon: '◇' },
  { name: 'Eligibility Centre', icon: '✓' },
  { name: 'Recovery Records', icon: '▤' },
  { name: 'Analytics', icon: '▥' },
]

const recoveryStages = [
  'Recorded',
  'Collected',
  'Transferred',
  'Recycler-confirmed',
]

function getRecoveryRecords(): RecoveryRecord[] {
  try {
    const saved = localStorage.getItem(storageKey)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  // Read the latest saved records whenever the app renders.
  const recoveryRecords = getRecoveryRecords()

  const totalWeight = recoveryRecords.reduce(
    (sum, record) => sum + (Number(record.weight) || 0),
    0
  )

  const confirmedWeight = recoveryRecords
    .filter((record) => record.status === 'Recycler-confirmed')
    .reduce((sum, record) => sum + (Number(record.weight) || 0), 0)

  const inProgressCount = recoveryRecords.filter(
    (record) => record.status !== 'Recycler-confirmed'
  ).length

  const getStageWeight = (stage: string) =>
    recoveryRecords
      .filter((record) => record.status === stage)
      .reduce((sum, record) => sum + (Number(record.weight) || 0), 0)

  const maxStageWeight = Math.max(
    ...recoveryStages.map(getStageWeight),
    1
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">CIRCLIN</div>
            <div className="brand-caption">CIRCULAR CLINIC SYSTEM</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === 'Material Scanner' && (
                <span className="nav-tag">AI</span>
              )}
              {item.name === 'AR Training Studio' && (
                <span className="nav-tag">AR</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">?</div>
            <strong>Need assistance?</strong>
            <p>Explore the CIRCLIN workflow and staff guidance.</p>
            <button onClick={() => setActivePage('AR Training Studio')}>
              Explore training ↗
            </button>
          </div>

          <div className="profile">
            <div className="avatar">DC</div>
            <div className="profile-info">
              <strong>Demo Clinic</strong>
              <span>Clinic administrator</span>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" /> Demo environment
            </div>
            <button className="notification-button" aria-label="Notifications">
              ♧<span />
            </button>
            <div className="top-avatar">DC</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">CLINIC RESOURCE MANAGEMENT</div>
              <h1>
                {activePage === 'Dashboard'
                  ? 'Good morning, Admin'
                  : activePage}
              </h1>
              <p className="page-subtitle">
                {activePage === 'Dashboard'
                  ? 'A clearer view of your clinic’s resource recovery journey.'
                  : 'This workspace is part of the CIRCLIN prototype.'}
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setActivePage('Material Scanner')}
            >
              <span>＋</span> Scan material
            </button>
          </section>

          {activePage === 'Dashboard' ? (
            <>
              <section className="metric-grid">
                <article className="metric-card">
                  <div className="metric-top">
                    <span>Recovery records</span>
                    <span className="metric-icon green">▤</span>
                  </div>
                  <div className="metric-value">
                    {recoveryRecords.length}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-neutral">Live data</span>
                    <span>Saved entries</span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Recorded recovery</span>
                    <span className="metric-icon blue">↗</span>
                  </div>
                  <div className="metric-value">
                    {totalWeight.toFixed(2)} <small>kg</small>
                  </div>
                  <div className="metric-foot">
                    <span className="metric-neutral">Live data</span>
                    <span>All recorded entries</span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>Recycler-confirmed</span>
                    <span className="metric-icon mint">✓</span>
                  </div>
                  <div className="metric-value">
                    {confirmedWeight.toFixed(2)} <small>kg</small>
                  </div>
                  <div className="metric-foot">
                    <span className="metric-neutral">Verified data</span>
                    <span>Partner-confirmed weight</span>
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-top">
                    <span>In progress</span>
                    <span className="metric-icon amber">!</span>
                  </div>
                  <div className="metric-value">
                    {inProgressCount}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-neutral">Live data</span>
                    <span>Not yet recycler-confirmed</span>
                  </div>
                </article>
              </section>

              <section className="content-grid">
                <article className="panel recovery-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recovery overview</h2>
                      <p>Recorded weight across current recovery stages</p>
                    </div>
                    <button
                      className="select-button"
                      onClick={() => setActivePage('Analytics')}
                    >
                      View analytics ↗
                    </button>
                  </div>

                  <div className="analytics-stage-list">
                    {recoveryStages.map((stage) => (
                      <div className="analytics-stage" key={stage}>
                        <div className="analytics-stage-top">
                          <span>{stage}</span>
                          <strong>
                            {getStageWeight(stage).toFixed(2)} kg
                          </strong>
                        </div>
                        <div className="analytics-track">
                          <div
                            className="analytics-fill"
                            style={{
                              width: `${(getStageWeight(stage) / maxStageWeight) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chart-legend">
                    <span /> Live recovery record data
                  </div>
                </article>

                <article className="panel workflow-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recovery workflow</h2>
                      <p>From identification to confirmation</p>
                    </div>
                  </div>

                  <div className="workflow-list">
                    <div className="workflow-step">
                      <div className="workflow-symbol scan-symbol">⌕</div>
                      <div className="workflow-copy">
                        <strong>Identify</strong>
                        <span>AI-assisted material recognition</span>
                      </div>
                      <span className="step-arrow">01</span>
                    </div>

                    <div className="workflow-step">
                      <div className="workflow-symbol verify-symbol">✓</div>
                      <div className="workflow-copy">
                        <strong>Verify</strong>
                        <span>Eligibility and human review</span>
                      </div>
                      <span className="step-arrow">02</span>
                    </div>

                    <div className="workflow-step">
                      <div className="workflow-symbol recover-symbol">↗</div>
                      <div className="workflow-copy">
                        <strong>Recover</strong>
                        <span>Track collection and transfer</span>
                      </div>
                      <span className="step-arrow">03</span>
                    </div>

                    <div className="workflow-step">
                      <div className="workflow-symbol measure-symbol">▥</div>
                      <div className="workflow-copy">
                        <strong>Measure</strong>
                        <span>Review recovery performance</span>
                      </div>
                      <span className="step-arrow">04</span>
                    </div>
                  </div>
                </article>
              </section>

              <section className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent recovery activity</h2>
                    <p>Latest entries from Recovery Records</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage('Recovery Records')}
                  >
                    View all records ↗
                  </button>
                </div>

                {recoveryRecords.length === 0 ? (
                  <div className="records-empty">
                    <div>▤</div>
                    <strong>No recovery records yet</strong>
                    <p>Create an entry in Recovery Records to see activity here.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>MATERIAL</th>
                          <th>CATEGORY</th>
                          <th>WEIGHT</th>
                          <th>STATUS</th>
                          <th>DATE</th>
                        </tr>
                      </thead>

                      <tbody>
                        {recoveryRecords.slice(0, 5).map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="material-symbol">▧</span>
                              <strong>{item.material}</strong>
                            </td>
                            <td>{item.category}</td>
                            <td>
                              {(Number(item.weight) || 0).toFixed(2)} kg
                            </td>
                            <td>
                              <span className="status-pill recorded">
                                {item.status}
                              </span>
                            </td>
                            <td className="date-cell">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="safety-note">
                <span className="safety-icon">i</span>
                <p>
                  <strong>Safety first:</strong> Visual material identification
                  does not establish recyclability or contamination status.
                  Follow approved clinic waste protocols and require human
                  verification before recovery. Recycler-confirmed weight is
                  counted separately from recorded weight.
                </p>
              </div>
            </>
          ) : activePage === 'Material Scanner' ? (
            <MaterialScanner />
          ) : activePage === 'AR Training Studio' ? (
            <ARTrainingStudio />
          ) : activePage === 'Eligibility Centre' ? (
            <EligibilityCentre />
          ) : activePage === 'Recovery Records' ? (
            <RecoveryRecords />
          ) : activePage === 'Analytics' ? (
            <Analytics />
          ) : (
            <section className="coming-panel">
              <div className="coming-icon">◇</div>
              <h2>{activePage}</h2>
              <p>
                This module is planned for the next development stage. The
                dashboard foundation is in place.
              </p>
              <button
                className="primary-button"
                onClick={() => setActivePage('Dashboard')}
              >
                ← Back to dashboard
              </button>
            </section>
          )}

          <footer className="footer">
            <span>
              © 2026 CIRCLIN · Turning Clinic Waste into Circular Value.
            </span>
            <span>Prototype environment · Browser-local data</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
