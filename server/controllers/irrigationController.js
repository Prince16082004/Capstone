const calculateIrrigation = (req, res) => {
  try {
    const { crop, soilType, areaAcre, stage, temp, humidity, recentRain } = req.body;

    if (!crop || !soilType || !areaAcre) {
      return res.status(400).json({ success: false, message: "Crop, soil type, and farm area are required." });
    }

    const area = parseFloat(areaAcre);
    let baseLitersPerAcrePerDay = 15000; // Base baseline

    const cropLower = crop.toLowerCase();
    if (cropLower.includes("rice") || cropLower.includes("paddy")) baseLitersPerAcrePerDay = 35000;
    else if (cropLower.includes("sugarcane")) baseLitersPerAcrePerDay = 28000;
    else if (cropLower.includes("cotton")) baseLitersPerAcrePerDay = 18000;
    else if (cropLower.includes("wheat") || cropLower.includes("maize")) baseLitersPerAcrePerDay = 14000;
    else if (cropLower.includes("vegetable") || cropLower.includes("tomato")) baseLitersPerAcrePerDay = 12000;
    else if (cropLower.includes("pulse") || cropLower.includes("mustard")) baseLitersPerAcrePerDay = 9000;

    // Soil adjustment factor
    let soilFactor = 1.0;
    if (soilType.toLowerCase().includes("sandy")) soilFactor = 1.35; // Needs more frequent watering
    else if (soilType.toLowerCase().includes("clay")) soilFactor = 0.8; // Retains water well
    else if (soilType.toLowerCase().includes("black")) soilFactor = 0.75;

    // Stage adjustment
    let stageFactor = 1.0;
    if (stage?.toLowerCase().includes("flowering") || stage?.toLowerCase().includes("fruit")) stageFactor = 1.25;
    else if (stage?.toLowerCase().includes("initial") || stage?.toLowerCase().includes("germination")) stageFactor = 0.7;

    // Temperature & Rain adjustment
    let weatherFactor = 1.0;
    if (parseFloat(temp) > 35) weatherFactor += 0.2;
    if (parseFloat(humidity) < 40) weatherFactor += 0.15;
    if (parseFloat(recentRain) > 10) weatherFactor -= 0.6; // Rain reduced requirement

    weatherFactor = Math.max(0.2, weatherFactor);

    const litersPerDay = Math.round(baseLitersPerAcrePerDay * area * soilFactor * stageFactor * weatherFactor);
    const hoursDrip = (litersPerDay / (area * 2500)).toFixed(1); // Assuming standard drip discharge

    let schedule = "Irrigate every 2 days";
    if (soilType.toLowerCase().includes("sandy")) schedule = "Irrigate daily (short duration)";
    else if (soilType.toLowerCase().includes("clay")) schedule = "Irrigate every 3-4 days";
    if (parseFloat(recentRain) > 15) schedule = "Skip irrigation for next 48-72 hours due to rain";

    res.json({
      success: true,
      data: {
        crop,
        soilType,
        areaAcre: area,
        dailyRequirementLiters: litersPerDay,
        weeklyRequirementLiters: litersPerDay * 7,
        recommendedSchedule: schedule,
        dripRunTimeHours: hoursDrip,
        waterSavingTips: [
          "Use drip irrigation to reduce water consumption by 35-45%",
          "Irrigate early in the morning (6 AM - 8 AM) to reduce evaporation losses",
          "Mulch with straw or crop residues to conserve soil moisture"
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error calculating irrigation requirement." });
  }
};

module.exports = { calculateIrrigation };
