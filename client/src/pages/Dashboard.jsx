import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useFarmerProfile } from "../context/FarmerProfileContext.jsx";
import {
  CloudSun, Sprout, Bug, Droplets, FlaskConical, LineChart, TrendingUp,
  ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Landmark, FileText,
  RotateCcw, Pencil, Save
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const FALLBACK_WEATHER = {
  temp: 28,
  description: "scattered clouds",
  humidity: 65,
  icon: "03d",
};

const yieldData = [
  { season: "Kharif 2022", yield: 24, profit: 42000 },
  { season: "Rabi 2022", yield: 28, profit: 51000 },
  { season: "Kharif 2023", yield: 31, profit: 58000 },
  { season: "Rabi 2023", yield: 35, profit: 67000 },
  { season: "Kharif 2024", yield: 39, profit: 74000 },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const { profile, updateProfile } = useFarmerProfile();
  const [weather, setWeather] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherWarning, setWeatherWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Local editable copy of profile fields for the Farm Profile card
  const [localForm, setLocalForm] = useState({
    landSizeAcres: profile.landSizeAcres || "",
    previousCrop:  profile.previousCrop  || "",
    priorityGroup: profile.priorityGroup || "none",
    state:         profile.state         || "",
    district:      profile.district      || "",
  });

  // Keep localForm in sync when profile loads from localStorage
  useEffect(() => {
    setLocalForm({
      landSizeAcres: profile.landSizeAcres || "",
      previousCrop:  profile.previousCrop  || "",
      priorityGroup: profile.priorityGroup || "none",
      state:         profile.state         || "",
      district:      profile.district      || "",
    });
  }, []);

  const handleProfileChange = (e) =>
    setLocalForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({
      landSizeAcres: parseFloat(localForm.landSizeAcres) || 0,
      previousCrop:  localForm.previousCrop.trim().toLowerCase(),
      priorityGroup: localForm.priorityGroup,
      state:         localForm.state.trim(),
      district:      localForm.district.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const soilHealth = [
    { metric: "Nitrogen (N)", value: "54 kg/ha", status: "Optimal", score: 85 },
    { metric: "Phosphorus (P)", value: "28 kg/ha", status: "Medium", score: 65 },
    { metric: "Potassium (K)", value: "42 kg/ha", status: "Good", score: 78 },
    { metric: "pH Level", value: "6.8 pH", status: "Ideal", score: 92 },
    { metric: "Organic Carbon", value: "0.75%", status: "Moderate", score: 70 },
  ];

  // Fetch live weather directly from OpenWeather using browser geolocation
  useEffect(() => {
    const fetchLiveWeather = async (lat, lon) => {
      if (!OPENWEATHER_KEY) {
        setWeatherWarning("Weather API key not configured. Showing cached data.");
        setLiveWeather(FALLBACK_WEATHER);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`
        );
        if (res.status === 401) {
          setWeatherWarning("Weather API key is pending activation. Showing cached agro-climatic data.");
          setLiveWeather(FALLBACK_WEATHER);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setLiveWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          icon: data.weather[0].icon,
          city: data.name,
        });
        setWeatherWarning("");
      } catch (err) {
        console.warn("Live weather fetch failed:", err.message);
        setWeatherWarning("Could not fetch live weather. Showing cached data.");
        setLiveWeather(FALLBACK_WEATHER);
      } finally {
        setLoading(false);
      }
    };

    // Try browser geolocation, fallback to Dhule, MH
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchLiveWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchLiveWeather(20.9042, 74.7749),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      fetchLiveWeather(20.9042, 74.7749);
    }

    // Also fetch the full weather data from server for charts/forecast (existing flow)
    fetch("/api/weather?city=Bengaluru")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWeather(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Build farmer badge text
  const farmerBadge = (() => {
    const parts = [];
    if (profile.category) parts.push(`🌱 ${profile.category.toUpperCase()} FARMER`);
    if (profile.landSizeAcres > 0) parts.push(`${profile.landSizeAcres} Acres`);
    if (profile.district || profile.state) {
      const loc = [profile.district, profile.state].filter(Boolean).join(", ");
      parts.push(loc);
    }
    return parts.length > 1 ? parts.join(" • ") : "";
  })();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Weather API Warning Banner */}
        {weatherWarning && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-4 py-2.5 rounded-2xl mb-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {weatherWarning}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark">
              👨‍🌾 {t("farmerDash")}
            </span>
            <h1 className="text-3xl font-extrabold mt-2">{t("welcome")}</h1>
            {farmerBadge ? (
              <p className="text-sm font-semibold text-primary mt-1">{farmerBadge}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dashSubtitle")}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/crop-recommendation"
              className="inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-xs font-semibold"
            >
              {t("cropAdvisory")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="glass p-5 rounded-3xl flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("liveWeather")}</div>
              <div className="text-2xl font-bold mt-1">
                {liveWeather ? `${liveWeather.temp}°C` : loading ? "--°C" : `${FALLBACK_WEATHER.temp}°C`}
              </div>
              <div className="text-xs text-primary font-medium mt-1 capitalize">
                {liveWeather ? liveWeather.description : loading ? "Loading..." : FALLBACK_WEATHER.description}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl btn-gradient">
              <CloudSun className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="glass p-5 rounded-3xl flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("soilHealthIndex")}</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600">82 / 100</div>
              <div className="text-xs text-emerald-700 font-medium mt-1">Healthy Soil</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-soft">
              <Sprout className="h-6 w-6" />
            </div>
          </div>

          <div className="glass p-5 rounded-3xl flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("waterSchedule")}</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">
                {liveWeather ? `${liveWeather.humidity}%` : loading ? "--%"  : `${FALLBACK_WEATHER.humidity}%`}
              </div>
              <div className="text-xs text-blue-700 font-medium mt-1">Humidity</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 text-white shadow-soft">
              <Droplets className="h-6 w-6" />
            </div>
          </div>

          <div className="glass p-5 rounded-3xl flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("pestRisk")}</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">Low Risk</div>
              <div className="text-xs text-amber-700 font-medium mt-1">0 active threats</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-soft">
              <Bug className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Charts & Soil Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="glass p-6 rounded-3xl lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{t("harvestTrend")}</h3>
                <p className="text-xs text-muted-foreground">Yield (Quintals/Acre) & Income growth</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="yield" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" name="Yield (Q/acre)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-1">{t("soilProfile")}</h3>
            <p className="text-xs text-muted-foreground mb-4">Current farm test results</p>
            <div className="space-y-4">
              {soilHealth.map((s) => (
                <div key={s.metric}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{s.metric}</span>
                    <span className="text-primary">{s.value} ({s.status})</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/fertilizer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-white/80 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition"
            >
              {t("recalcFertilizer")} <FlaskConical className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Farm Profile Editor */}
        <div className="glass p-6 rounded-3xl mb-8 border border-primary/10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" /> Farm Profile
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set your farm details — used by Crop Advisory, Scheme Matcher, and Rotation Analysis.
              </p>
            </div>
            {profileSaved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 animate-in fade-in duration-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Land Size */}
            <div>
              <label className="text-xs font-bold block mb-1" htmlFor="landSizeAcres">Land Size (Acres)</label>
              <input
                id="landSizeAcres"
                type="number"
                step="0.1"
                min="0"
                name="landSizeAcres"
                value={localForm.landSizeAcres}
                onChange={handleProfileChange}
                placeholder="e.g. 2.5"
                className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Previous Crop */}
            <div>
              <label className="text-xs font-bold block mb-1" htmlFor="previousCrop">
                <span className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3 text-primary" /> Previous Crop (Last Season)
                </span>
              </label>
              <select
                id="previousCrop"
                name="previousCrop"
                value={localForm.previousCrop}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">— Not set —</option>
                <optgroup label="Cereals">
                  <option value="rice">Rice</option>
                  <option value="maize">Maize</option>
                </optgroup>
                <optgroup label="Pulses">
                  <option value="chickpea">Chickpea</option>
                  <option value="kidneybeans">Kidney Beans</option>
                  <option value="pigeonpeas">Pigeon Peas (Tur/Arhar)</option>
                  <option value="mothbeans">Moth Beans</option>
                  <option value="mungbean">Mung Bean (Green Gram)</option>
                  <option value="blackgram">Black Gram (Urad)</option>
                  <option value="lentil">Lentil (Masoor)</option>
                </optgroup>
                <optgroup label="Cash &amp; Fibre Crops">
                  <option value="cotton">Cotton</option>
                  <option value="jute">Jute</option>
                </optgroup>
                <optgroup label="Cucurbits">
                  <option value="watermelon">Watermelon</option>
                  <option value="muskmelon">Muskmelon</option>
                </optgroup>
                <optgroup label="Perennial / Orchard">
                  <option value="mango">Mango</option>
                  <option value="coconut">Coconut</option>
                  <option value="coffee">Coffee</option>
                  <option value="apple">Apple</option>
                  <option value="orange">Orange</option>
                  <option value="grapes">Grapes</option>
                  <option value="banana">Banana</option>
                  <option value="papaya">Papaya</option>
                  <option value="pomegranate">Pomegranate</option>
                </optgroup>
              </select>
            </div>

            {/* Priority Group */}
            <div>
              <label className="text-xs font-bold block mb-1" htmlFor="priorityGroup">Priority Group</label>
              <select
                id="priorityGroup"
                name="priorityGroup"
                value={localForm.priorityGroup}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="none">None</option>
                <option value="sc_st">SC / ST</option>
                <option value="women">Women Farmer</option>
                <option value="north_east">North East Region</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="text-xs font-bold block mb-1" htmlFor="state">State</label>
              <input
                id="state"
                type="text"
                name="state"
                value={localForm.state}
                onChange={handleProfileChange}
                placeholder="e.g. Maharashtra"
                className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* District */}
            <div>
              <label className="text-xs font-bold block mb-1" htmlFor="district">District / City</label>
              <input
                id="district"
                type="text"
                name="district"
                value={localForm.district}
                onChange={handleProfileChange}
                placeholder="e.g. Pune"
                className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-2.5 text-xs font-bold transition-all hover:shadow-lg"
              >
                <Save className="h-3.5 w-3.5" /> Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tools Grid */}
        <h2 className="text-xl font-bold mb-4">{t("quickAiTools")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link to="/crop-recommendation" className="glass p-5 rounded-3xl hover:-translate-y-1 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl btn-gradient mb-3">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <h4 className="font-bold text-base group-hover:text-primary transition">{t("cropRec")}</h4>
            <p className="text-xs text-muted-foreground mt-1">AI matched crop guidance based on soil NPK, season & climate.</p>
          </Link>

          <Link to="/disease-detection" className="glass p-5 rounded-3xl hover:-translate-y-1 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white mb-3">
              <Bug className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base group-hover:text-amber-600 transition">{t("diseaseDetection")}</h4>
            <p className="text-xs text-muted-foreground mt-1">Upload leaf photo for instant infection diagnosis & treatment plan.</p>
          </Link>

          <Link to="/market-prices" className="glass p-5 rounded-3xl hover:-translate-y-1 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 text-white mb-3">
              <LineChart className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base group-hover:text-blue-600 transition">{t("marketAnalysis")}</h4>
            <p className="text-xs text-muted-foreground mt-1">Compare crop prices across 500+ Indian agricultural markets.</p>
          </Link>

          <Link to="/government-schemes" className="glass p-5 rounded-3xl hover:-translate-y-1 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white mb-3">
              <Landmark className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base group-hover:text-emerald-600 transition">{t("governmentSchemes")}</h4>
            <p className="text-xs text-muted-foreground mt-1">Find active subsidies, insurance, and agricultural credit schemes based on location.</p>
          </Link>

          <Link to="/soil-analyzer" className="glass p-5 rounded-3xl hover:-translate-y-1 transition group">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500 text-white mb-3">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-base group-hover:text-purple-600 transition">{t("soilAnalyzer")}</h4>
            <p className="text-xs text-muted-foreground mt-1">Upload soil test reports to get deterministic fertilizer recommendation & find nearby labs.</p>
          </Link>
        </div>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
