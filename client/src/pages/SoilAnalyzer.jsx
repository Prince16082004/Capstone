import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { FileUp, FileText, FlaskConical, MapPin, CheckCircle, RefreshCw, AlertTriangle, ArrowRight, Loader2, Landmark } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Resolve leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function SoilAnalyzer() {
  const { t, lang } = useLanguage();
  
  // File Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // NPK + pH input state (pre-filled by OCR, or manual input)
  const [soilForm, setSoilForm] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: ""
  });
  
  // Advisory result state
  const [advisory, setAdvisory] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Labs finder state
  const [labs, setLabs] = useState([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 19.0760, lon: 72.8777 }); // Default
  const [locationName, setLocationName] = useState("");

  const labMapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Detect location for labs finder
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lon: longitude });
          // Reverse geocode to get city name for UI
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            if (data.address) {
              setLocationName(data.address.city || data.address.district || data.address.state || "");
            }
          } catch {}
        },
        () => console.warn("Location permission denied for labs.")
      );
    }
  }, []);

  // Fetch and draw labs on coordinates change
  useEffect(() => {
    if (userCoords.lat && userCoords.lon) {
      fetchLabs(userCoords.lat, userCoords.lon);
    }
  }, [userCoords]);

  // Load OSM Map for labs
  const fetchLabs = async (lat, lon) => {
    setLoadingLabs(true);
    try {
      const res = await fetch(`/api/soil/labs?lat=${lat}&lon=${lon}`);
      const result = await res.json();
      if (result.success) {
        setLabs(result.data);
        drawMapWithLabs(lat, lon, result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLabs(false);
    }
  };

  const drawMapWithLabs = (lat, lon, labList) => {
    // If map not initialized, draw it
    if (!mapInstanceRef.current && labMapRef.current) {
      const map = L.map(labMapRef.current).setView([lat, lon], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add user marker
    const userMarker = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(map).bindPopup("<b>Your Farm Location</b>");
    markersRef.current.push(userMarker);

    // Add lab markers
    labList.forEach((lab) => {
      const marker = L.marker([lab.lat, lab.lon])
        .addTo(map)
        .bindPopup(`<b>${lab.name}</b><br/>${lab.address}<br/>Contact: ${lab.contact}`);
      markersRef.current.push(marker);
    });

    // Center map
    if (labList.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    } else {
      map.setView([lat, lon], 10);
    }
  };

  // Handle Drag Over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle Drop File
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input Select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile) => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMessage("Unsupported file type. Please upload a PNG, JPG, or PDF file.");
      return;
    }
    setFile(selectedFile);
    setErrorMessage("");
  };

  // Call OCR service on server
  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("report", file);

    try {
      const res = await fetch("/api/soil/analyze", {
        method: "POST",
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        const { extracted } = result.data;
        setSoilForm({
          nitrogen: extracted.nitrogen !== null ? String(extracted.nitrogen) : "",
          phosphorus: extracted.phosphorus !== null ? String(extracted.phosphorus) : "",
          potassium: extracted.potassium !== null ? String(extracted.potassium) : "",
          ph: extracted.ph !== null ? String(extracted.ph) : ""
        });
      } else {
        setErrorMessage(result.message || "Failed to analyze document.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error connecting to analysis module.");
    } finally {
      setUploading(false);
    }
  };

  // Call Advisory Recommendation engine
  const handleCalculateAdvisory = async (e) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await fetch("/api/soil/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soilForm)
      });
      const result = await res.json();
      if (result.success) {
        setAdvisory(result.data);
      } else {
        setErrorMessage(result.message || "Calculations failed.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to calculate results.");
    } finally {
      setCalculating(false);
    }
  };

  const getStatusColor = (val) => {
    switch (val) {
      case "Optimal":
      case "Medium":
      case "Normal":
      case "Neutral (Optimal)":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Low":
      case "Acidic":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "High":
      case "Alkaline":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getAdvisoryTitle = (rec) => {
    if (lang === "hi" && rec.titleHi) return rec.titleHi;
    if (lang === "mr" && rec.titleMr) return rec.titleMr;
    return rec.title;
  };

  const getAdvisoryText = (rec) => {
    if (lang === "hi" && rec.textHi) return rec.textHi;
    if (lang === "mr" && rec.textMr) return rec.textMr;
    return rec.text;
  };

  const getCropName = (crop) => {
    if (lang === "hi" && crop.nameHi) return crop.nameHi;
    if (lang === "mr" && crop.nameMr) return crop.nameMr;
    return crop.name;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark mb-3">
            🧪 {t("soilAnalyzerBadge")}
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
            {t("soilAnalyzerTitle")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("soilAnalyzerSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: OCR Scanned Document Upload & Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Upload Zone */}
            <div className="glass p-6 rounded-3xl flex flex-col gap-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> {t("uploadReport")}
              </h3>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative"
              >
                <input
                  type="file"
                  id="soil-file-input"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileUp className="h-10 w-10 text-primary/60 mb-2" />
                <span className="text-xs font-bold text-foreground">
                  {file ? file.name : "Drag & drop report or click to browse"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Supports PNG, JPG, or PDF (Max 5MB)
                </span>
              </div>

              {errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  {errorMessage}
                </div>
              )}

              {file && (
                <button
                  onClick={handleUploadAndAnalyze}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-gradient text-xs font-bold transition disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      {t("analyzingReport")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {lang === "hi" ? "ओसीआर पढ़ें" : lang === "mr" ? "अहवाल वाचा" : "Scan with OCR"}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Verification Form */}
            <form onSubmit={handleCalculateAdvisory} className="glass p-6 rounded-3xl flex flex-col gap-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" /> {t("verifyData")}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold block mb-1 text-muted-foreground uppercase">{t("nitrogen")}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 320"
                    value={soilForm.nitrogen}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogen: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 text-muted-foreground uppercase">{t("phosphorus")}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 15"
                    value={soilForm.phosphorus}
                    onChange={(e) => setSoilForm({ ...soilForm, phosphorus: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 text-muted-foreground uppercase">{t("potassium")}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 120"
                    value={soilForm.potassium}
                    onChange={(e) => setSoilForm({ ...soilForm, potassium: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1 text-muted-foreground uppercase">{t("soilPh")}</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 6.5"
                    value={soilForm.ph}
                    onChange={(e) => setSoilForm({ ...soilForm, ph: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl btn-gradient text-xs font-bold text-white transition disabled:opacity-50"
              >
                {calculating ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CheckCircle className="h-4 w-4" />}
                {t("analyzeButton")}
              </button>
            </form>
          </div>

          {/* Right Column: Advisory & Lab Finder */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Advisory Result */}
            {advisory ? (
              <div className="glass p-6 rounded-3xl flex flex-col gap-5">
                <div className="border-b border-primary/10 pb-3">
                  <h3 className="text-lg font-bold text-foreground">{t("reportNPKSummary")}</h3>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold mt-1 inline-block border border-emerald-100">
                    🌱 {advisory.yieldBooster}
                  </span>
                </div>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(advisory.status).map(([metric, status]) => (
                    <div key={metric} className={`border rounded-2xl p-3 flex flex-col text-center ${getStatusColor(status)}`}>
                      <span className="text-[10px] font-bold uppercase opacity-80">{metric}</span>
                      <span className="text-sm font-extrabold mt-1">{status}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  {advisory.recommendations.map((rec, i) => (
                    <div key={i} className="bg-primary/5 border border-primary/15 p-4 rounded-2xl">
                      <h4 className="font-bold text-sm text-primary-dark flex items-center gap-2">
                        💡 {getAdvisoryTitle(rec)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {getAdvisoryText(rec)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Suitable Crops */}
                <div className="bg-white/50 border border-primary/10 rounded-2xl p-4">
                  <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                    🌾 Recommended Crops
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {advisory.crops.map((crop, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-primary/10 last:border-b-0">
                        <span className="font-bold text-primary-dark">{getCropName(crop)}</span>
                        <span className="text-muted-foreground text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{crop.suitability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass p-8 text-center rounded-3xl text-muted-foreground text-xs flex flex-col items-center justify-center gap-3">
                <FlaskConical className="h-10 w-10 text-primary/40 animate-pulse" />
                <span>Upload a soil report or fill NPK & pH data manually to generate agricultural advice.</span>
              </div>
            )}

            {/* Labs Finder Map */}
            <div className="glass p-6 rounded-3xl flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> {t("labFinderTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{t("labFinderSubtitle")} {locationName && `(${locationName})`}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* Maps Column */}
                <div className="md:col-span-7 h-64 rounded-2xl overflow-hidden border border-primary/20 z-10">
                  <div id="labs-map" ref={labMapRef} className="h-full w-full" />
                </div>

                {/* List Column */}
                <div className="md:col-span-5 flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {loadingLabs ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Locating labs...</span>
                    </div>
                  ) : labs.length > 0 ? (
                    labs.map((lab, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition cursor-pointer flex flex-col gap-1">
                        <h4 className="font-bold text-xs text-foreground leading-snug line-clamp-1">{lab.name}</h4>
                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{lab.address}</p>
                        {lab.contact !== "N/A" && (
                          <span className="text-[10px] font-bold text-primary mt-0.5">📞 {lab.contact}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-muted-foreground py-10">No nearby labs detected.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
