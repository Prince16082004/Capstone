import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X, ArrowRight, LayoutDashboard, CloudSun, Sprout, Bug, Droplets, FlaskConical, LineChart, Globe, ChevronDown, LogOut, User as UserIcon, Landmark, FileText } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AuthModal from "./AuthModal.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const location = useLocation();
  const { lang, changeLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const langRef = useRef(null);

  const navItems = [
    { label: t("home"), path: "/" },
    { label: t("dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { label: t("cropAdvisory"), path: "/crop-recommendation", icon: Sprout },
    { label: t("weather"), path: "/weather", icon: CloudSun },
    { label: t("diseaseDetect"), path: "/disease-detection", icon: Bug },
    { label: t("irrigation"), path: "/irrigation", icon: Droplets },
    { label: t("fertilizer"), path: "/fertilizer", icon: FlaskConical },
    { label: t("marketPrices"), path: "/market-prices", icon: LineChart },
    { label: t("governmentSchemes"), path: "/government-schemes", icon: Landmark },
    { label: t("soilAnalyzer"), path: "/soil-analyzer", icon: FileText },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLangLabel = () => {
    if (lang === "hi") return "हिंदी";
    if (lang === "mr") return "मराठी";
    return "English";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || location.pathname !== "/" ? "glass py-2" : "py-4"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl btn-gradient">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Agri<span className="text-gradient">Sense</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Language Dropdown & Auth Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Single Button Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-full border border-primary/20 px-2.5 py-1.5 sm:px-3.5 text-xs font-bold text-foreground hover:bg-white transition"
              >
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">{getLangLabel()}</span>
                <span className="sm:hidden uppercase">{lang}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 glass rounded-2xl p-1.5 shadow-xl bg-white/95 border border-primary/10 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      changeLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      lang === "en" ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"
                    }`}
                  >
                    <span>English</span>
                    {lang === "en" && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage("hi");
                      setLangDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      lang === "hi" ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"
                    }`}
                  >
                    <span>हिंदी</span>
                    {lang === "hi" && <span className="text-[10px]">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage("mr");
                      setLangDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      lang === "mr" ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"
                    }`}
                  >
                    <span>मराठी</span>
                    {lang === "mr" && <span className="text-[10px]">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Auth / Login Button */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold text-primary-dark bg-primary/10 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 max-w-[100px] sm:max-w-none truncate">
                  <UserIcon className="h-3.5 w-3.5 shrink-0" /> <span className="hidden xs:inline">{user.name.split(" ")[0]}</span>
                </span>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 text-red-600 transition border border-red-200 bg-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-full btn-gradient px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs font-bold"
              >
                <span>{t("login")}</span> <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="xl:hidden rounded-xl p-1.5 sm:p-2 hover:bg-primary/10"
              onClick={() => setOpen(!open)}
              aria-label="menu"
            >
              {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {open && (
          <div className="xl:hidden glass mx-4 mt-2 rounded-2xl p-4 space-y-3">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-primary" /> {t("language")}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => changeLanguage("en")}
                  className={`px-2.5 py-1 text-xs rounded-full font-bold ${lang === "en" ? "bg-primary text-white" : "bg-white"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage("hi")}
                  className={`px-2.5 py-1 text-xs rounded-full font-bold ${lang === "hi" ? "bg-primary text-white" : "bg-white"}`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => changeLanguage("mr")}
                  className={`px-2.5 py-1 text-xs rounded-full font-bold ${lang === "mr" ? "bg-primary text-white" : "bg-white"}`}
                >
                  मराठी
                </button>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-primary/10"
                >
                  {item.icon && <item.icon className="h-4 w-4 text-primary" />}
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Login Button */}
            <div className="pt-2 border-t border-primary/10">
              {user ? (
                <div className="flex items-center justify-between p-2">
                  <span className="text-xs font-bold text-primary">👨‍🌾 {user.name}</span>
                  <button onClick={logout} className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full btn-gradient py-2.5 text-xs font-semibold"
                >
                  {t("login")}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
