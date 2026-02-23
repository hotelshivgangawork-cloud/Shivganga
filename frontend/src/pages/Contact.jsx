import { MapPin, Phone, Mail, Send } from "lucide-react";
import { motion } from "framer-motion";
import contactHero from "../assets/contact-hero.webp";
import ResponsiveImage from "../components/ResponsiveImage";
import Seo from "../components/Seo";
import api from "../api/api";
import { useState, useRef } from "react";
// import Turnstile from "../components/Turnstile";
export default function Contact() {
  // const turnstileRef = useRef();
  const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: ""
});

const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState("");
const [error, setError] = useState("");

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  try {
    // Get Turnstile token
    // const captchaToken = turnstileRef.current?.getToken();
    // if (!captchaToken) {
    //   setError("Please complete the CAPTCHA verification");
    //   return;
    // }

    setLoading(true);

    await api.post("/contact", {
      ...formData,
      // captchaToken
    });

    setSuccess("Your message has been sent successfully 🙏");

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: ""
    });

    // // Reset Turnstile
    // turnstileRef.current?.reset();
  } catch (err) {
    setError(
      err.response?.data?.message || "Something went wrong. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-[#F8F6F3] min-h-screen text-[#1E1E1E]">
      <Seo
        title="Contact Shiv Ganga Hotel | Rishikesh"
        description="Get in touch with Shiv Ganga Hotel for reservations and inquiries. Near Laxman Jhula, Tapovan, Rishikesh."
        path="/contact"
        image={contactHero}
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ResponsiveImage
            src={contactHero}
            alt="Hotel Shiv Ganga contact background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="
            relative z-10 max-w-4xl mx-auto
            px-6
            pt-32 sm:pt-40 md:pt-48
            pb-40 sm:pb-56 md:pb-64
            text-center text-white
            -translate-y-10 sm:-translate-y-16 md:-translate-y-20
          "
        >
          <span className="text-[#C9A24D] uppercase tracking-[0.35em] text-[10px] sm:text-xs font-bold">
            Contact Us
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-serif leading-tight">
            Connect with Shiv Ganga
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Experience tranquility in the heart of Rishikesh. Whether you’re
            planning a spiritual retreat or a luxury getaway, we’re here to
            assist you with every detail.
          </p>
        </motion.div>
      </section>

      {/* ================= FORM SECTION ================= */}
      <section className="relative z-20 px-4 -mt-24 sm:-mt-36 md:-mt-44 lg:-mt-52">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="
            w-full max-w-5xl
            mx-auto
            bg-white rounded-2xl sm:rounded-3xl
            px-5 sm:px-10 md:px-16
            pt-6 pb-10 sm:pt-8 sm:pb-14
            shadow-2xl
            border border-[#E5E1DA]
          "
        >
          <h2 className="text-2xl md:text-3xl font-serif mb-10 text-center text-[#1E1E1E]">
            Send Us a Message
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8">
            <Input
  label="First Name"
  placeholder="Your name"
  name="firstName"
  value={formData.firstName}
  onChange={handleChange}
/>

        <Input
  label="Last Name"
  placeholder="Surname"
  name="lastName"
  value={formData.lastName}
  onChange={handleChange}
/>

            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Input
  label="Email Address"
  placeholder="email@example.com"
  name="email"
  value={formData.email}
  onChange={handleChange}
/>

                <Input
  label="Subject"
  placeholder="How can we help?"
  name="subject"
  value={formData.subject}
  onChange={handleChange}
/>

            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest">
                Message
              </label>
            <textarea
  rows="3"
  name="message"
  value={formData.message}
  onChange={handleChange}
  className="w-full bg-transparent border-b border-[#D8D3C9] py-3 text-primary text-lg placeholder-gray-300 focus:outline-none focus:border-[#C9A24D] transition resize-none"
  placeholder="Tell us about your requirements..."
/>

            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            {/* <div className="pt-2">
              <Turnstile ref={turnstileRef} />
            </div> */}

            <div className="pt-4">
              <button
  type="submit"
  disabled={loading}
  className="w-full py-4 rounded-xl bg-[#C9A24D] text-white hover:bg-[#B89240] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-[#C9A24D]/20 font-bold uppercase tracking-widest text-xs disabled:opacity-60"
>
  {loading ? "Sending..." : "Send Message"}
  <Send size={14} />
</button>

            </div>
          </form>
        </motion.div>
        {success && (
  <p className="text-green-600 text-center text-sm font-medium">
    {success}
  </p>
)}

{error && (
  <p className="text-red-600 text-center text-sm font-medium">
    {error}
  </p>
)}

      </section>

      {/* ================= INFO CARDS (DOME SHAPE) ================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-10">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            {
              icon: <MapPin size={22} />,
              title: "Our Location",
              value: "Near Laxman Jhula, Tapovan, Rishikesh, Uttarakhand 249137, India",
            },
            {
              icon: <Phone size={22} />,
              title: "Reservation Desk",
              value: "+91-9837368384\n8755558384\n0135-2973618",
            },
            {
              icon: <Mail size={22} />,
              title: "Email Us",
              value:
                "vikrambhardwaj1984@gmail.com\nhotelshivganga.rishikesh@gmail.com",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="
                relative
                bg-gradient-to-b from-white to-[#FBFAF8]
                /* Responsive Padding: More vertical space on desktop */
                pt-20 pb-12 px-5 sm:px-8
                text-center
                shadow-md
                border border-[#E5E1DA]
                /* Responsive Dome: Slightly smaller radius on mobile for better proportions */
                rounded-t-[100px] sm:rounded-t-[140px] md:rounded-t-[160px]
                rounded-b-3xl
                transition-all duration-300
                hover:-translate-y-2
              "
            >
              {/* Icon container with a subtle scale effect on hover */}
              <div className="
                mx-auto mb-6 w-16 h-16 
                flex items-center justify-center 
                rounded-full bg-[#F8F6F3] text-[#C9A24D]
                border border-[#E5E1DA]
                group-hover:scale-110 transition-transform duration-500
              ">
                {item.icon}
              </div>

              <h3 className="mt-4 uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold text-[#9A9A9A] mb-4">
                {item.title}
              </h3>

              <p className="whitespace-pre-line text-[#4A4A4A] leading-relaxed text-sm sm:text-base break-words max-w-full">
                {item.value}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= LOCATION ================= */}
      <section className="px-4 sm:px-6 pt-12 pb-20 bg-[#F8F6F3]">
        <div className="max-w-6xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-10 md:mb-16">
            <span className="text-[#C9A24D] uppercase tracking-[0.35em] text-[10px] sm:text-xs font-bold">
              Location
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif">
              Find Us on the Map
            </h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Nestled near the sacred ghats of Rishikesh, Shiv Ganga offers a peaceful
              stay with effortless accessibility.
            </p>
          </div>

          {/* Map Container */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white p-2">
            
            {/* Interactive Google Map */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d55227.432242764546!2d78.26394774849987!3d30.102361472701975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39091765decf6c95%3A0x7fe90e0c9f2edcae!2sShiv%20Ganga%20Hotel!5e0!3m2!1sen!2sin!4v1769325397693!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              title="Shiv Ganga Location"
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-[1.5rem]"
            />

            {/* Floating Address Badge */}
            <div
              className="
                absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2
                w-[90%] sm:w-auto
                bg-white/90 backdrop-blur-md
                px-6 py-4 rounded-2xl sm:rounded-full
                shadow-xl border border-[#E5E1DA]
                text-xs sm:text-sm text-gray-800 font-medium
                flex items-center justify-center gap-2
                text-center
              "
            >
              <span className="text-[#C9A24D]">📍</span>
              <span className="leading-tight">
                Near Laxman Jhula, Tapovan, Rishikesh, Uttarakhand
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ===== INPUT (UNCHANGED) ===== */
function Input({ label, placeholder, name, value, onChange }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-[#D8D3C9] py-3 text-primary text-lg placeholder-gray-300 focus:outline-none focus:border-[#C9A24D] transition"
      />
    </div>
  );
}

