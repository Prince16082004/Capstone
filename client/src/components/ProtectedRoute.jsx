import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiFetch } from "../lib/api.js";
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldAlert, Sprout } from "lucide-react";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin text-primary">
          <Sprout className="h-10 w-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-muted-foreground">Loading farmer profile...</p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        login(data.data, data.data.token);
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-4 py-24 hero-bg">
          <div className="w-full max-w-md glass p-6 sm:p-8 rounded-3xl bg-white/95 shadow-2xl border border-white/80 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 border border-red-100">
                <ShieldAlert className="h-3.5 w-3.5" /> Authentication Required
              </span>
              <h2 className="text-2xl font-extrabold mt-3">
                {isRegister ? "Register Farmer Account" : "Access Farmer Tools"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isRegister
                  ? "Sign up to unlock crop recommendation, disease scanner, and dashboard."
                  : "Please sign in with your farmer account to access this feature."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="text-xs font-bold block mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ravi Kumar"
                      required
                      className="w-full rounded-2xl border border-primary/20 bg-white pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="farmer@agrisense.ai"
                    required
                    className="w-full rounded-2xl border border-primary/20 bg-white pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-primary/20 bg-white pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-60"
              >
                {authLoading ? "Processing..." : isRegister ? "Create Account & Access" : "Sign In & Access"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 text-center pt-4 border-t border-primary/10 text-xs">
              <span className="text-muted-foreground">
                {isRegister ? "Already have an account?" : "Don't have an account?"}
              </span>{" "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="font-bold text-primary hover:underline"
              >
                {isRegister ? "Sign In" : "Register Free"}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return children;
}
