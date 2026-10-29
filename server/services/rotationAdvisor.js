'use strict';

/**
 * Pure crop-rotation evaluation function.
 *
 * Given a farmer's previous crop, the ML-predicted next crop, and the
 * ICAR/TNAU rotation matrix, returns a structured advisory object that
 * the caller can attach to the API response.
 *
 * This function has NO side effects, NO I/O, and NO Express dependencies —
 * it is fully unit-testable in isolation.
 *
 * @param {string|null|undefined} previousCrop   - The crop grown last season.
 * @param {string|null|undefined} predictedCrop  - The ML-predicted next crop.
 * @param {object[]}              matrix         - Array from crop_rotation_matrix.json.
 * @returns {{
 *   has_rotation_data: boolean,
 *   status: 'no_history'|'no_data'|'perennial'|'warning'|'success'|'neutral',
 *   is_perennial: boolean,
 *   title: string|null,
 *   message: string|null,
 *   recommended_crops: string[]|null,
 *   rationale: string|null,
 *   nitrogen_effect: string|null
 * }}
 */
function evaluateRotation(previousCrop, predictedCrop, matrix) {
  // ── 1. Normalise inputs ────────────────────────────────────────────────────
  const prev = typeof previousCrop === 'string' ? previousCrop.trim().toLowerCase() : '';
  const pred = typeof predictedCrop === 'string' ? predictedCrop.trim().toLowerCase() : '';

  // ── 2. Build lookup map from the matrix (keyed by crop_name) ─────────────
  const lookup = new Map();
  for (const entry of matrix) {
    lookup.set(entry.crop_name.toLowerCase(), entry);
  }

  // ── 3. Branch: no previous crop ───────────────────────────────────────────
  if (!prev) {
    return {
      has_rotation_data: false,
      status:            'no_history',
      is_perennial:      false,
      title:             null,
      message:           null,
      recommended_crops: null,
      rationale:         null,
      nitrogen_effect:   null,
    };
  }

  // ── 4. Branch: previous crop not found in matrix ──────────────────────────
  const previousEntry = lookup.get(prev);
  if (!previousEntry) {
    return {
      has_rotation_data: false,
      status:            'no_data',
      is_perennial:      false,
      title:             null,
      message:           null,
      recommended_crops: null,
      rationale:         null,
      nitrogen_effect:   null,
    };
  }

  // Look up the predicted crop entry (may be undefined if not in matrix)
  const predictedEntry = lookup.get(pred);

  // ── 5. Branch: either crop is perennial ──────────────────────────────────
  const eitherPerennial =
    previousEntry.is_perennial === true ||
    (predictedEntry && predictedEntry.is_perennial === true);

  if (eitherPerennial) {
    return {
      has_rotation_data: true,
      status:            'perennial',
      is_perennial:      true,
      title:             'Perennial Crop',
      message:
        'Perennial orchard/plantation crop. Single-season annual rotation rules are not applicable.',
      recommended_crops: null,
      rationale:         null,
      nitrogen_effect:   null,
    };
  }

  // ── 6. Branch: same crop repeated AND rotation is applicable ─────────────
  if (prev === pred && previousEntry.rotation_applicable) {
    return {
      has_rotation_data: true,
      status:            'warning',
      is_perennial:      false,
      title:             'Continuous Cropping Risk Detected',
      message:           previousEntry.avoid_repeat_reason,
      recommended_crops: previousEntry.recommended_next_crops,
      rationale:         previousEntry.rationale,
      nitrogen_effect:   previousEntry.nitrogen_effect,
    };
  }

  // ── 7. Branch: predicted crop is in the recommended list ──────────────────
  if (
    Array.isArray(previousEntry.recommended_next_crops) &&
    previousEntry.recommended_next_crops.includes(pred)
  ) {
    return {
      has_rotation_data: true,
      status:            'success',
      is_perennial:      false,
      title:             'Scientifically Recommended Rotation',
      message:           null,
      recommended_crops: previousEntry.recommended_next_crops,
      rationale:         previousEntry.rationale,
      nitrogen_effect:   previousEntry.nitrogen_effect,
    };
  }

  // ── 8. Branch: neutral — predicted crop is neither recommended nor the same
  return {
    has_rotation_data: true,
    status:            'neutral',
    is_perennial:      false,
    title:             'Rotation Advisory',
    message:
      'Consider rotating with a recommended crop for better soil health next season.',
    recommended_crops: previousEntry.recommended_next_crops,
    rationale:         previousEntry.rationale,
    nitrogen_effect:   previousEntry.nitrogen_effect,
  };
}

module.exports = { evaluateRotation };
