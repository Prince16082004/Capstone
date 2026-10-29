import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/ChatbotWidget.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useFarmerProfile } from "../context/FarmerProfileContext.jsx";
import { MapPin, Search, Landmark, ShieldCheck, HelpCircle, ArrowRight, Loader2, CheckSquare } from "lucide-react";
import SchemeMatcher from "../components/SchemeMatcher.jsx";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Resolve leaflet marker icon issue in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// India-centric defaults (Dhule, Maharashtra)
const DEFAULT_LAT = 20.9042;
const DEFAULT_LON = 74.7749;
const DEFAULT_ZOOM = 7;

export default function GovernmentSchemes() {
  const { t, lang } = useLanguage();
  const { updateLocation } = useFarmerProfile();
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
  const [locationName, setLocationName] = useState("Detecting location...");
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState({ subsidies: [], insurance: [], schemes: [] });
  const [activeTab, setActiveTab] = useState("matcher");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [gpsPermission, setGpsPermission] = useState("prompt");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const skipReverseGeocode = useRef(false);
  
  // Robust sequential promise queue for Nominatim to strictly enforce 1.1s gap
  const requestQueue = useRef(Promise.resolve());
  const nominatimFetch = (url) => {
    return new Promise((resolve, reject) => {
      requestQueue.current = requestQueue.current.then(async () => {
        try {
          await new Promise((r) => setTimeout(r, 1100)); // Enforce rate limit
          const res = await fetch(url, {
            headers: { "User-Agent": "AgriSenseAI/1.0 (academic-research)" },
          });
          if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
          const data = await res.json();
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  const extractPlaceName = (address) => {
    return (
      address.suburb       ||
      address.neighbourhood||
      address.town         ||
      address.village      ||
      address.hamlet       ||
      address.city         ||
      address.municipality ||
      address.county       ||
      address.state_district ||
      ""
    );
  };

  // Reverse-geocode coordinates using Nominatim to extract state/district
  const reverseGeocode = async (lat, lon) => {
    try {
      const data = await nominatimFetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`
      );
      if (data && data.address) {
        const placeName = extractPlaceName(data.address);
        const district = data.address.county || data.address.state_district || placeName;
        const state = data.address.state || "";
        const displayName = placeName && state ? `${placeName}, ${state}` : state || data.display_name?.split(",")[0] || "India";
        setLocationName(displayName);
        updateLocation(state, district);
        return { state, district: placeName || district };
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
    return null;
  };

  // Fetch schemes based on coordinates
  const fetchSchemes = async (latitude, longitude) => {
    setLoading(true);
    setStatusMessage("");
    try {
      const res = await fetch(`/api/government?lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data.success) {
        setSchemes(data.data);
        if (!locationName || locationName === "Detecting location...") {
           if (data.data.location) setLocationName(data.data.location);
        }
      } else {
        setStatusMessage("Error parsing location schemes.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapInstanceRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lon], DEFAULT_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lon], { draggable: true }).addTo(map);
      
      marker.on("dragend", (event) => {
        const markerPos = event.target.getLatLng();
        setCoords({ lat: markerPos.lat, lon: markerPos.lng });
      });

      map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        setCoords({ lat, lon: lng });
        marker.setLatLng([lat, lng]);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Only fetch schemes directly — auto-detect or coords-change useEffect will handle the name
      fetchSchemes(coords.lat, coords.lon);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map and fetch data when coordinates state changes
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const { lat, lon } = coords;
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
      markerInstanceRef.current.setLatLng([lat, lon]);
      if (skipReverseGeocode.current) {
        skipReverseGeocode.current = false;
      } else {
        reverseGeocode(lat, lon);
      }
      fetchSchemes(lat, lon);
    }
  }, [coords.lat, coords.lon]);

  // Check browser GPS permission state on mount, then auto-detect
  useEffect(() => {
    if (!navigator.permissions) {
      // Old browser — go straight to IP
      detectByIP();
      return;
    }
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setGpsPermission(result.state); // 'granted' | 'denied' | 'prompt'
      result.onchange = () => setGpsPermission(result.state);

      if (result.state === "granted") {
        // Permission already granted — use GPS silently on load
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            setStatusMessage("✅ GPS location detected.");
          },
          () => detectByIP()
        );
      } else {
        // denied or prompt — fall back to IP automatically on load
        detectByIP();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // IP-based geolocation fallback (no permission needed)
  const detectByIP = async () => {
    try {
      // ip-api.com is free, no API key, returns JSON with lat/lon/city/regionName
      const res = await fetch("http://ip-api.com/json/?fields=status,lat,lon,city,regionName,countryCode");
      const data = await res.json();
      if (data.status === "success") {
        // Build a display name from IP lookup
        const ipLocation = [data.city, data.regionName].filter(Boolean).join(", ");
        if (ipLocation) setLocationName(ipLocation);
        setStatusMessage("📍 Location detected via network (approximate).");
        skipReverseGeocode.current = true;
        setCoords({ lat: data.lat, lon: data.lon });
      } else {
        setStatusMessage("Could not detect location. Defaulting to Dhule, Maharashtra.");
        setCoords({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
      }
    } catch {
      setStatusMessage("Could not detect location. Defaulting to Dhule, Maharashtra.");
      setCoords({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
    } finally {
      setLoading(false);
    }
  };

  // Request user's device location, fall back to IP geolocation if denied
  const handleDetectLocation = () => {
    setLoading(true);
    setStatusMessage("");
    if (!navigator.geolocation) {
      setStatusMessage("Geolocation not supported. Trying network location...");
      detectByIP();
      return;
    }
    // If previously denied, show instructions and still use IP
    if (gpsPermission === "denied") {
      setStatusMessage("🔒 GPS blocked in browser. To fix: click the 🔒 icon in your address bar → Site settings → Location → Allow. For now, using network location.");
      detectByIP();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setStatusMessage("✅ GPS location detected precisely.");
        setGpsPermission("granted");
        setLoading(false);
      },
      (error) => {
        console.warn("Geolocation denied:", error.message);
        if (error.code === 1) {
          setGpsPermission("denied");
          setStatusMessage("🔒 GPS permission denied. Using network location. To enable: click the 🔒 icon in your address bar → Allow Location.");
        } else {
          setStatusMessage("📍 Location timed out. Using network location instead.");
        }
        detectByIP();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search for a location — India only via countrycodes=in
  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setStatusMessage("");
    try {
      const results = await nominatimFetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5&addressdetails=1`
      );
      if (results && results.length > 0) {
        const top = results[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);

        // Build display name directly from the search result
        const addr = top.address || {};
        const placeName = extractPlaceName(addr);
        const district  = addr.county || addr.state_district || placeName;
        const state     = addr.state || "";
        const display   = placeName && state
          ? `${placeName}, ${state}`
          : state || top.display_name?.split(",")[0] || searchQuery;

        setLocationName(display);
        updateLocation(state, district);
        // Set flag BEFORE setCoords so the useEffect skips reverseGeocode
        skipReverseGeocode.current = true;
        setCoords({ lat, lon });
      } else {
        setStatusMessage("Location not found in India. Try entering a State or District name.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Failed to search location.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSchemes = () => {
    if (activeTab === "subsidies") return schemes.subsidies || [];
    if (activeTab === "insurance") return schemes.insurance || [];
    if (activeTab === "schemes") return schemes.schemes || [];
    return [];
  };

  const getLocalizedTitle = (item) => {
    if (lang === "hi" && item.nameHi) return item.nameHi;
    if (lang === "mr" && item.nameMr) return item.nameMr;
    return item.name;
  };

  const getLocalizedDesc = (item) => {
    if (lang === "hi" && item.descHi) return item.descHi;
    if (lang === "mr" && item.descMr) return item.descMr;
    return item.description;
  };

  const getTabIcon = (tabName) => {
    switch (tabName) {
      case "matcher": return <CheckSquare className="h-4 w-4" />;
      case "subsidies": return <Landmark className="h-4 w-4" />;
      case "insurance": return <ShieldCheck className="h-4 w-4" />;
      case "schemes": return <HelpCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark mb-3">
            🏛️ {t("govSchemesBadge")}
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
            {t("govSchemesTitle")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("govSchemesSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Map and Location Controller */}
          <div className="glass p-6 rounded-3xl lg:col-span-5 flex flex-col gap-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> {t("yourLocation")}
            </h3>
            
            {/* Search location form */}
            <form onSubmit={handleSearchLocation} className="relative flex gap-2">
              <input
                type="text"
                placeholder={lang === "hi" ? "स्थान खोजें (उदा. पुणे, लखनऊ)..." : lang === "mr" ? "स्थान शोधा (उदा. पुणे, सातारा)..." : "Search location in India (e.g. Pune, Lucknow)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl btn-gradient disabled:opacity-50"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </form>

            {/* Geolocation Button */}
            <button
              onClick={handleDetectLocation}
              disabled={loading}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl border text-xs font-bold transition disabled:opacity-50 ${
                gpsPermission === "granted"
                  ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                  : gpsPermission === "denied"
                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700"
                  : "border-primary/20 bg-white hover:bg-primary/5 text-primary"
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {gpsPermission === "granted"
                ? "✅ Re-detect GPS Location"
                : gpsPermission === "denied"
                ? "🔒 GPS Blocked — Using Network Location"
                : (lang === "hi" ? "मेरा स्थान खोजें" : lang === "mr" ? "माझे स्थान शोधा" : "Detect My Location")}
            </button>
            {gpsPermission === "denied" && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-[11px] text-blue-800 leading-relaxed">
                <strong>To enable precise GPS:</strong><br />
                1. Click the <strong>🔒 lock icon</strong> in your browser's address bar<br />
                2. Go to <strong>Site settings → Location → Allow</strong><br />
                3. Refresh the page and click Detect My Location again
              </div>
            )}

            {/* Address display */}
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                {lang === "hi" ? "सक्रिय स्थान:" : lang === "mr" ? "चालू ठिकाण:" : "Active Location:"}
              </span>
              <span className="text-sm font-bold text-primary-dark mt-0.5 block">
                {locationName || t("loadingLocation")}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Coordinates: {coords.lat.toFixed(4)} N, {coords.lon.toFixed(4)} E
              </span>
            </div>

            {statusMessage && (
              <div className={`text-xs px-4 py-2.5 rounded-2xl border ${
                statusMessage.startsWith("📍") || statusMessage.startsWith("🔒")
                  ? "bg-amber-50 text-amber-800 border-amber-100"
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {statusMessage}
              </div>
            )}

            {/* Map Container */}
            <div className="h-64 rounded-2xl overflow-hidden border border-primary/20 z-10">
              <div id="map" ref={mapContainerRef} className="h-full w-full" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              💡 Drag the marker or click anywhere on the map to update your location.
            </p>
          </div>

          {/* Schemes Display */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex bg-primary/10 p-1.5 rounded-2xl gap-1 shrink-0 w-max max-w-full overflow-x-auto">
              {["matcher", "subsidies", "insurance", "schemes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeTab === tab
                      ? "bg-primary text-white shadow-md"
                      : "text-foreground/75 hover:bg-primary/10"
                  }`}
                >
                  {getTabIcon(tab)}
                  {tab === "matcher" ? "Eligibility Matcher" : t(`${tab}Tab`)}
                </button>
              ))}
            </div>

            {/* Loading / Cards Grid */}
            {activeTab === "matcher" ? (
              <SchemeMatcher />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Updating schemes database for {locationName}...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {getFilteredSchemes().length > 0 ? (
                  getFilteredSchemes().map((item) => (
                    <div key={item.id} className="glass p-5 rounded-3xl hover:border-primary/40 transition flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-primary/10 text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                            {item.amount || item.premium || item.benefit}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-foreground">
                          {getLocalizedTitle(item)}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getLocalizedDesc(item)}
                        </p>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark shrink-0 hover:underline"
                      >
                        {t("applyNow")} <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="glass p-8 text-center rounded-3xl text-muted-foreground text-xs">
                    No active schemes found for this location. Try choosing another state.
                  </div>
                )}
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
