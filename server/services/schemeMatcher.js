'use strict';

/**
 * Maps boolean profile flags to the exclusion_tags strings used in
 * govt_schemes.json. Only flags that exist on the profile are mapped;
 * unrecognised exclusion_tags in the data are silently ignored.
 */
const FLAG_TO_TAG = {
  isIncomeTaxPayer: 'income_tax_payer',
  isGovtEmployee:   'government_employee_class_1_2',
};

/**
 * Derives a farmer category from land size in acres.
 *   marginal : < 2.5 acres
 *   small    : 2.5 – 5.0 acres (inclusive)
 *   general  : > 5.0 acres
 *
 * @param {number} landSizeAcres
 * @returns {'marginal'|'small'|'general'}
 */
function deriveCategory(landSizeAcres) {
  if (landSizeAcres < 2.5)  return 'marginal';
  if (landSizeAcres <= 5.0) return 'small';
  return 'general';
}

/**
 * Builds the set of exclusion tags that are active for this farmer.
 *
 * @param {Record<string,boolean>} exclusionFlags
 * @returns {Set<string>}
 */
function buildActiveExclusionTags(exclusionFlags = {}) {
  const active = new Set();
  for (const [flag, tag] of Object.entries(FLAG_TO_TAG)) {
    if (exclusionFlags[flag]) active.add(tag);
  }
  return active;
}

/**
 * Computes a numeric benefit value for sorting purposes.
 *
 * Priority:
 *   1. annual_benefit_inr
 *   2. financial_assistance_inr
 *   3. subsidy_slabs → look up the farmer's category slab (prefer higher
 *      slab when the farmer belongs to an additional_priority_groups entry),
 *      then return the slab's max value so higher subsidies rank first.
 *   4. null  (service-type schemes with no monetary value)
 *
 * @param {object} scheme
 * @param {string} category
 * @param {string[]} priorityGroups
 * @returns {number|null}
 */
function computeBenefit(scheme, category, priorityGroups = []) {
  if (scheme.annual_benefit_inr != null) {
    return scheme.annual_benefit_inr;
  }

  if (scheme.financial_assistance_inr != null) {
    return scheme.financial_assistance_inr;
  }

  if (scheme.subsidy_slabs) {
    const slabs = scheme.subsidy_slabs;
    const inPriorityGroup =
      Array.isArray(scheme.additional_priority_groups) &&
      priorityGroups.some(pg =>
        scheme.additional_priority_groups.includes(pg.toLowerCase())
      );

    let slab;
    if (inPriorityGroup) {
      // Priority-group farmers get the highest available slab
      slab =
        slabs['marginal'] ||
        slabs['small']    ||
        slabs['general']  ||
        null;
    } else {
      slab = slabs[category] || slabs['general'] || null;
    }

    return slab ? slab.max : null;
  }

  return null;
}

/**
 * Pure scheme-matching function.
 *
 * @param {object} farmerProfile
 * @param {string}   farmerProfile.category        - 'marginal'|'small'|'general'
 * @param {string[]} [farmerProfile.priorityGroups]  - e.g. ['sc_st']
 * @param {string}   [farmerProfile.currentCrop]    - lowercase crop name
 * @param {Record<string,boolean>} [farmerProfile.exclusionFlags]
 * @param {object[]} schemes  - raw array from govt_schemes.json
 * @returns {object[]}  matched schemes, each with a `computed_benefit` field, sorted desc
 */
function matchSchemes(farmerProfile, schemes) {
  const {
    category,
    priorityGroups = [],
    currentCrop,
    exclusionFlags = {},
  } = farmerProfile;

  const activeExclusionTags = buildActiveExclusionTags(exclusionFlags);

  const matched = schemes
    .filter(scheme => {
      // --- 1. Category eligibility ---
      if (
        !Array.isArray(scheme.eligible_categories) ||
        !scheme.eligible_categories.includes(category)
      ) {
        return false;
      }

      // --- 2. Exclusion check ---
      // A scheme is excluded if ANY of its exclusion_tags is in the active set.
      // Tags that have no corresponding profile flag are simply never added to
      // activeExclusionTags, so they won't match — no errors thrown.
      if (
        Array.isArray(scheme.exclusion_tags) &&
        scheme.exclusion_tags.some(tag => activeExclusionTags.has(tag))
      ) {
        return false;
      }

      // --- 3. Crop eligibility ---
      // Only skip when: all_crops_eligible is false AND a crop was supplied AND
      // the crop is absent from applicable_crops.
      if (!scheme.all_crops_eligible) {
        if (currentCrop) {
          const normalised = currentCrop.toLowerCase();
          if (
            !Array.isArray(scheme.applicable_crops) ||
            !scheme.applicable_crops.includes(normalised)
          ) {
            return false;
          }
        }
        // If no currentCrop is provided, we cannot rule the scheme out on crop
        // grounds alone — include it.
      }

      return true;
    })
    .map(scheme => ({
      scheme_id:              scheme.scheme_id,
      scheme_name:            scheme.scheme_name,
      short_code:             scheme.short_code,
      benefit_type:           scheme.benefit_type,
      key_benefit_description:scheme.key_benefit_description,
      required_documents:     scheme.required_documents,
      official_link:          scheme.official_link,
      exclusion_tags:         scheme.exclusion_tags,
      computed_benefit:       computeBenefit(scheme, category, priorityGroups),
    }))
    .sort((a, b) => {
      // Nulls go last; otherwise descending numeric order
      if (a.computed_benefit === null && b.computed_benefit === null) return 0;
      if (a.computed_benefit === null) return 1;
      if (b.computed_benefit === null) return -1;
      return b.computed_benefit - a.computed_benefit;
    });

  return matched;
}

module.exports = { matchSchemes, deriveCategory };
