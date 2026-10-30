import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Leaf,
  CloudSun,
  Droplets,
  Bug,
  FlaskConical,
  TrendingUp,
  Sprout,
  ShieldCheck,
  LineChart,
  Bell,
  LayoutDashboard,
  Bot,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Sun,
  Wind,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { apiFetch } from "../lib/api.js";
import heroImg from "../assets/hero-farm.jpg";
import farmer1 from "../assets/farmer-1.jpg";
import farmer2 from "../assets/farmer-2.jpg";
import farmer3 from "../assets/farmer-3.jpg";



function FloatingLeaves() {
  const leaves = Array.from({ length: 8 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {leaves.map((_, i) => (
        <Leaf
          key={i}
          className="absolute text-primary/40 animate-leaf"
          style={{
            left: `${(i * 13) % 100}%`,
            width: 14 + (i % 4) * 6,
            height: 14 + (i % 4) * 6,
            animationDelay: `${i * 1.8}s`,
            animationDuration: `${12 + (i % 5) * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function Cloud({ className }) {
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden>
      <path
        d="M40 60 Q40 30 70 30 Q80 10 105 15 Q130 5 145 30 Q175 30 175 60 Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

function FloatingCard({ icon: Icon, title, value, className, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`glass absolute flex items-center gap-3 rounded-2xl px-4 py-3 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl btn-gradient">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[11px] font-medium text-muted-foreground">{title}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section id="home" className="relative overflow-hidden hero-bg pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0">
        <Cloud className="absolute top-24 -left-20 w-64 animate-drift" />
        <div className="absolute top-16 right-16 h-24 w-24 rounded-full bg-yellow-300/70 blur-2xl" />
        <div className="absolute top-20 right-20 h-16 w-16 rounded-full bg-yellow-200" />
      </div>
      <FloatingLeaves />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-primary-dark">
            <Sparkles className="h-3.5 w-3.5" /> {t("badge")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            {t("heroTitle1")}
            <span className="text-gradient">{t("heroTitle2")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold"
            >
              {t("getStarted")} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/60 px-6 py-3 text-sm font-semibold text-primary-dark backdrop-blur hover:bg-white"
            >
              {t("exploreFeatures")}
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> {t("trustedFarmers")}
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" /> {t("cropsSupported")}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative mx-auto aspect-[5/4] w-full max-w-xl overflow-hidden rounded-[2rem] shadow-[var(--shadow-glow)] ring-1 ring-white/50">
            <img
              src={heroImg}
              alt="Smart farming with AI"
              width={1280}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          <FloatingCard
            icon={CloudSun}
            title="Weather"
            value="28°C · Sunny"
            className="left-[-1rem] top-6 hidden sm:flex"
            delay={0.4}
          />
          <FloatingCard
            icon={Droplets}
            title="Soil Health"
            value="Optimal"
            className="right-[-1rem] top-24 hidden sm:flex"
            delay={0.7}
          />
          <FloatingCard
            icon={TrendingUp}
            title="Crop Yield"
            value="+18% ↑"
            className="left-2 bottom-6 hidden sm:flex"
            delay={1.0}
          />
          <FloatingCard
            icon={Bot}
            title="AI Recommendation"
            value="Grow Rice 🌾"
            className="right-0 bottom-16 hidden sm:flex"
            delay={1.3}
          />
        </motion.div>
      </div>

      <svg
        viewBox="0 0 1440 80"
        className="absolute bottom-0 left-0 w-full text-primary-dark"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0 60 L30 40 L60 60 L90 30 L120 60 L150 45 L180 60 L210 25 L240 60 L270 40 L300 60 L330 35 L360 60 L390 45 L420 60 L450 20 L480 60 L510 40 L540 60 L570 30 L600 60 L630 45 L660 60 L690 25 L720 60 L750 40 L780 60 L810 35 L840 60 L870 45 L900 60 L930 20 L960 60 L990 40 L1020 60 L1050 30 L1080 60 L1110 45 L1140 60 L1170 25 L1200 60 L1230 40 L1260 60 L1290 35 L1320 60 L1350 45 L1380 60 L1410 20 L1440 60 L1440 80 L0 80 Z"
        />
      </svg>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-dark">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

function WhyChooseUs() {
  const { t } = useLanguage();

  const whyCards = [
    { icon: Bot, title: t("cropRec"), text: t("whyCropRecText") },
    { icon: CloudSun, title: t("weatherForecast"), text: t("whyWeatherText") },
    { icon: Droplets, title: t("irrigationAdvisory"), text: t("whyIrrigationText") },
    { icon: Bug, title: t("diseaseDetection"), text: t("whyDiseaseText") },
    { icon: FlaskConical, title: t("fertilizerRec"), text: t("whyFertilizerText") },
    { icon: LineChart, title: t("yieldPrediction") || "Yield Prediction", text: t("whyYieldText") },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("whyAgriSense")}
          title={t("whyTitle")}
          subtitle={t("whySubtitle")}
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyCards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl btn-gradient">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.floor(v).toLocaleString() + suffix);
  const [text, setText] = useState("0" + suffix);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.8, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setText(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, mv, rounded, to, suffix]);
  return <span ref={ref}>{text}</span>;
}

function Benefits() {
  const { t } = useLanguage();

  const stats = [
    { value: 35, suffix: "%", label: t("statsYield"), icon: TrendingUp },
    { value: 40, suffix: "%", label: t("statsWater"), icon: Droplets },
    { value: 28, suffix: "%", label: t("statsFertilizer"), icon: FlaskConical },
    { value: 92, suffix: "%", label: t("statsDisease"), icon: ShieldCheck },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-cta)] p-10 text-white shadow-[var(--shadow-glow)] sm:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {t("statsTitle") || "Farmer Benefits"}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
                {t("statsHeadline") || "Real results, measured across thousands of farms"}
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <div className="mt-4 text-4xl font-extrabold sm:text-5xl">
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-sm text-white/85">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { n: "01", title: t("step1Title"), text: t("step1Text"), icon: Sprout },
    { n: "02", title: t("step2Title"), text: t("step2Text"), icon: Bot },
    { n: "03", title: t("step3Title"), text: t("step3Text"), icon: Sparkles },
    { n: "04", title: t("step4Title"), text: t("step4Text"), icon: TrendingUp },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("howItWorks")}
          title={t("howTitle")}
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-3xl border border-primary/15 bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="text-6xl font-extrabold text-primary/10">{s.n}</div>
              <div className="mt-[-2rem] grid h-12 w-12 place-items-center rounded-2xl btn-gradient">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/40 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useLanguage();

  const features = [
    { icon: Sprout, title: t("cropRec"), path: "/crop-recommendation" },
    { icon: CloudSun, title: t("weatherForecast"), path: "/weather" },
    { icon: Bug, title: t("diseaseDetection"), path: "/disease-detection" },
    { icon: ShieldCheck, title: t("pestDetection"), path: "/disease-detection" },
    { icon: Droplets, title: t("irrigationAdvisory"), path: "/irrigation" },
    { icon: FlaskConical, title: t("fertilizerRec"), path: "/fertilizer" },
    { icon: LineChart, title: t("yieldPrediction") || "Yield Prediction", path: "/dashboard" },
    { icon: TrendingUp, title: t("marketAnalysis"), path: "/market-prices" },
    { icon: Bell, title: t("smartNotif"), path: "/dashboard" },
    { icon: LayoutDashboard, title: t("farmerDash"), path: "/dashboard" },
    { icon: Bot, title: t("aiAssistant"), path: "/dashboard" },
    { icon: Sun, title: t("weatherAlerts"), path: "/weather" },
  ];

  return (
    <section id="features" className="relative bg-primary/5 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("features") || "Features"}
          title={t("featuresTitle")}
          subtitle={t("featuresSubtitle") || "A complete toolkit designed with agronomists, data scientists and real farmers."}
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {features.map((f, i) => (
            <a
              key={f.title}
              href={f.path}
              className="glass group flex flex-col items-start rounded-2xl p-5 transition hover:-translate-y-1"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:btn-gradient group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-sm font-semibold">{f.title}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    img: farmer1,
    name: "Ravi Kumar",
    role: "Rice Farmer · Andhra Pradesh",
    quote:
      "AgriSense told me exactly when to irrigate. My rice yield went up 22% and my water bill dropped. Life-changing.",
  },
  {
    img: farmer2,
    name: "Meera Devi",
    role: "Vegetable Farmer · Punjab",
    quote:
      "The disease detection saved my tomato crop last monsoon. I just clicked a photo and got the exact treatment.",
  },
  {
    img: farmer3,
    name: "Suresh Patel",
    role: "Wheat Farmer · Gujarat",
    quote:
      "Market price alerts helped me sell at the right time. I earned ₹28,000 more from the same harvest this year.",
  },
];

function Testimonials() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Testimonials"
          title="Farmers love AgriSense"
          subtitle="Stories from the fields where our AI is making a difference every day."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass flex flex-col rounded-3xl p-6"
            >
              <div className="flex items-center gap-4">
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30"
                />
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/80">
                "{t.quote}"
              </blockquote>
              <div className="mt-4 flex gap-0.5 text-yellow-500">
                {"★★★★★".split("").map((s, k) => (
                  <span key={k}>{s}</span>
                ))}
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Do I need internet to use AgriSense?",
    a: "You need internet to sync data and use AI features, but many insights are cached on your device so you can view them offline in the field.",
  },
  {
    q: "Which crops does AgriSense support?",
    a: "24 major crops including rice, wheat, cotton, sugarcane, maize, pulses, and most common vegetables and fruits. We're adding more monthly.",
  },
  {
    q: "How accurate is disease detection?",
    a: "Our model is trained on over 500,000 leaf images and achieves 92%+ accuracy on the most common crop diseases across India.",
  },
  {
    q: "Is my farm data private?",
    a: "Absolutely. Your data is encrypted and never shared without your permission. You control what's visible and can export or delete it anytime.",
  },
  {
    q: "Is AgriSense free?",
    a: "Yes — core features like crop advice, weather and disease detection are free. Premium market analytics are available on paid plans.",
  },
];

function FAQ() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(0);

  const faqs = [
    {
      q: t("faq1Q") || "Do I need internet to use AgriSense?",
      a: t("faq1A") || "You need internet to sync data and use AI features, but many insights are cached on your device so you can view them offline in the field.",
    },
    {
      q: t("faq2Q") || "Which crops does AgriSense support?",
      a: t("faq2A") || "24 major crops including rice, wheat, cotton, sugarcane, maize, pulses, and most common vegetables and fruits. We're adding more monthly.",
    },
    {
      q: t("faq3Q") || "How accurate is disease detection?",
      a: t("faq3A") || "Our model is trained on over 500,000 leaf images and achieves 92%+ accuracy on the most common crop diseases across India.",
    },
    {
      q: t("faq4Q") || "Is my farm data private?",
      a: t("faq4A") || "Absolutely. Your data is encrypted and never shared without your permission. You control what's visible and can export or delete it anytime.",
    },
    {
      q: t("faq5Q") || "Is AgriSense free?",
      a: t("faq5A") || "Yes — core features like crop advice, weather and disease detection are free. Premium market analytics are available on paid plans.",
    },
  ];

  return (
    <section id="about" className="relative bg-primary/5 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={t("faq") || "FAQ"} title={t("faqTitle")} />
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-semibold">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-6 pb-5 text-sm text-muted-foreground"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // null | "sending" | "success" | "error"

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-4 max-w-lg mx-auto">
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder={t("contactName") || "Your Name"}
        required
        className="w-full rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur"
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder={t("contactEmail") || "Your Email"}
        required
        className="w-full rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur"
      />
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder={t("contactMessage") || "Your Message"}
        rows={4}
        required
        className="w-full rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 backdrop-blur resize-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {status === "sending" ? t("sending") : t("sendMessage")} <ArrowRight className="h-4 w-4" />
      </button>
      {status === "success" && (
        <p className="text-sm text-green-700 font-medium">{t("messageSent")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 font-medium">✗ Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

function CTA() {
  const { t } = useLanguage();
  return (
    <section id="contact" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-cta)] p-10 text-center text-white shadow-[var(--shadow-glow)] sm:p-16">
          <FloatingLeaves />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Wind className="mx-auto h-8 w-8 opacity-80" />
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{t("ctaTitle") || "Ready to grow smarter?"}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              {t("ctaSubtitle") || "Join 12,000+ farmers using AgriSense to make better decisions every day. Free to start. No credit card needed."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#home"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary-dark shadow hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                {t("getStarted")} <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
              >
                {t("exploreFeatures")}
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <SectionHeader eyebrow={t("getInTouch") || "Get in Touch"} title={t("contactUs")} />
          <ContactForm />
        </div>
      </div>
    </section>
  );
}



function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "🙏 Namaste! I am your **AgriSense AI Assistant**. Ask me about weather, crops, disease, fertilizers, irrigation or market prices!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { from: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.data?.reply || "Sorry, I couldn't understand that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown bold **text** rendering
  const renderText = (text) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full btn-gradient shadow-[var(--shadow-glow)]"
        aria-label="AI assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            1
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-primary/20 bg-white/95 shadow-2xl backdrop-blur-xl"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[image:var(--gradient-cta)] px-5 py-4 text-white">
            <Bot className="h-6 w-6" />
            <div>
              <div className="font-bold text-sm">AgriSense AI Assistant</div>
              <div className="text-[11px] opacity-80">Online · Ask anything about farming</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollBehavior: "smooth" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-primary/10 text-foreground rounded-bl-md"
                  }`}
                >
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-primary/10 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-primary/10 px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about crops, weather, disease..."
              className="flex-1 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full btn-gradient disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <WhyChooseUs />
        <Benefits />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
