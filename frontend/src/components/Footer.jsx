import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import bgImage from "../assets/homepage-images/banner-two.webp";
import { useSystemSettings } from "../context/SystemSettingsContext";
import { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../pages/axios";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const { settings } = useSystemSettings();
  const { property } = settings;
  const [email, setEmail] = useState("");

  return (
    <footer className="relative text-white pt-14 sm:pt-20 md:pt-28 pb-10 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/85" />

      {/* MAIN GRID */}
      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
    gap-10 lg:gap-16 mb-14 text-left"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        {/* BRAND */}
        <div className="space-y-5">
          <Link
            to="/"
            className="inline-block hover:scale-105 transition-transform"
          >
            <h2 className="text-xl sm:text-3xl font-serif font-bold tracking-[0.3em] uppercase">
              {property.hotelName}
            </h2>
            <p className="text-accent text-[10px] tracking-[0.4em] uppercase mt-1">
              Luxury Stay
            </p>
          </Link>

          <p className="text-sm leading-relaxed opacity-90 max-w-sm">
            Experience the epitome of luxury and Indian heritage. Your sanctuary
            in the heart of the city, where every detail is curated for comfort.
          </p>

          <div className="flex gap-3">
            {[
              {
                icon: Facebook,
                link: "https://www.facebook.com/Graphura.in",
              },
              {
                icon: Instagram,
                link: "https://www.instagram.com/graphura.in",
              },
              {
                icon: Twitter,
                link: "https://x.com/Graphura",
              },
            ].map(({ icon: Icon, link }, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/40
        flex items-center justify-center
        hover:bg-accent hover:border-accent hover:text-primary
        transition-all duration-300 group"
              >
                <Icon
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />
              </a>
            ))}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-5">
            Quick Links
          </h3>

          <ul className="space-y-2">
            {[
              { name: "About Us", path: "/about" },
              { name: "Accommodations", path: "/rooms" },
              { name: "Tariff", path: "/tariff" },
              { name: "Gallery", path: "/gallery" },
              { name: "Attractions", path: "/attractions" },
              { name: "Contact", path: "/contact" },
            ].map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="group inline-flex items-center text-sm hover:text-accent transition"
                >
                  <span className="w-0 overflow-hidden group-hover:w-4 transition-all text-accent">
                    <ArrowRight size={12} />
                  </span>
                  <span className="group-hover:translate-x-2 transition-transform">
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-5">
            Contact Us
          </h3>

          <ul className="space-y-4 text-sm">
            {/* Address */}
            <li className="flex gap-3 items-start">
              <MapPin
                className="text-accent mt-1 flex-shrink-0 w-5"
                size={18}
              />
              <span className="leading-relaxed break-words">
                {property.address}
              </span>
            </li>

            {/* Phone */}
            <li className="flex gap-3 items-start">
              <Phone className="text-accent mt-1 flex-shrink-0 w-5" size={18} />
              <div className="leading-relaxed flex flex-wrap gap-x-2">
                {property.phones?.map((phone, idx) => (
                  <span key={idx} className="whitespace-nowrap">
                    {phone}{idx < property.phones.length - 1 && ","}
                  </span>
                ))}
              </div>
            </li>

            {/* Email */}
            <li className="flex gap-3 items-start">
              <Mail className="text-accent mt-1 flex-shrink-0 w-5" size={18} />

              <div className="flex flex-col gap-1 leading-relaxed break-words">
                {property.emails?.map((email, idx) => (
                  <a
                    key={idx}
                    href={`mailto:${email}`}
                    className="hover:text-accent transition"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </li>
          </ul>
        </div>

        {/* NEWSLETTER */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-5">
            Newsletter
          </h3>

          <p className="text-sm mb-4 opacity-90 max-w-sm">
            Subscribe for exclusive offers and hotel updates.
          </p>

          <form
            className="flex flex-col gap-3 max-w-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = email.trim();
              const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
              if (!valid) {
                toast.error("Please enter a valid email.");
                return;
              }
              try {
                const res = await api.post("/newsletter/subscribe", {
                  email: value,
                });
                const data = res?.data;
                toast.success(
                  (data && typeof data === "object" && data.message) ||
                    "Subscribed successfully!",
                );
                setEmail("");
              } catch (err) {
                let errMsg = "Subscription failed. Please try again.";
                try {
                  if (err && typeof err === "object") {
                    if (!err.response) {
                      errMsg =
                        "Unable to reach the server. Please try again in a moment.";
                    }
                    // Prefer axios-parsed message if present and safe to read
                    const data = err.response?.data;
                    if (data && typeof data === "object" && data.message) {
                      errMsg = data.message;
                    } else if (typeof data === "string" && data.trim()) {
                      errMsg = data;
                    } else if (err.message) {
                      errMsg = err.message;
                    }
                  }
                } catch {
                  // fall back to generic message
                }
                toast.error(errMsg);
              }
            }}
          >
            <input
              type="email"
              placeholder="Your Email Address"
              className="bg-white/10 border border-white/30 px-4 py-3
          rounded-md text-sm text-white placeholder:text-white/60
          focus:outline-none focus:border-accent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="submit"
              className="bg-white text-primary hover:bg-accent hover:text-white
          py-3 rounded-md text-xs font-bold uppercase tracking-widest transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </motion.div>

      {/* BOTTOM BAR */}
      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6
        border-t border-white/30
        flex flex-col sm:flex-row gap-3 sm:gap-4
        justify-between items-center
        text-[11px] sm:text-xs text-center sm:text-left"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <p>
          © {currentYear} {property.hotelName}. All Rights Reserved.
        </p>

        <p className="opacity-70">
          Designed & Developed by{" "}
          <a
            href="https://graphura.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition"
          >
            Graphura India Private Limited
          </a>
        </p>

        <div className="flex gap-4 sm:gap-6 justify-center sm:justify-start">
          <Link to="/privacypolicy" className="hover:text-accent transition">
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-servicespolicy"
            className="hover:text-accent transition"
          >
            Terms of Service
          </Link>
          <Link
            to="/cancellationpolicy"
            className="hover:text-accent transition"
          >
            Cancellation Policy
          </Link>
        </div>
      </motion.div>
    </footer>
  );
}
