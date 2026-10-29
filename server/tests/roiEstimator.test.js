'use strict';
/**
 * tests/roiEstimator.test.js  –  AgriSense | roiEstimator unit tests
 * ===================================================================
 * Same runner pattern as schemeMatcher.test.js — no external test runner.
 * Run with:  node server/tests/roiEstimator.test.js
 */

const path = require('path');
const { computeEconomics, rankCrops } = require('../services/roiEstimator');

// ── Minimal assertion helper (shared pattern with schemeMatcher.test.js) ──────
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

function assertClose(description, actual, expected, tol = 0.0001) {
  const ok = Math.abs(actual - expected) <= tol;
  if (ok) {
    console.log(`  ✅  ${description}  (got ${actual})`);
    passed++;
  } else {
    console.error(`  ❌  ${description}  (expected ${expected}, got ${actual})`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Worked example: rice
//   msp   = 2183 INR/quintal
//   yield = 25.0 qtl/ha
//   A2+FL = 35083
//   C2    = 49380
//
//   revenue   = 25.0 * 2183 = 54575
//   net_a2fl  = 54575 - 35083 = 19492
//   net_c2    = 54575 - 49380 = 5195
//   roi_a2fl  = 19492 / 35083 * 100 ≈ 55.5597…
//   roi_c2    =  5195 / 49380 * 100 ≈ 10.5205…
// ─────────────────────────────────────────────────────────────────────────────
section('A: computeEconomics — worked example (rice)');
{
  const rice = {
    crop_name             : 'rice',
    season                : 'kharif',
    msp_inr_per_quintal   : 2183,
    yield_qtl_per_ha      : 25.0,
    cost_a2_fl_inr_per_ha : 35083,
    cost_c2_inr_per_ha    : 49380,
  };
  const r = computeEconomics(rice);

  const expectedRevenue  = 25.0 * 2183;                     // 54575
  const expectedNetA2fl  = expectedRevenue - 35083;          // 19492
  const expectedNetC2    = expectedRevenue - 49380;          // 5195
  const expectedRoiA2fl  = (expectedNetA2fl / 35083) * 100;
  const expectedRoiC2    = (expectedNetC2   / 49380) * 100;

  assert('crop_name is "rice"',          r.crop_name === 'rice');
  assert('season is "kharif"',           r.season  === 'kharif');
  assertClose('revenue_per_ha',          r.revenue_per_ha,  expectedRevenue);
  assertClose('net_return_a2fl',         r.net_return_a2fl, expectedNetA2fl);
  assertClose('net_return_c2',           r.net_return_c2,   expectedNetC2);
  assertClose('roi_pct_a2fl',            r.roi_pct_a2fl,    expectedRoiA2fl, 0.001);
  assertClose('roi_pct_c2',             r.roi_pct_c2,       expectedRoiC2,   0.001);
  assert('roi_available is true',        r.roi_available === true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Null handling — all four null patterns
// ─────────────────────────────────────────────────────────────────────────────
section('B: computeEconomics — null handling');
{
  // B1: MSP null → revenue, both nets, both ROIs null; roi_available false
  const b1 = computeEconomics({
    crop_name: 'x', season: 'kharif',
    msp_inr_per_quintal: null, yield_qtl_per_ha: 25,
    cost_a2_fl_inr_per_ha: 35000, cost_c2_inr_per_ha: 50000,
  });
  assert('B1 revenue_per_ha null when MSP null',    b1.revenue_per_ha   === null);
  assert('B1 net_return_a2fl null when MSP null',   b1.net_return_a2fl  === null);
  assert('B1 net_return_c2 null when MSP null',     b1.net_return_c2    === null);
  assert('B1 roi_pct_a2fl null when MSP null',      b1.roi_pct_a2fl     === null);
  assert('B1 roi_pct_c2 null when MSP null',        b1.roi_pct_c2       === null);
  // roi_available: MSP is null → all four inputs not non-null → roi_available false
  assert('B1 roi_available false (MSP null → roi unavailable)', b1.roi_available === false);

  // B2: yield null → revenue null (even if MSP is valid)
  const b2 = computeEconomics({
    crop_name: 'x', season: 'kharif',
    msp_inr_per_quintal: 2000, yield_qtl_per_ha: null,
    cost_a2_fl_inr_per_ha: 35000, cost_c2_inr_per_ha: 50000,
  });
  assert('B2 revenue_per_ha null when yield null',   b2.revenue_per_ha   === null);
  assert('B2 roi_available false when yield null',   b2.roi_available    === false);

  // B3: A2+FL cost null → net_return_a2fl null, roi_pct_a2fl null; C2 still computable
  const b3 = computeEconomics({
    crop_name: 'x', season: 'kharif',
    msp_inr_per_quintal: 2000, yield_qtl_per_ha: 20,
    cost_a2_fl_inr_per_ha: null, cost_c2_inr_per_ha: 40000,
  });
  assert('B3 revenue_per_ha = 40000',                b3.revenue_per_ha    === 40000);
  assert('B3 net_return_a2fl null when cost null',   b3.net_return_a2fl   === null);
  assert('B3 roi_pct_a2fl null when cost null',      b3.roi_pct_a2fl      === null);
  assertClose('B3 net_return_c2 = 0',                b3.net_return_c2,     0);
  assert('B3 roi_available false when A2+FL null',   b3.roi_available     === false);

  // B4: C2 cost null → roi_pct_c2 null; A2+FL still computable
  const b4 = computeEconomics({
    crop_name: 'x', season: 'rabi',
    msp_inr_per_quintal: 2000, yield_qtl_per_ha: 20,
    cost_a2_fl_inr_per_ha: 30000, cost_c2_inr_per_ha: null,
  });
  assertClose('B4 net_return_a2fl = 10000',          b4.net_return_a2fl,  10000);
  assert('B4 roi_pct_c2 null when C2 null',          b4.roi_pct_c2        === null);
  assert('B4 roi_available false when C2 null',      b4.roi_available     === false);

  // B5: all nulls
  const b5 = computeEconomics({
    crop_name: 'x', season: 'kharif',
    msp_inr_per_quintal: null, yield_qtl_per_ha: null,
    cost_a2_fl_inr_per_ha: null, cost_c2_inr_per_ha: null,
  });
  assert('B5 all computed fields null',
    b5.revenue_per_ha === null &&
    b5.net_return_a2fl === null &&
    b5.net_return_c2 === null &&
    b5.roi_pct_a2fl === null &&
    b5.roi_pct_c2 === null
  );
  assert('B5 roi_available false', b5.roi_available === false);
}

// ─────────────────────────────────────────────────────────────────────────────
// rankCrops — ordering and unranked list
// ─────────────────────────────────────────────────────────────────────────────
section('C: rankCrops — ordering and unranked list');
{
  // Three crops: two rankable (different net_return_a2fl), one with null costs
  const fixtures = [
    {
      crop_name: 'wheat', season: 'rabi',
      msp_inr_per_quintal: 2275, yield_qtl_per_ha: 34.9,
      cost_a2_fl_inr_per_ha: 31960, cost_c2_inr_per_ha: 52616,
      // revenue = 79397.5; net_a2fl = 47437.5 ← highest
    },
    {
      crop_name: 'chickpea', season: 'rabi',
      msp_inr_per_quintal: 5440, yield_qtl_per_ha: 10.9,
      cost_a2_fl_inr_per_ha: 30780, cost_c2_inr_per_ha: 44374,
      // revenue = 59296; net_a2fl = 28516
    },
    {
      crop_name: 'coffee', season: 'kharif',
      msp_inr_per_quintal: null, yield_qtl_per_ha: null,
      cost_a2_fl_inr_per_ha: null, cost_c2_inr_per_ha: null,
      // no data
    },
  ];

  const { ranked, unranked } = rankCrops(['wheat', 'chickpea', 'coffee'], fixtures);

  assert('ranked has 2 entries',        ranked.length  === 2);
  assert('unranked has 1 entry',        unranked.length === 1);
  assert('ranked[0] is wheat (highest net_a2fl)',  ranked[0].crop_name === 'wheat');
  assert('ranked[1] is chickpea',       ranked[1].crop_name === 'chickpea');
  assert('ranked is sorted descending',
    ranked[0].net_return_a2fl > ranked[1].net_return_a2fl
  );
  assert('unranked[0] crop_name is coffee',  unranked[0].crop_name === 'coffee');
  assert('unranked[0] has reason field',typeof unranked[0].reason === 'string' && unranked[0].reason.length > 0);
  assert('unranked reason text correct', unranked[0].reason === 'No official cost or yield data');
}

section('C2: rankCrops — empty and null inputs');
{
  const fixtures = [{ crop_name: 'rice', season: 'kharif', msp_inr_per_quintal: 2183, yield_qtl_per_ha: 25, cost_a2_fl_inr_per_ha: 35083, cost_c2_inr_per_ha: 49380 }];

  // empty array
  const r1 = rankCrops([], fixtures);
  assert('empty names → ranked empty',   r1.ranked.length   === 0);
  assert('empty names → unranked empty', r1.unranked.length === 0);

  // null input
  const r2 = rankCrops(null, fixtures);
  assert('null names → ranked empty',    r2.ranked.length   === 0);
  assert('null names → unranked empty',  r2.unranked.length === 0);

  // crop name not in economics data
  const r3 = rankCrops(['quinoa'], fixtures);
  assert('unknown crop → 0 ranked',      r3.ranked.length   === 0);
  assert('unknown crop → 1 unranked',    r3.unranked.length === 1);
  assert('unknown crop unranked reason', r3.unranked[0].reason === 'No official cost or yield data');
}

// ─────────────────────────────────────────────────────────────────────────────
// Missing-file case — simulate what the controller does when the JSON file
// cannot be loaded (economics = undefined → omitted from response)
// ─────────────────────────────────────────────────────────────────────────────
section('D: missing-file fallback (controller simulation)');
{
  // Simulate the module-level try/catch in mlCropController.js
  function loadEconomics(filePath) {
    const fs   = require('fs');
    let _economics = null;
    try {
      _economics = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      // file not found — _economics stays null
    }
    return _economics;
  }

  const nonExistent = path.join(__dirname, '..', 'Data', 'does_not_exist.json');
  const result = loadEconomics(nonExistent);
  assert('_economics is null when file missing', result === null);

  // When _economics is null, economics variable is undefined → not added to response
  let _economics = null;
  let economics;   // intentionally undefined
  if (_economics !== null) {
    economics = { predicted_crop: null, rotation_options: {}, basis_note: '' };
  }
  assert('economics key absent when _economics null',  economics === undefined);

  const responseData =
    economics !== undefined
      ? { crop: 'rice', economics }
      : { crop: 'rice' };
  assert('"economics" absent from response when file missing',
    !Object.prototype.hasOwnProperty.call(responseData, 'economics')
  );

  // Verify real file loads correctly
  const realPath = path.join(__dirname, '..', 'Data', 'crop_economics.json');
  const real = loadEconomics(realPath);
  assert('crop_economics.json loads and is an array', Array.isArray(real));
  assert('crop_economics.json has at least 12 entries and no duplicate crop_name',
    real && real.length >= 12 && new Set(real.map(e => e.crop_name)).size === real.length
  );
  assert('each entry has a "crop_name" string field',
    real && real.every(e => typeof e.crop_name === 'string' && e.crop_name.length > 0)
  );
  assert('each entry has a "season" field',
    real && real.every(e => typeof e.season === 'string')
  );
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
