"""
part5_shap_analysis.py  –  AgriSense Eval | SHAP Analysis
==========================================================
Uses the Part 2 model (RF trained on 60% real_kaggle data).
SHAP output treated as 3D ndarray (n_samples, n_features, n_classes).

(a) Global mean |SHAP| bar chart aggregated over classes -> PNG
(b) Top-3 features per class -> JSON and TXT table
(c) Local explanation PNGs for one rice row and one cotton row
(d) Additivity check on 20 random test rows:
    base_value + sum(SHAP) ≈ predict_proba(x)[predicted_class]
    -> reports max absolute error

Output:
  eval/results/part5_global_shap.png
  eval/results/part5_top3_per_class.json
  eval/results/part5_top3_per_class.txt
  eval/results/part5_local_rice.png
  eval/results/part5_local_cotton.png
  eval/results/part5_additivity.json
"""

import sys, json, pathlib, warnings, random
warnings.filterwarnings("ignore")
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib
import shap

# -- Paths ---------------------------------------------------------------------
SCRIPT_DIR  = pathlib.Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
DATA_PATH   = ROOT / "data" / "agrisense_crop_dataset_v2.csv"
RESULTS_DIR = SCRIPT_DIR / "results"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

import sklearn
libs = {
    "python": sys.version.split()[0],
    "sklearn": sklearn.__version__,
    "shap": shap.__version__,
    "numpy": np.__version__,
}

# -- Load Part 2 artifacts -----------------------------------------------------
clf = joblib.load(RESULTS_DIR / "part2_model.pkl")
le  = joblib.load(RESULTS_DIR / "part2_encoder.pkl")

X_train = np.load(RESULTS_DIR / "part2_X_train.npy")
X_test  = np.load(RESULTS_DIR / "part2_X_test.npy")
y_test  = np.load(RESULTS_DIR / "part2_y_test.npy")

# -- Load original data for label lookup --------------------------------------
df_all  = pd.read_csv(DATA_PATH)
df_real = df_all[df_all["source"] == "real_kaggle"].reset_index(drop=True)

# Build SHAP explainer on the Part 2 model
print("Building TreeExplainer …")
explainer = shap.TreeExplainer(clf)

# Compute SHAP values on full test set
print(f"Computing SHAP values for {len(X_test)} test rows …")
# Returns ndarray (n_samples, n_features, n_classes) with modern SHAP
shap_vals = explainer.shap_values(X_test)   # shape verified via .ndim
print(f"shap_vals shape: {np.array(shap_vals).shape}")
shap_arr = np.array(shap_vals)   # (n_test, n_features, n_classes)

n_test, n_feats, n_classes = shap_arr.shape
class_names = le.classes_
print(f"n_test={n_test}, n_feats={n_feats}, n_classes={n_classes}")

# -- (a) Global mean |SHAP| aggregated over classes ----------------------------
# mean over samples and classes of |shap|
global_mean_abs = np.mean(np.abs(shap_arr), axis=(0, 2))   # (n_feats,)
feat_order      = np.argsort(global_mean_abs)[::-1]

fig, ax = plt.subplots(figsize=(8, 5))
colors = ["#2563EB"] * n_feats
ax.barh(
    [FEATURES[i] for i in feat_order],
    global_mean_abs[feat_order],
    color=colors, alpha=0.8
)
ax.set_xlabel("Mean |SHAP value| (averaged over samples and classes)", fontsize=11)
ax.set_title("Global Feature Importance — Mean |SHAP|\n(Part 2 model, real_kaggle test set)", fontsize=12)
ax.invert_yaxis()
ax.grid(axis="x", alpha=0.3)
plt.tight_layout()
global_path = RESULTS_DIR / "part5_global_shap.png"
fig.savefig(global_path, dpi=150)
plt.close(fig)
print(f"Saved: {global_path}")
print(f"Global mean |SHAP| per feature: { {FEATURES[i]: round(float(global_mean_abs[i]),6) for i in range(n_feats)} }")

# -- (b) Top-3 features per class ---------------------------------------------
top3_data = {}
for ci, cname in enumerate(class_names):
    # Mean |SHAP| for this class across all test rows
    class_shap = np.abs(shap_arr[:, :, ci])   # (n_test, n_feats)
    mean_abs   = np.mean(class_shap, axis=0)   # (n_feats,)
    top3_idx   = np.argsort(mean_abs)[::-1][:3]
    top3_data[cname] = [
        {"feature": FEATURES[i], "mean_abs_shap": round(float(mean_abs[i]), 6)}
        for i in top3_idx
    ]

top3_json = RESULTS_DIR / "part5_top3_per_class.json"
out_b = {
    "_meta": {"script": "eval/part5_shap_analysis.py", "library_versions": libs},
    "top3_per_class": top3_data,
    "global_mean_abs_shap": {FEATURES[i]: round(float(global_mean_abs[i]), 6) for i in range(n_feats)},
}
with open(top3_json, "w") as f:
    json.dump(out_b, f, indent=2)
print(f"Saved: {top3_json}")

# Human-readable table
lines = ["Part 5(b) — Top-3 Features per Class (mean |SHAP| over test rows)",
         "=" * 70]
for cname, top3 in top3_data.items():
    line = f"  {cname:<15}:  " + "  |  ".join(
        f"{t['feature']}={t['mean_abs_shap']:.4f}" for t in top3
    )
    lines.append(line)
txt_path = RESULTS_DIR / "part5_top3_per_class.txt"
with open(txt_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"Saved: {txt_path}")
print("\n".join(lines))

# -- (c) Local explanation PNGs ------------------------------------------------
def find_row_for_class(class_name, X_test, y_test, le):
    """Return index of first test row with the given true class label."""
    class_idx = le.transform([class_name])[0]
    idxs = np.where(y_test == class_idx)[0]
    if len(idxs) == 0:
        return None
    return int(idxs[0])

def local_bar_plot(row_idx, class_name, shap_arr, clf, X_test, le, out_path):
    """Plot local SHAP bar chart for one row, predicted class."""
    proba   = clf.predict_proba(X_test[[row_idx]])[0]
    pred_ci = int(np.argmax(proba))
    true_ci = le.transform([class_name])[0]

    # Show SHAP for predicted class
    sv_row   = shap_arr[row_idx, :, pred_ci]          # (n_feats,)
    base_val = float(explainer.expected_value[pred_ci])
    pred_val = float(proba[pred_ci])

    order = np.argsort(np.abs(sv_row))[::-1]
    colors = ["#16a34a" if sv_row[i] >= 0 else "#DC2626" for i in order]

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.barh([FEATURES[i] for i in order], sv_row[order], color=colors, alpha=0.8)
    ax.axvline(0, color="black", lw=0.8)
    ax.set_xlabel("SHAP value (contribution to predicted-class log-odds)", fontsize=10)
    ax.set_title(
        f"Local SHAP — True: {class_name}  |  Predicted: {le.classes_[pred_ci]}\n"
        f"Base={base_val:.4f}  Predicted proba={pred_val:.4f}",
        fontsize=11,
    )
    ax.invert_yaxis()
    ax.grid(axis="x", alpha=0.3)
    plt.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    print(f"Saved: {out_path}")
    return {"base_value": base_val, "predicted_proba": pred_val,
            "predicted_class": le.classes_[pred_ci],
            "shap_for_pred_class": {FEATURES[i]: round(float(sv_row[i]), 6) for i in range(n_feats)}}

rice_idx   = find_row_for_class("rice",   X_test, y_test, le)
cotton_idx = find_row_for_class("cotton", X_test, y_test, le)

local_results = {}
if rice_idx is not None:
    local_results["rice"] = local_bar_plot(
        rice_idx, "rice", shap_arr, clf, X_test, le,
        RESULTS_DIR / "part5_local_rice.png"
    )
else:
    print("WARNING: no rice rows in test set")

if cotton_idx is not None:
    local_results["cotton"] = local_bar_plot(
        cotton_idx, "cotton", shap_arr, clf, X_test, le,
        RESULTS_DIR / "part5_local_cotton.png"
    )
else:
    print("WARNING: no cotton rows in test set")

# -- (d) Additivity check ------------------------------------------------------
print("\nAdditivity check on 20 random test rows …")
rng = np.random.default_rng(42)
check_idxs = rng.choice(len(X_test), size=20, replace=False)

errors = []
for idx in check_idxs:
    proba  = clf.predict_proba(X_test[[idx]])[0]
    pred_ci = int(np.argmax(proba))
    pred_proba = float(proba[pred_ci])

    # base_value + sum(shap) should equal predict_proba for pred class
    base    = float(explainer.expected_value[pred_ci])
    sv_sum  = float(shap_arr[idx, :, pred_ci].sum())
    approx  = base + sv_sum
    err     = abs(approx - pred_proba)
    errors.append({
        "test_idx"       : int(idx),
        "pred_class"     : le.classes_[pred_ci],
        "pred_proba"     : round(pred_proba, 6),
        "base_value"     : round(base, 6),
        "shap_sum"       : round(sv_sum, 6),
        "base_plus_shap" : round(approx, 6),
        "abs_error"      : round(err, 8),
    })

max_err = max(e["abs_error"] for e in errors)
mean_err = sum(e["abs_error"] for e in errors) / len(errors)
print(f"Additivity: max |error| = {max_err:.2e}  mean |error| = {mean_err:.2e}")

additivity_out = {
    "_meta": {
        "script": "eval/part5_shap_analysis.py",
        "note"  : "base_value + sum(SHAP) must equal predict_proba[pred_class]; checks SHAP additivity property",
        "n_rows_checked": 20,
        "random_seed": 42,
        "library_versions": libs,
    },
    "max_abs_error" : round(max_err, 8),
    "mean_abs_error": round(mean_err, 8),
    "per_row"       : errors,
}
add_json = RESULTS_DIR / "part5_additivity.json"
with open(add_json, "w") as f:
    json.dump(additivity_out, f, indent=2)
print(f"Saved: {add_json}")

# -- Final JSON with all Part 5 results ----------------------------------------
final = {
    "_meta"          : {"script": "eval/part5_shap_analysis.py", "library_versions": libs},
    "global_mean_abs_shap": {FEATURES[i]: round(float(global_mean_abs[i]),6) for i in range(n_feats)},
    "top3_per_class" : top3_data,
    "local_results"  : local_results,
    "additivity"     : {
        "max_abs_error" : round(max_err, 8),
        "mean_abs_error": round(mean_err, 8),
    },
}
p5_json = RESULTS_DIR / "part5_shap_results.json"
with open(p5_json, "w") as f:
    json.dump(final, f, indent=2)
print(f"Saved: {p5_json}")
