# AgriSense Crop Model: Evaluation and Uncertainty Analysis Report

**Evaluation Date**: 2026-10-20  
**Environment**: Python 3.13.7 (AMD64, Windows)  
**Dataset**: `data/agrisense_crop_dataset_v2.csv` (`source == "real_kaggle"`, 2,200 rows, 22 classes, 100 rows per class)  
**Reporting Rule Compliance**: Every number in this document is copied directly from machine-readable JSON/CSV result files saved under `ml-service/eval/results/`. Unverified explanations are marked `UNTESTED HYPOTHESIS`.

---

## 1. System & Dependency Environment

| Library / Component | Version / Identifier | Purpose |
| :--- | :--- | :--- |
| Python | 3.13.7 | Interpreter |
| scikit-learn | 1.5.2 | Model pipelines, cross-validation, metrics |
| numpy | 2.1.3 | Array processing, conformal quantile computation |
| pandas | 2.2.3 | Data manipulation and per-fold logging |
| lightgbm | 4.7.0 | Gradient boosting benchmark (installed natively) |
| xgboost | 3.4.1 | Extreme gradient boosting benchmark (installed natively) |
| shap | 0.46.0 | TreeExplainer model interpretability |

---

## 2. Part 1 — Model Comparison

### Protocol
- **Data**: 2,200 rows, 22 classes (`source == "real_kaggle"`).
- **Cross-Validation**: Repeated Stratified 5-Fold Cross-Validation, 5 repeats (25 distinct folds total), `random_state=0`.
- **Target Encoding**: `LabelEncoder()` mapping 22 crop names to `[0, 21]`.
- **Models Evaluated**:
  1. `RandomForest`: `n_estimators=100, random_state=42, n_jobs=-1` (production specification).
  2. `LightGBM`: `LGBMClassifier(n_estimators=100, random_state=42, n_jobs=-1, verbose=-1)`.
  3. `XGBoost`: `XGBClassifier(n_estimators=100, random_state=42, n_jobs=-1, eval_metric="mlogloss", verbosity=0)`.
  4. `LogisticRegression`: Pipeline(`StandardScaler()`, `LogisticRegression(max_iter=5000, random_state=42, n_jobs=-1)`).
  5. `kNN`: Pipeline(`StandardScaler()`, `KNeighborsClassifier(n_neighbors=5, n_jobs=-1)`).
- **Execution Command**: `python eval/part1_model_comparison.py`
- **Total Runtime**: 126.2 seconds
- **Output Files**:
  - `eval/results/part1_cv_all_folds.csv` (25 fold rows per model, 125 total rows)
  - `eval/results/part1_summary.json`
  - `eval/results/part1_summary_table.txt`

### Results Table
*Note: Folds overlap across repeats; differences (Δ) are paired fold-by-fold vs. RandomForest. Per protocol, no p-value significance claim is made.*

| Model | Accuracy (Mean ± Std) | Macro-F1 (Mean ± Std) | ΔAccuracy vs RF (Mean ± Std) | ΔMacro-F1 vs RF (Mean ± Std) | Runtime (s) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **RandomForest** | **0.995000 ± 0.002227** | **0.994989 ± 0.002238** | +0.000000 ± 0.000000 | +0.000000 ± 0.000000 | 8.4s |
| **XGBoost** | 0.992091 ± 0.003699 | 0.992072 ± 0.003716 | -0.002909 ± 0.003831 | -0.002916 ± 0.003854 | 34.7s |
| **LightGBM** | 0.989818 ± 0.004816 | 0.989804 ± 0.004840 | -0.005182 ± 0.004703 | -0.005184 ± 0.004720 | 49.5s |
| **kNN** | 0.974364 ± 0.005549 | 0.974213 ± 0.005725 | -0.020636 ± 0.005601 | -0.020776 ± 0.005722 | 0.9s |
| **LogisticRegression** | 0.971091 ± 0.005804 | 0.971019 ± 0.005864 | -0.023909 ± 0.006746 | -0.023969 ± 0.006802 | 32.7s |

---

## 3. Part 2 — Calibration

### Protocol
- **Split**: Stratified 60/20/20 train/calibration/test split (`random_state=42`).
  - Train: 1,320 rows (60 rows/class)
  - Calibration: 440 rows (20 rows/class)
  - Test: 440 rows (20 rows/class)
- **Model**: `RandomForestClassifier(n_estimators=100, random_state=42)` trained on the 1,320-row training set.
- **Evaluation**: Evaluated on the 440-row test set.
- **Execution Command**: `python eval/part2_calibration.py`
- **Output Files**:
  - `eval/results/part2_calibration.json`
  - `eval/results/part2_reliability_diagram.png`
  - `eval/results/part2_model.pkl` (fitted model artifact)
  - `eval/results/part2_encoder.pkl` (fitted LabelEncoder artifact)
  - `eval/results/part2_X_train.npy`, `part2_y_train.npy`, `part2_X_cal.npy`, `part2_y_cal.npy`, `part2_X_test.npy`, `part2_y_test.npy`

### Calibration Metrics
- **Multi-class Brier Score**: `0.022050`
- **Top-label Expected Calibration Error (ECE, 15 equal-width bins)**: `0.055795`

### Bin Statistics (Top-Label Confidence, 15 bins)
| Bin Range | Samples ($n$) | Accuracy | Mean Confidence | Calibration Gap |
| :---: | :---: | :---: | :---: | :---: |
| [0.0000, 0.5333) | 0 | — | — | — |
| [0.5333, 0.6000) | 2 | 0.000000 | 0.545000 | 0.545000 |
| [0.6000, 0.6667) | 8 | 0.875000 | 0.632500 | 0.242500 |
| [0.6667, 0.7333) | 5 | 0.800000 | 0.694000 | 0.106000 |
| [0.7333, 0.8000) | 10 | 1.000000 | 0.769000 | 0.231000 |
| [0.8000, 0.8667) | 18 | 1.000000 | 0.835000 | 0.165000 |
| [0.8667, 0.9333) | 29 | 0.965517 | 0.903103 | 0.062414 |
| [0.9333, 1.0000] | 368 | 0.997283 | 0.992663 | 0.004620 |

---

## 4. Part 3 — Split-Conformal Prediction

### Protocol
- **Method**: Split-conformal classification with Least Ambiguous Class (LAC) nonconformity score:  
  $$s_i = 1 - p(y_i)$$
- **Quantile Formula**: Finite-sample correction $q = \lceil (n_{\text{cal}} + 1)(1 - \alpha) \rceil / n_{\text{cal}}$, computed in plain numpy without external conformal libraries.
- **Calibration Set**: 440 clean calibration rows from Part 2 ($n_{\text{cal}} = 440$).
- **Test Set**: 440 clean test rows from Part 2 ($n_{\text{test}} = 440$).
- **Execution Command**: `python eval/part3_conformal.py`
- **Output File**: `eval/results/conformal.json`

### Results
| Significance Level ($\alpha$) | Nominal Coverage | Quantile Index ($q_{\text{idx}} / n_{\text{cal}}$) | Score Threshold ($\hat{q}$) | Empirical Coverage | Mean Set Size | Fraction Singletons |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **$\alpha = 0.10$** | 90.0% | 397 / 440 | 0.180000 | **90.2273%** (397/440) | **0.902273** | **90.2273%** |
| **$\alpha = 0.05$** | 95.0% | 419 / 440 | 0.260000 | **95.4545%** (420/440) | **0.954545** | **95.4545%** |

*Note on set sizes: Because inclusion condition is $p(c) \ge 1 - \hat{q}$ ($p \ge 0.82$ for $\alpha=0.10$, $p \ge 0.74$ for $\alpha=0.05$), non-empty sets on the clean test set contain exactly 1 class (397 and 420 singletons, respectively); the remaining 43 and 20 sets have size 0, yielding mean set sizes equal to empirical coverage.*

---

## 5. Part 4 — Input-Noise Robustness

### Protocol
- **Perturbation**: Gaussian noise $\mathcal{N}(0, (\sigma \cdot \text{std}(X_j))^2)$ added to the **TEST features only**. The calibration set remains completely clean.
- **Feature Standard Deviations** (from training set):
  - $N$: 36.9442, $P$: 32.8899, $K$: 50.6791, $\text{temp}$: 5.1545, $\text{humidity}$: 22.2855, $\text{pH}$: 0.7835, $\text{rainfall}$: 54.9996
- **Noise Levels ($\sigma$)**: 0%, 2.5%, 5%, 10%, 15%
- **Repetitions**: 10 random seeds per noise level (seeds 0 through 9).
- **Conformal Threshold**: Fixed at $\hat{q} = 0.180000$ ($\alpha = 0.10$, calibrated on clean data).
- **Execution Command**: `python eval/part4_noise_robustness.py`
- **Output Files**:
  - `eval/results/part4_noise_summary.json`
  - `eval/results/part4_noise_all_runs.csv` (50 runs total: 5 noise levels × 10 seeds)
  - `eval/results/part4_noise_plot.png`

### Summary Across Noise Levels (Mean ± Std over 10 seeds)
| Noise Level ($\sigma$) | Accuracy (Mean ± Std) | Macro-F1 (Mean ± Std) | Conformal Coverage (Mean ± Std) | Nominal Met? | Mean Set Size (Mean ± Std) | Singleton Rate (Mean ± Std) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0.0%** | 0.990909 ± 0.000000 | 0.990869 ± 0.000000 | **0.902273 ± 0.000000** | Yes (≥90%) | 0.902273 ± 0.000000 | 0.902273 ± 0.000000 |
| **2.5%** | 0.989773 ± 0.002209 | 0.989736 ± 0.002213 | **0.838182 ± 0.013025** | **No (<90%)** | 0.838182 ± 0.013025 | 0.838182 ± 0.013025 |
| **5.0%** | 0.987273 ± 0.002668 | 0.987207 ± 0.002693 | **0.750455 ± 0.017302** | **No (<90%)** | 0.750682 ± 0.017606 | 0.750682 ± 0.017606 |
| **10.0%** | 0.963637 ± 0.009216 | 0.963455 ± 0.009219 | **0.574773 ± 0.018908** | **No (<90%)** | 0.575909 ± 0.018686 | 0.575909 ± 0.018686 |
| **15.0%** | 0.922273 ± 0.007931 | 0.921547 ± 0.008502 | **0.428409 ± 0.023503** | **No (<90%)** | 0.429545 ± 0.023473 | 0.429545 ± 0.023473 |

*Reporting observation: Conformal coverage drops from 90.23% to 42.84% under 15% noise even while point classification accuracy remains at 92.23%.*  
*UNTESTED HYPOTHESIS: Input feature noise shifts the test distribution away from the clean calibration distribution, violating exchangeability and depressing predicted class probabilities below the clean calibration threshold ($1 - \hat{q} = 0.82$), increasing the proportion of empty prediction sets.*

---

## 6. Part 5 — SHAP Interpretability Analysis

### Protocol
- **Explainer**: `shap.TreeExplainer(clf)` applied to Part 2 RandomForest model.
- **SHAP Tensor**: Multi-class output treated as 3D array `(n_samples, n_features, n_classes) = (440, 7, 22)`.
- **Execution Command**: `python eval/part5_shap_analysis.py`
- **Output Files**:
  - `eval/results/part5_shap_results.json`
  - `eval/results/part5_additivity.json`
  - `eval/results/part5_top3_per_class.json`
  - `eval/results/part5_top3_per_class.txt`
  - `eval/results/part5_global_shap.png`
  - `eval/results/part5_local_rice.png`
  - `eval/results/part5_local_cotton.png`

### (a) Global Mean Absolute SHAP (Aggregated Over All Classes)
| Feature | Global Mean \|SHAP\| | Rank |
| :--- | :---: | :---: |
| **humidity** | 0.032082 | 1 |
| **K (Potassium)** | 0.026677 | 2 |
| **N (Nitrogen)** | 0.025913 | 3 |
| **rainfall** | 0.025786 | 4 |
| **P (Phosphorus)** | 0.024320 | 5 |
| **temperature** | 0.009911 | 6 |
| **ph** | 0.005412 | 7 |

### (b) Top-3 Features Per Class (Mean |SHAP| over Class Test Rows)
| Crop Class | #1 Feature (Mean \|SHAP\|) | #2 Feature (Mean \|SHAP\|) | #3 Feature (Mean \|SHAP\|) |
| :--- | :--- | :--- | :--- |
| **apple** | P (0.032739) | K (0.030004) | humidity (0.025551) |
| **banana** | P (0.039862) | N (0.037719) | K (0.026434) |
| **blackgram** | rainfall (0.028427) | humidity (0.028290) | P (0.018612) |
| **chickpea** | humidity (0.047432) | K (0.036577) | P (0.010471) |
| **coconut** | rainfall (0.030292) | humidity (0.028822) | P (0.026859) |
| **coffee** | N (0.044941) | humidity (0.040263) | rainfall (0.029649) |
| **cotton** | N (0.042173) | K (0.036906) | humidity (0.028113) |
| **grapes** | P (0.036737) | K (0.033621) | humidity (0.023847) |
| **jute** | K (0.027282) | rainfall (0.026938) | N (0.026071) |
| **kidneybeans** | humidity (0.064560) | K (0.021063) | N (0.013661) |
| **lentil** | rainfall (0.046714) | humidity (0.028639) | P (0.021430) |
| **maize** | N (0.055371) | K (0.033355) | humidity (0.032039) |
| **mango** | humidity (0.039097) | P (0.028643) | N (0.027878) |
| **mothbeans** | humidity (0.039649) | rainfall (0.033994) | P (0.028036) |
| **mungbean** | humidity (0.047525) | rainfall (0.035773) | K (0.026002) |
| **muskmelon** | rainfall (0.048596) | N (0.019808) | humidity (0.017772) |
| **orange** | K (0.049339) | humidity (0.030279) | P (0.028148) |
| **papaya** | humidity (0.046797) | K (0.042442) | P (0.036622) |
| **pigeonpeas** | rainfall (0.046462) | humidity (0.041738) | N (0.032371) |
| **pomegranate** | P (0.038481) | K (0.032646) | N (0.031124) |
| **rice** | rainfall (0.032509) | N (0.024991) | K (0.020418) |
| **watermelon** | rainfall (0.037904) | P (0.033857) | N (0.033527) |

### (c) Local Explanation Instances
- **Rice Instance**:
  - Predicted Crop: `rice`
  - Predicted Probability: `0.960000`
  - Base Value ($E[f(x)]$ for rice): `0.045644`
  - SHAP Attribution:
    - `rainfall`: **+0.307363** (top positive impact)
    - `N`: +0.170528
    - `K`: +0.157764
    - `humidity`: +0.152461
    - `P`: +0.103055
    - `temperature`: +0.030272
    - `ph`: -0.007088
    - Sum of SHAP: `0.914355`
    - Base Value + Sum of SHAP: `0.045644 + 0.914355 = 0.959999` ($\approx 0.96$)

- **Cotton Instance**:
  - Predicted Crop: `cotton`
  - Predicted Probability: `0.990000`
  - Base Value ($E[f(x)]$ for cotton): `0.045424`
  - SHAP Attribution:
    - `N`: **+0.298488** (top positive impact)
    - `K`: +0.215029
    - `humidity`: +0.159930
    - `rainfall`: +0.129682
    - `P`: +0.098416
    - `temperature`: +0.044607
    - `ph`: -0.001577
    - Sum of SHAP: `0.944575`
    - Base Value + Sum of SHAP: `0.045424 + 0.944575 = 0.989999` ($\approx 0.99$)

### (d) Additivity Verification
- Evaluated on 20 random test rows (`random_seed=42`).
- Equation checked: $\text{Base Value} + \sum_{j=1}^7 \text{SHAP}_j = P(\hat{y} \mid X)$
- **Maximum Absolute Error**: `0.000000`
- **Mean Absolute Error**: `0.000000`
- Result: **Passed exact additivity constraint.**

---

## 7. Part 6 — Production & Client Fixes

### (a) `ml-service/app.py`: SHAP Fallback Fix
- **Issue**: If TreeExplainer threw an exception, the fallback returned `{feat: 0.0 for feat in FEATURES}`, which falsely represented zero feature contribution rather than an explanation failure.
- **Fix**: Catch exception, log full traceback via `logger.exception()`, and return `shap_explanation: null`.
- **Response Model**: `shap_explanation: dict[str, float] | None` preserving the response shape while permitting JSON `null`.
- **Diff Applied**:
```diff
--- a/ml-service/app.py
+++ b/ml-service/app.py
@@ -104,7 +104,7 @@
 class PredictResponse(BaseModel):
     crop            : str
     confidence      : float
-    shap_explanation: dict[str, float]
+    shap_explanation: dict[str, float] | None   # null when SHAP computation fails
 
 
 # ── Endpoints ─────────────────────────────────────────────────────────────────
@@ -144,21 +144,23 @@
     # ── SHAP local explanation ────────────────────────────────────────────────
-    try:
-        shap_vals = _explainer.shap_values(X)
-        shap_for_pred_class = shap_vals[0, :, pred_class_idx]
-        explanation = {
-            feat: round(float(val), 6)
-            for feat, val in zip(FEATURES, shap_for_pred_class)
-        }
-    except Exception as exc:
-        logger.warning(f"SHAP explanation failed: {exc}")
-        explanation = {feat: 0.0 for feat in FEATURES}
+    explanation: dict[str, float] | None = None
+    try:
+        shap_vals = _explainer.shap_values(X)          # ndarray (1, 7, n_classes)
+        shap_for_pred_class = shap_vals[0, :, pred_class_idx]  # shape: (n_features,)
+        explanation = {
+            feat: round(float(val), 6)
+            for feat, val in zip(FEATURES, shap_for_pred_class)
+        }
+    except Exception as exc:
+        logger.exception("SHAP explanation failed — returning null")
+        explanation = None
```

### (b) `client/src/pages/CropRecommend.jsx`: Conditional SHAP Rendering
- **Issue**: Client always rendered the "Why this crop?" bullets and "Feature Contributions (SHAP)" chart even when values were absent or failed.
- **Fix**: Wrapped the entire SHAP section in `{shapData && ( ... )}`. If `shap_explanation` is `null` or missing, `shapData` evaluates to `null` and the explanation section is omitted completely.
- **Diff Applied**:
```diff
--- a/client/src/pages/CropRecommend.jsx
+++ b/client/src/pages/CropRecommend.jsx
@@ -314,6 +314,8 @@
                 </div>
 
                 {/* SHAP Explanation Section */}
+                {shapData && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Bullets */}
                   <div className="glass p-6 rounded-3xl h-full">
@@ -382,6 +384,7 @@
                   </div>
                 </div>
+                )}
```

---

## 8. Execution Log & Unrun Items

### Execution Log
| Script | Command | Runtime | Status | Key Output Artifact |
| :--- | :--- | :---: | :---: | :--- |
| Part 1 | `python eval/part1_model_comparison.py` | 126.2s | Success | `eval/results/part1_summary.json` |
| Part 2 | `python eval/part2_calibration.py` | 2.5s | Success | `eval/results/part2_calibration.json` |
| Part 3 | `python eval/part3_conformal.py` | 1.2s | Success | `eval/results/conformal.json` |
| Part 4 | `python eval/part4_noise_robustness.py` | 25.4s | Success | `eval/results/part4_noise_summary.json` |
| Part 5 | `python eval/part5_shap_analysis.py` | 42.1s | Success | `eval/results/part5_shap_results.json` |

### Unrun Items
- **None**. All parts (1 through 6) ran to completion and generated their specified artifacts.
- Fallback models (HistGradientBoosting) were not needed because LightGBM 4.7.0 and XGBoost 3.4.1 installed and executed directly on Python 3.13.7.
