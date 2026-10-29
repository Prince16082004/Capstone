'use strict';

const fs   = require('fs');
const path = require('path');
const { matchSchemes, deriveCategory } = require('../services/schemeMatcher');

// Load scheme data once at startup — avoids repeated disk reads per request.
const SCHEMES_PATH = path.join(__dirname, '..', 'Data', 'govt_schemes.json');
let schemesCache;
function loadSchemes() {
  if (!schemesCache) {
    const raw = fs.readFileSync(SCHEMES_PATH, 'utf8');
    schemesCache = JSON.parse(raw);
  }
  return schemesCache;
}

/**
 * POST /api/schemes/match
 *
 * Body:
 *  {
 *    landSizeAcres  : number   (required)
 *    priorityGroups : string[] (optional) e.g. ["sc_st"]
 *    previousCrop   : string   (optional)
 *    currentCrop    : string   (optional)
 *    exclusionFlags : {
 *      isIncomeTaxPayer?: boolean
 *      isGovtEmployee?  : boolean
 *    }
 *  }
 *
 * Response:
 *  { category, matchedSchemes }
 */
const matchSchemesHandler = (req, res) => {
  try {
    const {
      landSizeAcres,
      priorityGroups  = [],
      previousCrop,
      currentCrop,
      exclusionFlags  = {},
    } = req.body;

    // --- Validation ---
    if (landSizeAcres === undefined || landSizeAcres === null) {
      return res
        .status(400)
        .json({ success: false, message: 'landSizeAcres is required.' });
    }
    const acres = Number(landSizeAcres);
    if (isNaN(acres) || acres < 0) {
      return res
        .status(400)
        .json({ success: false, message: 'landSizeAcres must be a non-negative number.' });
    }

    // --- Derive category server-side (never trust client) ---
    const category = deriveCategory(acres);

    // --- Build farmer profile for the service ---
    const farmerProfile = {
      category,
      priorityGroups: Array.isArray(priorityGroups) ? priorityGroups : [],
      currentCrop:    currentCrop || previousCrop || '',   // fall back to previousCrop
      exclusionFlags: typeof exclusionFlags === 'object' ? exclusionFlags : {},
    };

    const schemes        = loadSchemes();
    const matchedSchemes = matchSchemes(farmerProfile, schemes);

    return res.json({
      category,
      totalMatched: matchedSchemes.length,
      matchedSchemes,
    });

  } catch (error) {
    console.error('Error in matchSchemesHandler:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { matchSchemes: matchSchemesHandler };
