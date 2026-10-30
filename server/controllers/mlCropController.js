'use strict';

const http = require('http');
const path = require('path');
const fs   = require('fs');
const { evaluateRotation }              = require('../services/rotationAdvisor');
const { computeEconomics, rankCrops }  = require('../services/roiEstimator');
const rotationMatrix                   = require('../Data/crop_rotation_matrix.json');

/**
 * POST /api/crop/ml-recommend
 *
 * Thin proxy: validates that all 7 required fields are numeric,
 * then forwards the body verbatim to the Python FastAPI service at
 * ML_SERVICE_URL (default: http://127.0.0.1:8001) and returns its
 * response unchanged.
 *
 * The client NEVER calls the FastAPI service directly.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
const REQUIRED_FIELDS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];

// ── Load crop economics once at module initialisation ─────────────────────────
// If the file is missing or unreadable, economics block is silently omitted.
let _economics = null;
try {
  _economics = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', 'Data', 'crop_economics.json'),
      'utf8'
    )
  );
} catch (e) {
  console.warn(
    '[mlCropController] crop_economics.json not found or unreadable — ' +
    '"economics" field will be omitted from responses.'
  );
}

const BASIS_NOTE =
  'Estimated using the government Minimum Support Price with state-average ' +
  'yield and cost from CACP data. Actual market prices and farm-level yields differ.';

const mlRecommend = async (req, res) => {
  try {
    // ── Validation ──────────────────────────────────────────────────────────
    const missing = REQUIRED_FIELDS.filter(
      (f) => req.body[f] === undefined || req.body[f] === null
    );
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    const nonNumeric = REQUIRED_FIELDS.filter(
      (f) => isNaN(Number(req.body[f]))
    );
    if (nonNumeric.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fields must be numeric: ${nonNumeric.join(', ')}`,
      });
    }

    // Build a clean payload (only the 7 features, cast to float)
    const payload = {};
    for (const f of REQUIRED_FIELDS) {
      payload[f] = parseFloat(req.body[f]);
    }

    // ── Forward to FastAPI ──────────────────────────────────────────────────
    const body = JSON.stringify(payload);
    const targetUrl = new URL('/predict', ML_SERVICE_URL);

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: targetUrl.hostname,
        port    : parseInt(targetUrl.port || 8001, 10),
        path    : targetUrl.pathname,
        method  : 'POST',
        headers : {
          'Content-Type'  : 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => (data += chunk));
        proxyRes.on('end', () =>
          resolve({ statusCode: proxyRes.statusCode, body: data })
        );
      });

      proxyReq.on('error', reject);
      proxyReq.write(body);
      proxyReq.end();
    });

    // Forward the status code and parsed JSON from the ML service
    const parsed = JSON.parse(response.body);

    if (response.statusCode === 200) {
      // ── Rotation advisory ────────────────────────────────────────────────
      // previousCrop comes from the farmer profile forwarded by the client.
      // predictedCrop comes from the ML service response.
      const previousCrop  = req.body.previousCrop || '';
      const predictedCrop = parsed.crop            || '';
      const rotation_advisory = evaluateRotation(previousCrop, predictedCrop, rotationMatrix);

      // ── Estimated economics ──────────────────────────────────────────────
      // Only included when crop_economics.json loaded successfully.
      // No existing response field is altered.
      let economics;   // intentionally undefined when _economics is null
      if (_economics !== null) {
        const key         = predictedCrop.toLowerCase();
        const entry       = _economics.find((e) => e.crop_name.toLowerCase() === key) || null;
        const rotationCrops =
          Array.isArray(rotation_advisory.recommended_crops)
            ? rotation_advisory.recommended_crops
            : [];

        economics = {
          predicted_crop   : entry ? computeEconomics(entry) : null,
          rotation_options : rankCrops(rotationCrops, _economics),
          basis_note       : BASIS_NOTE,
        };
      }

      const responseData =
        economics !== undefined
          ? { ...parsed, rotation_advisory, economics }
          : { ...parsed, rotation_advisory };

      return res.status(200).json({ success: true, data: responseData });
    }

    // FastAPI validation error (422) or other errors — forward as 502
    return res.status(502).json({
      success: false,
      message: 'ML service returned an error.',
      detail : parsed,
    });

  } catch (err) {
    // Connection refused (ML service not running)
    if (err.code === 'ECONNREFUSED') {
      const mlPort = new URL(ML_SERVICE_URL).port || '8001';
      return res.status(503).json({
        success: false,
        message:
          'ML recommendation service is offline. ' +
          `Start it with: uvicorn app:app --host 127.0.0.1 --port ${mlPort}`,
      });
    }
    console.error('mlRecommend proxy error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { mlRecommend };
