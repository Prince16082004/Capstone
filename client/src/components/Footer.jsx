import { Leaf, Facebook, Twitter, Instagram, Youtube, MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
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
            Smart AI advisory to help farmers grow more, save resources and earn more from every harvest.
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
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Features</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/crop-recommendation" className="hover:text-white">Crop Recommendation</Link></li>
            <li><Link to="/weather" className="hover:text-white">Weather Forecast</Link></li>
            <li><Link to="/disease-detection" className="hover:text-white">Disease Detection</Link></li>
            <li><Link to="/irrigation" className="hover:text-white">Irrigation Advisory</Link></li>
            <li><Link to="/fertilizer" className="hover:text-white">Fertilizer Calculator</Link></li>
            <li><Link to="/market-prices" className="hover:text-white">Market Mandi Prices</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/dashboard" className="hover:text-white">Farmer Dashboard</Link></li>
            <li><Link to="/" className="hover:text-white">Home Page</Link></li>
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
