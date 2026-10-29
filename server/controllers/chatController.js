const botKnowledge = [
  {
    keywords: ["weather", "rain", "monsoon", "temperature", "forecast"],
    response: "🌤️ You can check hyper-local weather forecasts on our **Weather Page**! It includes 7-day precipitation risk, temperature alerts, and customized agricultural guidance based on live satellite feeds."
  },
  {
    keywords: ["fertilizer", "urea", "dap", "mop", "npk", "nutrient", "soil test"],
    response: "🧪 For exact NPK fertilizer dosages, visit our **Fertilizer Recommendation** tool. Input your soil NPK levels, and it calculates commercial bag requirements (Urea, DAP, MOP) with top-dressing schedules!"
  },
  {
    keywords: ["disease", "pest", "leaf", "spot", "blight", "fungus", "insect", "photo"],
    response: "🐛 Experiencing crop issues? Go to **Disease Detection** to upload a leaf photograph. Our AI vision system diagnoses fungal/bacterial infections and provides immediate treatment steps!"
  },
  {
    keywords: ["water", "irrigate", "drip", "irrigation", "pump", "watering"],
    response: "💧 Smart irrigation saves up to 40% water! Check out our **Irrigation Advisory** tool to get tailored watering schedules (liters/acre) based on your crop stage and soil moisture."
  },
  {
    keywords: ["price", "mandi", "market", "rate", "sell", "msp"],
    response: "📈 Live Mandi prices across 500+ markets in India are available on our **Market Prices** page. Track real-time prices for Paddy, Wheat, Cotton, Mustard, and Vegetables with 6-month trends!"
  },
  {
    keywords: ["crop", "plant", "grow", "recommend", "season", "sow"],
    response: "🌱 Want to know which crop will give you maximum profit this season? Use our **Crop Recommendation** feature! It analyzes your soil type, pH, rainfall, and season to find top-yielding matches."
  },
  {
    keywords: ["hello", "hi", "hey", "namaste"],
    response: "🙏 Namaste! I am your **AgriSense AI Assistant**. How can I help your farm today? Ask me about weather, crop recommendations, disease treatment, market rates, or irrigation."
  }
];

const handleChat = (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required." });

    const lower = message.toLowerCase();
    let reply = "🌱 I am AgriSense Assistant. You can ask me about **Crop Recommendations**, **Weather Forecasts**, **Disease Diagnostics**, **Fertilizers**, or **Mandi Prices**! Select any tool from the main navigation to get started.";

    for (const item of botKnowledge) {
      if (item.keywords.some(kw => lower.includes(kw))) {
        reply = item.response;
        break;
      }
    }

    res.json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Chat server error." });
  }
};

module.exports = { handleChat };
