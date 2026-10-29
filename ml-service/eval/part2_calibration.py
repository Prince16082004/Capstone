"""
part2_calibration.py  –  AgriSense Eval | Model Calibration
============================================================
Stratified 60/20/20 split (train/calibration/test, seed=42).
Trains a fresh RandomForest on the 60% train set.
On the 20% test set: Brier score (multi-class), top-label ECE (15 bins).
Saves a reliability diagram PNG.

Data: real_kaggle rows only from agrisense_crop_dataset_v2.csv

Output:
  eval/results/part2_calibration.json
  eval/results/part2_reliability_diagram.png
"""

import sys, json, time, pathlib, warnings
warnings.filterwarnings("ignore")
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import brier_score_loss

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = pathlib.Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
DATA_PATH   = ROOT / "data" / "agrisense_crop_dataset_v2.csv"
RESULTS_DIR = SCRIPT_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SAVE  = RESULTS_DIR / "part2_model.pkl"
ENCODER_SAVE= RESULTS_DIR / "part2_encoder.pkl"

FEATURES    = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET      = "label"
SOURCE_COL  = "source"
RANDOM_STATE = 42
N_BINS       = 15

import sklearn, shap
libs = {
    "python": sys.version.split()[0],
    "sklearn": sklearn.__version__,
    "numpy": np.__version__,
    "pandas": pd.__version__,
    "shap": shap.__version__,
}

# ── Load real_kaggle data ─────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
df_real = df[df[SOURCE_COL] == "real_kaggle"].reset_index(drop=True)
X_all = df_real[FEATURES].astype(float).values
y_all = df_real[TARGET].values
print(f"Data: {len(X_all)} rows, {len(np.unique(y_all))} classes")

le = LabelEncoder()
y_enc = le.fit_transform(y_all)
n_classes = len(le.classes_)

# ── Stratified 60 / 20 / 20 split ────────────────────────────────────────────
# First split: 60% train, 40% temp
X_train, X_temp, y_train, y_temp = train_test_split(
    X_all, y_enc, test_size=0.40, stratify=y_enc, random_state=RANDOM_STATE
)
# Second split: temp -> 50% cal, 50% test  (= 20% / 20% of total)
X_cal, X_test, y_cal, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=RANDOM_STATE
)
print(f"Split: train={len(X_train)}, cal={len(X_cal)}, test={len(X_test)}")

# ── Train RF on 60% ───────────────────────────────────────────────────────────
t0 = time.time()
clf = RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1)
clf.fit(X_train, y_train)
train_time = time.time() - t0
print(f"Model trained in {train_time:.1f}s")

# Save for Part 3 and Part 5
joblib.dump(clf, MODEL_SAVE)
joblib.dump(le,  ENCODER_SAVE)
print(f"Saved model -> {MODEL_SAVE}")

# ── Probabilities on test set ─────────────────────────────────────────────────
proba_test = clf.predict_proba(X_test)          # (n_test, n_classes)
y_pred_test = np.argmax(proba_test, axis=1)

# ── Multi-class Brier score ───────────────────────────────────────────────────
# One-hot encode y_test
Y_onehot = np.zeros((len(y_test), n_classes), dtype=float)
for i, c in enumerate(y_test):
    Y_onehot[i, c] = 1.0
brier = float(np.mean(np.sum((proba_test - Y_onehot) ** 2, axis=1)))
print(f"Multi-class Brier score: {brier:.6f}")

# ── Top-label ECE (15 bins) ───────────────────────────────────────────────────
confidence = np.max(proba_test, axis=1)   # top-label probability
correct    = (y_pred_test == y_test).astype(float)

bin_edges  = np.linspace(0.0, 1.0, N_BINS + 1)
ece_total  = 0.0
bin_stats  = []
for b in range(N_BINS):
    lo, hi = bin_edges[b], bin_edges[b + 1]
    mask = (confidence >= lo) & (confidence < hi) if b < N_BINS - 1 else (confidence >= lo) & (confidence <= hi)
    n_b  = mask.sum()
    if n_b == 0:
        bin_stats.append({"lo": round(lo,4), "hi": round(hi,4), "n": 0,
                          "acc": None, "conf": None, "gap": None})
        continue
    acc_b  = float(correct[mask].mean())
    conf_b = float(confidence[mask].mean())
    gap_b  = abs(acc_b - conf_b)
    ece_total += (n_b / len(y_test)) * gap_b
    bin_stats.append({"lo": round(lo,4), "hi": round(hi,4), "n": int(n_b),
                      "acc": round(acc_b,6), "conf": round(conf_b,6),
                      "gap": round(gap_b,6)})

print(f"Top-label ECE (15 bins): {ece_total:.6f}")

# ── Reliability diagram ───────────────────────────────────────────────────────
centers  = [(b["lo"] + b["hi"]) / 2 for b in bin_stats if b["n"] > 0]
accs     = [b["acc"] for b in bin_stats if b["n"] > 0]
confs    = [b["conf"] for b in bin_stats if b["n"] > 0]
ns       = [b["n"] for b in bin_stats if b["n"] > 0]

fig, ax = plt.subplots(figsize=(7, 6))
ax.plot([0, 1], [0, 1], "k--", lw=1.2, label="Perfect calibration", alpha=0.7)
bar_w = 1.0 / N_BINS
bars = ax.bar(centers, accs, width=bar_w * 0.85, alpha=0.65, color="#2563EB",
              label="Fraction correct per bin", align="center")
ax.scatter(confs, accs, color="#DC2626", zorder=5, s=40, label="Mean confidence vs accuracy")
for cx, ac, cf, n in zip(centers, accs, confs, ns):
    ax.annotate(f"n={n}", (cx, ac), textcoords="offset points",
                xytext=(0, 4), ha="center", fontsize=6.5)
ax.set_xlabel("Confidence (top-label probability)", fontsize=11)
ax.set_ylabel("Fraction correct", fontsize=11)
ax.set_title(f"Reliability Diagram — AgriSense RF (test set)\n"
             f"ECE={ece_total:.4f}  Brier={brier:.4f}  n_test={len(y_test)}",
             fontsize=11)
ax.legend(fontsize=9)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1.05)
ax.grid(alpha=0.3)
plt.tight_layout()
diag_path = RESULTS_DIR / "part2_reliability_diagram.png"
fig.savefig(diag_path, dpi=150)
plt.close(fig)
print(f"Saved: {diag_path}")

# ── Save JSON ─────────────────────────────────────────────────────────────────
out = {
    "_meta": {
        "script": "eval/part2_calibration.py",
        "data"  : "data/agrisense_crop_dataset_v2.csv (real_kaggle only)",
        "split" : {"train": int(len(X_train)), "cal": int(len(X_cal)), "test": int(len(X_test))},
        "split_random_state": RANDOM_STATE,
        "n_bins": N_BINS,
        "model" : "RandomForestClassifier(n_estimators=100, random_state=42)",
        "library_versions": libs,
    },
    "multi_class_brier_score": round(brier, 6),
    "top_label_ece_15bins"   : round(ece_total, 6),
    "bin_stats"              : bin_stats,
    "split_indices_saved"    : False,   # full split saved via model+encoder pkl
}

cal_json = RESULTS_DIR / "part2_calibration.json"
with open(cal_json, "w") as f:
    json.dump(out, f, indent=2)
print(f"Saved: {cal_json}")
print(f"\nSummary: Brier={brier:.6f}  ECE={ece_total:.6f}")
print(f"X_cal shape: {X_cal.shape}  (used in Part 3 conformal)")

# Save split arrays for Parts 3, 4, 5
np.save(RESULTS_DIR / "part2_X_train.npy", X_train)
np.save(RESULTS_DIR / "part2_y_train.npy", y_train)
np.save(RESULTS_DIR / "part2_X_cal.npy",   X_cal)
np.save(RESULTS_DIR / "part2_y_cal.npy",   y_cal)
np.save(RESULTS_DIR / "part2_X_test.npy",  X_test)
np.save(RESULTS_DIR / "part2_y_test.npy",  y_test)
print("Saved train/cal/test arrays as .npy")
