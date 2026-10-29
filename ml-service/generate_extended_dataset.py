"""
generate_extended_dataset.py  –  AgriSense | Synthetic Crop Row Generator
==========================================================================
IMPORTANT — DATA PROVENANCE WARNING
------------------------------------
The parameter bounds below (N, P, K, temperature, humidity, ph, rainfall)
for soybean, bajra, jowar, groundnut and sugarcane are UNCITED ASSUMPTIONS.
They have NOT been verified against ICAR, TNAU, or any other agronomic
reference.  Pending citations are tracked in data/DATA_PROVENANCE.md.

This script writes ONLY to:
    data/agrisense_crop_dataset_v2.csv   (provenance-tagged, 2700 rows)

It does NOT write to, overwrite, or delete:
    data/Crop_recommendation.csv
    data/Crop_recommendation_backup.csv

Run:
    python generate_extended_dataset.py
"""

import pandas as pd
import numpy as np
import pathlib

BASE_DIR    = pathlib.Path(__file__).parent
BACKUP_PATH = BASE_DIR / "data" / "Crop_recommendation_backup.csv"
OUTPUT_PATH = BASE_DIR / "data" / "agrisense_crop_dataset_v2.csv"

# ---------------------------------------------------------------------------
# Parameter bounds for synthetic crops.
# Format: [N_min, N_max, P_min, P_max, K_min, K_max,
#          temp_min, temp_max, hum_min, hum_max,
#          ph_min, ph_max, rain_min, rain_max]
#
# ALL RANGES BELOW ARE UNCITED ASSUMPTIONS unless a comment says otherwise.
# See data/DATA_PROVENANCE.md for per-feature citation status.
# ---------------------------------------------------------------------------
new_crops_bounds = {
    # N, P, K: ASSUMED - no source
    # temperature, rainfall: UNCITED - pending
    # ph: soybean only — pending verification
    "soybean":   [20, 40, 60, 80, 35, 55, 20, 32, 60, 75, 6.0, 7.5, 600, 1000],

    # N, P, K, humidity: ASSUMED - no source
    # temperature, rainfall, ph: UNCITED - pending
    "bajra":     [40, 60, 20, 40, 15, 30, 25, 38, 40, 65, 6.5, 8.5, 350,  600],

    # N, P, K, humidity: ASSUMED - no source
    # temperature, rainfall, ph: UNCITED - pending
    "jowar":     [45, 70, 25, 45, 20, 35, 24, 35, 45, 70, 6.0, 8.0, 400,  750],

    # N, P, K, humidity: ASSUMED - no source
    # temperature, rainfall, ph: UNCITED - pending
    "groundnut": [15, 30, 40, 65, 30, 50, 22, 30, 50, 70, 5.8, 7.2, 500,  800],

    # N, P, K, humidity: ASSUMED - no source
    # temperature, rainfall, ph: UNCITED - pending
    "sugarcane": [120, 180, 50, 70, 60, 90, 20, 35, 65, 85, 6.0, 7.5, 1100, 1800],
}

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def main():
    # Load the clean Kaggle backup (never modified)
    if not BACKUP_PATH.exists():
        raise FileNotFoundError(
            f"Backup not found at {BACKUP_PATH}. "
            "Place Crop_recommendation_backup.csv in ml-service/data/ and retry."
        )
    real_df = pd.read_csv(BACKUP_PATH)
    real_df["source"] = "real_kaggle"
    print(f"[1/3] Loaded backup: {real_df.shape}  (22 real crops × 100 rows each)")

    # Generate synthetic rows
    new_rows = []
    np.random.seed(42)  # reproducibility

    for crop, bounds in new_crops_bounds.items():
        for _ in range(100):
            row = {}
            for i, feat in enumerate(FEATURES):
                min_val = bounds[i * 2]
                max_val = bounds[i * 2 + 1]
                mean_val = (min_val + max_val) / 2
                std_val  = (max_val - min_val) / 6

                val = np.random.normal(mean_val, std_val)
                val = np.clip(val, min_val, max_val)

                if real_df[feat].dtype == np.int64:
                    row[feat] = int(round(val))
                else:
                    row[feat] = round(val, 2)
            row["label"]  = crop
            row["source"] = "synthetic"
            new_rows.append(row)

    synth_df = pd.DataFrame(new_rows)
    print(f"[2/3] Generated synthetic rows: {synth_df.shape}  (5 crops × 100)")

    # Combine and write — ONLY to OUTPUT_PATH
    combined = pd.concat([real_df, synth_df], ignore_index=True)
    combined.to_csv(OUTPUT_PATH, index=False)
    print(f"[3/3] Written: {OUTPUT_PATH}  shape={combined.shape}")
    print("\nClass counts:")
    print(combined["label"].value_counts().sort_index())
    print("\nSource counts:")
    print(combined["source"].value_counts())


if __name__ == "__main__":
    main()
