const calculateFertilizer = (req, res) => {
  try {
    const { crop, soilN, soilP, soilK, targetYield, areaAcre } = req.body;

    if (!crop || !soilN || !soilP || !soilK) {
      return res.status(400).json({ success: false, message: "Crop and soil NPK values are required." });
    }

    const n = parseFloat(soilN);
    const p = parseFloat(soilP);
    const k = parseFloat(soilK);
    const area = parseFloat(areaAcre) || 1;

    // Recommended standard N-P-K requirement (kg/acre) for selected crop
    let reqN = 50, reqP = 25, reqK = 25;
    const cropLower = crop.toLowerCase();

    if (cropLower.includes("rice")) { reqN = 48; reqP = 24; reqK = 24; }
    else if (cropLower.includes("wheat")) { reqN = 50; reqP = 25; reqK = 20; }
    else if (cropLower.includes("cotton")) { reqN = 60; reqP = 30; reqK = 30; }
    else if (cropLower.includes("maize")) { reqN = 50; reqP = 25; reqK = 20; }
    else if (cropLower.includes("sugarcane")) { reqN = 100; reqP = 40; reqK = 50; }
    else if (cropLower.includes("soybean") || cropLower.includes("pulse")) { reqN = 10; reqP = 30; reqK = 20; } // Legumes fix N

    // Deficiency calculation
    const defN = Math.max(0, reqN - n * 0.4);
    const defP = Math.max(0, reqP - p * 0.4);
    const defK = Math.max(0, reqK - k * 0.4);

    // Convert to commercial fertilizer bags (Urea 46% N, DAP 18% N + 46% P, MOP 60% K)
    // 1 bag = 45kg or 50kg
    const dapKg = Math.round((defP / 0.46) * area);
    const nFromDap = (dapKg * 0.18);
    const remNKg = Math.max(0, (defN * area) - nFromDap);
    const ureaKg = Math.round(remNKg / 0.46);
    const mopKg = Math.round((defK / 0.60) * area);

    res.json({
      success: true,
      data: {
        crop,
        areaAcre: area,
        soilStatus: {
          nitrogen: n < 30 ? "Low" : n > 60 ? "High" : "Medium",
          phosphorus: p < 20 ? "Low" : p > 50 ? "High" : "Medium",
          potassium: k < 20 ? "Low" : k > 50 ? "High" : "Medium"
        },
        fertilizerRequirementKg: {
          urea: ureaKg,
          dap: dapKg,
          mop: mopKg,
          zincSulphate: Math.round(10 * area),
          organicCompost: Math.round(2000 * area)
        },
        applicationSchedule: [
          { stage: "Basal (At Sowing)", details: `Apply 100% DAP (${dapKg} kg), 100% MOP (${mopKg} kg), and 30% Urea (${Math.round(ureaKg * 0.3)} kg)` },
          { stage: "First Top Dressing (30 Days)", details: `Apply 35% Urea (${Math.round(ureaKg * 0.35)} kg) after first weeding` },
          { stage: "Second Top Dressing (55 Days)", details: `Apply remaining 35% Urea (${Math.round(ureaKg * 0.35)} kg) at panicle/flowering initiation` }
        ],
        precautions: [
          "Do not mix Urea directly with Seed or Rhizobium culture",
          "Apply Zinc Sulphate separately; avoid mixing with DAP to prevent zinc phosphate precipitation",
          "Ensure adequate soil moisture before top dressing Urea"
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error calculating fertilizer recommendation." });
  }
};

module.exports = { calculateFertilizer };
