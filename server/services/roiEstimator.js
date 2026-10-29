'use strict';

/**
 * roiEstimator.js  –  AgriSense | Estimated Economics Service
 * ============================================================
 * Pure functions, no I/O, no Express dependencies, fully unit-testable.
 *
 * Data contract (one entry from crop_economics.json):
 *   {
 *     crop_name             : string
 *     season                : "kharif" | "rabi"
 *     msp_inr_per_quintal   : number | null
 *     yield_qtl_per_ha      : number | null
 *     cost_a2_fl_inr_per_ha : number | null   // A2+FL cost (paid-out + family labour)
 *     cost_c2_inr_per_ha    : number | null   // C2 cost (includes imputed land rent)
 *   }
 *
 * Formulae:
 *   revenue_per_ha   = yield_qtl_per_ha × msp_inr_per_quintal
 *   net_return_a2fl  = revenue_per_ha − cost_a2_fl_inr_per_ha
 *   net_return_c2    = revenue_per_ha − cost_c2_inr_per_ha
 *   roi_pct_a2fl     = net_return_a2fl / cost_a2_fl_inr_per_ha × 100
 *   roi_pct_c2       = net_return_c2   / cost_c2_inr_per_ha   × 100
 *
 * Any value whose required inputs include a null is itself null.
 * roi_available is true only when msp_inr_per_quintal, yield_qtl_per_ha,
 * cost_a2_fl_inr_per_ha and cost_c2_inr_per_ha are all non-null.
 */

/**
 * Compute economics for a single crop entry.
 *
 * @param {{ crop_name: string, season: string,
 *            msp_inr_per_quintal: number|null,
 *            yield_qtl_per_ha: number|null,
 *            cost_a2_fl_inr_per_ha: number|null,
 *            cost_c2_inr_per_ha: number|null }} entry
 * @returns {{
 *   crop_name: string,
 *   season: string,
 *   msp_inr_per_quintal: number|null,
 *   yield_qtl_per_ha: number|null,
 *   cost_a2_fl_inr_per_ha: number|null,
 *   cost_c2_inr_per_ha: number|null,
 *   revenue_per_ha: number|null,
 *   net_return_a2fl: number|null,
 *   net_return_c2: number|null,
 *   roi_pct_a2fl: number|null,
 *   roi_pct_c2: number|null,
 *   roi_available: boolean
 * }}
 */
function computeEconomics(entry) {
  const { crop_name, season, msp_inr_per_quintal, yield_qtl_per_ha,
          cost_a2_fl_inr_per_ha, cost_c2_inr_per_ha } = entry;

  // revenue requires both yield and MSP
  const revenue_per_ha =
    yield_qtl_per_ha != null && msp_inr_per_quintal != null
      ? yield_qtl_per_ha * msp_inr_per_quintal
      : null;

  // net returns require revenue AND the respective cost
  const net_return_a2fl =
    revenue_per_ha != null && cost_a2_fl_inr_per_ha != null
      ? revenue_per_ha - cost_a2_fl_inr_per_ha
      : null;

  const net_return_c2 =
    revenue_per_ha != null && cost_c2_inr_per_ha != null
      ? revenue_per_ha - cost_c2_inr_per_ha
      : null;

  // ROI requires both the net return and the cost (no divide-by-zero guard
  // needed because cost fields from CACP are always > 0 when non-null)
  const roi_pct_a2fl =
    net_return_a2fl != null && cost_a2_fl_inr_per_ha != null
      ? (net_return_a2fl / cost_a2_fl_inr_per_ha) * 100
      : null;

  const roi_pct_c2 =
    net_return_c2 != null && cost_c2_inr_per_ha != null
      ? (net_return_c2 / cost_c2_inr_per_ha) * 100
      : null;

  // roi_available only when ALL four inputs are non-null
  const roi_available =
    msp_inr_per_quintal != null &&
    yield_qtl_per_ha != null &&
    cost_a2_fl_inr_per_ha != null &&
    cost_c2_inr_per_ha != null;

  return {
    crop_name,
    season,
    msp_inr_per_quintal,
    yield_qtl_per_ha,
    cost_a2_fl_inr_per_ha,
    cost_c2_inr_per_ha,
    revenue_per_ha,
    net_return_a2fl,
    net_return_c2,
    roi_pct_a2fl,
    roi_pct_c2,
    roi_available,
  };
}

/**
 * Rank a list of crop names by net_return_a2fl descending.
 * Crops without roi_available are placed in the unranked list.
 *
 * @param {string[]} cropNames        - Crop names to rank (may be empty or null).
 * @param {Object[]} economicsEntries - Full array from crop_economics.json.
 * @returns {{ ranked: Object[], unranked: Array<{crop_name:string,reason:string}> }}
 */
function rankCrops(cropNames, economicsEntries) {
  const names = Array.isArray(cropNames) ? cropNames : [];

  // Build a lookup map: crop name (lowercase) → entry
  const lookup = new Map();
  for (const e of economicsEntries) {
    lookup.set(e.crop_name.toLowerCase(), e);
  }

  const ranked   = [];
  const unranked = [];

  for (const name of names) {
    const key   = (typeof name === 'string' ? name : '').toLowerCase();
    const entry = lookup.get(key);

    if (!entry) {
      unranked.push({ crop_name: name, reason: 'No official cost or yield data' });
      continue;
    }

    const econ = computeEconomics(entry);
    if (econ.roi_available) {
      ranked.push(econ);
    } else {
      unranked.push({ crop_name: name, reason: 'No official cost or yield data' });
    }
  }

  // Sort ranked by net_return_a2fl descending (both are non-null when roi_available)
  ranked.sort((a, b) => b.net_return_a2fl - a.net_return_a2fl);

  return { ranked, unranked };
}

module.exports = { computeEconomics, rankCrops };
