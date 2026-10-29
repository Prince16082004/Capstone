"""
train_v2.py  –  AgriSense AI | Provenance-Aware Crop Recommendation Training
=============================================================================
Canonical training script.  Supersedes train_legacy.py.

Dataset : ml-service/data/agrisense_crop_dataset_v2.csv
          2,700 rows  |  27 crop classes
          Provenance column: 'source' == 'real_kaggle' | 'synthetic'

Saves (ml-service/model/):
  crop_model.pkl       – RandomForestClassifier (n_estimators=100, seed=42)
  label_encoder.pkl    – sklearn LabelEncoder (integer ↔ crop-name mapping)
  class_labels.pkl     – sorted list of crop-name strings (app.py compat)
  shap_explainer.pkl   – SHAP TreeExplainer

Metrics (ml-service/model/):
  metrics.json         – accuracy + classification_report for 3 eval blocks
  confusion_matrix.png – heatmap, all test rows

Hyperparameters recorded in metrics.json:
  n_estimators = 100
  random_state = 42
  n_jobs       = -1
  test_size    = 0.20
  stratified   = True

Run:
    cd ml-service
    python train_v2.py
"""

import io
import json
import sys
import warnings
import pathlib

import numpy  as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import shap

from sklearn.ensemble        import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing   import LabelEncoder
from sklearn.metrics         import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

# Force UTF-8 on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR       = pathlib.Path(__file__).parent
DATA_PATH      = BASE_DIR / "data"  / "agrisense_crop_dataset_v2.csv"
MODEL_DIR      = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH     = MODEL_DIR / "crop_model.pkl"
ENCODER_PATH   = MODEL_DIR / "label_encoder.pkl"
LABELS_PATH    = MODEL_DIR / "class_labels.pkl"
EXPLAINER_PATH = MODEL_DIR / "shap_explainer.pkl"
METRICS_PATH   = MODEL_DIR / "metrics.json"
CM_PATH        = MODEL_DIR / "confusion_matrix.png"

FEATURES     = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET       = "label"
SOURCE_COL   = "source"
RANDOM_STATE = 42
TEST_SIZE    = 0.20
N_ESTIMATORS = 100

# ── Hyperparameter record ─────────────────────────────────────────────────────
HYPERPARAMS = {
    "n_estimators": N_ESTIMATORS,
    "random_state" : RANDOM_STATE,
    "n_jobs"       : -1,
    "max_depth"    : None,
    "test_size"    : TEST_SIZE,
    "stratified"   : True,
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _clf_report_dict(y_true, y_pred, le):
    """Return classification_report as a dict with digits=4.

    Handles subsets: only passes label indices that appear in the
    y_true / y_pred union so sklearn does not raise ValueError when
    the block contains fewer classes than le.classes_.
    """
    # Labels that actually appear in this block
    active_labels = sorted(set(y_true) | set(y_pred))
    active_names  = le.inverse_transform(active_labels)

    report_str = classification_report(
        y_true, y_pred,
        labels=active_labels,
        target_names=active_names,
        zero_division=0,
        digits=4,
        output_dict=False,
    )
    report_dict = classification_report(
        y_true, y_pred,
        labels=active_labels,
        target_names=active_names,
        zero_division=0,
        digits=4,
        output_dict=True,
    )
    return report_str, report_dict


def _block_metrics(y_true_enc, y_pred_enc, le, block_name):
    """Print and return metrics dict for one eval block."""
    acc = accuracy_score(y_true_enc, y_pred_enc)
    report_str, report_dict = _clf_report_dict(y_true_enc, y_pred_enc, le)

    bar = "=" * 60
    print(f"\n{bar}")
    print(f"  EVAL BLOCK: {block_name}")
    print(f"  Rows      : {len(y_true_enc)}")
    print(f"  Accuracy  : {acc:.4f}  ({acc*100:.2f}%)")
    print(bar)
    print(report_str)

    return {
        "rows"    : int(len(y_true_enc)),
        "accuracy": round(acc, 6),
        "classification_report": report_dict,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # ── 1. Load ───────────────────────────────────────────────────────────────
    print(f"[1/7] Loading dataset from {DATA_PATH} ...")
    if not DATA_PATH.exists():
        sys.exit(f"[ERROR] Dataset not found: {DATA_PATH}\n"
                 "Run: python generate_extended_dataset.py  first.")
    df = pd.read_csv(DATA_PATH)
    print(f"      Rows: {len(df):,}  |  Classes: {df[TARGET].nunique()}  "
          f"|  real_kaggle: {(df[SOURCE_COL]=='real_kaggle').sum()}  "
          f"|  synthetic: {(df[SOURCE_COL]=='synthetic').sum()}")

    # ── 2. Encode labels ──────────────────────────────────────────────────────
    print("\n[2/7] Fitting LabelEncoder ...")
    le = LabelEncoder()
    df["label_encoded"] = le.fit_transform(df[TARGET])
    class_labels = sorted(df[TARGET].unique().tolist())
    print(f"      Classes: {le.classes_.tolist()}")

    # ── 3. Stratified split ───────────────────────────────────────────────────
    print(f"\n[3/7] Stratified 80/20 split (random_state={RANDOM_STATE}) ...")
    X      = df[FEATURES].astype(float)
    y      = df["label_encoded"]
    source = df[SOURCE_COL]

    X_train, X_test, y_train, y_test, src_train, src_test = train_test_split(
        X, y, source,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    print(f"      Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    print(f"      Test  real_kaggle: {(src_test=='real_kaggle').sum()}  "
          f"|  synthetic: {(src_test=='synthetic').sum()}")

    # ── 4. Train combined model ───────────────────────────────────────────────
    print(f"\n[4/7] Training RandomForestClassifier "
          f"(n_estimators={N_ESTIMATORS}, random_state={RANDOM_STATE}, n_jobs=-1) ...")
    clf = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    print("      Training complete.")

    # ── 5. Evaluate in 3 blocks ───────────────────────────────────────────────
    print("\n[5/7] Evaluating on held-out test set (3 blocks) ...")
    y_pred_all = clf.predict(X_test)

    # 5a. real_kaggle only
    mask_real  = src_test == "real_kaggle"
    block_real = _block_metrics(
        y_test[mask_real].values, y_pred_all[mask_real], le,
        "real_kaggle ONLY  [PRIMARY]",
    )

    # 5b. synthetic only
    mask_synth  = src_test == "synthetic"
    block_synth = _block_metrics(
        y_test[mask_synth].values, y_pred_all[mask_synth], le,
        "synthetic ONLY  [SECONDARY — uncited ranges]",
    )

    # 5c. all test rows
    block_all = _block_metrics(
        y_test.values, y_pred_all, le,
        "ALL test rows  [SECONDARY — blends real + synthetic]",
    )

    # ── 5d. Baseline: real-only model, 22 classes ─────────────────────────────
    print("\n--- Baseline: real-only model (22 Kaggle classes, no synthetic) ---")
    real_classes = set(
        df[df[SOURCE_COL] == "real_kaggle"][TARGET].unique()
    )
    df_real = df[df[SOURCE_COL] == "real_kaggle"].copy()
    le_real = LabelEncoder()
    df_real["label_encoded_real"] = le_real.fit_transform(df_real[TARGET])

    X_r = df_real[FEATURES].astype(float)
    y_r = df_real["label_encoded_real"]

    X_r_tr, X_r_te, y_r_tr, y_r_te = train_test_split(
        X_r, y_r,
        test_size=TEST_SIZE,
        stratify=y_r,
        random_state=RANDOM_STATE,
    )
    clf_real = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf_real.fit(X_r_tr, y_r_tr)
    y_r_pred = clf_real.predict(X_r_te)

    block_baseline = _block_metrics(
        y_r_te.values, y_r_pred, le_real,
        "BASELINE — real-only model (22 classes, no synthetic rows)",
    )

    # ── 6. Save artifacts ────────────────────────────────────────────────────
    print("\n[6/7] Saving model artifacts ...")

    joblib.dump(clf, MODEL_PATH)
    print(f"      [OK] crop_model.pkl    -> {MODEL_PATH}")

    joblib.dump(le, ENCODER_PATH)
    print(f"      [OK] label_encoder.pkl -> {ENCODER_PATH}")

    joblib.dump(class_labels, LABELS_PATH)
    print(f"      [OK] class_labels.pkl  -> {LABELS_PATH}")

    print("      Building SHAP TreeExplainer (may take ~60s) ...")
    explainer = shap.TreeExplainer(clf)
    joblib.dump(explainer, EXPLAINER_PATH)
    print(f"      [OK] shap_explainer.pkl-> {EXPLAINER_PATH}")

    # ── Confusion matrix PNG ──────────────────────────────────────────────────
    labels_sorted = le.classes_.tolist()
    cm = confusion_matrix(y_test.values, y_pred_all, labels=le.transform(labels_sorted))
    fig, ax = plt.subplots(figsize=(18, 15))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=labels_sorted,
        yticklabels=labels_sorted,
        ax=ax,
        linewidths=0.4,
    )
    ax.set_title("Confusion Matrix — AgriSense v2 (all test rows)\n"
                 f"Accuracy: {block_all['accuracy']:.4f}", fontsize=14)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual",    fontsize=12)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    fig.savefig(CM_PATH, dpi=150)
    plt.close(fig)
    print(f"      [OK] confusion_matrix.png -> {CM_PATH}")

    # ── metrics.json ──────────────────────────────────────────────────────────
    metrics = {
        "_note": (
            "real_kaggle_only is the PRIMARY result. "
            "synthetic_only and all_test are SECONDARY and must not be "
            "blended with or presented as equivalent to the primary."
        ),
        "training_script"  : "train_v2.py",
        "dataset"          : "data/agrisense_crop_dataset_v2.csv",
        "dataset_rows"     : int(len(df)),
        "real_kaggle_rows" : int((df[SOURCE_COL] == "real_kaggle").sum()),
        "synthetic_rows"   : int((df[SOURCE_COL] == "synthetic").sum()),
        "hyperparameters"  : HYPERPARAMS,
        "primary": {
            "_label"    : "real_kaggle_only",
            "_note"     : "Only rows from Crop_recommendation_backup.csv (Kaggle). Primary result.",
            **block_real,
        },
        "secondary": {
            "synthetic_only": {
                "_label": "synthetic_only",
                "_note" : "SECONDARY. Rows generated from UNCITED parameter bounds. Not trusted.",
                **block_synth,
            },
            "all_test_rows": {
                "_label": "all_test_rows",
                "_note" : "SECONDARY. Blends real and synthetic — do not use as headline number.",
                **block_all,
            },
        },
        "baseline_real_only_model": {
            "_label": "baseline",
            "_note" : "Separate model trained and tested on 22 real Kaggle classes only. No synthetic rows.",
            **block_baseline,
        },
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    print(f"      [OK] metrics.json       -> {METRICS_PATH}")

    print("\n[7/7] Done. Summary:")
    print(f"      Primary accuracy (real_kaggle test rows) : "
          f"{block_real['accuracy']:.4f} ({block_real['accuracy']*100:.2f}%)")
    print(f"      Baseline accuracy (real-only model)      : "
          f"{block_baseline['accuracy']:.4f} ({block_baseline['accuracy']*100:.2f}%)")
    print(f"      Synthetic accuracy [secondary]           : "
          f"{block_synth['accuracy']:.4f} ({block_synth['accuracy']*100:.2f}%)")
    print(f"      All-test accuracy  [secondary]           : "
          f"{block_all['accuracy']:.4f} ({block_all['accuracy']*100:.2f}%)")
    print("\n[DONE] Run app.py to start the FastAPI service.")


if __name__ == "__main__":
    main()
