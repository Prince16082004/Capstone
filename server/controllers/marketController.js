const marketData = [
  { id: 1, crop: "Paddy (Rice - Common)", market: "Azampur Mandi", state: "Uttar Pradesh", modalPrice: 2183, minPrice: 2100, maxPrice: 2250, change: "+1.2%", trend: "up", msp: 2183 },
  { id: 2, crop: "Wheat (Sharbati)", market: "Khanna Mandi", state: "Punjab", modalPrice: 2450, minPrice: 2350, maxPrice: 2520, change: "+2.5%", trend: "up", msp: 2275 },
  { id: 3, crop: "Cotton (Medium Staple)", market: "Rajkot Mandi", state: "Gujarat", modalPrice: 6850, minPrice: 6500, maxPrice: 7100, change: "-0.8%", trend: "down", msp: 6620 },
  { id: 4, crop: "Maize (Yellow)", market: "Davangere Mandi", state: "Karnataka", modalPrice: 2220, minPrice: 2100, maxPrice: 2300, change: "+0.5%", trend: "up", msp: 2090 },
  { id: 5, crop: "Soybean (Yellow)", market: "Indore Mandi", state: "Madhya Pradesh", modalPrice: 4720, minPrice: 4500, maxPrice: 4900, change: "-1.5%", trend: "down", msp: 4892 },
  { id: 6, crop: "Mustard (Black)", market: "Bharatpur Mandi", state: "Rajasthan", modalPrice: 5890, minPrice: 5650, maxPrice: 6050, change: "+3.1%", trend: "up", msp: 5650 },
  { id: 7, crop: "Tomato (Hybrid)", market: "Kolar Mandi", state: "Karnataka", modalPrice: 2800, minPrice: 2200, maxPrice: 3400, change: "+8.4%", trend: "up", msp: "N/A" },
  { id: 8, crop: "Onion (Red)", market: "Lasalgaon Mandi", state: "Maharashtra", modalPrice: 1950, minPrice: 1600, maxPrice: 2300, change: "-4.2%", trend: "down", msp: "N/A" },
  { id: 9, crop: "Potato (Jyoti)", market: "Hooghly Mandi", state: "West Bengal", modalPrice: 1650, minPrice: 1450, maxPrice: 1850, change: "+0.0%", trend: "neutral", msp: "N/A" },
  { id: 10, crop: "Chickpea (Gram)", market: "Latur Mandi", state: "Maharashtra", modalPrice: 5620, minPrice: 5400, maxPrice: 5800, change: "+1.8%", trend: "up", msp: 5440 }
];

const historicalTrends = [
  { month: "Jan", paddy: 2100, wheat: 2250, cotton: 6700, mustard: 5400 },
  { month: "Feb", paddy: 2120, wheat: 2280, cotton: 6750, mustard: 5500 },
  { month: "Mar", paddy: 2140, wheat: 2310, cotton: 6680, mustard: 5600 },
  { month: "Apr", paddy: 2150, wheat: 2350, cotton: 6720, mustard: 5650 },
  { month: "May", paddy: 2165, wheat: 2390, cotton: 6800, mustard: 5720 },
  { month: "Jun", paddy: 2183, wheat: 2450, cotton: 6850, mustard: 5890 }
];

const getMarketPrices = (req, res) => {
  const { search, state } = req.query;
  let filtered = [...marketData];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(item => item.crop.toLowerCase().includes(q) || item.market.toLowerCase().includes(q));
  }
  if (state) {
    filtered = filtered.filter(item => item.state.toLowerCase() === state.toLowerCase());
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
    historical: historicalTrends,
    lastUpdated: new Date().toISOString()
  });
};

module.exports = { getMarketPrices };
