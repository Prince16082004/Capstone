"""
part4_noise_robustness.py  –  AgriSense Eval | Input-Noise Robustness
======================================================================
Adds Gaussian noise to TEST features only (calibration stays clean).
Sigma levels: 0, 2.5, 5, 10, 15 percent of each feature's std dev.
10 seeds per level (seeds 0..9).

For each (sigma_pct, seed) pair, reports:
  accuracy, macro-F1, conformal coverage (alpha=0.10), mean set size, singleton rate.

Conformal threshold reused from Part 3 (calibration set unchanged, clean).

Output:
  eval/results/part4_noise_all_runs.csv    — per (sigma, seed) row
  eval/results/part4_noise_summary.json    — mean±std aggregated by sigma level
  eval/results/part4_noise_plot.png        — accuracy, coverage, set size vs noise
"""

import sys, json, time, pathlib, warnings
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

from sklearn.metrics import accuracy_score, f1_score

# -- Paths ---------------------------------------------------------------------
SCRIPT_DIR  = pathlib.Path(__file__).parent
ROOT        = SCRIPT_DIR.parent
RESULTS_DIR = SCRIPT_DIR / "results"

import sklearn
libs = {"python": sys.version.split()[0], "sklearn": sklearn.__version__, "numpy": np.__version__}

# -- Load Part 2 artifacts -----------------------------------------------------
clf = joblib.load(RESULTS_DIR / "part2_model.pkl")
le  = joblib.load(RESULTS_DIR / "part2_encoder.pkl")

X_train = np.load(RESULTS_DIR / "part2_X_train.npy")
X_cal   = np.load(RESULTS_DIR / "part2_X_cal.npy")
y_cal   = np.load(RESULTS_DIR / "part2_y_cal.npy")
X_test  = np.load(RESULTS_DIR / "part2_X_test.npy")
y_test  = np.load(RESULTS_DIR / "part2_y_test.npy")

# -- Feature std devs (computed on TRAIN set) ----------------------------------
feat_stds = X_train.std(axis=0)   # shape: (7,)
print(f"Feature stds (train): {feat_stds.round(3)}")

# -- Conformal threshold (alpha=0.10, calibration clean) ----------------------
ALPHA = 0.10
proba_cal = clf.predict_proba(X_cal)
scores_cal = 1.0 - proba_cal[np.arange(len(X_cal)), y_cal]
n_cal = len(X_cal)
q_idx = min(int(np.ceil((n_cal + 1) * (1 - ALPHA))), n_cal)
threshold = np.sort(scores_cal)[q_idx - 1]
print(f"Conformal threshold (alpha={ALPHA}): {threshold:.6f}  (q_idx={q_idx})")

# -- Noise experiment ----------------------------------------------------------
SIGMA_PCTS = [0, 2.5, 5, 10, 15]
SEEDS      = list(range(10))

rows = []

for sigma_pct in SIGMA_PCTS:
    for seed in SEEDS:
        rng = np.random.default_rng(seed)
        sigma_abs = (sigma_pct / 100.0) * feat_stds   # shape: (7,)

        if sigma_pct == 0:
            X_noisy = X_test.copy()
        else:
            noise   = rng.normal(0.0, sigma_abs, size=X_test.shape)
            X_noisy = X_test + noise

        proba_noisy  = clf.predict_proba(X_noisy)
        y_pred_noisy = np.argmax(proba_noisy, axis=1)

        acc  = accuracy_score(y_test, y_pred_noisy)
        mf1  = f1_score(y_test, y_pred_noisy, average="macro", zero_division=0)

        # Conformal prediction sets (threshold from CLEAN calibration)
        pred_sets  = proba_noisy >= (1.0 - threshold)
        set_sizes  = pred_sets.sum(axis=1)
        covered    = pred_sets[np.arange(len(y_test)), y_test]

        coverage    = float(covered.mean())
        mean_size   = float(set_sizes.mean())
        frac_single = float((set_sizes == 1).mean())

        rows.append({
            "sigma_pct"         : sigma_pct,
            "seed"              : seed,
            "accuracy"          : round(acc, 6),
            "macro_f1"          : round(mf1, 6),
            "conformal_coverage": round(coverage, 6),
            "mean_set_size"     : round(mean_size, 6),
            "frac_singletons"   : round(frac_single, 6),
        })

    # Progress
    subset = [r for r in rows if r["sigma_pct"] == sigma_pct]
    mean_acc = np.mean([r["accuracy"] for r in subset])
    mean_cov = np.mean([r["conformal_coverage"] for r in subset])
    print(f"sigma={sigma_pct:5.1f}%  acc={mean_acc:.4f}  coverage={mean_cov:.4f}")

# -- Save per-run CSV ----------------------------------------------------------
df_runs = pd.DataFrame(rows)
runs_csv = RESULTS_DIR / "part4_noise_all_runs.csv"
df_runs.to_csv(runs_csv, index=False)
print(f"Saved: {runs_csv}")

# -- Aggregate by sigma --------------------------------------------------------
METRICS = ["accuracy", "macro_f1", "conformal_coverage", "mean_set_size", "frac_singletons"]
summary = {}
for sigma_pct in SIGMA_PCTS:
    sub = df_runs[df_runs["sigma_pct"] == sigma_pct]
    entry = {"sigma_pct": sigma_pct}
    for m in METRICS:
        entry[f"{m}_mean"] = round(float(sub[m].mean()), 6)
        entry[f"{m}_std"]  = round(float(sub[m].std()),  6)
    if entry["conformal_coverage_mean"] < (1 - ALPHA):
        entry["_coverage_below_nominal"] = True
    summary[str(sigma_pct)] = entry

out = {
    "_meta": {
        "script"             : "eval/part4_noise_robustness.py",
        "sigma_pct_levels"   : SIGMA_PCTS,
        "seeds_per_level"    : SEEDS,
        "noise_target"       : "TEST features only (calibration is clean)",
        "feat_stds_train"    : feat_stds.tolist(),
        "conformal_alpha"    : ALPHA,
        "conformal_threshold": round(float(threshold), 6),
        "library_versions"   : libs,
    },
    "summary_by_sigma": summary,
}

summary_json = RESULTS_DIR / "part4_noise_summary.json"
with open(summary_json, "w") as f:
    json.dump(out, f, indent=2)
print(f"Saved: {summary_json}")

# -- Plot ----------------------------------------------------------------------
x_vals = SIGMA_PCTS
acc_means    = [summary[str(s)]["accuracy_mean"] for s in SIGMA_PCTS]
acc_stds     = [summary[str(s)]["accuracy_std"]  for s in SIGMA_PCTS]
cov_means    = [summary[str(s)]["conformal_coverage_mean"] for s in SIGMA_PCTS]
cov_stds     = [summary[str(s)]["conformal_coverage_std"]  for s in SIGMA_PCTS]
size_means   = [summary[str(s)]["mean_set_size_mean"] for s in SIGMA_PCTS]
size_stds    = [summary[str(s)]["mean_set_size_std"]  for s in SIGMA_PCTS]

fig, axes = plt.subplots(1, 3, figsize=(15, 5))

ax = axes[0]
ax.errorbar(x_vals, acc_means, yerr=acc_stds, marker="o", color="#2563EB",
            capsize=4, linewidth=2, label="Accuracy")
ax.axhline(acc_means[0], color="#2563EB", ls="--", alpha=0.4, lw=1)
ax.set_xlabel("Noise σ (% of feature std)", fontsize=11)
ax.set_ylabel("Accuracy", fontsize=11)
ax.set_title("Accuracy vs. Noise Level", fontsize=12)
ax.grid(alpha=0.3)

ax = axes[1]
ax.errorbar(x_vals, cov_means, yerr=cov_stds, marker="s", color="#16a34a",
            capsize=4, linewidth=2, label="Coverage")
ax.axhline(1 - ALPHA, color="#DC2626", ls="--", lw=1.5, label=f"Nominal (1-α={1-ALPHA:.2f})")
ax.set_xlabel("Noise σ (% of feature std)", fontsize=11)
ax.set_ylabel("Empirical Coverage", fontsize=11)
ax.set_title(f"Conformal Coverage vs. Noise (α={ALPHA})", fontsize=12)
ax.legend(fontsize=9)
ax.grid(alpha=0.3)

ax = axes[2]
ax.errorbar(x_vals, size_means, yerr=size_stds, marker="^", color="#9333ea",
            capsize=4, linewidth=2, label="Mean set size")
ax.axhline(size_means[0], color="#9333ea", ls="--", alpha=0.4, lw=1)
ax.set_xlabel("Noise σ (% of feature std)", fontsize=11)
ax.set_ylabel("Mean Prediction Set Size", fontsize=11)
ax.set_title("Set Size vs. Noise Level", fontsize=12)
ax.grid(alpha=0.3)

fig.suptitle(f"AgriSense RF — Input-Noise Robustness (10 seeds per level, test-set noise only)",
             fontsize=13, fontweight="bold")
plt.tight_layout()
plot_path = RESULTS_DIR / "part4_noise_plot.png"
fig.savefig(plot_path, dpi=150)
plt.close(fig)
print(f"Saved: {plot_path}")
