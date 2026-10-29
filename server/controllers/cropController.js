// Comprehensive crop knowledge base
const cropDB = {
  rice: {
    name: "Rice", emoji: "🌾",
    season: ["kharif", "summer"],
    soil: ["clayey", "loamy", "alluvial", "black"],
    temp: [20, 38], rainfall: [1000, 2500], ph: [5.5, 7.0],
    n: "high", p: "medium", k: "medium",
    desc: "Staple food crop. Thrives in waterlogged or irrigated conditions.",
    yield: "25–40 quintals/acre", duration: "90–150 days",
    price: "₹2,183/quintal (MSP)", tips: ["Maintain 5 cm standing water during tillering","Transplant at 21-day seedlings","Apply Zinc Sulphate at 25 kg/ha"],
  },
  wheat: {
    name: "Wheat", emoji: "🌿",
    season: ["rabi"],
    soil: ["loamy", "clayey", "alluvial"],
    temp: [10, 25], rainfall: [300, 1000], ph: [6.0, 7.5],
    n: "high", p: "high", k: "medium",
    desc: "Major rabi cereal crop. Requires cool growing season and warm dry harvest.",
    yield: "18–30 quintals/acre", duration: "100–135 days",
    price: "₹2,275/quintal (MSP)", tips: ["Sow in October-November for best yield","Irrigate at crown root initiation stage","Use certified disease-resistant seeds"],
  },
  cotton: {
    name: "Cotton", emoji: "🌸",
    season: ["kharif"],
    soil: ["black", "red", "alluvial"],
    temp: [21, 35], rainfall: [600, 1100], ph: [5.8, 8.0],
    n: "high", p: "medium", k: "high",
    desc: "Cash crop also known as 'white gold'. Needs deep well-drained soil.",
    yield: "8–15 quintals/acre", duration: "150–180 days",
    price: "₹6,620/quintal (MSP)", tips: ["Use BT cotton varieties in pest-prone areas","Apply Boron for better boll setting","Protect from Bollworm with pheromone traps"],
  },
  maize: {
    name: "Maize", emoji: "🌽",
    season: ["kharif", "rabi", "zaid"],
    soil: ["loamy", "sandy loam", "alluvial"],
    temp: [18, 32], rainfall: [500, 900], ph: [5.5, 7.5],
    n: "high", p: "medium", k: "medium",
    desc: "Versatile crop used for food, fodder, and industrial starch.",
    yield: "20–35 quintals/acre", duration: "80–110 days",
    price: "₹2,090/quintal (MSP)", tips: ["Plant in rows with 60 cm spacing","Side-dress with Nitrogen at knee-high stage","Ensure good drainage to prevent root rot"],
  },
  soybean: {
    name: "Soybean", emoji: "🫘",
    season: ["kharif"],
    soil: ["loamy", "clayey loam", "alluvial"],
    temp: [18, 30], rainfall: [500, 900], ph: [6.0, 7.5],
    n: "low", p: "high", k: "medium",
    desc: "High-protein legume. Fixes atmospheric nitrogen, improving soil fertility.",
    yield: "8–18 quintals/acre", duration: "90–120 days",
    price: "₹4,892/quintal (MSP)", tips: ["Inoculate seeds with Rhizobium bacteria","Avoid excessive nitrogen — it's a legume","Harvest at pod maturity before cracking"],
  },
  groundnut: {
    name: "Groundnut", emoji: "🥜",
    season: ["kharif", "rabi", "zaid"],
    soil: ["sandy loam", "red", "loamy"],
    temp: [20, 35], rainfall: [400, 800], ph: [6.0, 7.0],
    n: "low", p: "medium", k: "high",
    desc: "Oil seed and protein-rich cash crop. Grows well in light, well-drained soils.",
    yield: "10–20 quintals/acre", duration: "95–130 days",
    price: "₹6,783/quintal (MSP)", tips: ["Apply gypsum at 250 kg/ha at peg stage","Earth up rows 30 days after sowing","Harvest when leaves turn yellow-green"],
  },
  sugarcane: {
    name: "Sugarcane", emoji: "🎋",
    season: ["kharif", "spring"],
    soil: ["loamy", "alluvial", "clayey"],
    temp: [20, 38], rainfall: [1000, 2000], ph: [6.0, 8.0],
    n: "high", p: "medium", k: "high",
    desc: "Long-duration cash crop. Major source of sugar, jaggery, and ethanol.",
    yield: "300–400 quintals/acre", duration: "300–360 days",
    price: "₹315/quintal (FRP)", tips: ["Ratoon crop possible for 2–3 cycles","Irrigate every 7–10 days in summer","Apply Trashon top of soil to conserve moisture"],
  },
  tomato: {
    name: "Tomato", emoji: "🍅",
    season: ["kharif", "rabi", "zaid"],
    soil: ["loamy", "sandy loam", "red"],
    temp: [15, 30], rainfall: [400, 800], ph: [6.0, 7.0],
    n: "medium", p: "high", k: "high",
    desc: "High-value vegetable crop with good market demand throughout the year.",
    yield: "120–200 quintals/acre", duration: "60–90 days",
    price: "₹15–40/kg (market)", tips: ["Stake or trellis plants for better air circulation","Drip irrigation preferred to prevent blight","Remove suckers for better fruit set"],
  },
  chickpea: {
    name: "Chickpea", emoji: "🫘",
    season: ["rabi"],
    soil: ["loamy", "sandy loam", "red"],
    temp: [10, 25], rainfall: [300, 600], ph: [6.0, 8.0],
    n: "low", p: "medium", k: "medium",
    desc: "Protein-rich pulse crop. Drought-tolerant and improves soil nitrogen.",
    yield: "6–12 quintals/acre", duration: "90–120 days",
    price: "₹5,440/quintal (MSP)", tips: ["Avoid waterlogging — grows on residual moisture","Inoculate seeds with Mesorhizobium","Intercrop with wheat for risk management"],
  },
  mustard: {
    name: "Mustard", emoji: "🌻",
    season: ["rabi"],
    soil: ["loamy", "sandy loam", "alluvial"],
    temp: [7, 25], rainfall: [250, 600], ph: [6.0, 7.5],
    n: "medium", p: "medium", k: "low",
    desc: "Oilseed rabi crop. Highly tolerant to frost and cool conditions.",
    yield: "6–12 quintals/acre", duration: "90–110 days",
    price: "₹5,650/quintal (MSP)", tips: ["Sow in October-November after cotton harvest","Apply Sulphur at 20 kg/ha for good oil content","One irrigation at pre-flowering stage is critical"],
  },
};

const getCropScore = (crop, input) => {
  let score = 0;
  const { soil_type, season, ph, temperature, rainfall, nitrogen, phosphorus, potassium } = input;

  if (crop.season.includes(season)) score += 30;
  if (crop.soil.some((s) => soil_type?.toLowerCase().includes(s))) score += 25;

  const temp = parseFloat(temperature);
  if (temp >= crop.temp[0] && temp <= crop.temp[1]) score += 15;
  else if (temp >= crop.temp[0] - 5 && temp <= crop.temp[1] + 5) score += 7;

  const rain = parseFloat(rainfall);
  if (rain >= crop.rainfall[0] && rain <= crop.rainfall[1]) score += 15;
  else if (rain >= crop.rainfall[0] * 0.7 && rain <= crop.rainfall[1] * 1.3) score += 7;

  const phVal = parseFloat(ph);
  if (phVal >= crop.ph[0] && phVal <= crop.ph[1]) score += 10;

  const nLevel = parseFloat(nitrogen);
  if ((crop.n === "high" && nLevel > 60) || (crop.n === "medium" && nLevel >= 30 && nLevel <= 60) || (crop.n === "low" && nLevel < 30)) score += 5;

  return Math.min(score, 100);
};

/**
 * DEPRECATED — POST /api/crop/recommend
 * Rule-based in-memory heuristic recommendation. No client code currently
 * calls this route. Kept for backward-compatibility only.
 * Use POST /api/crop/ml-recommend (mlCropController) instead.
 */
const getCropRecommendation = (req, res) => {
  try {
    const { soil_type, season, temperature, humidity, rainfall, ph, nitrogen, phosphorus, potassium, state } = req.body;

    if (!soil_type || !season) {
      return res.status(400).json({ success: false, message: "Soil type and season are required." });
    }

    const scored = Object.entries(cropDB).map(([key, crop]) => ({
      id: key,
      ...crop,
      score: getCropScore(crop, { soil_type, season, ph, temperature, rainfall, nitrogen, phosphorus, potassium }),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5).filter((c) => c.score > 20);

    if (top.length === 0)
      return res.status(200).json({ success: true, data: [], message: "No strong matches found. Try adjusting soil or season." });

    res.json({ success: true, data: top, total_analyzed: Object.keys(cropDB).length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Recommendation engine error." });
  }
};

module.exports = { getCropRecommendation };
