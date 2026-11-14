
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import * as tf from '@tensorflow/tfjs'

const MODEL_URL = '/model/model.json'
const METADATA_URL = '/model/metadata.json'

const demoImages = [
  { name: 'Medicine carton', file: '01-medicine-carton.jpg', type: 'Paperboard' },
  { name: 'Glove box', file: '02-glove-box.jpg', type: 'Paperboard' },
  { name: 'Gauze box', file: '03-gauze-box.jpg', type: 'Paperboard' },
  { name: 'Medicine leaflet', file: '04-medicine-leaflet.jpg', type: 'Paper' },
  { name: 'Shipping carton', file: '05-shipping-carton.jpg', type: 'Cardboard' },
  { name: 'Sterile outer pouch', file: '06-sterile-pouch.jpg', type: 'To be identified' },
  { name: 'Mask supply box', file: '07-mask-box.jpg', type: 'Paperboard' },
  { name: 'Syringe wrapper', file: '08-syringe-wrapper.jpg', type: 'To be identified' },
  { name: 'Cotton swab box', file: '09-cotton-swab-box.jpg', type: 'Paperboard' },
  { name: 'Pharma insert', file: '10-pharma-insert.jpg', type: 'Paper' },
]

interface ModelMetadata {
  labels: string[]
  imageSize: number
}

interface Prediction {
  label: string
  confidence: number
}

function MaterialScanner() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [model, setModel] = useState<tf.LayersModel | null>(null)
  const [labels, setLabels] = useState<string[]>([])
  const [modelStatus, setModelStatus] = useState('Loading AI model...')
  const [isScanning, setIsScanning] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([])

  const imageRef = useRef<HTMLImageElement>(null)

  // Load the TensorFlow.js model and its class labels.
  useEffect(() => {
    let cancelled = false
    let loadedModel: tf.LayersModel | null = null

    async function loadModel() {
      try {
        setModelStatus('Preparing TensorFlow.js...')
        await tf.ready()

        const metadataResponse = await fetch(METADATA_URL)

        if (!metadataResponse.ok) {
          throw new Error('Could not load model metadata.')
        }

        const metadata: ModelMetadata = await metadataResponse.json()

        if (!metadata.labels || metadata.labels.length === 0) {
          throw new Error('No class labels found in model metadata.')
        }

        loadedModel = await tf.loadLayersModel(MODEL_URL)

        if (cancelled) {
          loadedModel.dispose()
          return
        }

        setLabels(metadata.labels)
        setModel(loadedModel)
        setModelStatus('AI model loaded successfully')
      } catch (err) {
        console.error('Model loading error:', err)
        setModelStatus('AI model failed to load')
        setError(
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while loading the AI model.'
        )
      }
    }

    loadModel()

    return () => {
      cancelled = true
      loadedModel?.dispose()
    }
  }, [])

  // Release uploaded image URLs when they are replaced or removed.
  useEffect(() => {
    if (!imageUrl?.startsWith('blob:')) return

    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be below 10 MB.')
      return
    }

    setError('')
    setPrediction(null)
    setAllPredictions([])
    setFileName(file.name)
    setImageUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  function selectDemoImage(file: string, name: string) {
    setError('')
    setPrediction(null)
    setAllPredictions([])
    setFileName(name)
    setImageUrl(`/demo-images/${file}`)
  }

  function removeImage() {
    setImageUrl(null)
    setFileName('')
    setError('')
    setPrediction(null)
    setAllPredictions([])
  }

  // Convert the selected image into a 224 x 224 TensorFlow tensor.
  async function scanImage() {
    if (!model || !imageRef.current) {
      setError('AI model or image is not ready. Please wait and try again.')
      return
    }

    if (!imageRef.current.complete || imageRef.current.naturalWidth === 0) {
      setError('The image has not loaded correctly.')
      return
    }

    setIsScanning(true)
    setError('')
    setPrediction(null)
    setAllPredictions([])

    let inputTensor: tf.Tensor | null = null
    let outputTensor: tf.Tensor | null = null

    try {
      const canvas = document.createElement('canvas')
      const imageSize = 224

      canvas.width = imageSize
      canvas.height = imageSize

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Could not prepare the image for analysis.')
      }

      context.drawImage(
        imageRef.current,
        0,
        0,
        imageSize,
        imageSize
      )

      inputTensor = tf.tidy(() => {
        return tf.browser
          .fromPixels(canvas)
          .toFloat()
          .div(127.5)
          .sub(1)
          .expandDims(0)
      })

      const output = model.predict(inputTensor)
      outputTensor = Array.isArray(output) ? output[0] : output

      const scores = await outputTensor.data()

      if (scores.length !== labels.length) {
        throw new Error('Model output does not match the class labels.')
      }

      const results: Prediction[] = Array.from(scores)
        .map((score, index) => ({
          label: labels[index],
          confidence: Number(score) * 100,
        }))
        .sort((a, b) => b.confidence - a.confidence)

      setAllPredictions(results)
      setPrediction(results[0])

      const predictedMaterial =
        /paper|cardboard/i.test(results[0].label)
          ? 'Paperboard / cardboard'
          : /plastic/i.test(results[0].label)
            ? 'Plastic packaging'
            : /metal/i.test(results[0].label)
              ? 'Metal packaging'
              : /glass/i.test(results[0].label)
                ? 'Glass packaging'
                : 'Unknown material'

      localStorage.setItem(
        'circlin-scan-result-v1',
        JSON.stringify({
          material: predictedMaterial,
          label: results[0].label,
          confidence: results[0].confidence,
          fileName,
          scannedAt: new Date().toISOString(),
        })
      )
    } catch (err) {
      console.error('Image analysis error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Image analysis failed. Please try another image.'
      )
    } finally {
      inputTensor?.dispose()
      outputTensor?.dispose()
      setIsScanning(false)
    }
  }

  function formatLabel(label: string) {
    return label.replace(/_/g, ' ')
  }

  return (
    <div className="scanner-page">
      <div className="scanner-intro">
        <div>
          <div className="eyebrow">AI-POWERED MATERIAL INTELLIGENCE</div>
          <h2>Material Scanner</h2>
          <p>Upload or select a healthcare packaging image to begin.</p>
        </div>
        <span className="scanner-ai-badge">AI MATERIAL SCANNER</span>
      </div>

      <div className="scanner-layout">
        <section className="panel scanner-upload-panel">
          <div className="panel-heading">
            <div>
              <h2>Upload material image</h2>
              <p>Choose a clear image of the packaging you want to inspect.</p>
            </div>
          </div>

          {!imageUrl ? (
            <label className="upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="upload-icon">↑</div>
              <strong>Drop your image here or browse</strong>
              <span>PNG, JPG, WEBP · Maximum 10 MB</span>
              <span className="browse-button">Choose image</span>
            </label>
          ) : (
            <div className="image-preview">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Selected healthcare packaging"
                onLoad={() => setError('')}
              />
              <div className="image-preview-footer">
                <div>
                  <strong>{fileName}</strong>
                  <span>Image successfully loaded</span>
                </div>
                <button
                  className="remove-image"
                  onClick={removeImage}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {error && <p className="scanner-error">{error}</p>}

          {imageUrl && (
            <button
              className="browse-button scan-action"
              onClick={scanImage}
              disabled={isScanning || !model}
              type="button"
            >
              {isScanning
                ? 'Analysing image...'
                : model
                  ? 'Analyse material'
                  : 'Loading AI model...'}
            </button>
          )}
        </section>

        <section className="panel scanner-result-panel">
          <div className="panel-heading">
            <div>
              <h2>Identification results</h2>
              <p>AI material classification results.</p>
            </div>
          </div>

          <div className="scanner-empty-result">
            {!prediction ? (
              <>
                <div className="result-icon">⌕</div>
                <strong>
                  {imageUrl ? 'Ready for analysis' : 'Waiting for an image'}
                </strong>
                <p>
                  {imageUrl
                    ? 'Click Analyse material to run the AI model.'
                    : 'Select or upload a packaging image to prepare it for identification.'}
                </p>
              </>
            ) : (
              <>
                <div className="result-icon">✓</div>
                <strong>AI prediction complete</strong>

                <div className="scanner-prediction">
                  <span>Predicted material category</span>
                  <h3>{formatLabel(prediction.label)}</h3>
                  <strong>
                    {prediction.confidence.toFixed(2)}% confidence
                  </strong>

                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.min(prediction.confidence, 100)}%` }}
                    />
                  </div>
                </div>

                {allPredictions.map((item) => (
                  <div className="scanner-score" key={item.label}>
                    <span>{formatLabel(item.label)}</span>
                    <strong>{item.confidence.toFixed(2)}%</strong>
                  </div>
                ))}

                {prediction.confidence < 60 && (
                  <p className="scanner-error">
                    Low-confidence prediction. Manual review is recommended.
                  </p>
                )}
              </>
            )}

            <span className="model-status">
              <span /> {modelStatus}
            </span>
          </div>
        </section>
      </div>

      <section className="panel demo-gallery">
        <div className="panel-heading">
          <div>
            <h2>Demo image library</h2>
            <p>Select a sample image to load it into the scanner.</p>
          </div>
          <span className="gallery-count">10 SAMPLES</span>
        </div>

        <div className="demo-image-grid">
          {demoImages.map((item) => (
            <button
              className={`demo-image-card ${
                fileName === item.name ? 'selected' : ''
              }`}
              key={item.file}
              onClick={() => selectDemoImage(item.file, item.name)}
              type="button"
            >
              <img
                src={`/demo-images/${item.file}`}
                alt={item.name}
                loading="lazy"
              />
              <span className="demo-image-name">{item.name}</span>
              <span className="demo-image-type">{item.type}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="scanner-safety">
        <strong>Important safety notice</strong>
        <p>
          AI predictions identify visual patterns only. They cannot determine
          contamination, infection risk or recycling eligibility. Follow
          approved clinic waste procedures and require human verification.
        </p>
      </div>
    </div>
  )
}

export default MaterialScanner
