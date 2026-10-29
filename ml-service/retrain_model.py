import os
import sys
import warnings
import pathlib
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import numpy  as np
import pandas as pd
import joblib

from sklearn.ensemble        import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing   import LabelEncoder
from sklearn.metrics         import accuracy_score, classification_report
import shap

warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = pathlib.Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "agrisense_crop_recommendation_2700.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH    = MODEL_DIR / "crop_model.pkl"
EXPLAINER_PATH= MODEL_DIR / "shap_explainer.pkl"
ENCODER_PATH  = MODEL_DIR / "label_encoder.pkl"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET   = "label"
RANDOM_STATE = 42
TEST_SIZE    = 0.20


def main():
    print(f"[1/5] Loading dataset from {DATA_PATH} ...")
    if not DATA_PATH.exists():
        sys.exit(f"[ERROR] Dataset not found at {DATA_PATH}.")
    df = pd.read_csv(DATA_PATH)
    print(f"    Rows: {len(df):,}  |  Classes: {df[TARGET].nunique()}")

    print("[2/5] Encoding labels with LabelEncoder ...")
    le = LabelEncoder()
    df['label_encoded'] = le.fit_transform(df[TARGET])

    print(f"[3/5] Splitting 80 / 20 (stratified, random_state={RANDOM_STATE}) ...")
    X = df[FEATURES].astype(float)
    y = df['label_encoded']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    print("\n[4/5] Training RandomForestClassifier (n_estimators=100) ...")
    clf = RandomForestClassifier(
        n_estimators=100,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    print("\n[5/5] Evaluating on held-out test set ...")
    y_pred = clf.predict(X_test)
    acc  = accuracy_score(y_test, y_pred)
    print(f"\nAccuracy: {acc :.4f} ({acc * 100:.2f}%)")
    print("\nClassification Report:")
    # Provide string target names to classification report for readability
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    print("\nSaving model artifacts …")
    joblib.dump(clf, MODEL_PATH)
    print(f"    [OK] Classifier    -> {MODEL_PATH}")

    joblib.dump(le, ENCODER_PATH)
    print(f"    [OK] LabelEncoder  -> {ENCODER_PATH}")

    print("    Building SHAP TreeExplainer ...")
    explainer = shap.TreeExplainer(clf)
    joblib.dump(explainer, EXPLAINER_PATH)
    print(f"    [OK] SHAP explainer -> {EXPLAINER_PATH}")

    print("\n[DONE] Retraining complete. Update app.py if needed to use LabelEncoder.")


if __name__ == "__main__":
    main()
