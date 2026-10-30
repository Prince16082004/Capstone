import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiFetch } from "../lib/api.js";
import { Bug, Upload, CheckCircle2, ShieldCheck, AlertCircle, Sparkles, RefreshCw, FlaskConical } from "lucide-react";

export default function DiseaseDetect() {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState("Tomato");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select or drop an image of an infected leaf first!");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("crop", crop);

    try {
      const res = await apiFetch("/api/disease/detect", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to analyze leaf image.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-700">
            <Bug className="h-3.5 w-3.5" /> {t("diseaseBadge")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">{t("diseaseTitle")}</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {t("diseaseSubtitle")}
          </p>
          {/* Always-visible demo disclaimer */}
          <span
            id="demo-preview-badge"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1.5 text-[11px] font-bold text-amber-800"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Demo preview: illustrative result, a trained model is planned
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Upload Box */}
          <div className="lg:col-span-5 glass p-6 sm:p-8 rounded-3xl h-fit">
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">{t("selectCrop")}</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full rounded-xl border border-primary/20 bg-white/80 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Tomato">Tomato / Potato</option>
                  <option value="Rice">Rice / Paddy</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize</option>
                  <option value="Other">Other Crops</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-primary/30 rounded-2xl p-6 text-center bg-white/40 hover:bg-white/70 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {preview ? (
                  <div className="flex flex-col items-center">
                    <img src={preview} alt="Leaf Preview" className="h-40 w-auto rounded-xl object-contain shadow-md mb-2" />
                    <span className="text-xs text-primary font-bold">Change Image</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <Upload className="h-10 w-10 text-primary/60 mb-2" />
                    <span className="text-xs font-bold text-foreground">{t("uploadPrompt")}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP (Max 10MB)</span>
                  </div>
                )}
              </div>

              {error && <div className="text-xs text-red-600 font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-50"
              >
                {loading ? "Analyzing..." : t("runDiagnosis")} <Sparkles className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> {t("diagnosticResults")}
            </h2>

            {!result && !loading && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
                <Bug className="h-12 w-12 text-amber-500/40 mb-3 animate-pulse" />
                <h3 className="font-bold text-base">Awaiting Photo Upload</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Upload an image on the left to view disease diagnosis, severity score, and treatment methods.
                </p>
              </div>
            )}

            {loading && (
              <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
                <RefreshCw className="h-10 w-10 text-primary animate-spin mb-3" />
                <div className="text-sm font-bold">Scanning leaf stomata and spot patterns…</div>
              </div>
            )}

            {result && (
              <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary/10">
                  <div>
                    <span className="text-xs font-bold uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      {t("severity")}: {result.severity}
                    </span>
                    <h3 className="text-2xl font-extrabold text-foreground mt-2">
                      {result.diseaseName}
                      {result.is_demo && (
                        <span className="ml-2 text-sm font-medium text-amber-600">(Illustrative)</span>
                      )}
                    </h3>
                    <div className="text-xs text-muted-foreground mt-0.5">Target: {result.targetCrop}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("observedSymptoms")}{result.is_demo && <span className="ml-1 font-normal normal-case text-amber-600">(Illustrative)</span>}
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-white/60 p-3.5 rounded-2xl border border-primary/10">
                    {result.symptoms}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("pathogenCause")}</h4>
                  <p className="text-xs font-semibold text-primary-dark">{result.cause}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">{t("recommendedTreatment")}</h4>
                  {result.is_demo ? (
                    <div className="flex items-start gap-2 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900 font-semibold">
                      <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      Example only: do not use for real treatment decisions
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {result.treatment.map((step, idx) => (
                        <li key={idx} className="text-xs sm:text-sm flex items-start gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 border-t border-primary/10 text-xs">
                  <span className="font-bold text-muted-foreground block mb-1">
                    {t("preventionStrategy")}{result.is_demo && <span className="ml-1 font-normal text-amber-600">(Illustrative)</span>}
                  </span>
                  <p className="text-foreground/80">{result.prevention}</p>
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
