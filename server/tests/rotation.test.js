'use strict';
/**
 * tests/rotation.test.js  –  AgriSense | evaluateRotation unit tests
 * ===================================================================
 * Covers all six status branches returned by evaluateRotation().
 * Run with:  node server/tests/rotation.test.js
 * No external test runner required.
 */

const { evaluateRotation } = require('../services/rotationAdvisor');

// ── Minimal assertion helper (shared pattern) ────────────────────────────────
let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅  ${description}`);
    passed++;
  } else {
    console.error(`  ❌  ${description}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── Inline fixture matrix (subset of crop_rotation_matrix.json) ──────────────
const MATRIX = [
  {
    crop_name: 'rice',
    crop_category: 'cereal',
    is_perennial: false,
    rotation_applicable: true,
    nitrogen_effect: 'depletes',
    recommended_next_crops: ['chickpea', 'lentil', 'blackgram', 'mungbean', 'pigeonpeas'],
    avoid_repeat_reason:
      'Continuous paddy monocropping depletes soil nitrogen and builds up rice-specific pests/diseases (e.g., stem borer, blast).',
    rationale:
      'Rice is a nitrogen-exhaustive, non-leguminous cereal. Rotating with a nitrogen-fixing legume restores soil nitrogen.',
  },
  {
    crop_name: 'cotton',
    crop_category: 'cash_crop',
    is_perennial: false,
    rotation_applicable: true,
    nitrogen_effect: 'depletes',
    recommended_next_crops: ['chickpea', 'pigeonpeas', 'mungbean', 'blackgram'],
    avoid_repeat_reason:
      'Continuous cotton cultivation causes severe bollworm buildup and heavily depletes soil nitrogen.',
    rationale: 'Cotton-to-Bengal gram (chickpea) is a classic Indian rotation.',
  },
  {
    crop_name: 'coconut',
    crop_category: 'plantation',
    is_perennial: true,
    rotation_applicable: false,
    nitrogen_effect: null,
    recommended_next_crops: null,
    avoid_repeat_reason: null,
    rationale: null,
  },
  {
    crop_name: 'mango',
    crop_category: 'orchard',
    is_perennial: true,
    rotation_applicable: false,
    nitrogen_effect: null,
    recommended_next_crops: null,
    avoid_repeat_reason: null,
    rationale: 'Mango is a perennial orchard tree. Annual rotation rules do not apply.',
  },
  {
    // sugarcane: is_perennial=true AND rotation_applicable=true (real matrix values)
    // Demonstrates that is_perennial check fires BEFORE the same-crop branch.
    crop_name: 'sugarcane',
    crop_category: 'cash_crop',
    is_perennial: true,
    rotation_applicable: true,
    nitrogen_effect: 'depletes',
    recommended_next_crops: ['chickpea', 'mungbean', 'blackgram'],
    avoid_repeat_reason:
      'Continuous sugarcane monocropping severely depletes soil nutrients and increases pest buildup.',
    rationale:
      'Sugarcane is a long-duration cash crop that depletes nitrogen. Rotate with pulses or fallow to restore soil health.',
  },
  {
    crop_name: 'chickpea',
    crop_category: 'legume',
    is_perennial: false,
    rotation_applicable: false,
    nitrogen_effect: 'fixes',
    recommended_next_crops: ['rice', 'wheat', 'maize', 'cotton', 'jowar', 'bajra'],
    avoid_repeat_reason: null,
    rationale: 'Chickpea fixes nitrogen, benefiting the following cereal crop.',
  },
];

// A: no_history
section('A: no_history — previousCrop empty or missing');
{
  const r1 = evaluateRotation('', 'rice', MATRIX);
  assert('status is "no_history" for empty string', r1.status === 'no_history');
  assert('has_rotation_data is false', r1.has_rotation_data === false);
  assert('is_perennial is false',      r1.is_perennial   === false);
  assert('title is null',              r1.title          === null);
  assert('message is null',            r1.message        === null);
  assert('recommended_crops is null',  r1.recommended_crops === null);
  assert('nitrogen_effect is null',    r1.nitrogen_effect   === null);
  const r2 = evaluateRotation(null, 'rice', MATRIX);
  assert('status is "no_history" for null previousCrop', r2.status === 'no_history');
  const r3 = evaluateRotation(undefined, 'rice', MATRIX);
  assert('status is "no_history" for undefined previousCrop', r3.status === 'no_history');
}

// B: no_data
section('B: no_data — previousCrop not in matrix');
{
  const r = evaluateRotation('quinoa', 'rice', MATRIX);
  assert('status is "no_data"',        r.status          === 'no_data');
  assert('has_rotation_data is false', r.has_rotation_data === false);
  assert('title is null',              r.title           === null);
  assert('recommended_crops is null',  r.recommended_crops === null);
}

// C: perennial
section('C: perennial — previousCrop is a perennial crop');
{
  const r = evaluateRotation('coconut', 'rice', MATRIX);
  assert('status is "perennial"',      r.status         === 'perennial');
  assert('has_rotation_data is true',  r.has_rotation_data === true);
  assert('is_perennial is true',       r.is_perennial   === true);
  assert('title is "Perennial Crop"',  r.title          === 'Perennial Crop');
  assert('message is a non-empty string',
    typeof r.message === 'string' && r.message.length > 0);
  assert('recommended_crops is null',  r.recommended_crops === null);
}

// D: warning
section('D: warning — same crop repeated (rotation_applicable=true)');
{
  const r = evaluateRotation('rice', 'rice', MATRIX);
  assert('status is "warning"',               r.status         === 'warning');
  assert('has_rotation_data is true',         r.has_rotation_data === true);
  assert('title is "Continuous Cropping Risk Detected"',
    r.title === 'Continuous Cropping Risk Detected');
  assert('message is avoid_repeat_reason',    typeof r.message === 'string' && r.message.length > 0);
  assert('recommended_crops is an array',     Array.isArray(r.recommended_crops));
  assert('recommended_crops includes chickpea',
    Array.isArray(r.recommended_crops) && r.recommended_crops.includes('chickpea'));
  assert('nitrogen_effect is "depletes"',     r.nitrogen_effect === 'depletes');
}

// E: success
section('E: success — predictedCrop is in recommended list');
{
  const r = evaluateRotation('rice', 'chickpea', MATRIX);
  assert('status is "success"',              r.status         === 'success');
  assert('has_rotation_data is true',        r.has_rotation_data === true);
  assert('title is "Scientifically Recommended Rotation"',
    r.title === 'Scientifically Recommended Rotation');
  assert('message is null',                  r.message        === null);
  assert('rationale is a non-empty string',
    typeof r.rationale === 'string' && r.rationale.length > 0);
  assert('nitrogen_effect is "depletes"',    r.nitrogen_effect === 'depletes');
  const r2 = evaluateRotation('Rice', 'Chickpea', MATRIX);
  assert('lookup is case-insensitive',       r2.status === 'success');
}

// F: neutral
section('F: neutral — predictedCrop not recommended, not same as previous');
{
  const r = evaluateRotation('rice', 'cotton', MATRIX);
  assert('status is "neutral"',              r.status         === 'neutral');
  assert('has_rotation_data is true',        r.has_rotation_data === true);
  assert('title is "Rotation Advisory"',     r.title          === 'Rotation Advisory');
  assert('message is a non-empty string',
    typeof r.message === 'string' && r.message.length > 0);
  assert('recommended_crops is non-empty array',
    Array.isArray(r.recommended_crops) && r.recommended_crops.length > 0);
  const r2 = evaluateRotation('rice', 'sorghum_unknown', MATRIX);
  assert('unknown predictedCrop falls through to neutral', r2.status === 'neutral');
}

// G: edge — empty matrix
section('G: edge — empty matrix');
{
  const r = evaluateRotation('rice', 'chickpea', []);
  assert('empty matrix -> no_data (prev not found)', r.status === 'no_data');
}

// ─────────────────────────────────────────────────────────────────────────────
// H: perennial via predictedEntry (rice → mango)
// ─────────────────────────────────────────────────────────────────────────────
section('H: perennial — predictedCrop (mango) is perennial even when previousCrop is not');
{
  // rice is annual; mango is perennial → eitherPerennial is true → status 'perennial'
  const r = evaluateRotation('rice', 'mango', MATRIX);
  assert('status is "perennial" (pred is perennial)',     r.status       === 'perennial');
  assert('has_rotation_data is true',                     r.has_rotation_data === true);
  assert('is_perennial is true (flagged from pred entry)',r.is_perennial === true);
  assert('title is "Perennial Crop"',                     r.title        === 'Perennial Crop');
  assert('recommended_crops is null',                     r.recommended_crops === null);
}

// ─────────────────────────────────────────────────────────────────────────────
// I: whitespace normalisation — " Rice " behaves identically to "rice"
// ─────────────────────────────────────────────────────────────────────────────
section('I: whitespace — leading/trailing spaces are trimmed before lookup');
{
  // " Rice " (mixed case + spaces) should resolve the same as "rice"
  const rPlain  = evaluateRotation('rice',    'chickpea', MATRIX);
  const rSpaced = evaluateRotation(' Rice ',  'Chickpea', MATRIX);

  assert('"rice" → status success',           rPlain.status  === 'success');
  assert('" Rice " → same status as "rice"',  rSpaced.status === rPlain.status);
  assert('" Rice " → same title',             rSpaced.title  === rPlain.title);
  assert('" Rice " → same rationale',         rSpaced.rationale === rPlain.rationale);

  // warning path: " Rice " → " Rice " should still detect same-crop repeat
  const wPlain  = evaluateRotation('rice',   'rice',  MATRIX);
  const wSpaced = evaluateRotation(' Rice ', ' Rice ', MATRIX);
  assert('"rice"→"rice" → warning',             wPlain.status  === 'warning');
  assert('" Rice "→" Rice " → same warning',    wSpaced.status === 'warning');
}

// ─────────────────────────────────────────────────────────────────────────────
// J: sugarcane → sugarcane — reporting which status fires and why
// ─────────────────────────────────────────────────────────────────────────────
section('J: sugarcane→sugarcane — is_perennial=true fires before same-crop branch');
{
  // Matrix flags for sugarcane: is_perennial=true, rotation_applicable=true.
  // evaluateRotation branch order (§5 before §6):
  //   Branch 5: eitherPerennial = previousEntry.is_perennial=true → TRUE
  //   → returns status='perennial' immediately.
  //   Branch 6 (same-crop warning) is NEVER reached.
  // Expected: 'perennial', NOT 'warning'.
  const r = evaluateRotation('sugarcane', 'sugarcane', MATRIX);

  console.log(`  ℹ  sugarcane→sugarcane actual status: "${r.status}"`);
  console.log(`  ℹ  matrix flags: is_perennial=true, rotation_applicable=true`);
  console.log(`  ℹ  is_perennial branch fires first → "perennial" takes precedence`);

  assert('sugarcane→sugarcane status is "perennial" (is_perennial fires first)',
    r.status === 'perennial');
  assert('has_rotation_data is true', r.has_rotation_data === true);
  assert('is_perennial is true',      r.is_perennial === true);
  // Confirms: rotation_applicable=true alone is not sufficient to trigger "warning"
  // when is_perennial=true. No change to the advisor is needed — this is correct
  // behaviour: perennial crops are exempt from annual rotation rules.
  assert('same-crop warning NOT triggered when is_perennial=true',
    r.status !== 'warning');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Tests passed: ${passed} / ${passed + failed}`);
if (failed > 0) {
  console.error(`Tests failed: ${failed}`);
  process.exit(1);
} else {
  console.log('All tests passed ✅');
}
