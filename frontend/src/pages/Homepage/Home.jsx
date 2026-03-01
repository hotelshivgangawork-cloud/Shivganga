import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import bg1 from "../../assets/homepage-images/banner-one.webp";
import "swiper/css";
import "swiper/css/pagination";
import BookingBar from "./BookingBar";
import RoomSection from "./RoomSection";
import Amenities from "./Amenities";
import AdditionalService from "./AdditionalService";
import RoomCollage from "./RoomCollage";
import ExploreAttraction from "./ExploreAttraction";
import Testimonials from "./Testimonials";
import { Helmet } from "react-helmet-async";
import { useSystemSettings } from "../../context/SystemSettingsContext";

<Helmet>
  <link rel="canonical" href="https://shivgangahotel.com/" />
</Helmet>;

const BackgroundImages = [
  bg1,
  "/images/home-hero2.webp",
  "/images/home-hero3.webp",
];

export default function Home() {
  const heroRef = useRef(null);
  const [bgImage, setbgImage] = useState(0);
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 500], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);
  const scaleHero = useTransform(scrollY, [0, 1000], [1, 1.2]);

  const { settings } = useSystemSettings();
  const { property } = settings;

  useEffect(() => {
    const interval = setInterval(() => {
      setbgImage((prev) => (prev + 1) % BackgroundImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden bg-background">
      {/* HERO SECTION */}
      <div
        ref={heroRef}
        className="relative min-h-[80vh] md:min-h-[85vh] lg:min-h-[95vh] overflow-hidden pt-[120px]"
      >
        {/* Background */}
        <motion.div
          style={{ y: yBg, scale: scaleHero }}
          className="absolute inset-0 z-0"
        >
          <motion.div
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${BackgroundImages[bgImage]})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: opacityHero }}
          className="relative z-10 w-full flex justify-center px-4 sm:px-6 md:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center text-white max-w-6xl"
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-[1px] bg-white/80"
              />
              <span className="text-white text-xs md:text-sm uppercase tracking-[0.5em] font-medium">
                Welcome to {property.hotelName}
              </span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-[1px] bg-white/80"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif mb-6 md:mb-8 leading-[1.2] tracking-tight drop-shadow-2xl text-accent">
              Experience Rishikesh in <br /> Comfort and Calm
            </h1>

            <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-white mb-10 md:mb-12 font-light leading-relaxed tracking-wide opacity-90">
              Experience spiritual calm, modern comfort, and premium hospitality
              at {property.hotelName} Hotel.
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-20"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }
        >
          <ChevronDown size={32} strokeWidth={1} />
        </motion.div>
      </div>

      {/* BOOKING BAR */}
      <BookingBar />

      {/* ROOMS SECTION */}
      <RoomSection />

      {/* Amenities */}
      <Amenities />

      {/* Additional Service SECTION */}
      <AdditionalService />

      {/* Room Collage */}
      <RoomCollage />

      {/* ATTRACTIONS SECTION */}
      <ExploreAttraction />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* CTA PRE-FOOTER */}
      <section className="py-24 bg-accent/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-serif text-primary mb-6">
            Ready for an Unforgettable Stay?
          </h2>
          <p className="text-primary/80 max-w-2xl mx-auto mb-10 text-lg font-light">
            Book your stay at {property.hotelName} Hotel and experience the
            perfect blend of luxury and heritage.
          </p>
          <Link
            to="/booking"
            className="btn-primary shadow-xl hover:shadow-2xl hover:bg-accent/90 transition-all rounded-2xl"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
