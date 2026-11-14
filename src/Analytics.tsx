
import { useEffect, useState } from 'react'
import './Analytics.css'

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

const stages = [
  'Recorded',
  'Collected',
  'Transferred',
  'Recycler-confirmed',
]

function readRecords(): RecoveryRecord[] {
  try {
    const saved = localStorage.getItem(storageKey)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function Analytics() {
  const [records, setRecords] = useState<RecoveryRecord[]>(readRecords)

  useEffect(() => {
    const refreshRecords = () => setRecords(readRecords())

    window.addEventListener('storage', refreshRecords)
    window.addEventListener('focus', refreshRecords)

    return () => {
      window.removeEventListener('storage', refreshRecords)
      window.removeEventListener('focus', refreshRecords)
    }
  }, [])

  const totalWeight = records.reduce(
    (sum, record) => sum + (Number(record.weight) || 0), 0
  )

  const confirmedWeight = records
    .filter((record) => record.status === 'Recycler-confirmed')
    .reduce((sum, record) => sum + (Number(record.weight) || 0), 0)

  const collectedCount = records.filter(
    (record) => record.status === 'Collected'
  ).length

  const transferredCount = records.filter(
    (record) => record.status === 'Transferred'
  ).length

  const confirmedCount = records.filter(
    (record) => record.status === 'Recycler-confirmed'
  ).length

  const getStageCount = (stage: string) =>
    records.filter((record) => record.status === stage).length

  const getStageWeight = (stage: string) =>
    records
      .filter((record) => record.status === stage)
      .reduce((sum, record) => sum + (Number(record.weight) || 0), 0)

  const maxStageWeight = Math.max(
    ...stages.map((stage) => getStageWeight(stage)),
    1
  )

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <div>
          <span className="analytics-eyebrow">PERFORMANCE OVERVIEW</span>
          <h2>Recovery analytics</h2>
          <p>Understand material tracking and documented recovery progress.</p>
        </div>
        <div className="analytics-icon">▥</div>
      </div>

      <div className="analytics-metrics">
        <article className="analytics-card">
          <span>Total records</span>
          <strong>{records.length}</strong>
          <small>Documented entries</small>
        </article>

        <article className="analytics-card">
          <span>Recorded weight</span>
          <strong>{totalWeight.toFixed(2)} <small>kg</small></strong>
          <small>Across all recovery stages</small>
        </article>

        <article className="analytics-card">
          <span>Recycler-confirmed</span>
          <strong>{confirmedWeight.toFixed(2)} <small>kg</small></strong>
          <small>Partner-confirmed quantity</small>
        </article>

        <article className="analytics-card">
          <span>Confirmation rate</span>
          <strong>
            {totalWeight > 0
              ? `${((confirmedWeight / totalWeight) * 100).toFixed(1)}%`
              : '0%'}
          </strong>
          <small>By recorded weight</small>
        </article>
      </div>

      <div className="analytics-content-grid">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Recovery pipeline</h3>
              <p>Entries currently documented at each stage.</p>
            </div>
          </div>

          <div className="analytics-stage-list">
            {stages.map((stage) => (
              <div className="analytics-stage" key={stage}>
                <div className="analytics-stage-top">
                  <span>{stage}</span>
                  <strong>{getStageCount(stage)} entries</strong>
                </div>
                <div className="analytics-track">
                  <div
                    className="analytics-fill"
                    style={{
                      width: `${records.length
                        ? (getStageCount(stage) / records.length) * 100
                        : 0}%`,
                    }}
                  />
                </div>
                <small>{getStageWeight(stage).toFixed(2)} kg</small>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Recovery weight by stage</h3>
              <p>Weight associated with each current status.</p>
            </div>
          </div>

          <div className="analytics-bars">
            {stages.map((stage) => (
              <div className="analytics-bar-item" key={stage}>
                <div className="analytics-bar-value">
                  {getStageWeight(stage).toFixed(2)} kg
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar"
                    style={{
                      height: `${(getStageWeight(stage) / maxStageWeight) * 100}%`,
                    }}
                  />
                </div>
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="analytics-panel analytics-summary">
        <div className="analytics-panel-heading">
          <div>
            <h3>Recovery summary</h3>
            <p>Current activity based on saved recovery records.</p>
          </div>
        </div>

        <div className="analytics-summary-grid">
          <div>
            <strong>{collectedCount}</strong>
            <span>Collected entries</span>
          </div>
          <div>
            <strong>{transferredCount}</strong>
            <span>Transferred entries</span>
          </div>
          <div>
            <strong>{confirmedCount}</strong>
            <span>Recycler-confirmed entries</span>
          </div>
        </div>
      </section>

      <div className="analytics-note">
        <strong>Data integrity matters</strong>
        <p>
          These figures come from records saved in this browser. Recorded,
          collected and transferred quantities are not proof of recycling.
          Only recycler-confirmed entries contribute to confirmed recovery.
          This prototype does not yet provide multi-user cloud synchronisation.
        </p>
      </div>
    </div>
  )
}

export default Analytics
