const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// ── Comprehensive database of National & State Agricultural Schemes ──
const governmentSchemes = {
  subsidies: [
    // National Subsidies
    {
      id: "sub-nat-1",
      name: "Soil Health Card Scheme",
      nameHi: "मृदा स्वास्थ्य कार्ड योजना",
      nameMr: "मृदा आरोग्य कार्ड योजना",
      description: "Free soil testing and nutrient-based fertilizer recommendations. Government subsidizes the testing cost.",
      descHi: "मुफ्त मिट्टी परीक्षण और पोषक तत्व-आधारित उर्वरक सिफारिशें। सरकार परीक्षण लागत पर सब्सिडी देती है।",
      descMr: "मोफत माती परीक्षण आणि पोषक तत्वावर आधारित खत शिफारसी. सरकार चाचणी खर्चावर अनुदान देते.",
      link: "https://soilhealth.dac.gov.in/",
      amount: "Free Testing",
      category: "Soil Health",
      states: "all"
    },
    {
      id: "sub-nat-2",
      name: "Paramparagat Krishi Vikas Yojana (PKVY)",
      nameHi: "परंपरागत कृषि विकास योजना",
      nameMr: "परंपरागत कृषी विकास योजना",
      description: "Promotes organic farming with ₹50,000/ha financial assistance over 3 years for cluster-based organic farming.",
      descHi: "क्लस्टर-आधारित जैविक खेती के लिए 3 वर्षों में ₹50,000/हेक्टेयर वित्तीय सहायता के साथ जैविक खेती को बढ़ावा।",
      descMr: "क्लस्टर-आधारित सेंद्रिय शेतीसाठी 3 वर्षांत ₹50,000/हेक्टर आर्थिक सहाय्यासह सेंद्रिय शेतीला प्रोत्साहन.",
      link: "https://pgsindia-ncof.gov.in/PKVY/Index.aspx",
      amount: "₹50,000/ha",
      category: "Organic Farming",
      states: "all"
    },
    {
      id: "sub-nat-3",
      name: "National Mission on Micro Irrigation (PMKSY-PDMC)",
      nameHi: "सूक्ष्म सिंचाई पर राष्ट्रीय मिशन",
      nameMr: "सूक्ष्म सिंचनावर राष्ट्रीय मिशन",
      description: "55% subsidy for small farmers and 45% for others on drip and sprinkler irrigation systems.",
      descHi: "ड्रिप और स्प्रिंकलर सिंचाई प्रणालियों पर छोटे किसानों के लिए 55% और अन्य के लिए 45% सब्सिडी।",
      descMr: "ठिबक आणि तुषार सिंचन प्रणालींवर लहान शेतकऱ्यांना 55% आणि इतरांना 45% अनुदान.",
      link: "https://pmksy.gov.in/",
      amount: "45-55% Subsidy",
      category: "Irrigation",
      states: "all"
    },
    {
      id: "sub-nat-4",
      name: "Sub-Mission on Agricultural Mechanization (SMAM)",
      nameHi: "कृषि मशीनीकरण उप-मिशन",
      nameMr: "कृषी यांत्रिकीकरण उप-मिशन",
      description: "40-50% subsidy on purchase of farm machinery including tractors, harvesters, power tillers, and rotavators.",
      descHi: "ट्रैक्टर, हार्वेस्टर और टिलर सहित कृषि मशीनरी की खरीद पर 40-50% सब्सिडी।",
      descMr: "ट्रॅक्टर, हार्वेस्टर आणि टिलर यासह शेती यंत्रसामुग्री खरेदीवर 40-50% अनुदान.",
      link: "https://agrimachinery.nic.in/",
      amount: "40-50% Subsidy",
      category: "Mechanization",
      states: "all"
    },
    
    // Gujarat Specific Subsidies
    {
      id: "sub-guj-1",
      name: "Suryashakti Kisan Yojana (SKY) - Solar Pumps",
      nameHi: "सूर्यशक्ति किसान योजना (SKY) - सौर पंप",
      nameMr: "सूर्यशक्ती किसान योजना (SKY) - सौर पंप",
      description: "Gujarat state subsidy providing 60% financial assistance for solar water pump installation to reduce dependency on grid power.",
      descHi: "ग्रिड बिजली पर निर्भरता कम करने के लिए सोलर वाटर पंप स्थापना हेतु गुजरात सरकार द्वारा 60% वित्तीय सहायता।",
      descMr: "ग्रीड वीज जोडणीवरील अवलंबित्व कमी करण्यासाठी सौर पाणी पंप स्थापनेसाठी गुजरात सरकारचे ६०% आर्थिक अनुदान.",
      link: "https://ikhedut.gujarat.gov.in/",
      amount: "60% Solar Subsidy",
      category: "Irrigation & Energy",
      states: ["Gujarat"]
    },
    {
      id: "sub-guj-2",
      name: "Gujarat Tractor & Farm Equipment Assistance",
      nameHi: "गुजरात ट्रैक्टर एवं कृषि उपकरण सहायता",
      nameMr: "गुजरात ट्रॅक्टर व कृषी अवजारे साहाय्य",
      description: "Gujarat state subsidy offering ₹45,000 to ₹60,000 assistance for small/marginal farmers for purchasing new tractors.",
      descHi: "नए ट्रैक्टर खरीदने के लिए छोटे/सीमांत किसानों को ₹45,000 से ₹60,000 की वित्तीय सहायता गुजरात सरकार द्वारा।",
      descMr: "नवीन ट्रॅक्टर खरेदीसाठी अल्पभूधारक शेतकऱ्यांना ₹४५,००० ते ₹६०,००० चे अनुदान गुजरात शासनाद्वारे.",
      link: "https://ikhedut.gujarat.gov.in/",
      amount: "₹45,000 - ₹60,000",
      category: "Mechanization",
      states: ["Gujarat"]
    },

    // Maharashtra Specific Subsidies
    {
      id: "sub-mah-1",
      name: "MahaUrja Solar Pump Subsidy Scheme",
      nameHi: "महाऊर्जा सौर पंप सब्सिडी योजना",
      nameMr: "महाऊर्जा सौर पंप योजना",
      description: "Maharashtra state subsidy providing off-grid solar agricultural pumps with up to 90% subsidy for SC/ST and 95% for other farmers.",
      descHi: "अनुसूचित जाति/जनजाति के लिए 90% और अन्य किसानों के लिए 95% तक की सब्सिडी के साथ सौर कृषि पंप प्रदान करना।",
      descMr: "महाराष्ट्र राज्यातील शेतकऱ्यांसाठी ९०% ते ९५% पर्यंतच्या अनुदानावर कृषी सौर पंप उपलब्ध करून देणे.",
      link: "https://www.mahadiscom.in/solar-mskyp/",
      amount: "90-95% Subsidy",
      category: "Irrigation & Energy",
      states: ["Maharashtra"]
    },

    // Karnataka Specific Subsidies
    {
      id: "sub-kar-1",
      name: "Karnataka Krishi Bhagya Scheme",
      nameHi: "कर्नाटक कृषि भाग्य योजना",
      nameMr: "कर्नाटक कृषी भाग्य योजना",
      description: "Karnataka state subsidy of 50-90% to dryland farmers for constructing farm ponds and installing water lifting pump sets.",
      descHi: "शुष्क भूमि के किसानों को कृषि तालाब बनाने और पानी उठाने वाले पंप सेट स्थापित करने के लिए 50-90% की सब्सिडी।",
      descMr: "कर्नाटकातील कोरडवाहू शेतकऱ्यांसाठी शेततळे खोदणे आणि पंप संच बसवण्यासाठी ५०% ते ९०% पर्यंतचे अनुदान.",
      link: "https://raitamitra.karnataka.gov.in/",
      amount: "50-90% Subsidy",
      category: "Irrigation",
      states: ["Karnataka"]
    },

    // Uttar Pradesh Specific Subsidies
    {
      id: "sub-up-1",
      name: "UP Free Borewell Scheme",
      nameHi: "यूपी मुफ्त बोरिंग योजना",
      nameMr: "यूपी मोफत बोरिंग योजना",
      description: "Uttar Pradesh state subsidy providing free boring facilities and financial grants of up to ₹10,000 for installing pumps.",
      descHi: "उत्तर प्रदेश राज्य सरकार द्वारा पंप स्थापित करने के लिए मुफ्त बोरिंग सुविधाएं और ₹10,000 तक का वित्तीय अनुदान।",
      descMr: "उत्तर प्रदेश शासनातर्फे पंप बसवण्यासाठी मोफत बोअरिंग सुविधा आणि ₹१०,००० पर्यंतचे अनुदान.",
      link: "http://upagriculture.com/",
      amount: "₹10,000 Grant",
      category: "Irrigation",
      states: ["Uttar Pradesh"]
    }
  ],

  insurance: [
    // National Insurance
    {
      id: "ins-nat-1",
      name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      nameHi: "प्रधानमंत्री फसल बीमा योजना",
      nameMr: "प्रधानमंत्री पीक विमा योजना",
      description: "Crop insurance at just 2% premium for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops.",
      descHi: "खरीफ के लिए सिर्फ 2%, रबी के लिए 1.5% और व्यावसायिक/बागवानी फसलों के लिए 5% प्रीमियम पर फसल बीमा।",
      descMr: "खरीप पिकांसाठी फक्त 2%, रब्बीसाठी 1.5% आणि व्यावसायिक/बागायती पिकांसाठी 5% प्रीमियमवर पीक विमा.",
      link: "https://pmfby.gov.in/",
      premium: "1.5-5%",
      coverage: "Full Sum Insured",
      category: "Crop Insurance",
      states: "all"
    },
    {
      id: "ins-nat-2",
      name: "Weather-Based Crop Insurance Scheme (WBCIS)",
      nameHi: "मौसम आधारित फसल बीमा योजना",
      nameMr: "हवामान आधारित पीक विमा योजना",
      description: "Insurance payouts triggered automatically when weather parameters (rainfall, temperature, humidity) deviate from thresholds.",
      descHi: "जब मौसम पैरामीटर (वर्षा, तापमान, आर्द्रता) सीमा से विचलित होते हैं तो स्वचालित रूप से बीमा भुगतान।",
      descMr: "हवामानाचे पॅरामीटर्स (पाऊस, तापमान, आर्द्रता) सीमांपासून विचलित झाल्यावर स्वयंचलित विमा देयके.",
      link: "https://pmfby.gov.in/",
      premium: "Subsidized",
      coverage: "Weather-linked",
      category: "Weather Insurance",
      states: "all"
    },

    // Gujarat Specific Crop Insurance
    {
      id: "ins-guj-1",
      name: "Mukhya Mantri Kisan Sahay Yojana (MMKSY) - Gujarat",
      nameHi: "मुख्यमंत्री किसान सहाय योजना - गुजरात",
      nameMr: "मुख्यमंत्री किसान सहाय योजना - गुजरात",
      description: "Gujarat government's crop protection scheme covering losses due to drought, heavy rainfall, or unseasonal rain. Offers ₹20,000 - ₹25,000/hectare assistance. Premium is 100% free for farmers.",
      descHi: "सूखे, भारी बारिश या बेमौसम बारिश के नुकसान के लिए ₹20,000 - ₹25,000/हेक्टेयर की सहायता। प्रीमियम किसानों के लिए 100% मुफ्त है।",
      descMr: "दुष्काळ, मुसळधार पाऊस किंवा अवकाळी पावसामुळे होणाऱ्या नुकसानीसाठी ₹२०,००० ते ₹२५,००० प्रति हेक्टर मदत. प्रीमियम पूर्णपणे मोफत आहे.",
      link: "https://ikhedut.gujarat.gov.in/",
      premium: "Free (0%)",
      coverage: "Up to 4 Hectares",
      category: "Crop Assistance",
      states: ["Gujarat"]
    },

    // Maharashtra Specific Crop Insurance
    {
      id: "ins-mah-1",
      name: "Maha 1 Rupee Crop Insurance Scheme",
      nameHi: "महाराष्ट्र ₹1 फसल बीमा योजना",
      nameMr: "महाराष्ट्र १ रुपया पीक विमा योजना",
      description: "Maharashtra state initiative allowing farmers to secure crops under PMFBY by paying a premium of only ₹1. The state pays the rest.",
      descHi: "महाराष्ट्र सरकार की पहल जिसके तहत किसान केवल ₹1 प्रीमियम देकर पीएमएफबीवाई के तहत फसल बीमा ले सकते हैं। बाकी प्रीमियम राज्य सरकार देगी।",
      descMr: "शेतकऱ्यांना केवळ १ रुपयात पीक विमा उपलब्ध करून देणारी महाराष्ट्र शासनाची योजना. उर्वरित प्रीमियम शासन भरते.",
      link: "https://krishi.maharashtra.gov.in/",
      premium: "₹1 Only",
      coverage: "Standard PMFBY",
      category: "Crop Insurance",
      states: ["Maharashtra"]
    }
  ],

  schemes: [
    // National Schemes
    {
      id: "sch-nat-1",
      name: "PM-KISAN Samman Nidhi",
      nameHi: "पीएम-किसान सम्मान निधि",
      nameMr: "पीएम-किसान सन्मान निधी",
      description: "Direct income support of ₹6,000/year to small & marginal farmer families, paid in 3 installments of ₹2,000.",
      descHi: "छोटे और सीमांत किसान परिवारों को ₹6,000/वर्ष की प्रत्यक्ष आय सहायता, ₹2,000 की 3 किस्तों में।",
      descMr: "लहान व अल्पभूधारक शेतकरी कुटुंबांना ₹6,000/वर्ष प्रत्यक्ष उत्पन्न सहाय्य, ₹2,000 च्या 3 हप्त्यांमध्ये.",
      link: "https://pmkisan.gov.in/",
      benefit: "₹6,000/year",
      category: "Income Support",
      states: "all"
    },
    {
      id: "sch-nat-2",
      name: "Kisan Credit Card (KCC)",
      nameHi: "किसान क्रेडिट कार्ड",
      nameMr: "किसान क्रेडिट कार्ड",
      description: "Short-term crop loans at 4% interest (after prompt repayment subsidy) up to ₹3 lakh. No collateral for loans up to ₹1.6 lakh.",
      descHi: "₹3 लाख तक 4% ब्याज (सब्सिडी के बाद) पर अल्पकालिक फसल ऋण। ₹1.6 लाख तक के ऋण के लिए कोई गारंटी नहीं।",
      descMr: "₹३ लाखांपर्यंत ४% व्याजावर अल्पमुदतीचे पीक कर्ज. ₹१.६ लाखांपर्यंतच्या कर्जासाठी तारण आवश्यक नाही.",
      link: "https://www.nabard.org/content.aspx?id=592",
      benefit: "4% Interest Loans",
      category: "Credit/Loans",
      states: "all"
    },
    {
      id: "sch-nat-3",
      name: "e-NAM (National Agriculture Market)",
      nameHi: "ई-नाम (राष्ट्रीय कृषि बाजार)",
      nameMr: "ई-नाम (राष्ट्रीय कृषी बाजार)",
      description: "Online trading platform connecting 1,000+ mandis. Sell crops at best prices directly without middlemen.",
      descHi: "1,000+ मंडियों को जोड़ने वाला ऑनलाइन ट्रेडिंग प्लेटफ़ॉर्म। बिचौलियों के बिना सर्वोत्तम मूल्य पर फसल बेचें।",
      descMr: "१,०००+ बाजारपेठा जोडणारे ऑनलाइन ट्रेडिंग प्लॅटफॉर्म. दलालांशिवाय थेट बाजारात पीक विक्री करा.",
      link: "https://enam.gov.in/",
      benefit: "Direct Market Access",
      category: "Market & Trading",
      states: "all"
    },
    {
      id: "sch-nat-4",
      name: "PM Krishi Sinchai Yojana (PMKSY)",
      nameHi: "पीएम कृषि सिंचाई योजना",
      nameMr: "पीएम कृषी सिंचन योजना",
      description: "Har Khet Ko Paani — aims to expand cultivable area under irrigation, improve water use efficiency on farms.",
      descHi: "हर खेत को पानी — सिंचाई के तहत खेती योग्य क्षेत्र का विस्तार, खेतों में जल उपयोग दक्षता में सुधार।",
      descMr: "हर खेत को पाणी — सिंचनाखालील शेतजमिनीचा विस्तार, शेतांमध्ये पाणी वापर कार्यक्षमता सुधारणे.",
      link: "https://pmksy.gov.in/",
      benefit: "Irrigation Infrastructure",
      category: "Irrigation Infrastructure",
      states: "all"
    },

    // Gujarat Specific Schemes
    {
      id: "sch-guj-1",
      name: "Saat Pagla Kalyanna Scheme - Gujarat",
      nameHi: "सात पगला कल्याण योजना - गुजरात",
      nameMr: "सात पावले कल्याण योजना - गुजरात",
      description: "Gujarat state initiative providing financial help for mobile storage units, agricultural tool kits, and direct transport assistance.",
      descHi: "मोबाइल स्टोरेज यूनिट, कृषि टूल किट और फसल ले जाने के लिए परिवहन सहायता प्रदान करने वाली गुजरात सरकार की योजना।",
      descMr: "कृषी अवजारे किट, भाजीपाला साठवणूक आणि थेट वाहतूक खर्चासाठी आर्थिक मदत देणारी गुजरात शासनाची योजना.",
      link: "https://ikhedut.gujarat.gov.in/",
      benefit: "Toolkits & Storage Subvention",
      category: "Welfare & Logistics",
      states: ["Gujarat"]
    },

    // Maharashtra Specific Schemes
    {
      id: "sch-mah-1",
      name: "Namo Shetkari Mahasanman Nidhi Yojana",
      nameHi: "नमो शेतकरी महासन्मान निधी योजना",
      nameMr: "नमो शेतकरी महासन्मान निधी योजना",
      description: "Maharashtra state benefit matching PM-KISAN, giving an additional ₹6,000/year to farmers (total ₹12,000/year).",
      descHi: "महाराष्ट्र सरकार की योजना जो पीएम-किसान के समान अतिरिक्त ₹6,000/वर्ष प्रदान करती है (कुल ₹12,000/वर्ष)।",
      descMr: "पीएम-किसान योजनेच्या धर्तीवर महाराष्ट्र शासनाकडून अतिरिक्त ₹६,०००/वर्ष मानधन (एकूण ₹१२,०००/वर्ष).",
      link: "https://mahadbt.maharashtra.gov.in/",
      benefit: "₹6,000/year Add-on",
      category: "Income Support",
      states: ["Maharashtra"]
    },

    // Karnataka Specific Schemes
    {
      id: "sch-kar-1",
      name: "Karnataka Ganga Kalyana Scheme",
      nameHi: "कर्नाटक गंगा कल्याण योजना",
      nameMr: "कर्नाटक गंगा कल्याण योजना",
      description: "Karnataka government drills borewells and installs water pump sets with complete subsidy up to ₹2.5 lakh for SC/ST and OBC farmers.",
      descHi: "कर्नाटक सरकार द्वारा अनुसूचित जाति/जनजाति और ओबीसी किसानों के लिए ₹2.5 लाख तक की सब्सिडी के साथ बोरवेल सुविधा।",
      descMr: "कर्नाटक सरकार द्वारे अल्पसंख्याक व मागासवर्गीय शेतकऱ्यांसाठी ₹२.५ लाखांपर्यंतच्या अनुदानावर बोअरवेल योजना.",
      link: "https://karnataka.gov.in/",
      benefit: "Borewells & Pump Grant",
      category: "Welfare & Water",
      states: ["Karnataka"]
    }
  ]
};

// State mapping from coordinates (approximate bounding boxes for Indian states)
const stateFromCoords = (lat, lon) => {
  if (lat >= 15.6 && lat <= 20.0 && lon >= 72.6 && lon <= 80.9) return "Maharashtra";
  if (lat >= 12.0 && lat <= 19.0 && lon >= 76.0 && lon <= 84.7) return "Andhra Pradesh";
  if (lat >= 29.5 && lat <= 32.5 && lon >= 73.8 && lon <= 76.9) return "Punjab";
  if (lat >= 20.0 && lat <= 26.8 && lon >= 68.1 && lon <= 74.0) return "Gujarat";
  if (lat >= 23.0 && lat <= 30.5 && lon >= 77.0 && lon <= 84.6) return "Uttar Pradesh";
  if (lat >= 21.0 && lat <= 27.2 && lon >= 75.5 && lon <= 82.8) return "Madhya Pradesh";
  if (lat >= 11.0 && lat <= 15.5 && lon >= 74.0 && lon <= 78.0) return "Karnataka";
  if (lat >= 8.0 && lat <= 12.8 && lon >= 76.2 && lon <= 80.3) return "Tamil Nadu";
  if (lat >= 25.5 && lat <= 30.4 && lon >= 69.5 && lon <= 78.2) return "Rajasthan";
  return "India";
};

const getNearbySchemes = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    let stateName = "India";
    let displayName = "India";
    if (lat && lon) {
      stateName = stateFromCoords(parseFloat(lat), parseFloat(lon));
      displayName = stateName;
      // Try reverse geocode from OSM for precise location
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          { headers: { "User-Agent": "AgriSense-App/1.0" } }
        );
        const osmData = await osmRes.json();
        if (osmData.address?.state) {
          stateName = osmData.address.state;
          const localArea = osmData.address.city || osmData.address.town || osmData.address.county;
          displayName = localArea ? `${localArea} (${stateName})` : stateName;
        }
      } catch (err) {
        console.warn("Nominatim reverse geocode failed, using bbox fallback:", err.message);
      }
    }

    // Filter helper function - strictly by state to show ONLY that state's schemes (user requested "only surat(states )")
    const filterByState = (list, state) => {
      return list.filter(item => {
        // If the location is India, show National schemes. Otherwise, show strictly state schemes.
        if (state === "India" && item.states === "all") return true;
        
        if (Array.isArray(item.states)) {
          return item.states.some(s => s.toLowerCase() === state.toLowerCase());
        }
        return item.states.toLowerCase() === state.toLowerCase();
      });
    };

    const filteredSubsidies = filterByState(governmentSchemes.subsidies, stateName);
    const filteredInsurance = filterByState(governmentSchemes.insurance, stateName);
    const filteredSchemes = filterByState(governmentSchemes.schemes, stateName);

    res.json({
      success: true,
      data: {
        location: displayName,
        subsidies: filteredSubsidies,
        insurance: filteredInsurance,
        schemes: filteredSchemes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching government schemes." });
  }
};

module.exports = { getNearbySchemes };
