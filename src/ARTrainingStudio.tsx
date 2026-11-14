
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'

const lessons = [
  {
    title: 'Identify the material',
    subtitle: 'Recognise common healthcare packaging',
    instruction:
      'Look at the packaging and identify whether it appears to be paper, cardboard, plastic or a composite material.',
    tip: 'Visual appearance is only an initial material clue.',
  },
  {
    title: 'Check eligibility',
    subtitle: 'Verify before segregation',
    instruction:
      'Check the clinic-approved waste policy and confirm that the item is clean, uncontaminated and eligible for the designated recovery stream.',
    tip: 'Never use AI or appearance alone to determine contamination or recycling eligibility.',
  },
  {
    title: 'Segregate safely',
    subtitle: 'Follow approved clinic procedures',
    instruction:
      'Place only verified eligible materials into the designated collection stream. Keep biomedical and hazardous waste separate.',
    tip: 'When uncertain, stop and request manual verification.',
  },
]

function ARTrainingStudio() {
  const [activeLesson, setActiveLesson] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [answer, setAnswer] = useState('')
  const [arStatus, setArStatus] = useState('Camera not started')
  const [isStarting, setIsStarting] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [targetFound, setTargetFound] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<any>(null)

  const lesson = lessons[activeLesson]

  async function startAR() {
    if (mindarRef.current || isStarting) return

    if (!containerRef.current) {
      setArStatus('AR display is not ready.')
      return
    }

    setIsStarting(true)
    setArStatus('Starting camera and loading marker...')

    let mindar: any = null

    try {
      mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: '/ar/circlin-marker.mind',
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
      })

      mindarRef.current = mindar

      const anchor = mindar.addAnchor(0)

      const group = new THREE.Group()

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.48, 0.045),
        new THREE.MeshStandardMaterial({
          color: 0x174d35,
          roughness: 0.55,
        })
      )

      panel.position.set(0, 0.08, 0.08)
      group.add(panel)

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.012, 12, 64),
        new THREE.MeshStandardMaterial({ color: 0x8be0a5 })
      )

      ring.position.set(0, 0.13, 0.11)
      group.add(ring)

      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 512
      labelCanvas.height = 256

      const ctx = labelCanvas.getContext('2d')

      if (ctx) {
        ctx.fillStyle = '#174d35'
        ctx.fillRect(0, 0, 512, 256)

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 54px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('CIRCLIN', 256, 110)

        ctx.font = '25px Arial'
        ctx.fillText('IDENTIFY • VERIFY • RECOVER', 256, 165)

        ctx.fillStyle = '#9ce5b2'
        ctx.font = 'bold 24px Arial'
        ctx.fillText('TRAINING STUDIO', 256, 215)
      }

      const texture = new THREE.CanvasTexture(labelCanvas)
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.36),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
        })
      )

      label.position.set(0, 0.08, 0.105)
      group.add(label)

      anchor.group.add(group)

      anchor.onTargetFound = () => {
        setTargetFound(true)
        setArStatus('CIRCLIN marker detected!')
      }

      anchor.onTargetLost = () => {
        setTargetFound(false)
        setArStatus('Searching for CIRCLIN marker...')
      }

      await mindar.start()

      mindar.renderer.setAnimationLoop(() => {
        ring.rotation.z += 0.01
        mindar.renderer.render(mindar.scene, mindar.camera)
      })

      setIsRunning(true)
      setArStatus('Camera active. Point it at your mobile marker.')
    } catch (error) {
      console.error('AR startup error:', error)

      try {
        mindar?.renderer?.setAnimationLoop(null)
        mindar?.stop()
      } catch {
        // Continue cleanup if startup failed.
      }

      mindarRef.current = null
      setArStatus(
        error instanceof Error
          ? error.message
          : 'Could not start AR. Check camera permission.'
      )
    } finally {
      setIsStarting(false)
    }
  }

  function stopAR() {
    const mindar = mindarRef.current

    if (mindar) {
      mindar.renderer.setAnimationLoop(null)
      mindar.stop()
      mindarRef.current = null
    }

    setIsRunning(false)
    setTargetFound(false)
    setArStatus('Camera stopped')
  }

  useEffect(() => {
    return () => {
      const mindar = mindarRef.current

      if (mindar) {
        mindar.renderer.setAnimationLoop(null)
        mindar.stop()
        mindarRef.current = null
      }
    }
  }, [])

  return (
    <div className="ar-page">
      <div className="scanner-intro">
        <div>
          <div className="eyebrow">IMMERSIVE STAFF LEARNING</div>
          <h2>AR Training Studio</h2>
          <p>Interactive augmented reality for responsible clinic recovery.</p>
        </div>
        <span className="scanner-ai-badge">LIVE IMAGE TRACKING</span>
      </div>

      <div className="ar-layout">
        <section className="panel ar-visual-panel">
          <div className="panel-heading">
            <div>
              <h2>Live AR experience</h2>
              <p>Point your camera at the CIRCLIN marker displayed on your mobile.</p>
            </div>
          </div>

          <div
            ref={containerRef}
            className="ar-camera-container"
          >
            {!isRunning && (
              <div className="ar-camera-placeholder">
                <div className="ar-camera-symbol">◎</div>
                <strong>AR camera is ready</strong>
                <span>Start the camera to begin image tracking.</span>
              </div>
            )}
          </div>

          <div className="ar-live-status">
            <span className={`status-dot ${targetFound ? 'ar-found' : ''}`} />
            {arStatus}
          </div>

          <div className="ar-camera-controls">
            <button
              className="primary-button"
              type="button"
              onClick={startAR}
              disabled={isStarting || isRunning}
            >
              {isStarting ? 'Starting...' : 'Start AR camera'}
            </button>

            <button
              className="remove-image"
              type="button"
              onClick={stopAR}
              disabled={!isRunning && !isStarting}
            >
              Stop camera
            </button>
          </div>
        </section>

        <section className="panel ar-lesson-panel">
          <div className="panel-heading">
            <div>
              <h2>Learning modules</h2>
              <p>Follow each step in sequence.</p>
            </div>
          </div>

          <div className="ar-lesson-list">
            {lessons.map((item, index) => (
              <button
                key={item.title}
                className={`ar-lesson-item ${
                  activeLesson === index ? 'active' : ''
                }`}
                onClick={() => {
                  setActiveLesson(index)
                  setShowQuiz(false)
                  setAnswer('')
                }}
              >
                <span className="ar-lesson-number">0{index + 1}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <span className="ar-lesson-arrow">→</span>
              </button>
            ))}
          </div>

          <div className="ar-lesson-detail">
            <span className="eyebrow">CURRENT MODULE</span>
            <h3>{lesson.title}</h3>
            <p>{lesson.instruction}</p>

            <div className="ar-tip">
              <strong>Remember</strong>
              <span>{lesson.tip}</span>
            </div>

            <button
              className="primary-button ar-next-button"
              onClick={() => {
                if (activeLesson < lessons.length - 1) {
                  setActiveLesson(activeLesson + 1)
                  setShowQuiz(false)
                  setAnswer('')
                } else {
                  setShowQuiz(true)
                }
              }}
            >
              {activeLesson < lessons.length - 1
                ? 'Next lesson →'
                : 'Complete training →'}
            </button>
          </div>
        </section>
      </div>

      {showQuiz && (
        <section className="panel ar-quiz-panel">
          <div className="eyebrow">KNOWLEDGE CHECK</div>
          <h2>
            What should happen when a packaging item's contamination status is uncertain?
          </h2>

          {[
            'Place it in the recycling stream',
            'Request manual verification and follow clinic policy',
            'Let the AI decide automatically',
          ].map((option) => (
            <button
              key={option}
              className={`ar-quiz-option ${
                answer === option ? 'selected' : ''
              }`}
              onClick={() => setAnswer(option)}
            >
              {option}
            </button>
          ))}

          {answer && (
            <p className="ar-quiz-feedback">
              {answer ===
              'Request manual verification and follow clinic policy'
                ? 'Correct! Uncertain items require manual verification.'
                : 'Not quite. Never assume an uncertain item is safe to recycle.'}
            </p>
          )}
        </section>
      )}

      <div className="scanner-safety">
        <strong>Training safety notice</strong>
        <p>
          This prototype does not replace clinic-approved biomedical waste
          procedures, staff training or human verification.
        </p>
      </div>
    </div>
  )
}

export default ARTrainingStudio
