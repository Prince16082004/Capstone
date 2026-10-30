import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useFarmerProfile } from "../context/FarmerProfileContext.jsx";
import { Sprout, ArrowRight, Sparkles, CheckCircle2, Leaf, AlertTriangle, CloudSun, Thermometer, Droplets, TrendingUp, TrendingDown, RotateCcw, FlaskConical, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { apiFetch } from "../lib/api.js";

export default function CropRecommend() {
  const { t } = useLanguage();
  const { profile } = useFarmerProfile();
  
  const [form, setForm] = useState({
    N: "50",
    P: "30",
    K: "40",
    ph: "6.5",
    rainfall: "1200",
  });
  
  const [weatherData, setWeatherData] = useState({ temperature: 28, humidity: 60 });
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Auto-fetch weather based on profile location
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      const city = profile.district || "Pune"; // default fallback
      try {
        const res = await apiFetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        if (data.success && data.data?.current) {
          setWeatherData({
            temperature: data.data.current.temp,
            humidity: data.data.current.humidity,
          });
        }
      } catch (err) {
        console.error("Failed to fetch weather for auto-fill", err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [profile.district]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    // Combine manual inputs with auto-filled weather
    const payload = {
      N: parseFloat(form.N),
      P: parseFloat(form.P),
      K: parseFloat(form.K),
      ph: parseFloat(form.ph),
      rainfall: parseFloat(form.rainfall),
      temperature: parseFloat(weatherData.temperature),
      humidity: parseFloat(weatherData.humidity),
      previousCrop: profile.previousCrop || "",
    };

    try {
      const res = await apiFetch("/api/crop/ml-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setResults(data.data);
      } else if (res.status === 503) {
        setError(data.message || "AI service temporarily unavailable.");
      } else {
        setError(data.message || "Failed to get recommendations.");
      }
    } catch (err) {
      setError("Network error. AI service might be offline.");
    } finally {
      setLoading(false);
    }
  };

  // Process SHAP data for charting and explanations
  const shapData = useMemo(() => {
    if (!results || results.shap_explanation == null) return null;
    
    // Convert to array
    const entries = Object.entries(results.shap_explanation).map(([feature, value]) => ({
      feature,
      value,
      abs: Math.abs(value)
    }));
    
    // Sort by absolute value for the bullets (top impactful)
    const sortedForBullets = [...entries].sort((a, b) => b.abs - a.abs);
    
    // Sort for the bar chart (standard order makes it easier to read)
    const order = ["N", "P", "K", "ph", "rainfall", "temperature", "humidity"];
    const chartData = [...entries].sort((a, b) => order.indexOf(a.feature) - order.indexOf(b.feature));
    
    return { topImpacts: sortedForBullets.slice(0, 4), chartData };
  }, [results]);

  // Derived confidence gate state
  const showLowConfidenceNotice = results?.confident === false;

  const getFeatureLabel = (key) => {
    const labels = {
      N: "Nitrogen",
      P: "Phosphorus",
      K: "Potassium",
      ph: "Soil pH",
      rainfall: "Rainfall",
      temperature: "Temperature",
      humidity: "Humidity"
    };
    return labels[key] || key;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary-dark">
            <Sparkles className="h-3.5 w-3.5" /> AI Crop Advisory
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">Smart Crop Recommendation</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Get ML-powered crop suggestions based on your exact soil metrics and live local weather.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Auto-filled weather card */}
            <div className="glass p-5 rounded-3xl flex items-center justify-between border border-sky-500/20 bg-sky-50/30">
              <div className="w-full">
                <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 mb-1">
                  <CloudSun className="h-3.5 w-3.5" /> Auto-filled from {profile.district || "Live Weather"}
                </div>
                {weatherLoading ? (
                  <div className="flex gap-4 mt-2 opacity-50">
                    <div className="h-6 w-16 bg-sky-200/50 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-sky-200/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="h-4 w-4 text-sky-600" />
                      <span className="font-bold text-sm text-sky-900">{weatherData.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-4 w-4 text-sky-600" />
                      <span className="font-bold text-sm text-sky-900">{weatherData.humidity}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-6 sm:p-8 rounded-3xl h-fit">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" /> Soil Metrics
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">Nitrogen (N)</label>
                    <input
                      type="number"
                      name="N"
                      value={form.N}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Phosphorus (P)</label>
                    <input
                      type="number"
                      name="P"
                      value={form.P}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">Potassium (K)</label>
                    <input
                      type="number"
                      name="K"
                      value={form.K}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Soil pH</label>
                    <input
                      type="number"
                      step="0.1"
                      name="ph"
                      value={form.ph}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold block mb-1">Annual Rainfall (mm)</label>
                  <input
                    type="number"
                    name="rainfall"
                    value={form.rainfall}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || weatherLoading}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-60 transition-all hover:shadow-lg"
                >
                  {loading ? "Running ML Model..." : "Analyze with AI"} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="glass p-5 rounded-2xl text-sm flex items-start gap-3 text-red-700 bg-red-50/70 border-red-200 font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Recommendation Failed</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}

            {!results && !loading && !error && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] h-full border border-dashed border-primary/30">
                <Leaf className="h-14 w-14 text-primary/30 mb-4 animate-pulse" />
                <h3 className="font-extrabold text-lg">Awaiting Farm Data</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed">
                  Enter your soil nutrients and rainfall. The AI will cross-reference it with live weather to predict the optimal crop.
                </p>
              </div>
            )}

            {loading && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px] h-full">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <Sprout className="h-16 w-16 text-primary relative z-10 animate-bounce" />
                </div>
                <h3 className="font-extrabold text-lg mt-6">Analyzing Patterns...</h3>
                <p className="text-sm text-muted-foreground mt-1">Running Random Forest predictions with SHAP explanation...</p>
              </div>
            )}

            {results && !loading && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Top Recommendation Card */}
                <div className="glass p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-white/80 to-primary/5 border border-primary/20 shadow-lg">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="h-32 w-32" />
                  </div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-3">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Recommended Crop
                      </span>
                      <h2 className="text-4xl font-black text-slate-800 capitalize mb-2">{results.crop}</h2>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min(100, results.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {(results.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                    </div>
                    <div className="text-5xl drop-shadow-md">
                      🌱
                    </div>
                  </div>
                </div>

                {/* Low-confidence notice + top-3 alternatives — only when confident === false */}
                {showLowConfidenceNotice && (
                  <div
                    id="low-confidence-notice"
                    className="glass p-5 rounded-3xl border border-amber-300/70 bg-amber-50/70 animate-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-full bg-amber-100 shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-amber-900">
                          Low-confidence result: please verify your soil values or consult a local agriculture officer
                        </p>
                        <p className="text-[11px] text-amber-700 mt-1">
                          Model confidence ({(results.confidence * 100).toFixed(1)}%) is below the calibrated threshold ({results.confidence_threshold != null ? (results.confidence_threshold * 100).toFixed(0) : "—"}%). The recommendation is still shown; alternative crops are listed below.
                        </p>
                      </div>
                    </div>

                    {/* Top-3 alternatives */}
                    {Array.isArray(results.top3) && results.top3.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">Top alternatives</p>
                        <div className="flex flex-col gap-2">
                          {results.top3.map((alt, i) => (
                            <div key={alt.crop} className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-amber-700 w-4 text-right">{i + 1}.</span>
                              <span className="text-xs font-bold text-slate-800 capitalize w-28">{alt.crop}</span>
                              <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${Math.min(100, alt.probability * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 w-10 text-right">
                                {(alt.probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SHAP Explanation Section — only rendered when explanation is available */}
                {shapData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bullets */}
                  <div className="glass p-6 rounded-3xl h-full">
                    <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Why this crop?
                    </h3>
                    <ul className="space-y-4">
                      {shapData?.topImpacts.map((item, i) => {
                        const isPositive = item.value > 0;
                        const label = getFeatureLabel(item.feature);
                        return (
                          <li key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${isPositive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {isPositive ? `${label} strongly supported this choice` : `${label} worked against it slightly`}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                AI impact score: {item.value > 0 ? "+" : ""}{item.value.toFixed(4)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Chart */}
                  <div className="glass p-6 rounded-3xl h-full flex flex-col">
                    <h3 className="text-sm font-extrabold mb-4 text-slate-800">Feature Contributions (SHAP)</h3>
                    <div className="flex-1 w-full min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={shapData?.chartData}
                          layout="vertical"
                          margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="feature" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }}
                            tickFormatter={getFeatureLabel}
                            width={80}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value) => [value.toFixed(4), 'Impact Score']}
                            labelFormatter={getFeatureLabel}
                          />
                          <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                            {shapData?.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                )}

                {/* Soil Memory & Agronomic Advisory Card */}
                {(() => {
                  const ra = results.rotation_advisory;
                  if (!ra || ra.status === 'no_history' || ra.status === 'no_data') return null;

                  // Shared crop tag renderer
                  const CropTags = ({ crops }) =>
                    Array.isArray(crops) && crops.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {crops.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-primary/20 px-3 py-1 text-[10px] font-bold text-primary-dark uppercase tracking-wider"
                          >
                            <Leaf className="h-3 w-3" />
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : null;

                  if (ra.status === 'warning') {
                    return (
                      <div className="glass p-6 rounded-3xl border border-amber-300/60 bg-amber-50/60 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-amber-100 shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                <RotateCcw className="h-3 w-3" /> Soil Memory Advisory
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-amber-900 mt-2">{ra.title}</h4>
                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{ra.message}</p>
                            <CropTags crops={ra.recommended_crops} />
                            {ra.rationale && (
                              <p className="text-[10px] text-amber-700/80 mt-3 leading-relaxed border-t border-amber-200/60 pt-3">
                                {ra.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (ra.status === 'success') {
                    return (
                      <div className="glass p-6 rounded-3xl border border-emerald-300/60 bg-emerald-50/60 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-emerald-100 shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                <RotateCcw className="h-3 w-3" /> Soil Memory Advisory
                              </span>
                              {ra.nitrogen_effect && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                  ra.nitrogen_effect === 'fixes'
                                    ? 'bg-sky-100 text-sky-800'
                                    : ra.nitrogen_effect === 'depletes'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <FlaskConical className="h-3 w-3" />
                                  N: {ra.nitrogen_effect}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-extrabold text-emerald-900 mt-2">{ra.title}</h4>
                            {ra.rationale && (
                              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{ra.rationale}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (ra.status === 'perennial') {
                    return (
                      <div className="glass p-5 rounded-3xl border border-sky-200/60 bg-sky-50/50 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-sky-100 shrink-0">
                            <Info className="h-4 w-4 text-sky-600" />
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-1">
                              <RotateCcw className="h-3 w-3" /> Soil Memory Advisory
                            </span>
                            <p className="text-xs text-sky-800 mt-1">{ra.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // neutral
                  return (
                    <div className="glass p-6 rounded-3xl border border-slate-200/60 bg-slate-50/50 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-slate-100 shrink-0">
                          <RotateCcw className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            <RotateCcw className="h-3 w-3" /> Soil Memory Advisory
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-700 mt-2">{ra.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ra.message}</p>
                          <CropTags crops={ra.recommended_crops} />
                          {ra.rationale && (
                            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed border-t border-slate-200/60 pt-3">
                              {ra.rationale}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Estimated Economics ─────────────────────────────────── */}
                {results?.economics && (() => {
                  const ec = results.economics;
                  const pc = ec.predicted_crop;          // computeEconomics result or null
                  const ro = ec.rotation_options;        // { ranked, unranked }
                  const hasRanked   = Array.isArray(ro?.ranked)   && ro.ranked.length   > 0;
                  const hasUnranked = Array.isArray(ro?.unranked) && ro.unranked.length > 0;
                  const hasAny      = pc || hasRanked || hasUnranked;
                  if (!hasAny) return null;

                  const fmt = (val, decimals = 0) =>
                    val == null ? null : Number(val).toLocaleString('en-IN', {
                      maximumFractionDigits: decimals,
                      minimumFractionDigits: decimals,
                    });

                  const NO_DATA = 'No official data for this crop';

                  return (
                    <div
                      id="estimated-economics-card"
                      className="glass p-6 rounded-3xl border border-violet-200/60 bg-violet-50/40 animate-in slide-in-from-bottom-2 duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold text-violet-800 uppercase tracking-wider">
                          <TrendingUp className="h-3 w-3" /> Estimated Economics
                        </span>
                      </div>

                      {/* Predicted crop block */}
                      {pc && (
                        <div className="mb-5">
                          <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wider mb-3 capitalize">
                            {pc.crop_name}
                            {pc.season && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-600 normal-case">
                                {pc.season}
                              </span>
                            )}
                          </p>

                          {pc.roi_available ? (
                            <>
                              {/* A2+FL row — primary */}
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="text-xs text-slate-600">Net return / ha (A2+FL)</span>
                                <span className={`text-sm font-extrabold ${pc.net_return_a2fl >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  ₹{fmt(pc.net_return_a2fl)}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between mb-3">
                                <span className="text-xs text-slate-600">ROI (A2+FL basis)</span>
                                <span className={`text-sm font-extrabold ${pc.roi_pct_a2fl >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {fmt(pc.roi_pct_a2fl, 1)}%
                                </span>
                              </div>

                              {/* C2 row — secondary */}
                              <div className="flex items-baseline justify-between mb-1 border-t border-violet-100 pt-3">
                                <span className="text-[11px] text-slate-500">Net return / ha (C2 cost)</span>
                                <span className={`text-[11px] font-bold ${pc.net_return_c2 >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  ₹{fmt(pc.net_return_c2)}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-[11px] text-slate-500">ROI (C2 basis)</span>
                                <span className={`text-[11px] font-bold ${pc.roi_pct_c2 >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {fmt(pc.roi_pct_c2, 1)}%
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* MSP-only display — no cost/yield data available */}
                              {pc.msp_inr_per_quintal != null && (
                                <div className="flex items-baseline justify-between mb-2">
                                  <span className="text-xs text-slate-600">Government MSP</span>
                                  <span className="text-sm font-extrabold text-violet-700">
                                    ₹{fmt(pc.msp_inr_per_quintal)} / quintal
                                    {(pc.msp_marketing_season || pc.season) && (
                                      <span className="ml-1 text-[10px] font-normal text-slate-500">
                                        ({pc.msp_marketing_season || pc.season})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs text-slate-600">Profit estimate</span>
                                <span className="text-sm font-bold text-slate-400">
                                  No official cost / yield data for this crop
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Rotation crop economics */}
                      {(hasRanked || hasUnranked) && (
                        <div className={pc ? 'border-t border-violet-100 pt-4' : ''}>
                          <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wider mb-3">
                            Rotation options — economics
                          </p>

                          {hasRanked && (
                            <div className="flex flex-col gap-3 mb-3">
                              {ro.ranked.map((opt) => (
                                <div key={opt.crop_name} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Leaf className="h-3 w-3 text-violet-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-700 capitalize truncate">{opt.crop_name}</span>
                                    {opt.season && (
                                      <span className="hidden sm:inline-flex shrink-0 items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
                                        {opt.season}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={`text-xs font-extrabold ${opt.net_return_a2fl >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                      ₹{fmt(opt.net_return_a2fl)} / ha
                                    </p>
                                    <p className={`text-[10px] font-bold ${opt.roi_pct_a2fl >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                      ROI {fmt(opt.roi_pct_a2fl, 1)}%
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {hasUnranked && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ro.unranked.map((u) => (
                                <span key={u.crop_name} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-500 capitalize">
                                  <Leaf className="h-2.5 w-2.5" /> {u.crop_name} — {u.reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Basis note — always shown */}
                      <p className="text-[10px] text-slate-500 mt-4 leading-relaxed border-t border-violet-100 pt-3">
                        {ec.basis_note}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
