import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { LineChart, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart as RechartsLine, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MarketPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPrices = () => {
    setLoading(true);
    let url = "/api/market";
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (stateFilter) params.append("state", stateFilter);
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
  }, [search, stateFilter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              📈 {t("marketBadge")}
            </span>
            <h1 className="text-3xl font-extrabold mt-2">{t("marketTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("marketSubtitle")}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchCropMandi")}
                className="w-full rounded-full border border-primary/20 bg-white/80 pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full sm:w-auto rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">{t("allStates")}</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Punjab">Punjab</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>
        </div>

        {/* Historical Price Trend Chart */}
        {data?.historical && (
          <div className="glass p-6 rounded-3xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">6-Month Mandi Price Trend (₹/Quintal)</h3>
                <p className="text-xs text-muted-foreground">Paddy, Wheat, Cotton & Mustard</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLine data={data.historical}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="paddy" stroke="#2E7D32" strokeWidth={2.5} name="Paddy" />
                  <Line type="monotone" dataKey="wheat" stroke="#0288D1" strokeWidth={2.5} name="Wheat" />
                  <Line type="monotone" dataKey="cotton" stroke="#E65100" strokeWidth={2.5} name="Cotton" />
                  <Line type="monotone" dataKey="mustard" stroke="#7B1FA2" strokeWidth={2.5} name="Mustard" />
                </RechartsLine>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Mandi Price Table */}
        <h3 className="text-lg font-bold mb-4">{t("marketPrices")}</h3>
        <div className="glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-primary/10 text-foreground uppercase tracking-wider text-[11px] font-bold border-b border-primary/10">
                <tr>
                  <th className="px-6 py-4">{t("cropName")}</th>
                  <th className="px-6 py-4">{t("mandiState")}</th>
                  <th className="px-6 py-4">{t("modalPrice")}</th>
                  <th className="px-6 py-4">{t("priceRange")}</th>
                  <th className="px-6 py-4">{t("change24h")}</th>
                  <th className="px-6 py-4">{t("govtMsp")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading live mandi rates...
                    </td>
                  </tr>
                )}
                {!loading && data?.data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/60 transition">
                    <td className="px-6 py-4 font-extrabold text-foreground">{item.crop}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{item.market}</div>
                      <div className="text-[10px] text-muted-foreground">{item.state}</div>
                    </td>
                    <td className="px-6 py-4 text-base font-extrabold text-primary">
                      ₹{item.modalPrice.toLocaleString()}<span className="text-[10px] text-muted-foreground font-normal"> / quintal</span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      ₹{item.minPrice} - ₹{item.maxPrice}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${
                          item.trend === "up"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.trend === "down"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.trend === "up" && <TrendingUp className="h-3 w-3" />}
                        {item.trend === "down" && <TrendingDown className="h-3 w-3" />}
                        {item.trend === "neutral" && <Minus className="h-3 w-3" />}
                        {item.change}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      {typeof item.msp === "number" ? `₹${item.msp}` : item.msp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
