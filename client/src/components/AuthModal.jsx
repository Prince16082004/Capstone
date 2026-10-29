import { useState } from "react";
import { X, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        login(data.data, data.data.token);
        onClose();
        setForm({ name: "", email: "", password: "" });
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass p-6 sm:p-8 rounded-3xl bg-white/95 shadow-2xl border border-white/80 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-primary/10 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            👨‍🌾 AgriSense Farmer Portal
          </span>
          <h2 className="text-2xl font-extrabold mt-2">
            {isRegister ? "Create Farmer Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {isRegister
              ? "Register to access personalized AI crop advisory"
              : "Login with your email to access your farm dashboard"}
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
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl btn-gradient py-3 text-xs font-bold disabled:opacity-60"
          >
            {loading ? "Processing..." : isRegister ? "Register Account" : "Sign In"} <ArrowRight className="h-4 w-4" />
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
    </div>
  );
}
