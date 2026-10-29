import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { CloudSun, Search, Wind, Droplets, Sun, AlertTriangle, CheckCircle2, Thermometer, MapPin, Compass } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WeatherPage() {
  const { t } = useLanguage();
  const [city, setCity] = useState("Bengaluru");
  const [searchInput, setSearchInput] = useState("Bengaluru");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = (cityName) => {
    setLoading(true);
    setError(null);
    fetch(`/api/weather?city=${encodeURIComponent(cityName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWeather(data.data);
        } else {
          setError(data.message || "Failed to load weather");
        }
      })
      .catch(() => setError("Network error fetching weather."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setCity(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky/20 px-3 py-1 text-xs font-semibold text-sky-800">
              🌤️ {t("weatherBadge")}
            </span>
            <h1 className="text-3xl font-extrabold mt-2">{t("weatherPageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("weatherPageSubtitle")}</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xs w-full">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchCity")}
                className="w-full rounded-full border border-primary/20 bg-white/80 pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button type="submit" className="rounded-full btn-gradient p-2.5">
              <Search className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>

        {error && (
          <div className="glass p-4 rounded-2xl text-xs text-red-600 bg-red-50/50 border-red-200 font-medium mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="glass p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
            <CloudSun className="h-12 w-12 text-sky-500 animate-bounce mb-3" />
            <div className="text-sm font-bold">Fetching Live Satellite & Radar Data…</div>
          </div>
        )}

        {!loading && weather && (
          <>
            {/* Current Weather Card */}
            <div className="glass p-8 rounded-3xl mb-8 hero-bg relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.current.icon}@4x.png`}
                    alt={weather.current.description}
                    className="h-28 w-28 drop-shadow"
                  />
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {weather.current.city}, {weather.current.country}
                    </div>
                    <div className="text-5xl font-extrabold mt-1">{weather.current.temp}°C</div>
                    <div className="text-sm font-bold capitalize text-primary-dark mt-1">
                      {weather.current.description} · Feels like {weather.current.feels_like}°C
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-primary/10 pt-4 lg:pt-0 lg:pl-8 text-xs">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("humidity")}</span>
                      <span className="font-bold text-sm">{weather.current.humidity}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wind className="h-5 w-5 text-teal-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("windSpeed")}</span>
                      <span className="font-bold text-sm">{weather.current.wind_speed} m/s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("minMax")}</span>
                      <span className="font-bold text-sm">{weather.current.temp_min}° / {weather.current.temp_max}°C</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5 text-purple-500 shrink-0" />
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t("pressure")}</span>
                      <span className="font-bold text-sm">{weather.current.pressure} hPa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Advisories */}
            {weather.advisory && weather.advisory.length > 0 && (
              <div className="mb-8 space-y-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> Agronomist Weather Action Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weather.advisory.map((adv, idx) => (
                    <div
                      key={idx}
                      className={`glass p-4 rounded-2xl flex items-start gap-3 border ${
                        adv.type === "danger"
                          ? "bg-red-50/70 border-red-200 text-red-900"
                          : adv.type === "warning"
                          ? "bg-amber-50/70 border-amber-200 text-amber-900"
                          : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold leading-relaxed">{adv.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Forecast Chart */}
            <div className="glass p-6 rounded-3xl mb-8">
              <h3 className="text-base font-bold mb-1">{t("hourlyTrend")}</h3>
              <p className="text-xs text-muted-foreground mb-4">Next 24 Hours</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weather.hourly}>
                    <defs>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="temp" stroke="#0288D1" strokeWidth={3} fill="url(#colorTemp)" name="Temp (°C)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-Day Forecast Grid */}
            <h3 className="text-base font-bold mb-4">{t("dailyForecast")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {weather.forecast.map((day, idx) => (
                <div key={idx} className="glass p-4 rounded-2xl text-center flex flex-col items-center justify-between">
                  <div className="text-[11px] font-bold text-muted-foreground">
                    {day.date}
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                    alt={day.description}
                    className="h-12 w-12 my-1"
                  />
                  <div className="text-base font-extrabold">{day.temp}°C</div>
                  <div className="text-[10px] text-muted-foreground capitalize mt-0.5 line-clamp-1">{day.description}</div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-2">💧 {day.humidity}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
