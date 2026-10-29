# AgriSense AI 🌱

AI-powered crop advisory platform for smallholder farmers in India — built with the
**MERN stack** + a **Python FastAPI ML service**.

---

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS v4, Lucide React      |
| Backend     | Node.js 18+, Express.js 4.x (CommonJS)             |
| Database    | MongoDB (Mongoose 8.x)                             |
| Auth        | JSON Web Tokens (jsonwebtoken 9.x), bcryptjs 3.x   |
| File upload | Multer (disease / soil images)                     |
| OCR         | Tesseract.js 7.x — **soil analysis only**          |
| ML service  | Python 3.10+, FastAPI, scikit-learn (Random Forest)|
| Language    | JavaScript (ESM client / CJS server) + Python      |

---

## Project Structure

```
farm-ai-grow-83-main/
|-- client/                     <- React 18 frontend (Vite + JSX)
|   `-- src/
|       |-- components/         <- Navbar, AuthModal, SchemeMatcher, ...
|       |-- context/            <- AuthContext, FarmerProfileContext
|       `-- pages/
|           |-- CropRecommend.jsx   <- ML crop recommendation (port 8001)
|           |-- DiseaseDetect.jsx   <- Demo placeholder (no live ML model)
|           `-- SoilAnalyzer.jsx    <- OCR-assisted soil report parsing
|
|-- server/                     <- Express backend (CommonJS)
|   |-- controllers/
|   |   |-- cropController.js       <- DEPRECATED heuristic /recommend
|   |   |-- mlCropController.js     <- ML proxy -> FastAPI :8001
|   |   |-- diseaseController.js    <- Demo placeholder (hash-selected)
|   |   `-- soilController.js       <- Tesseract.js OCR + advisory
|   |-- services/
|   |   |-- schemeMatcher.js        <- Pure rule-based eligibility engine
|   |   |-- roiEstimator.js         <- MSP-based economics calculator
|   |   `-- rotationAdvisor.js      <- ICAR rotation advisory
|   |-- Data/
|   |   |-- govt_schemes.json           <- DO NOT MODIFY
|   |   |-- crop_economics.json         <- 12-entry verified MSP data
|   |   `-- crop_rotation_matrix.json   <- ICAR/TNAU rotation rules
|   |-- tests/
|   |   |-- schemeMatcher.test.js
|   |   |-- roiEstimator.test.js
|   |   `-- rotation.test.js
|   `-- server.js               <- Express entry point (port 5001)
|
`-- ml-service/                 <- Python FastAPI ML service (port 8001)
    |-- app.py                  <- /predict endpoint
    |-- train_v2.py             <- Random Forest training (27-class v2 dataset)
    `-- models/                 <- Saved model artefacts
```

---

## Run the Demo

Three services must run simultaneously. Open three terminals:

**Terminal 1 — Express backend** (port 5001):
```bash
cd server
npm install
npm run dev
# -> http://localhost:5001
```

**Terminal 2 — React frontend** (port 5173):
```bash
cd client
npm install
npm run dev
# -> http://localhost:5173
```

**Terminal 3 — Python ML service** (port 8001):
```bash
cd ml-service
pip install -r requirements.txt   # once
uvicorn app:app --host 127.0.0.1 --port 8001 --reload
# -> http://127.0.0.1:8001/predict
```

> If the ML service is offline the crop-recommendation page returns a 503 with
> an informative message. All other features remain functional.

---

## Environment Configuration

Copy `server/.env.example` to `server/.env` and fill in real values:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/agrisense
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_string
OPENWEATHER_API_KEY=replace_with_your_openweathermap_key
```

> Do **not** commit `.env` — it is git-ignored.

---

## API Endpoints (key routes)

| Method | Endpoint                    | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/api/health`               | Server health check                      |
| POST   | `/api/auth/register`        | Create account                           |
| POST   | `/api/auth/login`           | Returns JWT                              |
| GET    | `/api/auth/me`              | Current user (Bearer JWT required)       |
| POST   | `/api/crop/ml-recommend`    | ML crop recommendation (proxied to 8001) |
| POST   | `/api/crop/recommend`       | DEPRECATED rule-based heuristic          |
| POST   | `/api/disease/detect`       | Disease detection (demo placeholder)     |
| POST   | `/api/soil/analyze`         | Soil report OCR + advisory               |
| POST   | `/api/schemes/match`        | Government scheme eligibility matcher    |
| GET    | `/api/weather`              | Weather forecast                         |

---

## Running Tests

```bash
cd server
npm test
# Runs: schemeMatcher -> roiEstimator -> rotation (all plain Node scripts)
```

### Smoke test (requires both Express and FastAPI to be running)

Express (`http://localhost:5000`) and FastAPI (`http://127.0.0.1:8001`) must both be running for the full smoke test.

```bash
# Start backend (cd server && npm run dev) and ML service (cd ml-service && uvicorn app:app --port 8001),
# then in a separate terminal:
node server/scripts/smoke_test.js

# If the ML service is not running, skip ML checks:
SKIP_ML=1 node server/scripts/smoke_test.js

# Override base URL if the server runs on a different port:
BASE_URL=http://localhost:5001 node server/scripts/smoke_test.js
```

---

## Features

- AI Crop Recommendation: Random Forest (27 classes, SHAP explainability)
- Scheme Eligibility: Rule-based matcher for PM-KISAN, SMAM, PMFBY, etc.
- Economics: MSP-based ROI estimation (verified 2026-27 data)
- Rotation Advisory: ICAR/TNAU rotation matrix
- Soil Analyzer: OCR-assisted (Tesseract.js) soil report parser
- Disease Detection: Demo placeholder; a trained CV model is planned
- Weather Forecast: OpenWeatherMap integration
- Irrigation & Fertilizer: Rule-based calculators
- Contact Form: Saved to MongoDB

---

## Known Limitations

| Area | Current behaviour | Planned fix |
|---|---|---|
| JWT storage | Token stored in localStorage (XSS exposure) | Migrate to httpOnly cookie |
| Disease detection | Demo placeholder — diagnosis selected by filename hash, not a real model | Train and integrate a CNN/ViT model |
| Economics data | MSP values verified for 2026-27; cost and yield fields are null until CACP data is added | Fill cost/yield from CACP reports |
| Deployed model | 27 crop classes from v2 dataset | Extend dataset for more classes |

---

Built with for farmers.
