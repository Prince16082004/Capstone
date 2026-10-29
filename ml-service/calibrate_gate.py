"""
calibrate_gate.py  –  AgriSense | Confidence Gate Calibration
==============================================================
Uses the DEPLOYED model (model/crop_model.pkl) with the SAME 80/20
stratified split as train_v2.py (random_state=42, stratify=label_encoded)
on the FULL agrisense_crop_dataset_v2.csv (2,700 rows, 27 classes).

From the held-out test rows that have source == "real_kaggle" (~440 rows),
computes the LAC nonconformity score and derives:
  q_hat = ceil((n+1)(1-alpha)) / n  quantile of LAC scores
  confidence_threshold = 1 - q_hat

Saves:  model/confidence_gate.json

Prints:
  - n_cal (real_kaggle test rows used)
  - q_hat
  - confidence_threshold
  - share accepted, accuracy among accepted, accuracy among abstained

Run:
    cd ml-service
    python calibrate_gate.py
"""

import hashlib
import io
import json
import pathlib
import sys
import warnings

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
warnings.filterwarnings("ignore")

BASE_DIR   = pathlib.Path(__file__).parent
MODEL_PATH = BASE_DIR / "model" / "crop_model.pkl"
ENC_PATH   = BASE_DIR / "model" / "label_encoder.pkl"
DATA_PATH  = BASE_DIR / "data"  / "agrisense_crop_dataset_v2.csv"
GATE_PATH  = BASE_DIR / "model" / "confidence_gate.json"

FEATURES     = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET       = "label"
SOURCE_COL   = "source"
RANDOM_STATE = 42
TEST_SIZE    = 0.20
ALPHA        = 0.10

# ── Load artifacts ────────────────────────────────────────────────────────────
print(f"Loading model from {MODEL_PATH} ...")
clf = joblib.load(MODEL_PATH)
le  = joblib.load(ENC_PATH)
print(f"Model loaded. Classes: {len(le.classes_)}")

# ── Compute model file SHA-256 ────────────────────────────────────────────────
sha256 = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()
print(f"Model SHA-256: {sha256}")

# ── Reproduce the EXACT train/test split from train_v2.py ────────────────────
print(f"\nLoading dataset from {DATA_PATH} ...")
df = pd.read_csv(DATA_PATH)
print(f"  Total rows: {len(df)}  |  classes: {df[TARGET].nunique()}")

# Same encoding step as train_v2.py
le_full = LabelEncoder()
df["label_encoded"] = le_full.fit_transform(df[TARGET])

X      = df[FEATURES].astype(float)
y      = df["label_encoded"]
source = df[SOURCE_COL]

_, X_test, _, y_test, _, src_test = train_test_split(
    X, y, source,
    test_size=TEST_SIZE,
    stratify=y,
    random_state=RANDOM_STATE,
)

print(f"  Test rows total: {len(X_test)}")
print(f"  Test real_kaggle: {(src_test == 'real_kaggle').sum()}")

# ── Keep only real_kaggle test rows ──────────────────────────────────────────
mask    = (src_test == "real_kaggle").values
X_cal   = X_test.values[mask]
y_cal   = y_test.values[mask]       # integer-encoded labels (le_full)
n_cal   = len(X_cal)
print(f"\nUsing {n_cal} real_kaggle test rows for calibration.")

# ── LAC scores on calibration rows ───────────────────────────────────────────
proba_cal = clf.predict_proba(X_cal)               # (n_cal, n_classes)

# Map y_cal (le_full indices) to the deployed clf's class order
# clf was trained on le_full-encoded labels so they match directly
lac_scores = 1.0 - proba_cal[np.arange(n_cal), y_cal]
print(f"LAC score stats:  min={lac_scores.min():.6f}  "
      f"mean={lac_scores.mean():.6f}  max={lac_scores.max():.6f}")

# ── Finite-sample conformal quantile ─────────────────────────────────────────
level  = 1.0 - ALPHA
q_idx  = int(np.ceil((n_cal + 1) * level))
q_idx  = min(q_idx, n_cal)                         # clip to n_cal
q_hat  = float(np.sort(lac_scores)[q_idx - 1])     # 0-indexed
confidence_threshold = round(1.0 - q_hat, 10)

print(f"\nalpha={ALPHA}  q_idx={q_idx}/{n_cal}  q_hat={q_hat:.10f}")
print(f"confidence_threshold = {confidence_threshold:.10f}")

# ── Evaluate acceptance / abstention on the same 440 rows ────────────────────
max_proba = proba_cal.max(axis=1)
accepted  = max_proba >= confidence_threshold
abstained = ~accepted

n_accepted  = int(accepted.sum())
n_abstained = int(abstained.sum())
share_accepted = n_accepted / n_cal

pred_labels = clf.predict(X_cal)                   # integer indices

acc_accepted  = float((pred_labels[accepted]  == y_cal[accepted]).mean())  if n_accepted  else float("nan")
acc_abstained = float((pred_labels[abstained] == y_cal[abstained]).mean()) if n_abstained else float("nan")

print(f"\nAcceptance analysis (same {n_cal} real_kaggle test rows):")
print(f"  Accepted  : {n_accepted:4d} / {n_cal}  "
      f"({share_accepted*100:.2f}%)  accuracy={acc_accepted:.4f}")
print(f"  Abstained : {n_abstained:4d} / {n_cal}  "
      f"({(1-share_accepted)*100:.2f}%)  "
      f"accuracy={acc_abstained:.4f}" if n_abstained else
      f"  Abstained :    0 / {n_cal}   (0.00%)")
print(f"  NOTE: These numbers are IN-SAMPLE for the threshold "
      f"(calibration rows == evaluation rows).")

# ── Save gate JSON ────────────────────────────────────────────────────────────
from datetime import datetime, timezone
gate = {
    "_note": (
        "Confidence gate calibrated on real_kaggle test rows of the deployed model. "
        "These rows are IN-SAMPLE for the threshold (same split used for training)."
    ),
    "model_file"           : "model/crop_model.pkl",
    "model_sha256"         : sha256,
    "dataset"              : "data/agrisense_crop_dataset_v2.csv",
    "alpha"                : ALPHA,
    "n_cal"                : n_cal,
    "q_hat"                : round(q_hat, 10),
    "confidence_threshold" : confidence_threshold,
    "date"                 : datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "in_sample_stats": {
        "_note"           : "Statistics on the same rows used to compute q_hat — in-sample, not held-out.",
        "n_accepted"      : n_accepted,
        "n_abstained"     : n_abstained,
        "share_accepted"  : round(share_accepted, 6),
        "accuracy_accepted" : round(acc_accepted, 6)  if n_accepted  else None,
        "accuracy_abstained": round(acc_abstained, 6) if n_abstained else None,
    },
}

with open(GATE_PATH, "w", encoding="utf-8") as fh:
    json.dump(gate, fh, indent=2)
print(f"\nSaved: {GATE_PATH}")
print("Done.")
