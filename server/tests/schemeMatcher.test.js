'use strict';
/**
 * Manual test script for schemeMatcher.js
 * Run with: node server/tests/schemeMatcher.test.js
 * No external test runner required.
 */

const path = require('path');
const fs   = require('fs');
const { matchSchemes, deriveCategory } = require('../services/schemeMatcher');

// ── Load fixture data ─────────────────────────────────────────────────────────
const SCHEMES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'Data', 'govt_schemes.json'), 'utf8')
);

// ── Minimal assertion helper ─────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Test A: 1.5-acre farmer, no exclusions, no specific crop → multiple matches
// ─────────────────────────────────────────────────────────────────────────────
section('A: 1.5-acre marginal farmer — no exclusions, no crop filter');
{
  const category = deriveCategory(1.5);
  assert('deriveCategory(1.5) === "marginal"', category === 'marginal');

  const profile = {
    category,
    priorityGroups: [],
    currentCrop:    '',
    exclusionFlags: {},
  };

  const results = matchSchemes(profile, SCHEMES);
  assert('Returns at least 2 matched schemes', results.length >= 2);
  assert('PM-KISAN is present (no exclusions)', results.some(s => s.short_code === 'PM-KISAN'));
  assert(
    'Results are sorted: computed_benefit desc, nulls last',
    (() => {
      let prevBenefit = Infinity;
      for (const r of results) {
        if (r.computed_benefit === null) {
          // Once we hit nulls, everything after should also be null
          prevBenefit = null;
        } else {
          if (prevBenefit === null) return false;   // non-null after null ⇒ wrong order
          if (r.computed_benefit > prevBenefit)    return false;
          prevBenefit = r.computed_benefit;
        }
      }
      return true;
    })()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test B: isIncomeTaxPayer = true → PM-KISAN MUST be excluded
// ─────────────────────────────────────────────────────────────────────────────
section('B: isIncomeTaxPayer = true → PM-KISAN excluded');
{
  const category = deriveCategory(3.0);   // 3 acres → small
  assert('deriveCategory(3.0) === "small"', category === 'small');

  const profile = {
    category,
    priorityGroups: [],
    currentCrop:    'wheat',
    exclusionFlags: { isIncomeTaxPayer: true },
  };

  const results = matchSchemes(profile, SCHEMES);
  assert(
    'PM-KISAN is NOT in results when isIncomeTaxPayer is true',
    !results.some(s => s.short_code === 'PM-KISAN')
  );
  assert(
    'Other schemes are still returned (SHC / PMKSY-PDMC / etc.)',
    results.length >= 1
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test B2: isGovtEmployee = true → PM-KISAN MUST be excluded
// ─────────────────────────────────────────────────────────────────────────────
section('B2: isGovtEmployee = true → PM-KISAN excluded');
{
  const profile = {
    category:       deriveCategory(2.0),   // marginal
    priorityGroups: [],
    currentCrop:    '',
    exclusionFlags: { isGovtEmployee: true },
  };

  const results = matchSchemes(profile, SCHEMES);
  assert(
    'PM-KISAN is NOT in results when isGovtEmployee is true',
    !results.some(s => s.short_code === 'PM-KISAN')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test C: SC/ST priority group → SMAM uses higher slab (50–80 %)
// ─────────────────────────────────────────────────────────────────────────────
section('C: sc_st priority group → SMAM computed_benefit uses higher slab');
{
  // Use a "general" farmer (>5 acres) so the base slab would be 40-50;
  // the priority group should push it to the marginal slab (50-80).
  const category = deriveCategory(6.0);
  assert('deriveCategory(6.0) === "general"', category === 'general');

  const profileGeneral = {
    category,
    priorityGroups: [],
    currentCrop:    '',
    exclusionFlags: {},
  };
  const resultsGeneral = matchSchemes(profileGeneral, SCHEMES);
  const smamGeneral    = resultsGeneral.find(s => s.short_code === 'SMAM');
  assert('SMAM appears for general farmer', !!smamGeneral);
  assert(
    `SMAM computed_benefit for general = 50 (slab max)`,
    smamGeneral && smamGeneral.computed_benefit === 50
  );

  const profileSCST = {
    category,
    priorityGroups: ['sc_st'],
    currentCrop:    '',
    exclusionFlags: {},
  };
  const resultsSCST = matchSchemes(profileSCST, SCHEMES);
  const smamSCST    = resultsSCST.find(s => s.short_code === 'SMAM');
  assert('SMAM appears for sc_st priority-group farmer', !!smamSCST);
  assert(
    `SMAM computed_benefit for sc_st = 80 (higher slab max)`,
    smamSCST && smamSCST.computed_benefit === 80
  );
  assert(
    'sc_st slab (80) > general slab (50)',
    smamSCST && smamGeneral &&
    smamSCST.computed_benefit > smamGeneral.computed_benefit
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test D: Crop filter — scheme with all_crops_eligible:false, mismatched crop
// ─────────────────────────────────────────────────────────────────────────────
section('D: Crop filter — PMFBY excluded when crop is not in applicable_crops');
{
  const profile = {
    category:       'marginal',
    priorityGroups: [],
    currentCrop:    'quinoa',   // not in PMFBY's applicable_crops
    exclusionFlags: {},
  };
  const results = matchSchemes(profile, SCHEMES);
  assert(
    'PMFBY is excluded for unrecognised crop "quinoa"',
    !results.some(s => s.short_code === 'PMFBY')
  );
  // Schemes with all_crops_eligible:true should still appear
  assert(
    'All-crops-eligible schemes (e.g. SHC) still appear',
    results.some(s => s.short_code === 'SHC')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test E: deriveCategory boundary values
// ─────────────────────────────────────────────────────────────────────────────
section('E: deriveCategory boundary checks');
{
  assert('deriveCategory(0)   === "marginal"', deriveCategory(0)   === 'marginal');
  assert('deriveCategory(2.4) === "marginal"', deriveCategory(2.4) === 'marginal');
  assert('deriveCategory(2.5) === "small"',    deriveCategory(2.5) === 'small');
  assert('deriveCategory(5.0) === "small"',    deriveCategory(5.0) === 'small');
  assert('deriveCategory(5.1) === "general"',  deriveCategory(5.1) === 'general');
  assert('deriveCategory(10)  === "general"',  deriveCategory(10)  === 'general');
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
