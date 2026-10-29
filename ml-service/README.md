# AgriSense AI — ML Microservice

> RandomForest crop-recommendation engine with per-prediction SHAP explanations.
> Built with FastAPI + scikit-learn. Proxied exclusively through the Node/Express backend.

---

## Prerequisites

- Python 3.10 or 3.11
- pip

---

## 1. Install dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

---

## 2. Ensure the dataset is in place

```
ml-service/
└── data/
    └── Crop_recommendation.csv   ← Kaggle: atharvaingle/crop-recommendation-dataset
```

---

## 3. Train the model

Run this **once** before starting the API (or whenever you want to retrain):

```bash
# from ml-service/
python train.py
```

This prints real accuracy / precision / recall / F1 / confusion matrix on the 20 % test split,
and saves three artifacts:

```
ml-service/model/
├── crop_model.pkl        ← fitted RandomForestClassifier
├── shap_explainer.pkl    ← SHAP TreeExplainer
└── class_labels.pkl      ← sorted list of 22 crop class strings
```

---

## 4. Start the FastAPI service

```bash
# from ml-service/
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

The service will be available at:
- `POST http://127.0.0.1:8000/predict` — main inference endpoint
- `GET  http://127.0.0.1:8000/health`  — liveness check
- `GET  http://127.0.0.1:8000/docs`    — Swagger UI (development only)

> **CORS is restricted to `http://localhost:5000` (Node backend) only.**  
> The browser / client should never call this service directly.  
> Set `NODE_BACKEND_ORIGIN` env var if your Node backend runs on a different port.

---

## 5. Node proxy

The Node/Express backend exposes:

```
POST /api/crop/ml-recommend
```

which forwards the request body to this service's `/predict` endpoint and returns its response unchanged.

---

## API Contract

### `POST /predict`

**Request body (JSON):**

| Field         | Type  | Description                    |
|---------------|-------|--------------------------------|
| `N`           | float | Nitrogen content (kg/ha)       |
| `P`           | float | Phosphorus content (kg/ha)     |
| `K`           | float | Potassium content (kg/ha)      |
| `temperature` | float | Temperature (°C)               |
| `humidity`    | float | Relative humidity (%)          |
| `ph`          | float | Soil pH (0–14)                 |
| `rainfall`    | float | Annual rainfall (mm)           |

**Response (200 OK):**

```json
{
  "crop": "rice",
  "confidence": 0.9467,
  "shap_explanation": {
    "N":           0.012,
    "P":           0.003,
    "K":          -0.001,
    "temperature": 0.045,
    "humidity":    0.031,
    "ph":         -0.008,
    "rainfall":    0.124
  }
}
```

**Errors:**
- `422 Unprocessable Entity` — any field missing or non-numeric (FastAPI/Pydantic automatic)
- `500 Internal Server Error` — unexpected prediction failure

---

## Environment Variables

| Variable               | Default                  | Description                          |
|------------------------|--------------------------|--------------------------------------|
| `NODE_BACKEND_ORIGIN`  | `http://localhost:5000`  | The only origin allowed by CORS      |
