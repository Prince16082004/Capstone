const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const axios = require("axios");

// Fallback soil testing labs in case OSM query returns few/no results
const fallbackLabs = [
  {
    name: "Central Soil Salinity Research Institute (CSSRI) Lab",
    address: "Karnal, Haryana, India",
    lat: 29.6974,
    lon: 76.9996,
    contact: "0184-2290501"
  },
  {
    name: "National Bureau of Soil Survey & Land Use Planning Lab",
    address: "Amravati Road, Nagpur, Maharashtra, India",
    lat: 21.1498,
    lon: 79.0264,
    contact: "0712-2500386"
  },
  {
    name: "ICAR - Indian Institute of Soil Science (IISS)",
    address: "Nabibagh, Berasia Road, Bhopal, Madhya Pradesh, India",
    lat: 23.3082,
    lon: 77.4026,
    contact: "0755-2730970"
  },
  {
    name: "State Government Soil Testing Laboratory",
    address: "Krishi Bhavan, Shivajinagar, Pune, Maharashtra, India",
    lat: 18.5302,
    lon: 73.8474,
    contact: "020-25656234"
  },
  {
    name: "Krishi Vigyan Kendra (KVK) Soil Testing Center",
    address: "Hebbal, Bengaluru, Karnataka, India",
    lat: 13.0245,
    lon: 77.5896,
    contact: "080-23515082"
  },
  {
    name: "Punjab Agricultural University Soil Testing Lab",
    address: "Ludhiana, Punjab, India",
    lat: 30.9023,
    lon: 75.8087,
    contact: "0161-2401960"
  }
];

const pdfParse = require("pdf-parse");

const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a soil report file (image/PDF)." });
    }

    const filePath = req.file.path;
    const fileMime = req.file.mimetype;
    let extractedText = "";

    try {
      if (fileMime === "application/pdf") {
        // Parse PDF directly
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } else {
        // Perform OCR on images using Tesseract.js
        const { data } = await Tesseract.recognize(filePath, "eng", {
          logger: () => {} // Suppress progress logging
        });
        extractedText = data.text;
      }
    } catch (parseError) {
      console.error("Text extraction failed:", parseError);
      return res.status(500).json({ success: false, message: "Failed to extract text from file." });
    } finally {
      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete temp upload:", err);
      }
    }

    // Check if the extracted text is empty (happens with scanned PDFs)
    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: "Could not read text from this PDF. If it's a scanned image, please upload it as a PNG or JPG instead, so our OCR engine can process it." 
      });
    }

    // --- Deterministic Regex Parsing ---
    let n = null;
    let p = null;
    let k = null;
    let ph = null;

    // Normalizing spacing and case for matching
    const normalizedText = extractedText.toLowerCase().replace(/\s+/g, " ");

    // Regex for Nitrogen (N)
    const nMatch = normalizedText.match(/(?:nitrogen|avail[^a-z]*n\b|\bn\s*\(kg|nitrogen\s*\(n\)|\bn\b\s*[:=\-])[^0-9]*(\d+(?:\.\d+)?)/);
    if (nMatch) n = parseFloat(nMatch[1]);

    // Regex for Phosphorus (P)
    const pMatch = normalizedText.match(/(?:phosphorus|avail[^a-z]*p\b|\bp\s*\(kg|phosphorus\s*\(p\)|phosphate|\bp\b\s*[:=\-])[^0-9]*(\d+(?:\.\d+)?)/);
    if (pMatch) p = parseFloat(pMatch[1]);

    // Regex for Potassium (K)
    const kMatch = normalizedText.match(/(?:potassium|avail[^a-z]*k\b|\bk\s*\(kg|potassium\s*\(k\)|potash|\bk\b\s*[:=\-])[^0-9]*(\d+(?:\.\d+)?)/);
    if (kMatch) k = parseFloat(kMatch[1]);

    // Regex for pH
    const phMatch = normalizedText.match(/(?:ph\s*level|soil\s*ph|reaction|\bph\b)[^0-9]*(\d+(?:\.\d+)?)/);
    if (phMatch) ph = parseFloat(phMatch[1]);

    res.json({
      success: true,
      data: {
        rawText: extractedText,
        extracted: {
          nitrogen: n,
          phosphorus: p,
          potassium: k,
          ph: ph
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during soil report analysis." });
  }
};

const getAdvisory = (req, res) => {
  try {
    const { nitrogen, phosphorus, potassium, ph } = req.body;

    const nVal = parseFloat(nitrogen);
    const pVal = parseFloat(phosphorus);
    const kVal = parseFloat(potassium);
    const phVal = parseFloat(ph);

    if (isNaN(nVal) || isNaN(pVal) || isNaN(kVal) || isNaN(phVal)) {
      return res.status(400).json({ success: false, message: "Valid N, P, K and pH values are required." });
    }

    // --- Deterministic Recommendations ---
    const recommendations = [];
    const status = {
      nitrogen: "Medium",
      phosphorus: "Medium",
      potassium: "Medium",
      ph: "Normal"
    };

    // pH checks
    if (phVal < 6.0) {
      status.ph = "Acidic";
      recommendations.push({
        title: "Soil Acidity Correction",
        titleHi: "मिट्टी की अम्लता सुधार",
        titleMr: "मातीची आम्लता सुधारणा",
        text: "Your soil is acidic. Apply Agricultural Lime (Calcium Carbonate) or Dolomite Lime (1.5 - 2 tons/acre) to raise pH. Avoid ammonium-based fertilizers.",
        textHi: "आपकी मिट्टी अम्लीय है। पीएच बढ़ाने के लिए कृषि चूना (कैल्शियम कार्बोनेट) या डोलोमाइट चूना (1.5 - 2 टन/एकड़) डालें। अमोनियम-आधारित उर्वरकों से बचें।",
        textMr: "तुमची माती आम्लयुक्त आहे. सामू (pH) वाढवण्यासाठी कृषी चुना (कॅल्शियम कार्बोनेट) किंवा डोलोमाइट चुना (1.5 - 2 टन/एकर) वापरा. अमोनियमयुक्त खते टाळा."
      });
    } else if (phVal > 7.5) {
      status.ph = "Alkaline";
      recommendations.push({
        title: "Soil Alkalinity Correction",
        titleHi: "मिट्टी की क्षारीयता सुधार",
        titleMr: "मातीची क्षारता सुधारणा",
        text: "Your soil is alkaline. Apply Gypsum (Calcium Sulfate, 1 - 1.5 tons/acre) or elemental sulfur. Incorporate organic mulch and compost to lower pH naturally.",
        textHi: "आपकी मिट्टी क्षारीय है। जिप्सम (कैल्शियम सल्फेट, 1 - 1.5 टन/एकड़) या सल्फर डालें। पीएच को प्राकृतिक रूप से कम करने के लिए जैविक खाद और गीली घास डालें।",
        textMr: "तुमची माती क्षारयुक्त आहे. जिप्सम (कॅल्शियम सल्फेट, 1 - 1.5 टन/एकर) किंवा गंधक वापरा. सेंद्रिय खत आणि पालापाचोळा टाकून सामू नैसर्गिकरित्या कमी करा."
      });
    }

    // Nitrogen checks (optimal range: 280 - 560 kg/ha)
    if (nVal < 280) {
      status.nitrogen = "Low";
      recommendations.push({
        title: "Nitrogen (N) Boost",
        titleHi: "नाइट्रोजन (N) वृद्धि",
        titleMr: "नायट्रोजन (N) वाढवणे",
        text: "Nitrogen is low. Apply Urea (50 kg/acre) split into 2-3 doses (sowing, tillering, jointing stages). Integrate cow dung manure or vermicompost. Grow leguminous cover crops.",
        textHi: "नाइट्रोजन कम है। यूरिया (50 किग्रा/एकड़) को 2-3 भागों में बांटकर डालें (बुवाई, कल्ले निकलने और गाँठ बनने के समय)। गोबर की खाद या वर्मीकंपोस्ट मिलाएं। दालों वाली फसलें उगाएं।",
        textMr: "नायट्रोजन कमी आहे. युरिया (50 किलो/एकर) 2-3 हप्त्यांमध्ये विभागून द्या (पेरणी, फुटवे फुटणे आणि वाढीच्या वेळेस). शेणखत किंवा गांडूळ खताचा वापर करा. द्विदल पिकांची लागवड करा."
      });
    } else if (nVal > 560) {
      status.nitrogen = "High";
      recommendations.push({
        title: "Nitrogen Management",
        titleHi: "नाइट्रोजन प्रबंधन",
        titleMr: "नायट्रोजन व्यवस्थापन",
        text: "Nitrogen is high. Reduce Urea usage to prevent excessive vegetative growth and pest vulnerability. Increase carbon-rich organic matter.",
        textHi: "नाइट्रोजन अधिक है। अत्यधिक पत्ती विकास और कीटों के खतरे को रोकने के लिए यूरिया का उपयोग कम करें। कार्बन युक्त जैविक कचरा मिलाएं।",
        textMr: "नायट्रोजन जास्त आहे. युरियाचा वापर कमी करा जेणेकरून अतिरिक्त शाकीय वाढ आणि कीड प्रादुर्भाव टळेल. सेंद्रिय पदार्थांचे प्रमाण वाढवा."
      });
    }

    // Phosphorus checks (optimal range: 22.5 - 56 kg/ha)
    if (pVal < 22.5) {
      status.phosphorus = "Low";
      recommendations.push({
        title: "Phosphorus (P) Supplement",
        titleHi: "फास्फोरस (P) पूरक",
        titleMr: "स्फुरद (P) पुरवठा",
        text: "Phosphorus is low. Apply Single Super Phosphate (SSP, 100 kg/acre) or DAP (30-40 kg/acre) close to the root zone at the time of sowing.",
        textHi: "फास्फोरस कम है। बुवाई के समय जड़ क्षेत्र के पास सिंगल सुपर फॉस्फेट (SSP, 100 किग्रा/एकड़) या डीएपी (30-40 किग्रा/एकड़) डालें।",
        textMr: "स्फुरद कमी आहे. पेरणीच्या वेळी मुळांजवळ सिंगल सुपर फॉस्फेट (SSP, 100 किलो/एकर) किंवा डीएपी (30-40 किलो/एकर) द्यावे."
      });
    } else if (pVal > 56) {
      status.phosphorus = "High";
      recommendations.push({
        title: "Phosphorus Lockout Avoidance",
        titleHi: "फास्फोरस अतिरेक बचाव",
        titleMr: "स्फुरद अतिरेक टाळणे",
        text: "Phosphorus is high. Avoid phosphate applications. High P locks out zinc and iron uptake, so apply foliar micronutrient sprays if crops yellow.",
        textHi: "फास्फोरस अधिक है। फॉस्फेट डालना बंद करें। अधिक पी से जिंक और आयरन का अवशोषण रुक जाता है, इसलिए जरूरत पड़ने पर सूक्ष्म पोषक तत्वों का छिड़काव करें।",
        textMr: "स्फुरद जास्त आहे. फॉस्फेट खतांचा वापर थांबवा. जास्त स्फुरदमुळे जस्त आणि लोह शोषून घेण्यास अडथळा येतो, त्यामुळे पिके पिवळी पडल्यास सूक्ष्म अन्नद्रव्यांची फवारणी करा."
      });
    }

    // Potassium checks (optimal range: 140 - 225 kg/ha)
    if (kVal < 140) {
      status.potassium = "Low";
      recommendations.push({
        title: "Potassium (K) Application",
        titleHi: "पोटेशियम (K) अनुप्रयोग",
        titleMr: "पालाश (K) वाढवणे",
        text: "Potassium is low. Apply Muriate of Potash (MOP, 20-30 kg/acre) at sowing or early growth. Wood ash is an excellent organic potassium alternative.",
        textHi: "पोटेशियम कम है। बुवाई या शुरुआती विकास के समय म्‍यूरिएट ऑफ पोटाश (MOP, 20-30 किग्रा/एकड़) डालें। लकड़ी की राख एक उत्कृष्ट जैविक विकल्प है।",
        textMr: "पालाश कमी आहे. पेरणीच्या वेळी किंवा सुरुवातीच्या काळात म्युरिएट ऑफ पोटॅश (MOP, 20-30 किलो/एकर) द्यावे. लाकडाची राख हा सेंद्रिय पालाशचा चांगला पर्याय आहे."
      });
    } else if (kVal > 225) {
      status.potassium = "High";
      recommendations.push({
        title: "Potassium Buffering",
        titleHi: "पोटेशियम संतुलन",
        titleMr: "पालाश संतुलन",
        text: "Potassium is high. Avoid potash fertilizers. Excessive K can inhibit magnesium absorption; monitor for magnesium deficiency symptoms.",
        textHi: "पोटेशियम अधिक है। पोटाश उर्वरकों से बचें। अत्यधिक पोटाश से मैग्नीशियम का अवशोषण कम हो सकता है; पत्तों की निगरानी करें।",
        textMr: "पालाश जास्त आहे. पोटॅश खतांचा वापर टाळा. जास्त पालाशमुळे मॅग्नेशियम शोषून घेण्यास अडथळा येतो; पानांवर लक्ष ठेवा."
      });
    }

    // Recommended Crops based on pH
    let recommendedCrops = [];
    if (phVal < 6.0) {
      recommendedCrops = [
        { name: "Potato", nameHi: "आलू", nameMr: "बटाटा", suitability: "High (Prefers acidic soils)" },
        { name: "Rice (Paddy)", nameHi: "धान / चावल", nameMr: "भात", suitability: "Medium (Tolerates moderate acidity)" },
        { name: "Tea", nameHi: "चाय", nameMr: "चहा", suitability: "High (Thrives in acidic soil)" },
        { name: "Sweet Potato", nameHi: "शकरकंद", nameMr: "रताळे", suitability: "High" }
      ];
    } else if (phVal > 7.5) {
      recommendedCrops = [
        { name: "Cotton", nameHi: "कपास", nameMr: "कापूस", suitability: "High (Tolerates alkaline soils)" },
        { name: "Barley", nameHi: "जौ", nameMr: "जव", suitability: "High (Good salt/alkali tolerance)" },
        { name: "Mustard", nameHi: "सरसों", nameMr: "मोहरी", suitability: "Medium" },
        { name: "Alfalfa", nameHi: "अल्फाल्फा", nameMr: "लसूण घास", suitability: "High" }
      ];
    } else {
      recommendedCrops = [
        { name: "Wheat", nameHi: "गेहूँ", nameMr: "गहू", suitability: "High (Perfect in neutral pH)" },
        { name: "Maize (Corn)", nameHi: "मक्का", nameMr: "मका", suitability: "High" },
        { name: "Tomato", nameHi: "टमाटर", nameMr: "टोमॅटो", suitability: "High" },
        { name: "Sugarcane", nameHi: "गन्ना", nameMr: "ऊस", suitability: "High" },
        { name: "Soybean", nameHi: "सोयाबीन", nameMr: "सोयाबीन", suitability: "High" }
      ];
    }

    res.json({
      success: true,
      data: {
        status,
        recommendations,
        crops: recommendedCrops,
        yieldBooster: "Balanced fertilization based on these results can increase yield by 18% to 26%."
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error calculating soil advisory." });
  }
};

const findLabs = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
    }

    let labs = [];

    // Query OpenStreetMap Nominatim for nearby agricultural / soil testing offices
    try {
      const queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=soil+testing+lab&lat=${lat}&lon=${lon}&addressdetails=1&limit=5`;
      const response = await axios.get(queryUrl, {
        headers: { "User-Agent": "AgriSense-App/1.0" }
      });

      if (response.data && response.data.length > 0) {
        labs = response.data.map(item => ({
          name: item.display_name.split(",")[0],
          address: item.display_name.split(",").slice(1, 4).join(", ").trim(),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          contact: "N/A"
        }));
      }
    } catch (osmError) {
      console.warn("OSM lab search failed, using fallbacks:", osmError.message);
    }

    // Merge or fallback if few labs are found
    if (labs.length < 3) {
      // Calculate distance to fallback labs and return the closest ones
      const distance = (la1, lo1, la2, lo2) => {
        return Math.sqrt(Math.pow(la1 - la2, 2) + Math.pow(lo1 - lo2, 2));
      };

      const sortedFallbacks = fallbackLabs
        .map(lab => ({
          ...lab,
          dist: distance(parseFloat(lat), parseFloat(lon), lab.lat, lab.lon)
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5 - labs.length);

      labs = [...labs, ...sortedFallbacks];
    }

    res.json({
      success: true,
      data: labs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching nearby soil labs." });
  }
};

module.exports = { analyzeReport, getAdvisory, findLabs };
