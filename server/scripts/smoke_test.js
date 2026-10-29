'use strict';
/**
 * server/scripts/smoke_test.js  —  AgriSense API smoke test
 * ==========================================================
 * Fires minimal HTTP requests at key endpoints and reports pass/fail:
 *   1. Health check (GET /api/health)
 *   2. ML recommend with rice row (crop, confident=true, top3 length=3, SHAP non-null & non-zero)
 *   3. Rice economics check (MSP 2441, roi_available=false)
 *   4. Low-confidence input (confident=false)
 *   5. Cotton with previousCrop "cotton" (status="warning")
 *   6. Persona 1: Marginal farmer (<2.5 acres, no exclusions, PM-KISAN present, sorted desc)
 *   7. Persona 2: Small farmer (3.0 acres, tax payer exclusion, PM-KISAN absent)
 *   8. Persona 3: General farmer (6.0 acres, SC/ST priority group, SMAM slab benefit=80)
 *   9. Persona 4: General farmer (8.0 acres, govt employee exclusion, no priority groups: category general, PM-KISAN absent, SMAM benefit=50)
 *
 * Requirements:
 *   - Express server (port 5000) and FastAPI ML service (port 8001) must both be running
 *     for the full smoke test.
 *   - If the ML service is unreachable, ML checks FAIL and the script exits non-zero,
 *     unless SKIP_ML=1 is set.
 *   - A check must never be reported PASS if it did not run.
 *
 * Usage:
 *   node server/scripts/smoke_test.js
 *   BASE_URL=http://localhost:5001 node server/scripts/smoke_test.js
 *   SKIP_ML=1 node server/scripts/smoke_test.js
 */

const http  = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SKIP_ML  = process.env.SKIP_ML === '1' || process.env.SKIP_ML === 'true';

let passed  = 0;
let failed  = 0;
let skipped = 0;

/**
 * Minimal HTTP/HTTPS request helper.
 * Returns { status, body } or { status: 0, error } on network failure.
 */
function request(method, urlPath, body) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(urlPath, BASE_URL);
    } catch (err) {
      return resolve({ status: 0, error: err.message, body: null });
    }
    const lib     = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname : url.hostname,
      port     : url.port || (url.protocol === 'https:' ? 443 : 80),
      path     : url.pathname + url.search,
      method,
      headers  : {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end',  ()      => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message, body: null }));
    if (payload) req.write(payload);
    req.end();
  });
}

/** Simple assertion helper. */
function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}  (expected ${expected}, got ${actual})`);
    failed++;
  }
}

/** Record a skipped check. Never increments passed. */
function skip(label, reason) {
  console.log(`  ⏭️   [SKIPPED] ${label}${reason ? ` (${reason})` : ''}`);
  skipped++;
}

/** Check if array of schemes is sorted by computed_benefit descending with nulls last. */
function isSortedByBenefit(schemes) {
  if (!Array.isArray(schemes) || schemes.length === 0) return false;
  let seenNull = false;
  let prev = Infinity;
  for (const s of schemes) {
    const b = s.computed_benefit;
    if (b === null || b === undefined) {
      seenNull = true;
    } else {
      if (seenNull) return false;
      if (b > prev) return false;
      prev = b;
    }
  }
  return true;
}

async function run() {
  console.log(`\nAgriSense smoke test  →  ${BASE_URL}`);
  if (SKIP_ML) {
    console.log('  ⚠️  SKIP_ML=1 set — ML endpoints will be skipped.\n');
  } else {
    console.log('  ℹ  Full suite: Express (port 5000) and FastAPI (port 8001) required.\n');
  }

  // ── 1. Health check ──────────────────────────────────────────────────────────
  console.log('── 1. GET /api/health ──');
  const health = await request('GET', '/api/health');
  check('Health endpoint returns status 200', health.status, 200);
  let parsedHealth = null;
  try { parsedHealth = JSON.parse(health.body); } catch (_) {}
  check('Health response has success: true', parsedHealth && parsedHealth.success === true, true);

  // ── 2. ML recommend — Rice row (high confidence) ─────────────────────────────
  console.log('\n── 2. POST /api/crop/ml-recommend (Rice row) ──');
  const ricePayload = {
    N: 90.0,
    P: 42.0,
    K: 43.0,
    temperature: 20.87,
    humidity: 82.0,
    ph: 6.5,
    rainfall: 202.93,
  };

  if (SKIP_ML) {
    skip('Rice row status 200');
    skip('Rice row crop === "rice"');
    skip('Rice row confident === true');
    skip('Rice row top3 length === 3');
    skip('Rice row SHAP explanation non-null and not all zeros');
    skip('Rice economics MSP === 2441');
    skip('Rice economics roi_available === false');
  } else {
    const res = await request('POST', '/api/crop/ml-recommend', ricePayload);
    check('Rice recommendation returns status 200', res.status, 200);

    let parsed = null;
    try { parsed = JSON.parse(res.body); } catch (_) {}
    const data = parsed && parsed.data;

    check('Rice response has success: true', parsed && parsed.success === true, true);
    check('Predicted crop is "rice"', data && data.crop, 'rice');
    check('Prediction is confident (confident: true)', data && data.confident, true);
    check('top3 is an array of length 3', Boolean(data && Array.isArray(data.top3) && data.top3.length === 3), true);

    const hasShap = Boolean(data && data.shap_explanation && typeof data.shap_explanation === 'object');
    const shapNonZero = hasShap && Object.values(data.shap_explanation).some((v) => typeof v === 'number' && v !== 0);
    check('SHAP explanation is non-null', hasShap, true);
    check('SHAP explanation values are not all zeros', shapNonZero, true);

    // ── 3. Rice economics check ────────────────────────────────────────────────
    console.log('\n── 3. Rice economics check (MSP 2441, roi_available false) ──');
    const econ = data && data.economics && data.economics.predicted_crop;
    check('Economics predicted_crop block present', Boolean(econ), true);
    check('Rice MSP is 2441 INR/quintal', econ && econ.msp_inr_per_quintal, 2441);
    check('Rice roi_available is false (missing yield/cost data)', econ && econ.roi_available, false);
  }

  // ── 4. ML recommend — Low-confidence input ───────────────────────────────────
  console.log('\n── 4. POST /api/crop/ml-recommend (Low-confidence input) ──');
  const lowConfPayload = {
    N: 1.0,
    P: 1.0,
    K: 1.0,
    temperature: 25.0,
    humidity: 50.0,
    ph: 7.0,
    rainfall: 100.0,
  };

  if (SKIP_ML) {
    skip('Low-confidence status 200');
    skip('Low-confidence confident === false');
  } else {
    const res = await request('POST', '/api/crop/ml-recommend', lowConfPayload);
    check('Low-confidence request returns status 200', res.status, 200);

    let parsed = null;
    try { parsed = JSON.parse(res.body); } catch (_) {}
    const data = parsed && parsed.data;

    check('Low-confidence prediction has confident: false', data && data.confident, false);
  }

  // ── 5. Rotation advisory — Cotton repeat warning ─────────────────────────────
  console.log('\n── 5. POST /api/crop/ml-recommend (Cotton with previousCrop "cotton") ──');
  const cottonPayload = {
    N: 133.0,
    P: 47.0,
    K: 24.0,
    temperature: 24.4,
    humidity: 79.2,
    ph: 7.2,
    rainfall: 90.8,
    previousCrop: 'cotton',
  };

  if (SKIP_ML) {
    skip('Cotton status 200');
    skip('Predicted crop is "cotton"');
    skip('rotation_advisory.status === "warning"');
  } else {
    const res = await request('POST', '/api/crop/ml-recommend', cottonPayload);
    check('Cotton request returns status 200', res.status, 200);

    let parsed = null;
    try { parsed = JSON.parse(res.body); } catch (_) {}
    const data = parsed && parsed.data;

    check('Predicted crop is "cotton"', data && data.crop, 'cotton');
    check(
      'rotation_advisory status is "warning" on repeated crop',
      data && data.rotation_advisory && data.rotation_advisory.status,
      'warning'
    );
  }

  // ── 6. Scheme persona 1: Marginal farmer (< 2.5 acres, no exclusions) ────────
  console.log('\n── 6. POST /api/schemes/match (Persona 1: Marginal farmer, 1.5 acres) ──');
  const p1Res = await request('POST', '/api/schemes/match', { landSizeAcres: 1.5 });
  check('Persona 1 returns status 200', p1Res.status, 200);
  let p1Data = null;
  try { p1Data = JSON.parse(p1Res.body); } catch (_) {}
  check('Persona 1 category is "marginal"', p1Data && p1Data.category, 'marginal');
  check('Persona 1 totalMatched >= 2', Boolean(p1Data && p1Data.totalMatched >= 2), true);
  check(
    'Persona 1 includes PM-KISAN',
    Boolean(p1Data && Array.isArray(p1Data.matchedSchemes) && p1Data.matchedSchemes.some((s) => s.short_code === 'PM-KISAN')),
    true
  );
  check(
    'Persona 1 schemes sorted by computed_benefit desc (nulls last)',
    Boolean(p1Data && isSortedByBenefit(p1Data.matchedSchemes)),
    true
  );

  // ── 7. Scheme persona 2: Small farmer with tax payer exclusion ───────────────
  console.log('\n── 7. POST /api/schemes/match (Persona 2: Small farmer, tax payer exclusion) ──');
  const p2Res = await request('POST', '/api/schemes/match', {
    landSizeAcres: 3.0,
    exclusionFlags: { isIncomeTaxPayer: true },
  });
  check('Persona 2 returns status 200', p2Res.status, 200);
  let p2Data = null;
  try { p2Data = JSON.parse(p2Res.body); } catch (_) {}
  check('Persona 2 category is "small"', p2Data && p2Data.category, 'small');
  check(
    'Persona 2 excludes PM-KISAN due to tax payer flag',
    Boolean(p2Data && Array.isArray(p2Data.matchedSchemes) && !p2Data.matchedSchemes.some((s) => s.short_code === 'PM-KISAN')),
    true
  );
  check('Persona 2 has remaining matched schemes (totalMatched >= 1)', Boolean(p2Data && p2Data.totalMatched >= 1), true);

  // ── 8. Scheme persona 3: General farmer with SC/ST priority group ────────────
  console.log('\n── 8. POST /api/schemes/match (Persona 3: General farmer, SC/ST priority) ──');
  const p3Res = await request('POST', '/api/schemes/match', {
    landSizeAcres: 6.0,
    priorityGroups: ['sc_st'],
  });
  check('Persona 3 returns status 200', p3Res.status, 200);
  let p3Data = null;
  try { p3Data = JSON.parse(p3Res.body); } catch (_) {}
  check('Persona 3 category is "general"', p3Data && p3Data.category, 'general');
  const smamScheme = p3Data && Array.isArray(p3Data.matchedSchemes) && p3Data.matchedSchemes.find((s) => s.short_code === 'SMAM');
  check('Persona 3 includes SMAM scheme', Boolean(smamScheme), true);
  check('Persona 3 SMAM computed_benefit is 80 (higher slab for SC/ST)', smamScheme && smamScheme.computed_benefit, 80);

  // ── 9. Scheme persona 4: General farmer with govt employee exclusion ────────
  console.log('\n── 9. POST /api/schemes/match (Persona 4: General farmer, govt employee exclusion) ──');
  const p4Res = await request('POST', '/api/schemes/match', {
    landSizeAcres: 8.0,
    exclusionFlags: { isGovtEmployee: true },
    priorityGroups: [],
  });
  check('Persona 4 returns status 200', p4Res.status, 200);
  let p4Data = null;
  try { p4Data = JSON.parse(p4Res.body); } catch (_) {}
  check('Persona 4 category is "general"', p4Data && p4Data.category, 'general');
  check(
    'Persona 4 excludes PM-KISAN due to govt employee flag',
    Boolean(p4Data && Array.isArray(p4Data.matchedSchemes) && !p4Data.matchedSchemes.some((s) => s.short_code === 'PM-KISAN')),
    true
  );
  const smam4Scheme = p4Data && Array.isArray(p4Data.matchedSchemes) && p4Data.matchedSchemes.find((s) => s.short_code === 'SMAM');
  check('Persona 4 includes SMAM scheme', Boolean(smam4Scheme), true);
  check('Persona 4 SMAM computed_benefit is 50 (general category, no priority)', smam4Scheme && smam4Scheme.computed_benefit, 50);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Smoke test summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  if (failed > 0) {
    console.error(`Status: FAILED (${failed} check(s) failed)\n`);
    process.exit(1);
  } else {
    console.log('Status: ALL CHECKS PASSED ✅\n');
  }
}

run();
