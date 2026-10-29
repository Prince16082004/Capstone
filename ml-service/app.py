"""
app.py  –  AgriSense AI | Crop Recommendation FastAPI Microservice
===================================================================
Serves the trained RandomForest model for real-time crop recommendations
with per-prediction local SHAP explanations.

Start:
    uvicorn app:app --host 127.0.0.1 --port 8000 --reload

The Node/Express backend proxies POST /api/crop/ml-recommend → this service.
The client NEVER calls this service directly.
"""

import json
import os
import sys
import pathlib
import logging

import numpy  as np
import pandas as pd
import joblib

from contextlib import asynccontextmanager
from fastapi    import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic   import BaseModel, Field

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("agrisense.ml")

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR       = pathlib.Path(__file__).parent
MODEL_DIR      = BASE_DIR / "model"
MODEL_PATH     = MODEL_DIR / "crop_model.pkl"
EXPLAINER_PATH = MODEL_DIR / "shap_explainer.pkl"
ENCODER_PATH   = MODEL_DIR / "label_encoder.pkl"
GATE_PATH      = MODEL_DIR / "confidence_gate.json"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# ── Globals (loaded once at startup) ─────────────────────────────────────────
_model     = None
_explainer = None
_le        = None   # LabelEncoder for decoding predictions
_gate      = None   # dict loaded from confidence_gate.json, or None if missing


# ── Lifespan: load artifacts once when the server starts ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _explainer, _le, _gate
    logger.info("Loading model artifacts …")

    for path, name in [(MODEL_PATH,     "crop_model.pkl"),
                       (EXPLAINER_PATH, "shap_explainer.pkl"),
                       (ENCODER_PATH,   "label_encoder.pkl")]:
        if not path.exists():
            logger.error(
                f"Artifact not found: {path}. Run retrain_model.py first."
            )
            sys.exit(1)

    _model     = joblib.load(MODEL_PATH)
    _explainer = joblib.load(EXPLAINER_PATH)
    _le        = joblib.load(ENCODER_PATH)

    logger.info(f"Model ready. {len(_le.classes_)} crop classes: {_le.classes_}")

    # Load confidence gate (optional — service starts without it)
    if GATE_PATH.exists():
        with open(GATE_PATH, encoding="utf-8") as fh:
            _gate = json.load(fh)
        logger.info(
            f"Confidence gate loaded: threshold={_gate['confidence_threshold']}, "
            f"alpha={_gate['alpha']}, n_cal={_gate['n_cal']}"
        )
    else:
        logger.warning(
            f"confidence_gate.json not found at {GATE_PATH}. "
            "'confident' field will be null. Run calibrate_gate.py to generate it."
        )

    yield
    logger.info("Shutting down ML service.")


# ── FastAPI app ───────────────────────────────────────────────────────────────
# CORS: restrict to the Node backend origin only; the browser never calls this.
NODE_ORIGIN = os.getenv("NODE_BACKEND_ORIGIN", "http://localhost:5000")

app = FastAPI(
    title       = "AgriSense AI — Crop Recommendation ML Service",
    description = "RandomForest + SHAP. Internal service; proxied via Node/Express.",
    version     = "1.1.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = [NODE_ORIGIN],   # only the Node backend
    allow_credentials = False,
    allow_methods     = ["POST"],
    allow_headers     = ["Content-Type"],
)


# ── Request / Response schemas ────────────────────────────────────────────────
class PredictRequest(BaseModel):
    N          : float = Field(..., description="Nitrogen content in soil (kg/ha)")
    P          : float = Field(..., description="Phosphorus content in soil (kg/ha)")
    K          : float = Field(..., description="Potassium content in soil (kg/ha)")
    temperature: float = Field(..., description="Temperature in °C")
    humidity   : float = Field(..., description="Relative humidity in %")
    ph         : float = Field(..., description="Soil pH (0–14)")
    rainfall   : float = Field(..., description="Annual rainfall in mm")


class CropProbability(BaseModel):
    crop       : str
    probability: float


class PredictResponse(BaseModel):
    crop                : str
    confidence          : float
    shap_explanation    : dict[str, float] | None   # null when SHAP computation fails
    top3                : list[CropProbability]      # top-3 crops sorted by probability desc
    confident           : bool | None                # null when gate file missing
    confidence_threshold: float | None               # null when gate file missing


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Ops"])
def health():
    """Liveness check; returns 200 if the model is loaded."""
    return {
        "status"      : "ok",
        "model_loaded": _model is not None,
        "n_classes"   : len(_le.classes_) if _le else 0,
        "gate_loaded" : _gate is not None,
    }


@app.post("/predict", response_model=PredictResponse, tags=["ML"])
def predict(body: PredictRequest):
    """
    Given soil and climate features, return:
    - crop: the recommended crop name (highest probability class)
    - confidence: the model's confidence (max class probability)
    - shap_explanation: per-feature SHAP values for the predicted class (null on error)
    - top3: list of {crop, probability} for the top-3 classes, sorted desc
    - confident: true if confidence >= confidence_threshold; null if gate not loaded
    - confidence_threshold: the threshold value; null if gate not loaded
    """
    # Build input array in the exact column order the model was trained on
    X = np.array([[body.N, body.P, body.K,
                   body.temperature, body.humidity,
                   body.ph, body.rainfall]])
    X_df = pd.DataFrame(X, columns=FEATURES)

    # ── Prediction ────────────────────────────────────────────────────────────
    try:
        pred_class_idx = int(_model.predict(X_df)[0])       # integer class index
        pred_class  = _le.inverse_transform([pred_class_idx])[0]        # e.g. "rice"
        proba       = _model.predict_proba(X_df)[0]       # shape: (n_classes,)
        confidence  = round(float(proba[pred_class_idx]), 6)
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")

    # ── Top-3 alternatives ─────────────────────────────────────────────────────
    top3_indices = np.argsort(proba)[::-1][:3]
    top3 = [
        CropProbability(
            crop=str(_le.inverse_transform([int(i)])[0]),
            probability=round(float(proba[i]), 6),
        )
        for i in top3_indices
    ]

    # ── Confidence gate ────────────────────────────────────────────────────────
    if _gate is not None:
        confidence_threshold = float(_gate["confidence_threshold"])
        confident            = bool(confidence >= confidence_threshold)
    else:
        confidence_threshold = None
        confident            = None

    # ── SHAP local explanation ────────────────────────────────────────────────
    explanation: dict[str, float] | None = None
    try:
        # shap_values shape: (n_samples, n_features, n_classes) for multi-class RF
        shap_vals = _explainer.shap_values(X)          # ndarray (1, 7, n_classes)

        # Get the SHAP values for the predicted class
        shap_for_pred_class = shap_vals[0, :, pred_class_idx]  # shape: (n_features,)

        explanation = {
            feat: round(float(val), 6)
            for feat, val in zip(FEATURES, shap_for_pred_class)
        }
    except Exception as exc:
        logger.exception("SHAP explanation failed — returning null")
        explanation = None

    top_feat = (
        max(explanation, key=lambda k: abs(explanation[k]))
        if explanation is not None else "unavailable"
    )
    logger.info(
        f"Predicted: {pred_class!r} ({confidence:.2%}) | "
        f"confident={confident} (thresh={confidence_threshold}) | "
        f"SHAP top feature: {top_feat}"
    )

    return PredictResponse(
        crop                 = pred_class,
        confidence           = confidence,
        shap_explanation     = explanation,
        top3                 = top3,
        confident            = confident,
        confidence_threshold = confidence_threshold,
    )
