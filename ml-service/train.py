"""
train.py  –  AgriSense AI | Crop Recommendation Model Training
===============================================================
Trains a RandomForestClassifier on the Kaggle Crop Recommendation Dataset,
evaluates on a held-out test set (actual numbers, never assumed), saves:
  - ml-service/model/crop_model.pkl       — the fitted classifier
  - ml-service/model/shap_explainer.pkl   — SHAP TreeExplainer
  - ml-service/model/class_labels.pkl     — sorted list of crop label strings

Run from project root:
    cd ml-service
    python train.py
"""

import os
import sys
import warnings
import pathlib
import io

# Force UTF-8 output on Windows to avoid cp1252 UnicodeEncodeError with emojis
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import numpy  as np
import pandas as pd
import joblib

from sklearn.ensemble        import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics         import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)
import shap

warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = pathlib.Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "Crop_recommendation.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH    = MODEL_DIR / "crop_model.pkl"
EXPLAINER_PATH= MODEL_DIR / "shap_explainer.pkl"
LABELS_PATH   = MODEL_DIR / "class_labels.pkl"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET   = "label"
RANDOM_STATE = 42
TEST_SIZE    = 0.20


def load_data():
    print(f"[1/5] Loading dataset from {DATA_PATH} ...")
    if not DATA_PATH.exists():
        sys.exit(f"[ERROR] Dataset not found at {DATA_PATH}. "
                 "Place Crop_recommendation.csv in ml-service/data/ and retry.")
    df = pd.read_csv(DATA_PATH)

    sys.stdout.flush()
    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        sys.exit(f"[ERROR] Missing columns in CSV: {missing}")

    print(f"    Rows: {len(df):,}  |  Classes: {df[TARGET].nunique()}")
    return df


def split_data(df):
    print(f"[2/5] Splitting 80 / 20 (stratified, random_state={RANDOM_STATE}) ...")
    X = df[FEATURES].astype(float)
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    print(f"    Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    return X_train, X_test, y_train, y_test


def train_model(X_train, y_train):
    print("\n[3/5] Training RandomForestClassifier ...")
    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    print("    Training complete.")
    return clf


def evaluate_model(clf, X_test, y_test):
    print("\n[4/5] Evaluating on held-out test set ...")
    y_pred = clf.predict(X_test)

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec  = recall_score   (y_test, y_pred, average="weighted", zero_division=0)
    f1   = f1_score       (y_test, y_pred, average="weighted", zero_division=0)

    print(f"\n{'='*55}")
    print(f"  Accuracy   : {acc :.4f}  ({acc *100:.2f}%)")
    print(f"  Precision  : {prec:.4f}  (weighted avg)")
    print(f"  Recall     : {rec :.4f}  (weighted avg)")
    print(f"  F1 Score   : {f1  :.4f}  (weighted avg)")
    print(f"{'='*55}\n")

    print("Per-class report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("Confusion matrix (rows = actual, cols = predicted):")
    labels = sorted(y_test.unique())
    cm     = confusion_matrix(y_test, y_pred, labels=labels)
    cm_df  = pd.DataFrame(cm, index=labels, columns=labels)
    print(cm_df.to_string())
    print()


def save_artifacts(clf, X_train, labels):
    print("\n[5/5] Saving model artifacts …")

    # Model
    joblib.dump(clf, MODEL_PATH)
    print(f"    [OK] Classifier    -> {MODEL_PATH}")

    # SHAP TreeExplainer (built once on the trained model, not per-request)
    print("    Building SHAP TreeExplainer (this may take ~30s) ...")
    explainer = shap.TreeExplainer(clf)
    joblib.dump(explainer, EXPLAINER_PATH)
    print(f"    [OK] SHAP explainer -> {EXPLAINER_PATH}")

    # Sorted class labels
    joblib.dump(labels, LABELS_PATH)
    print(f"    [OK] Class labels   -> {LABELS_PATH}")

    print("\n[DONE] All artifacts saved. Run app.py to start the FastAPI service.")


def main():
    df                        = load_data()
    X_train, X_test, y_train, y_test = split_data(df)
    clf                       = train_model(X_train, y_train)
    evaluate_model(clf, X_test, y_test)
    labels                    = sorted(df[TARGET].unique().tolist())
    save_artifacts(clf, X_train, labels)


if __name__ == "__main__":
    main()
