import { useEffect, useState } from 'react'
import './RecoveryRecords.css'

type RecoveryStatus =
  | 'Recorded'
  | 'Collected'
  | 'Transferred'
  | 'Recycler-confirmed'

type RecoveryRecord = {
  id: string
  material: string
  category: string
  weight: number
  destination: string
  status: RecoveryStatus
  date: string
  eligibilityOutcome?: string
  humanVerified?: boolean
  scanLabel?: string
  scanConfidence?: number
}

type EligibilityResult = {
  material?: string
  outcome?: string
  humanVerified?: boolean
  scanLabel?: string
  scanConfidence?: number
  assessedAt?: string
}

type ScanResult = {
  fileName?: string
}

const statuses: RecoveryStatus[] = [
  'Recorded',
  'Collected',
  'Transferred',
  'Recycler-confirmed',
]

const storageKey = 'circlin-recovery-records-v1'
const eligibilityKey = 'circlin-eligibility-result-v1'
const scanKey = 'circlin-scan-result-v1'

function loadRecords(): RecoveryRecord[] {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as RecoveryRecord[] : []
  } catch {
    return []
  }
}

function loadEligibility(): EligibilityResult | null {
  try {
    const saved = localStorage.getItem(eligibilityKey)
    return saved ? JSON.parse(saved) as EligibilityResult : null
  } catch {
    return null
  }
}

function loadScan(): ScanResult | null {
  try {
    const saved = localStorage.getItem(scanKey)
    return saved ? JSON.parse(saved) as ScanResult : null
  } catch {
    return null
  }
}

function getMaterialName(fileName?: string) {
  if (!fileName) return 'Verified clinic packaging'

  const cleaned = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[-_]?/, '')
    .replace(/[-_]/g, ' ')
    .trim()

  return cleaned
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    : 'Verified clinic packaging'
}

function RecoveryRecords() {
  const [records, setRecords] = useState<RecoveryRecord[]>(loadRecords)
  const [eligibility] = useState<EligibilityResult | null>(loadEligibility)

  const isEligible =
    eligibility?.outcome === 'candidate' &&
    eligibility?.humanVerified === true

  const [material, setMaterial] = useState(() =>
    getMaterialName(loadScan()?.fileName)
  )
  const [category, setCategory] = useState(() =>
    loadEligibility()?.material || 'Paperboard / cardboard'
  )
  const [weight, setWeight] = useState('')
  const [destination, setDestination] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records))
  }, [records])

  const addRecord = () => {
    if (!isEligible || !eligibility) {
      setError('Complete eligibility screening and staff verification first.')
      return
    }

    const parsedWeight = Number(weight)

    if (!weight || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError('Enter a valid weight greater than zero.')
      return
    }

    if (!destination.trim()) {
      setError('Enter the collection destination or recovery partner.')
      return
    }

    const newRecord: RecoveryRecord = {
      id: `${Date.now()}`,
      material,
      category: eligibility.material || category,
      weight: parsedWeight,
      destination: destination.trim(),
      status: 'Recorded',
      date: new Date().toLocaleString(),
      eligibilityOutcome: eligibility.outcome,
      humanVerified: eligibility.humanVerified,
      scanLabel: eligibility.scanLabel,
      scanConfidence: eligibility.scanConfidence,
    }

    setRecords((current) => [newRecord, ...current])
    setWeight('')
    setDestination('')
    setError('')
  }

  const updateStatus = (id: string, status: RecoveryStatus) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, status } : record
      )
    )
  }

  const deleteRecord = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id))
  }

  const totalWeight = records.reduce((sum, record) => sum + record.weight, 0)

  const confirmedWeight = records
    .filter((record) => record.status === 'Recycler-confirmed')
    .reduce((sum, record) => sum + record.weight, 0)

  return (
    <div className="records-page">
      <div className="records-intro">
        <div>
          <span className="records-eyebrow">RECOVERY MANAGEMENT</span>
          <h2>Recovery records</h2>
          <p>
            Document material quantities and follow their recovery journey.
          </p>
        </div>
        <div className="records-icon">▤</div>
      </div>

      <div className="records-metrics">
        <article className="records-metric">
          <span>Total records</span>
          <strong>{records.length}</strong>
          <small>Saved entries</small>
        </article>

        <article className="records-metric">
          <span>Recorded weight</span>
          <strong>{totalWeight.toFixed(2)} <small>kg</small></strong>
          <small>Across all entries</small>
        </article>

        <article className="records-metric">
          <span>Recycler-confirmed</span>
          <strong>{confirmedWeight.toFixed(2)} <small>kg</small></strong>
          <small>Confirmed quantity only</small>
        </article>
      </div>

      <section className="records-panel">
        <div className="records-panel-heading">
          <div>
            <h3>Create recovery record</h3>
            <p>
              Only items that pass screening and staff verification can be
              entered into recovery records.
            </p>
          </div>
          <span className="records-step">NEW ENTRY</span>
        </div>

        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: isEligible ? '#edf8f0' : '#fff7e8',
            border: `1px solid ${isEligible ? '#b9dfc4' : '#ead6a8'}`,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '6px' }}>
            {isEligible
              ? 'Eligibility verified for this prototype entry'
              : 'Eligibility verification required'}
          </strong>

          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
            {isEligible
              ? `Screening outcome: Potential recovery candidate. Staff verification is recorded. Category: ${eligibility?.material || 'Not specified'}.`
              : eligibility?.outcome === 'candidate'
                ? 'The item passed initial screening, but staff physical inspection and protocol confirmation are still required in Eligibility Centre.'
                : eligibility?.outcome === 'rejected'
                  ? 'This item was marked not approved. It cannot be added to ordinary recovery records.'
                  : eligibility?.outcome === 'review'
                    ? 'This item requires manual review in Eligibility Centre before it can be recorded.'
                    : 'First scan an item, complete its eligibility screening, and confirm physical inspection in Eligibility Centre.'}
          </p>
        </div>

        <div className="records-form-grid">
          <label>
            Material
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              disabled={!isEligible}
            />
          </label>

          <label>
            Material category
            <input
              type="text"
              value={eligibility?.material || category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!isEligible || Boolean(eligibility?.material)}
            />
          </label>

          <label>
            Weight (kg)
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 2.50"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              disabled={!isEligible}
            />
          </label>

          <label>
            Collection destination / partner
            <input
              type="text"
              placeholder="e.g. Clinic recovery storage"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={!isEligible}
            />
          </label>
        </div>

        {error && <p className="records-error">{error}</p>}

        <button
          className="records-add-button"
          onClick={addRecord}
          disabled={!isEligible}
          style={{
            opacity: isEligible ? 1 : 0.5,
            cursor: isEligible ? 'pointer' : 'not-allowed',
          }}
        >
          + Add recovery record
        </button>

        <p className="records-form-note">
          New entries start as Recorded. Update their status only when the
          corresponding collection or transfer has actually occurred.
        </p>
      </section>

      <section className="records-panel">
        <div className="records-panel-heading">
          <div>
            <h3>Recovery activity</h3>
            <p>Track each entry through its documented recovery stages.</p>
          </div>
          <span className="records-count">{records.length} entries</span>
        </div>

        {records.length === 0 ? (
          <div className="records-empty">
            <div>▤</div>
            <strong>No recovery records yet</strong>
            <p>Create your first entry using the form above.</p>
          </div>
        ) : (
          <div className="records-table-wrap">
            <table className="records-table">
              <thead>
                <tr>
                  <th>MATERIAL</th>
                  <th>CATEGORY</th>
                  <th>WEIGHT</th>
                  <th>DESTINATION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.material}</strong>
                      <small>{record.date}</small>
                    </td>

                    <td>{record.category}</td>
                    <td>{record.weight.toFixed(2)} kg</td>
                    <td>{record.destination}</td>

                    <td>
                      <select
                        className="records-status-select"
                        value={record.status}
                        onChange={(e) =>
                          updateStatus(
                            record.id,
                            e.target.value as RecoveryStatus
                          )
                        }
                        aria-label={`Update status for ${record.material}`}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <button
                        className="records-delete"
                        onClick={() => deleteRecord(record.id)}
                        aria-label={`Delete ${record.material}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="records-safety">
        <strong>Documentation and verification</strong>
        <p>
          A recorded entry does not prove that material was collected,
          transferred or recycled. Use Recycler-confirmed only after receiving
          confirmation from the authorised recovery partner. Never enter
          biomedical or contaminated waste into ordinary recovery records.
          This browser-based prototype does not provide secure staff
          authentication or independent verification.
        </p>
      </div>
    </div>
  )
}

export default RecoveryRecords
