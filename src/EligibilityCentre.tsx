import { useEffect, useState } from 'react'
import './EligibilityCentre.css'

type Outcome = 'candidate' | 'review' | 'rejected'

type ScanResult = {
  material: string
  label: string
  confidence: number
  fileName: string
  scannedAt: string
}

const scanKey = 'circlin-scan-result-v1'
const eligibilityKey = 'circlin-eligibility-result-v1'

function EligibilityCentre() {
  const [material, setMaterial] = useState('Paperboard / cardboard')
  const [wasteStream, setWasteStream] = useState('General non-biomedical waste')
  const [contamination, setContamination] = useState('No visible contamination')
  const [condition, setCondition] = useState('Clean and dry')
  const [protocol, setProtocol] = useState('Yes')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [humanVerified, setHumanVerified] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(scanKey)
      if (!saved) return

      const parsed = JSON.parse(saved) as ScanResult
      setScan(parsed)
      setMaterial(parsed.material || 'Unknown material')
      setOutcome(null)
      setHumanVerified(false)
    } catch {
      setScan(null)
    }
  }, [])

  const evaluate = () => {
    let result: Outcome

    if (
      wasteStream === 'Biomedical / infectious waste' ||
      contamination === 'Yes' ||
      condition === 'Wet, soiled or damaged'
    ) {
      result = 'rejected'
    } else if (
      material === 'Unknown material' ||
      wasteStream !== 'General non-biomedical waste' ||
      contamination !== 'No visible contamination' ||
      condition !== 'Clean and dry' ||
      protocol !== 'Yes' ||
      !scan ||
      scan.confidence < 60
    ) {
      result = 'review'
    } else {
      result = 'candidate'
    }

    setOutcome(result)
    setHumanVerified(false)

    localStorage.setItem(
      eligibilityKey,
      JSON.stringify({
        material,
        outcome: result,
        humanVerified: false,
        scanLabel: scan?.label || '',
        scanConfidence: scan?.confidence ?? null,
        assessedAt: new Date().toISOString(),
      })
    )
  }

  const confirmHumanVerification = (checked: boolean) => {
    setHumanVerified(checked)

    if (outcome === 'candidate') {
      localStorage.setItem(
        eligibilityKey,
        JSON.stringify({
          material,
          outcome,
          humanVerified: checked,
          scanLabel: scan?.label || '',
          scanConfidence: scan?.confidence ?? null,
          assessedAt: new Date().toISOString(),
        })
      )
    }
  }

  const reset = () => {
    setMaterial('Paperboard / cardboard')
    setWasteStream('General non-biomedical waste')
    setContamination('No visible contamination')
    setCondition('Clean and dry')
    setProtocol('Yes')
    setOutcome(null)
    setHumanVerified(false)
    localStorage.removeItem(eligibilityKey)
  }

  const changeField = (setter: (value: string) => void) =>
    (value: string) => {
      setter(value)
      setOutcome(null)
      setHumanVerified(false)
      localStorage.removeItem(eligibilityKey)
    }

  return (
    <div className="eligibility-page">
      <div className="eligibility-intro">
        <div>
          <span className="eligibility-eyebrow">MATERIAL VERIFICATION</span>
          <h2>Eligibility assessment</h2>
          <p>
            Review packaging information before considering it for a
            recovery pathway.
          </p>
        </div>
        <div className="eligibility-shield">✓</div>
      </div>

      {scan && (
        <section className="panel" style={{ padding: 18, marginBottom: 18 }}>
          <strong>Latest AI scanner result</strong>
          <p>Image: {scan.fileName}</p>
          <p>Predicted material: {scan.label.replace(/_/g, ' ')}</p>
          <p>Mapped category: {scan.material}</p>
          <p>Model confidence: {scan.confidence.toFixed(2)}%</p>
          <small>AI identification is informational only, not a safety approval.</small>
        </section>
      )}

      <div className="eligibility-layout">
        <section className="eligibility-form panel">
          <div className="eligibility-section-heading">
            <span>01</span>
            <div>
              <h3>Material information</h3>
              <p>Identify the item being assessed.</p>
            </div>
          </div>

          <label className="eligibility-field">
            Material category
            <select value={material} onChange={(e) => changeField(setMaterial)(e.target.value)}>
              <option>Paperboard / cardboard</option>
              <option>Plastic packaging</option>
              <option>Composite packaging</option>
              <option>Metal packaging</option>
              <option>Glass packaging</option>
              <option>Unknown material</option>
            </select>
          </label>

          <div className="eligibility-section-heading second">
            <span>02</span>
            <div>
              <h3>Safety screening</h3>
              <p>Check the waste stream and item condition.</p>
            </div>
          </div>

          <label className="eligibility-field">
            Waste stream
            <select value={wasteStream} onChange={(e) => changeField(setWasteStream)(e.target.value)}>
              <option>General non-biomedical waste</option>
              <option>Biomedical / infectious waste</option>
              <option>Unknown / not verified</option>
            </select>
          </label>

          <label className="eligibility-field">
            Visible contamination
            <select value={contamination} onChange={(e) => changeField(setContamination)(e.target.value)}>
              <option>No visible contamination</option>
              <option>Yes</option>
              <option>Uncertain</option>
            </select>
          </label>

          <label className="eligibility-field">
            Packaging condition
            <select value={condition} onChange={(e) => changeField(setCondition)(e.target.value)}>
              <option>Clean and dry</option>
              <option>Wet, soiled or damaged</option>
              <option>Uncertain condition</option>
            </select>
          </label>

          <div className="eligibility-section-heading second">
            <span>03</span>
            <div>
              <h3>Clinic protocol</h3>
              <p>Confirm that an approved local procedure applies.</p>
            </div>
          </div>

          <label className="eligibility-field">
            Is this item covered by the clinic's approved recovery protocol?
            <select value={protocol} onChange={(e) => changeField(setProtocol)(e.target.value)}>
              <option>Yes</option>
              <option>No</option>
              <option>Not sure</option>
            </select>
          </label>

          <div className="eligibility-actions">
            <button className="eligibility-primary" onClick={evaluate}>
              Assess eligibility →
            </button>
            <button className="eligibility-reset" onClick={reset}>
              Reset
            </button>
          </div>
        </section>

        <aside className="eligibility-side">
          <section className="eligibility-result panel">
            <span className="eligibility-eyebrow">ASSESSMENT RESULT</span>

            {!outcome ? (
              <div className="eligibility-empty">
                <div className="eligibility-empty-icon">✓</div>
                <h3>Awaiting assessment</h3>
                <p>Complete the screening and select Assess eligibility.</p>
              </div>
            ) : outcome === 'candidate' ? (
              <div className="eligibility-outcome candidate">
                <div className="eligibility-result-icon">✓</div>
                <h3>Potential recovery candidate</h3>
                <p>Initial information meets the configured screening conditions. This is not final recycling approval.</p>
                <div className="eligibility-next">
                  <strong>Human verification required</strong>
                  <span>An authorised staff member must physically inspect the item and verify the applicable clinic procedure.</span>
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16 }}>
                  <input
                    type="checkbox"
                    checked={humanVerified}
                    onChange={(e) => confirmHumanVerification(e.target.checked)}
                  />
                  I confirm that I physically inspected this item and verified it against the clinic's approved protocol.
                </label>
                <p style={{ marginTop: 12 }}>
                  {humanVerified
                    ? 'Human verification recorded. You may now proceed to Recovery Records.'
                    : 'Recovery recording remains locked until human verification is confirmed.'}
                </p>
              </div>
            ) : outcome === 'review' ? (
              <div className="eligibility-outcome review">
                <div className="eligibility-result-icon">!</div>
                <h3>Manual review required</h3>
                <p>One or more details are unknown, uncertain, or require further verification.</p>
                <div className="eligibility-next">
                  <strong>Required next step</strong>
                  <span>Keep the item out of the recovery stream until authorised staff verify it.</span>
                </div>
              </div>
            ) : (
              <div className="eligibility-outcome rejected">
                <div className="eligibility-result-icon">×</div>
                <h3>Not approved for ordinary recovery</h3>
                <p>The information indicates biomedical waste, visible contamination or unsuitable condition.</p>
                <div className="eligibility-next">
                  <strong>Required next step</strong>
                  <span>Do not place this item in the ordinary recycling stream. Follow applicable clinic safety procedures.</span>
                </div>
              </div>
            )}
          </section>

          <section className="eligibility-safety">
            <span>ⓘ</span>
            <div>
              <strong>Safety comes first</strong>
              <p>This prototype cannot detect contamination, establish regulatory compliance or certify recyclability. Human inspection and approved clinic procedures are mandatory.</p>
            </div>
          </section>

          <div className="eligibility-material-summary">
            <span>SELECTED MATERIAL</span>
            <strong>{material}</strong>
            <span>Screening tool · Prototype demonstration</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default EligibilityCentre
