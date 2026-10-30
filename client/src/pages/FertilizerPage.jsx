import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiFetch } from "../lib/api.js";
import { FlaskConical, ArrowRight, CheckCircle2 } from "lucide-react";

export default function FertilizerPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    crop: "Wheat",
    soilN: "40",
    soilP: "20",
    soilK: "30",
    areaAcre: "2",
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
      const res = await apiFetch("/api/fertilizer/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.message);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <FlaskConical className="h-3.5 w-3.5" /> {t("fertilizerBadge")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">{t("fertilizerTitle")}</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {t("fertilizerSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 glass p-6 sm:p-8 rounded-3xl h-fit">
            <h2 className="text-lg font-bold mb-4">{t("fertilizerRec")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">{t("selectCrop")}</label>
                <select
                  name="crop"
                  value={form.crop}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice / Paddy</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Soybean">Soybean / Pulses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">{t("farmArea")}</label>
                  <input
                    type="number"
                    name="areaAcre"
                    value={form.areaAcre}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t("nitrogen")}</label>
                  <input
                    type="number"
                    name="soilN"
                    value={form.soilN}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">{t("phosphorus")}</label>
                  <input
                    type="number"
                    name="soilP"
                    value={form.soilP}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t("potassium")}</label>
                  <input
                    type="number"
                    name="soilK"
                    value={form.soilK}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {error && <div className="text-xs text-red-600 font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-50"
              >
                {loading ? "Calculating..." : t("calculateFertilizerBtn")} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold">{t("recommendedCommercial")}</h2>

            {!result && !loading && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
                <FlaskConical className="h-12 w-12 text-emerald-600/40 mb-3 animate-pulse" />
                <h3 className="font-bold text-base">Awaiting Soil Data</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Input your soil test NPK values to calculate Urea, DAP, and MOP bag requirements.
                </p>
              </div>
            )}

            {result && (
              <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
                    <div className="text-2xl font-extrabold text-emerald-800">{result.fertilizerRequirementKg.urea} kg</div>
                    <div className="text-[10px] font-bold text-emerald-900 uppercase mt-0.5">Urea (46% N)</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-center">
                    <div className="text-2xl font-extrabold text-blue-800">{result.fertilizerRequirementKg.dap} kg</div>
                    <div className="text-[10px] font-bold text-blue-900 uppercase mt-0.5">DAP (18-46-0)</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                    <div className="text-2xl font-extrabold text-amber-800">{result.fertilizerRequirementKg.mop} kg</div>
                    <div className="text-[10px] font-bold text-amber-900 uppercase mt-0.5">MOP (60% K)</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("splitSchedule")}</h4>
                  <div className="space-y-2">
                    {result.applicationSchedule.map((s, i) => (
                      <div key={i} className="bg-white/70 p-3.5 rounded-2xl border border-primary/10 text-xs">
                        <div className="font-bold text-primary mb-0.5">{s.stage}</div>
                        <div className="text-foreground/90">{s.details}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("safetyPrecautions")}</h4>
                  <ul className="space-y-1.5 text-xs text-foreground/80">
                    {result.precautions.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> {p}
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
