import { createFileRoute } from "@tanstack/react-router";
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
import heroImg from "@/assets/hero-farm.jpg";
import farmer1 from "@/assets/farmer-1.jpg";
import farmer2 from "@/assets/farmer-2.jpg";
import farmer3 from "@/assets/farmer-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSense AI — Smart Crop Advisory for Modern Farmers" },
      {
        name: "description",
        content:
          "AI crop recommendations, weather, disease detection, irrigation, fertilizer advice and market prices for farmers.",
      },
      { property: "og:title", content: "AgriSense AI — Smart Crop Advisory" },
      {
        property: "og:description",
        content:
          "Empowering farmers with AI insights: crops, weather, disease, irrigation, fertilizer and markets.",
      },
    ],
  }),
  component: LandingPage,
});

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Weather", href: "#weather" },
  { label: "Disease Detection", href: "#disease" },
  { label: "Market Prices", href: "#market" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-2" : "py-4"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl btn-gradient">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Agri<span className="text-gradient">Sense</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-primary/10 hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:block">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold"
          >
            Login <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <button
          className="lg:hidden rounded-xl p-2 hover:bg-primary/10"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden glass mx-4 mt-2 rounded-2xl p-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-primary/10"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-5 py-2.5 text-sm font-semibold"
            >
              Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

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

function Cloud({ className }: { className?: string }) {
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

function FloatingCard({
  icon: Icon,
  title,
  value,
  className,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  className?: string;
  delay: number;
}) {
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
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered AgriTech Platform
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            Empowering Farmers with{" "}
            <span className="text-gradient">Artificial Intelligence</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Get AI-powered crop recommendations, weather insights, disease detection, irrigation
            advice, fertilizer suggestions and market prices — all in one beautiful platform built
            for farmers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-3 text-sm font-semibold"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/60 px-6 py-3 text-sm font-semibold text-primary-dark backdrop-blur hover:bg-white"
            >
              Explore Features
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Trusted by 12k+ farmers
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" /> 24 crops supported
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

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
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

const whyCards = [
  { icon: Bot, title: "AI Recommendations", text: "Personalised crop guidance based on your farm's soil, climate and season." },
  { icon: CloudSun, title: "Weather Forecast", text: "Hyper-local 7-day forecasts, rainfall probability and severe weather alerts." },
  { icon: Droplets, title: "Smart Irrigation", text: "Know exactly when and how much to water — save up to 40% on water usage." },
  { icon: Bug, title: "Disease Detection", text: "Snap a leaf photo, get instant disease diagnosis and treatment plans." },
  { icon: FlaskConical, title: "Fertilizer Advice", text: "Right nutrient, right dose, right time. Cut chemical costs while boosting soil health." },
  { icon: LineChart, title: "Yield Prediction", text: "Forecast production before harvest and plan sales with confidence." },
];

function WhyChooseUs() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Why AgriSense"
          title="Everything a modern farm needs"
          subtitle="Six intelligent tools that work together to help you grow more, spend less and farm smarter."
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

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
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

const stats = [
  { value: 35, suffix: "%", label: "Increase in Yield", icon: TrendingUp },
  { value: 40, suffix: "%", label: "Water Saved", icon: Droplets },
  { value: 28, suffix: "%", label: "Fertilizer Cost Reduced", icon: FlaskConical },
  { value: 92, suffix: "%", label: "Early Disease Detection", icon: ShieldCheck },
];

function Benefits() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-cta)] p-10 text-white shadow-[var(--shadow-glow)] sm:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Farmer Benefits
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
                Real results, measured across thousands of farms
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

const steps = [
  { n: "01", title: "Enter Farm Details", text: "Tell us about your soil, crop and location — takes 2 minutes.", icon: Sprout },
  { n: "02", title: "AI Analyses Data", text: "Our models combine weather, soil and satellite data in seconds.", icon: Bot },
  { n: "03", title: "Get Recommendations", text: "Actionable advice for crops, water, nutrients and pest control.", icon: Sparkles },
  { n: "04", title: "Improve Production", text: "Apply insights and watch your yield and income grow season after season.", icon: TrendingUp },
];

function HowItWorks() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How It Works"
          title="From your field to smart insights in 4 steps"
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

const features = [
  { icon: Sprout, title: "Crop Recommendation" },
  { icon: CloudSun, title: "Weather Forecast" },
  { icon: Bug, title: "Disease Detection" },
  { icon: ShieldCheck, title: "Pest Detection" },
  { icon: Droplets, title: "Irrigation Advisory" },
  { icon: FlaskConical, title: "Fertilizer Recommendation" },
  { icon: LineChart, title: "Yield Prediction" },
  { icon: TrendingUp, title: "Market Price Analysis" },
  { icon: Bell, title: "Smart Notifications" },
  { icon: LayoutDashboard, title: "Farmer Dashboard" },
  { icon: Bot, title: "AI Assistant" },
  { icon: Sun, title: "Weather Alerts" },
];

function Features() {
  return (
    <section id="features" className="relative bg-primary/5 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Features"
          title="One platform, every advantage"
          subtitle="A complete toolkit designed with agronomists, data scientists and real farmers."
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="glass group flex flex-col items-start rounded-2xl p-5 transition hover:-translate-y-1"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:btn-gradient group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-sm font-semibold">{f.title}</div>
            </motion.div>
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
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="about" className="relative bg-primary/5 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Answers for every farmer" />
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

function CTA() {
  return (
    <section id="contact" className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[image:var(--gradient-cta)] p-10 text-center text-white shadow-[var(--shadow-glow)] sm:p-16">
          <FloatingLeaves />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Wind className="mx-auto h-8 w-8 opacity-80" />
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Ready to grow smarter?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Join 12,000+ farmers using AgriSense to make better decisions every day. Free to
              start. No credit card needed.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#home"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary-dark shadow hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative bg-[color:var(--primary-dark)] pt-16 pb-8 text-white/85">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold text-white">AgriSense</span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Smart AI advisory to help farmers grow more, save resources and earn more from every
            harvest.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Twitter, Instagram, Youtube].map((I, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="social"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Product</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {["Features", "Dashboard", "Weather", "Disease Detection", "Market Prices"].map((x) => (
              <li key={x}>
                <a href="#" className="hover:text-white">
                  {x}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Company</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {["About", "Blog", "Careers", "Press", "Contact"].map((x) => (
              <li key={x}>
                <a href="#" className="hover:text-white">
                  {x}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Bengaluru, India
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> hello@agrisense.ai
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" /> +91 98765 43210
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-4 pt-6 text-center text-xs text-white/60 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} AgriSense AI. All rights reserved. Grown with 🌱 for farmers.
      </div>
    </footer>
  );
}

function ChatButton() {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring" }}
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full btn-gradient shadow-[var(--shadow-glow)]"
      aria-label="AI assistant"
    >
      <Bot className="h-6 w-6" />
      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        1
      </span>
    </motion.button>
  );
}

function LandingPage() {
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
      <ChatButton />
    </div>
  );
}
