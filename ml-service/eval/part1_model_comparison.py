"""
part1_model_comparison.py  –  AgriSense Eval | Model Comparison
================================================================
Repeated stratified 5-fold CV, 5 repeats, fixed seeds.
Models: RandomForest, LightGBM (or HistGBM fallback), XGBoost (or HistGBM),
        Logistic Regression (StandardScaler pipeline), kNN (StandardScaler pipeline).

Data: real_kaggle rows only from agrisense_crop_dataset_v2.csv (2200 rows, 22 classes).

Output:
  eval/results/part1_cv_all_folds.csv     — per-fold scores for every model
  eval/results/part1_summary.json         — mean/std accuracy and macro-F1, delta vs RF
  eval/results/part1_summary_table.txt    — human-readable table

Random seed: every repeat uses seed = repeat_index (0,1,2,3,4).
"""

import sys, json, time, pathlib, warnings
warnings.filterwarnings("ignore")
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, accuracy_score, f1_score

# -- Paths ---------------------------------------------------------------------
SCRIPT_DIR  = pathlib.Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
DATA_PATH   = ROOT / "data" / "agrisense_crop_dataset_v2.csv"
RESULTS_DIR = SCRIPT_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

FEATURES    = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET      = "label"
SOURCE_COL  = "source"
N_SPLITS    = 5
N_REPEATS   = 5
# Each repeat uses random_state = repeat index (0..4), embedded in RSKF
RSKF_SEED   = 0   # seed for the RepeatedStratifiedKFold splitter itself

# -- Library versions ----------------------------------------------------------
import sklearn
libs = {"python": sys.version.split()[0], "sklearn": sklearn.__version__,
        "numpy": np.__version__, "pandas": pd.__version__}

try:
    import lightgbm as lgb
    libs["lightgbm"] = lgb.__version__
    LGBM_AVAILABLE = True
except ImportError:
    LGBM_AVAILABLE = False
    libs["lightgbm"] = "NOT INSTALLED — using HistGradientBoostingClassifier"

try:
    import xgboost as xgb
    libs["xgboost"] = xgb.__version__
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    libs["xgboost"] = "NOT INSTALLED — using HistGradientBoostingClassifier"

print("Library versions:", json.dumps(libs, indent=2))

# -- Load data -----------------------------------------------------------------
df = pd.read_csv(DATA_PATH)
df_real = df[df[SOURCE_COL] == "real_kaggle"].reset_index(drop=True)
X = df_real[FEATURES].astype(float).values
y_raw = df_real[TARGET].values
le = LabelEncoder()
y = le.fit_transform(y_raw)
print(f"Data: {X.shape[0]} rows, {len(np.unique(y))} classes")

# -- Build model registry ------------------------------------------------------
models = {}

models["RandomForest"] = RandomForestClassifier(
    n_estimators=100, random_state=42, n_jobs=-1
)

if LGBM_AVAILABLE:
    models["LightGBM"] = lgb.LGBMClassifier(
        n_estimators=100, random_state=42, n_jobs=-1, verbose=-1
    )
else:
    print("LightGBM not available -> using HistGradientBoostingClassifier as 'LightGBM_HistGBM'")
    models["LightGBM_HistGBM"] = HistGradientBoostingClassifier(
        max_iter=100, random_state=42
    )

if XGB_AVAILABLE:
    models["XGBoost"] = xgb.XGBClassifier(
        n_estimators=100, random_state=42, n_jobs=-1,
        eval_metric="mlogloss", verbosity=0
    )
else:
    print("XGBoost not available -> using HistGradientBoostingClassifier as 'XGBoost_HistGBM'")
    models["XGBoost_HistGBM"] = HistGradientBoostingClassifier(
        max_iter=100, random_state=43  # different seed to distinguish from LightGBM fallback
    )

models["LogisticRegression"] = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=5000, random_state=42, n_jobs=-1)),
])

models["kNN"] = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", KNeighborsClassifier(n_neighbors=5, n_jobs=-1)),
])

# -- Cross-validation ----------------------------------------------------------
scoring = {
    "accuracy": make_scorer(accuracy_score),
    "macro_f1": make_scorer(f1_score, average="macro", zero_division=0),
}

rskf = RepeatedStratifiedKFold(
    n_splits=N_SPLITS, n_repeats=N_REPEATS, random_state=RSKF_SEED
)

all_fold_rows = []
summary = {}
model_acc_scores = {}
model_f1_scores = {}

print(f"\nRunning {N_REPEATS}×{N_SPLITS}-fold CV for {len(models)} models …")
t0_global = time.time()

for name, model in models.items():
    print(f"  [{name}] …", end=" ", flush=True)
    t0 = time.time()
    cv_results = cross_validate(
        model, X, y,
        cv=rskf, scoring=scoring,
        n_jobs=1,   # each model handles its own parallelism
        return_train_score=False,
    )
    elapsed = time.time() - t0

    acc_scores = cv_results["test_accuracy"]
    f1_scores  = cv_results["test_macro_f1"]
    model_acc_scores[name] = acc_scores
    model_f1_scores[name]  = f1_scores

    # Annotate with fold/repeat indices
    fold_idx = 0
    for repeat in range(N_REPEATS):
        for fold in range(N_SPLITS):
            all_fold_rows.append({
                "model"    : name,
                "repeat"   : repeat,
                "fold"     : fold,
                "accuracy" : round(acc_scores[fold_idx], 6),
                "macro_f1" : round(f1_scores[fold_idx], 6),
            })
            fold_idx += 1

    summary[name] = {
        "accuracy_mean": round(float(np.mean(acc_scores)), 6),
        "accuracy_std" : round(float(np.std(acc_scores)),  6),
        "macro_f1_mean": round(float(np.mean(f1_scores)),  6),
        "macro_f1_std" : round(float(np.std(f1_scores)),   6),
        "elapsed_s"    : round(elapsed, 1),
    }
    print(f"acc={summary[name]['accuracy_mean']:.4f}±{summary[name]['accuracy_std']:.4f}  "
          f"F1={summary[name]['macro_f1_mean']:.4f}±{summary[name]['macro_f1_std']:.4f}  "
          f"({elapsed:.1f}s)")

total_elapsed = time.time() - t0_global
print(f"\nTotal runtime: {total_elapsed:.1f}s")

# -- Compute delta vs RF -------------------------------------------------------
rf_acc_arr = model_acc_scores["RandomForest"]
rf_f1_arr  = model_f1_scores["RandomForest"]

# Delta = other model - RF (positive means better than RF)
for name, s in summary.items():
    delta_acc = model_acc_scores[name] - rf_acc_arr
    delta_f1  = model_f1_scores[name] - rf_f1_arr
    s["delta_accuracy_vs_RF_mean"] = round(float(np.mean(delta_acc)), 6)
    s["delta_accuracy_vs_RF_std"]  = round(float(np.std(delta_acc)),  6)
    s["delta_macro_f1_vs_RF_mean"] = round(float(np.mean(delta_f1)),  6)
    s["delta_macro_f1_vs_RF_std"]  = round(float(np.std(delta_f1)),   6)
    s["delta_accuracy_vs_RF"]      = s["delta_accuracy_vs_RF_mean"]
    s["delta_macro_f1_vs_RF"]      = s["delta_macro_f1_vs_RF_mean"]

# -- Save per-fold CSV ---------------------------------------------------------
fold_df = pd.DataFrame(all_fold_rows)
fold_csv = RESULTS_DIR / "part1_cv_all_folds.csv"
fold_df.to_csv(fold_csv, index=False)
print(f"Saved: {fold_csv}")

# -- Save summary JSON ---------------------------------------------------------
output = {
    "_meta": {
        "script"       : "eval/part1_model_comparison.py",
        "data"         : "data/agrisense_crop_dataset_v2.csv (real_kaggle only)",
        "n_rows"       : int(X.shape[0]),
        "n_classes"    : int(len(np.unique(y))),
        "cv_strategy"  : f"RepeatedStratifiedKFold(n_splits={N_SPLITS}, n_repeats={N_REPEATS}, random_state={RSKF_SEED})",
        "total_runtime_s": round(total_elapsed, 1),
        "library_versions": libs,
        "lgbm_fallback": not LGBM_AVAILABLE,
        "xgb_fallback" : not XGB_AVAILABLE,
    },
    "models": summary,
}

summary_json = RESULTS_DIR / "part1_summary.json"
with open(summary_json, "w") as f:
    json.dump(output, f, indent=2)
print(f"Saved: {summary_json}")

# -- Human-readable table ------------------------------------------------------
lines = [
    "Part 1 — Model Comparison (RepeatedStratifiedKFold 5×5, real_kaggle rows only)",
    "=" * 105,
    f"{'Model':<22} {'Acc mean':>9} {'Acc std':>9} {'F1 mean':>9} {'F1 std':>9} {'ΔAcc vs RF (mean±std)':>22} {'ΔF1 vs RF (mean±std)':>22}",
    "-" * 105,
]
for name, s in summary.items():
    d_acc = f"{s['delta_accuracy_vs_RF_mean']:>+7.4f}±{s['delta_accuracy_vs_RF_std']:.4f}"
    d_f1  = f"{s['delta_macro_f1_vs_RF_mean']:>+7.4f}±{s['delta_macro_f1_vs_RF_std']:.4f}"
    lines.append(
        f"{name:<22} {s['accuracy_mean']:>9.4f} {s['accuracy_std']:>9.4f} "
        f"{s['macro_f1_mean']:>9.4f} {s['macro_f1_std']:>9.4f} "
        f"{d_acc:>22} {d_f1:>22}"
    )
lines += [
    "-" * 105,
    "",
    "NOTE: Folds overlap across repeats; do not interpret delta as statistically significant.",
    f"LightGBM available: {LGBM_AVAILABLE}  |  XGBoost available: {XGB_AVAILABLE}",
    f"Library versions: {libs}",
]

table_path = RESULTS_DIR / "part1_summary_table.txt"
table_txt  = "\n".join(lines)
with open(table_path, "w", encoding="utf-8") as f:
    f.write(table_txt)
print(table_txt)
print(f"\nSaved: {table_path}")
