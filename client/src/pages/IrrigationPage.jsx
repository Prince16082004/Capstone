import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Droplets, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function IrrigationPage() {
  const { lang, t } = useLanguage();
  const crops = [
    { value: "Rice", label: t("irrigationCropRice") },
    { value: "Wheat", label: t("irrigationCropWheat") },
    { value: "Cotton", label: t("irrigationCropCotton") },
    { value: "Sugarcane", label: t("irrigationCropSugarcane") },
    { value: "Maize", label: t("irrigationCropMaize") },
    { value: "Tomato", label: t("irrigationCropTomato") },
  ];
  const soils = [
    { value: "Loamy", label: t("irrigationSoilLoamy") },
    { value: "Sandy", label: t("irrigationSoilSandy") },
    { value: "Clayey", label: t("irrigationSoilClayey") },
    { value: "Black", label: t("irrigationSoilBlack") },
  ];
  const growthStages = [
    { value: "Initial", label: t("irrigationStageInitial") },
    { value: "Vegetative", label: t("irrigationStageVegetative") },
    { value: "Flowering", label: t("irrigationStageFlowering") },
    { value: "Maturity", label: t("irrigationStageMaturity") },
  ];
  const scheduleTranslations = {
    "Irrigate every 2 days": t("irrigationScheduleTwoDays"),
    "Irrigate daily (short duration)": t("irrigationScheduleDaily"),
    "Irrigate every 3-4 days": t("irrigationScheduleThreeFourDays"),
    "Skip irrigation for next 48-72 hours due to rain": t("irrigationScheduleSkipRain"),
  };
  const waterTipTranslations = {
    "Use drip irrigation to reduce water consumption by 35-45%": t("irrigationTipDrip"),
    "Irrigate early in the morning (6 AM - 8 AM) to reduce evaporation losses": t("irrigationTipMorning"),
    "Mulch with straw or crop residues to conserve soil moisture": t("irrigationTipMulch"),
  };
  const formatNumber = (value) =>
    Number(value).toLocaleString(lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN");
  const [form, setForm] = useState({
    crop: "Rice",
    soilType: "Loamy",
    areaAcre: "2",
    stage: "Flowering",
    temp: "30",
    humidity: "65",
    recentRain: "0",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/irrigation/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(t("irrigationCalculateError"));
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <Droplets className="h-3.5 w-3.5" /> {t("irrigationBadge")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">{t("irrigationTitle")}</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {t("irrigationSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 glass p-6 sm:p-8 rounded-3xl h-fit">
            <h2 className="text-lg font-bold mb-4">{t("irrigationAdvisory")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">{t("selectCrop")}</label>
                <select
                  name="crop"
                  value={form.crop}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {crops.map((crop) => (
                    <option key={crop.value} value={crop.value}>{crop.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">{t("soilType")}</label>
                  <select
                    name="soilType"
                    value={form.soilType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {soils.map((soil) => (
                      <option key={soil.value} value={soil.value}>{soil.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t("farmArea")}</label>
                  <input
                    type="number"
                    step="0.5"
                    name="areaAcre"
                    value={form.areaAcre}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">{t("growthStage")}</label>
                  <select
                    name="stage"
                    value={form.stage}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {growthStages.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t("recentRainfall")}</label>
                  <input
                    type="number"
                    name="recentRain"
                    value={form.recentRain}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {error && <div className="text-xs text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-50"
              >
                {loading ? t("calculating") : t("calculateSchedule")} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold">{t("recommendedSchedule")}</h2>

            {!result && !loading && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
                <Droplets className="h-12 w-12 text-blue-500/40 mb-3 animate-pulse" />
                <h3 className="font-bold text-base">{t("awaitingInputs")}</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  {t("irrigationAwaitingDescription")}
                </p>
              </div>
            )}

            {result && (
              <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-center">
                    <div className="text-2xl font-extrabold text-blue-700">{formatNumber(result.dailyRequirementLiters)} {t("litersUnit")}</div>
                    <div className="text-[10px] font-bold text-blue-900 uppercase mt-0.5">{t("dailyVolume")}</div>
                  </div>
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-center">
                    <div className="text-2xl font-extrabold text-emerald-700">{formatNumber(result.dripRunTimeHours)} {t("hoursUnit")}</div>
                    <div className="text-[10px] font-bold text-emerald-900 uppercase mt-0.5">{t("dripDuration")}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("wateringFreq")}</h4>
                  <div className="text-base font-bold text-foreground bg-white/70 p-3.5 rounded-2xl border border-primary/10 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> {scheduleTranslations[result.recommendedSchedule] || result.recommendedSchedule}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("waterSavingTips")}</h4>
                  <ul className="space-y-2">
                    {result.waterSavingTips.map((tip, idx) => (
                      <li key={idx} className="text-xs flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> {waterTipTranslations[tip] || tip}
                      </li>
                    ))}
                  </ul>
                </div>
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
