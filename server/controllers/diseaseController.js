const diseaseDatabase = [
  // --- Tomato / Potato ---
  {
    name: "Late Blight",
    crop: "Tomato / Potato",
    confidence: 94.2,
    severity: "High",
    symptoms: "Dark, water-soaked spots on leaves with pale green margins. White moldy growth on undersides in humid weather.",
    cause: "Phytophthora infestans (fungal-like organism)",
    treatment: [
      "Spray Mancozeb (2.5g/L) or Copper Oxychloride (3g/L) immediately.",
      "Remove and destroy severely infected plant parts.",
      "Improve air circulation and avoid overhead watering."
    ],
    prevention: "Plant resistant varieties, ensure wide spacing, and apply preventive copper sprays before rainy weather."
  },
  {
    name: "Early Blight",
    crop: "Tomato / Potato",
    confidence: 88.7,
    severity: "Medium",
    symptoms: "Dark brown spots with concentric rings ('target spots') on older leaves. Leaves may turn yellow and drop off.",
    cause: "Alternaria solani (Fungus)",
    treatment: [
      "Apply Chlorothalonil or Mancozeb fungicide sprays.",
      "Prune lower leaves to reduce soil splash transmission."
    ],
    prevention: "Rotate crops annually, mulch around plants, and avoid overhead irrigation."
  },
  {
    name: "Leaf Mold",
    crop: "Tomato / Potato",
    confidence: 91.5,
    severity: "Medium",
    symptoms: "Pale green or yellow spots on upper leaf surfaces; olive-green velvety mold growth on leaf undersides.",
    cause: "Passalora fulva (Fungus)",
    treatment: [
      "Apply copper-based fungicides or Dithane M-45.",
      "Increase greenhouse ventilation and spacing."
    ],
    prevention: "Grow resistant hybrids, avoid wetting leaves when watering, and clean stakes/cages thoroughly."
  },

  // --- Rice / Paddy ---
  {
    name: "Rice Blast",
    crop: "Rice / Paddy",
    confidence: 91.8,
    severity: "High",
    symptoms: "Diamond or spindle-shaped lesions with reddish-brown borders and gray centers on leaf blades.",
    cause: "Magnaporthe oryzae (Fungus)",
    treatment: [
      "Spray Tricyclazole 75 WP (0.6 g/L) at first sign of lesions.",
      "Avoid excessive application of Nitrogenous fertilizers.",
      "Maintain proper field water level (5 cm standing water)."
    ],
    prevention: "Use blast-resistant seeds like Swarna Sub1 or PR 126, treat seeds with Carbendazim before sowing."
  },
  {
    name: "Brown Spot",
    crop: "Rice / Paddy",
    confidence: 86.4,
    severity: "Medium",
    symptoms: "Numerous dark brown oval spots resembling sesame seeds on leaves, causing leaf drying.",
    cause: "Cochliobolus miyabeanus (Fungus)",
    treatment: [
      "Apply Propiconazole or Mancozeb (2g/L) to control spreading.",
      "Correct soil nutrient deficiencies, especially Potassium."
    ],
    prevention: "Use healthy seed stocks and apply balanced NPK fertilizers."
  },
  {
    name: "Bacterial Leaf Blight",
    crop: "Rice / Paddy",
    confidence: 93.1,
    severity: "High",
    symptoms: "Linear, yellow-to-white wavy stripes starting from leaf tips and margins; drops of bacterial ooze under humid conditions.",
    cause: "Xanthomonas oryzae pv. oryzae (Bacteria)",
    treatment: [
      "Spray Agrimycin-100 or Streptocycline (0.1g/L) combined with Copper Oxychloride (2g/L).",
      "Drain water from fields to restrict spread."
    ],
    prevention: "Avoid clipping leaf tips at transplanting, use balanced nitrogen fertilization."
  },

  // --- Wheat ---
  {
    name: "Powdery Mildew",
    crop: "Wheat",
    confidence: 96.5,
    severity: "Medium",
    symptoms: "White or grayish powdery patches on upper leaf surfaces, stems, and buds.",
    cause: "Erysiphe graminis (Fungus)",
    treatment: [
      "Spray Wettable Sulphur (3 g/L) or Dinocap (1 ml/L).",
      "Prune dense foliage to increase sunlight penetration."
    ],
    prevention: "Avoid crowded planting, maintain high soil moisture, and avoid shaded field locations."
  },
  {
    name: "Leaf Rust (Brown Rust)",
    crop: "Wheat",
    confidence: 92.3,
    severity: "High",
    symptoms: "Orange-brown, oval pustules scattered randomly on leaf blades, which turn black as crop matures.",
    cause: "Puccinia triticina (Fungus)",
    treatment: [
      "Apply Propiconazole (Tilt 25 EC @ 1 ml/L) at first symptom appearance.",
      "Avoid excessive water stagnation in fields."
    ],
    prevention: "Cultivate rust-resistant wheat varieties such as HD 2967 or HD 3086."
  },

  // --- Cotton ---
  {
    name: "Cotton Bacterial Blight",
    crop: "Cotton",
    confidence: 89.4,
    severity: "Medium",
    symptoms: "Angular, water-soaked lesions on leaves bounded by leaf veins; later turning brown or black.",
    cause: "Xanthomonas citri pv. malvacearum (Bacteria)",
    treatment: [
      "Spray Streptocycline (100 ppm) combined with Copper Oxychloride (2.5 g/L).",
      "Collect and burn infected plant debris post-harvest."
    ],
    prevention: "Delint seeds with concentrated sulphuric acid and treat with Streptocycline before planting."
  },
  {
    name: "Cotton Leaf Curl Virus",
    crop: "Cotton",
    confidence: 95.0,
    severity: "High",
    symptoms: "Upward or downward curling of leaf margins, thickening and darkening of leaf veins, and cup-like structures (enations) under leaves.",
    cause: "Cotton leaf curl virus (transmitted by Whiteflies)",
    treatment: [
      "Manage Whitefly vector population by spraying Imidacloprid (0.3 ml/L) or Diafenthiuron.",
      "Uproot and destroy infected plants to prevent vectors spreading it."
    ],
    prevention: "Grow resistant cultivars and keep fields free of broadleaf weeds that host the virus."
  },

  // --- Healthy Leaf ---
  {
    name: "Healthy Leaf (No Disease Detected)",
    crop: "All Crops",
    confidence: 98.1,
    severity: "None",
    symptoms: "Vibrant green color, intact leaf margins, no spots, lesions, or discoloration.",
    cause: "N/A",
    treatment: ["No chemical treatment required! Keep up optimal watering and fertilization schedules."],
    prevention: "Continue routine monitoring and maintain good field sanitation."
  }
];

// Helper to convert filename/metadata into a unique number for selection
const getFileHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const detectDisease = (req, res) => {
  try {
    const file = req.file;
    const crop = req.body.crop || "Unknown";
    const cropLower = crop.toLowerCase();

    // Find all matching diseases for this crop group
    let possibleResults = diseaseDatabase.filter(item => {
      const itemCropLower = item.crop.toLowerCase();
      
      // Match specific crops
      if (cropLower.includes("rice") || cropLower.includes("paddy")) {
        return itemCropLower.includes("rice") || itemCropLower.includes("paddy");
      }
      if (cropLower.includes("wheat")) {
        return itemCropLower.includes("wheat");
      }
      if (cropLower.includes("cotton")) {
        return itemCropLower.includes("cotton");
      }
      if (cropLower.includes("tomato") || cropLower.includes("potato")) {
        return itemCropLower.includes("tomato") || itemCropLower.includes("potato");
      }
      return false;
    });

    // Always append the "Healthy Leaf" option as a possible result
    possibleResults.push(diseaseDatabase[diseaseDatabase.length - 1]);

    // Choose diagnosis using hash index of file name + size to make it dynamic
    let selectedIndex = 0;
    if (file) {
      const seedString = file.originalname + file.size;
      const hashValue = getFileHash(seedString);
      selectedIndex = hashValue % possibleResults.length;
    } else {
      selectedIndex = Math.floor(Math.random() * possibleResults.length);
    }

    const result = possibleResults[selectedIndex];

    res.json({
      success: true,
      data: {
        is_demo: true,
        diseaseName: result.name,
        targetCrop: result.crop,
        confidenceScore: result.confidence,
        severity: result.severity,
        symptoms: result.symptoms,
        cause: result.cause,
        treatment: result.treatment,
        prevention: result.prevention,
        uploadedImageUrl: file ? `/uploads/${file.filename}` : null,
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error analyzing image." });
  }
};

module.exports = { detectDisease };
