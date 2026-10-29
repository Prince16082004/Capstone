"""
part3_conformal.py  –  AgriSense Eval | Split-Conformal Prediction
===================================================================
LAC (Least Ambiguous Class) nonconformity score = 1 - p(true class).
Uses the calibration set from Part 2 (clean, 20% = 440 rows).
Finite-sample quantile: q = ceil((n+1)(1-alpha)) / n  [Angelopoulos et al.]
Implemented in plain numpy — no external conformal library.

alpha = 0.10 and 0.05

On the CLEAN test set (Part 2 test, 440 rows), reports:
  - Empirical coverage  (fraction of test rows where true class ∈ prediction set)
  - Mean prediction-set size
  - Fraction of singleton prediction sets

Output:
  eval/results/conformal.json
"""

import sys, json, pathlib, warnings
warnings.filterwarnings("ignore")
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
import numpy as np
import pandas as pd

# -- Paths ---------------------------------------------------------------------
SCRIPT_DIR  = pathlib.Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
RESULTS_DIR = SCRIPT_DIR / "results"

import sklearn
libs = {"python": sys.version.split()[0], "sklearn": sklearn.__version__, "numpy": np.__version__}

# -- Load Part 2 artifacts -----------------------------------------------------
import joblib
clf = joblib.load(RESULTS_DIR / "part2_model.pkl")
le  = joblib.load(RESULTS_DIR / "part2_encoder.pkl")

X_cal  = np.load(RESULTS_DIR / "part2_X_cal.npy")
y_cal  = np.load(RESULTS_DIR / "part2_y_cal.npy")
X_test = np.load(RESULTS_DIR / "part2_X_test.npy")
y_test = np.load(RESULTS_DIR / "part2_y_test.npy")

n_cal  = len(X_cal)
n_test = len(X_test)
print(f"Cal: {n_cal}  Test: {n_test}")

# -- LAC calibration scores ----------------------------------------------------
proba_cal  = clf.predict_proba(X_cal)    # (n_cal, n_classes)
# LAC score = 1 - p(true class)
scores_cal = 1.0 - proba_cal[np.arange(n_cal), y_cal]   # shape: (n_cal,)
print(f"Cal score stats: min={scores_cal.min():.4f}  mean={scores_cal.mean():.4f}  max={scores_cal.max():.4f}")

# -- Test probabilities --------------------------------------------------------
proba_test = clf.predict_proba(X_test)   # (n_test, n_classes)

results_by_alpha = {}

for alpha in [0.10, 0.05]:
    # Finite-sample quantile:  ceil((n+1)(1-alpha)) / n
    level  = 1.0 - alpha
    q_idx  = int(np.ceil((n_cal + 1) * level))          # 1-based index
    q_idx  = min(q_idx, n_cal)                           # clip to [1, n_cal]
    # Sort scores ascending; the q_idx-th smallest is our threshold
    sorted_scores = np.sort(scores_cal)
    threshold     = sorted_scores[q_idx - 1]             # 0-indexed
    print(f"\nalpha={alpha}: q_idx={q_idx}/{n_cal}  threshold={threshold:.6f}")

    # Build prediction sets on test:  include class c if 1-p(c) <= threshold
    # Equivalently: include class c if p(c) >= 1 - threshold
    pred_sets  = proba_test >= (1.0 - threshold)         # (n_test, n_classes) bool

    set_sizes  = pred_sets.sum(axis=1)                   # (n_test,)
    covered    = pred_sets[np.arange(n_test), y_test]    # (n_test,) bool

    empirical_coverage = float(covered.mean())
    mean_set_size      = float(set_sizes.mean())
    frac_singletons    = float((set_sizes == 1).mean())

    print(f"  Empirical coverage : {empirical_coverage:.4f}  (nominal: {level:.2f})")
    print(f"  Mean set size      : {mean_set_size:.4f}")
    print(f"  Fraction singletons: {frac_singletons:.4f}")
    if empirical_coverage < level:
        print(f"  *** Coverage below nominal ({empirical_coverage:.4f} < {level:.4f}) — reported as-is ***")

    results_by_alpha[str(alpha)] = {
        "alpha"             : alpha,
        "nominal_coverage"  : level,
        "quantile_index"    : int(q_idx),
        "threshold"         : round(float(threshold), 6),
        "empirical_coverage": round(empirical_coverage, 6),
        "mean_set_size"     : round(mean_set_size, 6),
        "frac_singletons"   : round(frac_singletons, 6),
        "n_test"            : int(n_test),
        "n_cal"             : int(n_cal),
    }

# -- Save ----------------------------------------------------------------------
out = {
    "_meta": {
        "script"          : "eval/part3_conformal.py",
        "method"          : "Split-conformal LAC (1 - p(true class))",
        "quantile_formula": "ceil((n_cal+1)*(1-alpha)) / n_cal  [Angelopoulos 2023]",
        "calibration_set" : "Part 2 calibration split (20% of real_kaggle data, clean)",
        "test_set"        : "Part 2 test split (20% of real_kaggle data, clean)",
        "implementation"  : "plain numpy — no external conformal library",
        "library_versions": libs,
    },
    "results": results_by_alpha,
}

out_path = RESULTS_DIR / "conformal.json"
with open(out_path, "w") as f:
    json.dump(out, f, indent=2)
print(f"\nSaved: {out_path}")
