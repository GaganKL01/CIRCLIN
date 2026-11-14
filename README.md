# CIRCLIN ♻️
### Turning Clinic Waste into Circular Value

CIRCLIN is an AI-assisted resource-recovery platform designed to help clinics identify, screen, document and track potentially recoverable non-contaminated packaging materials.

Built as a hackathon prototype under the theme Circular Economy & Recycling, targeting doctors and clinics.

## The Problem

Clinics generate packaging waste from medicines, medical supplies and equipment. Some clean, non-contaminated packaging may have recycling value, but identifying, segregating and tracking these materials can be challenging.

## Our Solution

CIRCLIN connects five steps:

**Learn → Identify → Verify → Recover → Measure**

## Key Features

1. **AI-assisted Material Scanner**
   - TensorFlow.js image classification.
   - Helps identify material categories from sample images.

2. **AR Training Studio**
   - MindAR.js and Three.js.
   - Marker-based augmented reality.
   - Interactive lessons and quizzes.

3. **Eligibility Centre**
   - Screens materials as potential candidates, requiring review, or not approved.
   - Requires staff confirmation for potential candidates.

4. **Digital Recovery Records**
   - Records material weight and destination.
   - Tracks recovery stages.
   - Uses browser localStorage for prototype persistence.

5. **Analytics Dashboard**
   - Displays recorded recovery activity and status summaries.

## Technology Stack

- React
- TypeScript
- Vite
- TensorFlow.js
- MindAR.js
- Three.js
- CSS
- Browser localStorage

## Run Locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/GaganKL01/CIRCLIN.git
cd CIRCLIN
npm install
npm run dev
