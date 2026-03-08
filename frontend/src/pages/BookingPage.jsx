// Debug: log the sitekey value and type at module load
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Star,
  Check,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  User,
  MapPin,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import bgImage from "../assets/homepage-images/banner-one.webp";
import Seo from "../components/Seo";
import ResponsiveImage from "../components/ResponsiveImage";
import api from "../api/api";
import { rooms as fallbackRooms } from "../data/rooms";

const _motion = motion;

const steps = [
  { id: 1, title: "Dates & Guests", icon: Calendar },
  { id: 2, title: "Select Room", icon: Star },
  { id: 3, title: "Enhance Stay", icon: MapPin },
  { id: 4, title: "Personal Details", icon: User },
  { id: 5, title: "Confirmation", icon: Check },
];

const ACTIVITIES = [
  {
    id: "rafting",
    title: "River Rafting",
    price: 2500,
    label: "Rs. 2500",
    desc: "Experience the thrill of the Ganges rapids.",
    img: "/images/rafting.webp",
  },
  {
    id: "bungee",
    title: "Bungee Jumping",
    price: 4000,
    label: "Rs. 4000",
    desc: "India's highest bungee jumping platform.",
    img: "/images/bjumping.webp",
  },
  {
    id: "aarti",
    title: "Ganga Aarti",
    price: 0,
    label: "Free",
    desc: "Spiritual evening ceremony by the river.",
    img: "/images/a1.webp",
  },
  {
    id: "yoga",
    title: "Yoga Session",
    price: 1500,
    label: "Rs. 1500",
    desc: "Find peace in the Yoga Capital of the World.",
    img: "/images/yoga.webp",
  },
];

export default function BookingPage() {
  // Cloudflare Turnstile CAPTCHA
  // const turnstileRef = useRef(null);
  // const handleCaptchaVerify = (token) => {
  //   setCaptchaToken(token);
  //   setPaymentError("");
  // };
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate(); // ✅ INSIDE component
  const location = useLocation();
  const [appliedCoupon, setAppliedCoupon] = useState(
    location.state?.appliedCoupon || null
  ); // New

  // restore various pieces from bookingDraft when navigating back from coupons
  const draft = location.state?.bookingDraft || {};

  const [rooms, setRooms] = useState(
    location.state?.rooms || draft.rooms || [],
  );
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);
  const [isMember, setIsMember] = useState(draft.isMember || false);
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);// added

  const [currentStep, setCurrentStep] = useState(() => {
    const s = location.state || {};

    if (s.fromCoupon && s.bookingDraft?.currentStep) {
      return s.bookingDraft.currentStep; // 🔥 restore step
    }

    return s.step || 1;
  });

  const [formData, setFormData] = useState(() => {
    const state = location.state || {};
    const draftForm = draft.formData || {};

    // if draft form data exists, use it directly
    if (Object.keys(draftForm).length) return draftForm;

    const selectedRooms = state.room
      ? [{ ...state.room, quantity: 1, plan: "ep" }]
      : [];
    const selectedActivities = [];

    if (state.activityId) {
      const activity = ACTIVITIES.find((a) => a.id === state.activityId);
      if (activity) selectedActivities.push(activity);
    }

    return {
      checkIn: state.checkIn || "",
      checkOut: state.checkOut || "",
      adults: state.adults || 1,
      children: state.children || 0,
      selectedRooms,
      selectedActivities,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialRequests: state.specialRequests || "",
    };
  });

  const [membershipType, setMembershipType] = useState("PERCENT");

  const [otpSent, setOtpSent] = useState(draft.otpSent || false);
  const [otpVerified, setOtpVerified] = useState(draft.otpVerified || false);
  const [otpInput, setOtpInput] = useState("");
  const [otpSecret, setOtpSecret] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(draft.otpCountdown || 0);
  const [otpError, setOtpError] = useState("");
  const otpTimerRef = useRef(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availableRoomsCount, setAvailableRoomsCount] = useState(null);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null); // "FULL" | "PARTIAL"
  const PARTIAL_PAYMENT_FIXED_AMOUNT = 1000; // ₹1000 fixed partial payment
  const [paymentError, setPaymentError] = useState(""); // ✅ Added from version 2 for error handling
  // const [captchaToken, setCaptchaToken] = useState("");

  // whatsApp link
  const WhatsAppLink = () => {
    window.open(
      `https://wa.me/${formData.phone}?text=${encodeURIComponent(
        "Thank you for booking with Shiv Ganga Hotel. Your booking reference is " +
        bookingReference +
        ". We look forward to hosting you!",
      )}`,
    );
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    const fetchMembership = async () => {
      const res = await api.get("/membership/active");
      if (res.data?.data) {
        setMembershipDiscount(res.data.data.discountValue);
        setMembershipType(res.data.data.discountType);
      }
    };
    fetchMembership();
  }, []);

  // useEffect(() => {
  //   if (location.state?.fromCoupon && location.state?.bookingDraft) {
  //     const { formData, rooms, isMember, otpSent, otpVerified, otpCountdown } =
  //       location.state.bookingDraft;

  //     setFormData(formData);
  //     setRooms(rooms || []);
  //     setIsMember(isMember || false);
  //     if (typeof otpSent !== "undefined") setOtpSent(otpSent);
  //     if (typeof otpVerified !== "undefined") setOtpVerified(otpVerified);
  //     if (typeof otpCountdown !== "undefined") setOtpCountdown(otpCountdown);
  //   }
  // }, []);

  // ✅ Added from version 2 - Clear coupon after payment
  useEffect(() => {
    if (paymentCompleted) {
      // Don't clear the coupon here - let it show in confirmation
      // navigate(location.pathname, {
      //   replace: true,
      //   state: { ...(location.state || {}), appliedCoupon: null },
      // });
    }
  }, [paymentCompleted]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const proceedNext = async () => {
    if (currentStep === 1) {
      if (!formData.checkIn || !formData.checkOut) {
        alert("Please select check-in and check-out dates");
        return;
      }
      if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
        alert("Checkout must be after check-in");
        return;
      }

      try {
        setLoadingRooms(true);

        const res = await api.get("/room/search", {
          params: {
            checkInDate: formData.checkIn,
            checkOutDate: formData.checkOut,
            adults: formData.adults,
            children: formData.children,
          },
        });

        const availableRooms = res.data?.data || [];

        setRooms(availableRooms);
        setAvailabilityChecked(true);
        setAvailableRoomsCount(availableRooms.length);

        setLoadingRooms(false);
        nextStep();
      } catch (error) {
        setLoadingRooms(false);
        const totalGuests = Number(formData.adults) + Number(formData.children);
        const localRooms = (fallbackRooms || []).filter(
          (r) => (r.capacity || 2) >= totalGuests,
        );
        if (localRooms.length > 0) {
          setRooms(
            localRooms.map((r) => ({
              ...r,
              _id: r.id,
              pricePerNight:
                typeof r.price === "number"
                  ? r.price
                  : Number(String(r.price).replace(/[^0-9]/g, "")),
              plan: "ep",
              priceDetails: {
                ep: Number(String(r.price).replace(/[^0-9]/g, "")),
              },
              mainImage: r.image,
            })),
          );
          setAvailabilityChecked(true);
          setAvailableRoomsCount(localRooms.length);
          alert(
            "Network issue while checking availability. Showing sample rooms.",
          );
          nextStep();
        } else {
          alert("Failed to check availability");
        }
      }
      return;
    }

    if (currentStep === 2) {
      if (formData.selectedRooms.length === 0) return;
      nextStep();
      return;
    }

    if (currentStep === 3) {
      nextStep();
      return;
    }

    if (currentStep === 4) {
      if (!otpVerified) {
        setOtpError("Please verify OTP to continue");
        return;
      }
      nextStep();
      return;
    }
  };

  // 🔥 FIXED: Only FULL payment amount is corrected, PARTIAL remains same
  const openRazorpay = async (type = "FULL") => {
    setPaymentError(""); // ✅ Clear previous errors
    try {
      // ✅ Verify Cloudflare Turnstile before payment
      // const token = turnstileRef.current?.getToken();

      // if (!token) {
      //   setPaymentError("Please complete the CAPTCHA verification");
      //   setShowPaymentChoice(true);
      //   return;
      // }

      // ✅ Added Razorpay check from version 2
      if (typeof window.Razorpay === "undefined") {
        setPaymentError("Payment gateway not loaded. Please refresh the page.");
        setShowPaymentChoice(true);
        return;
      }

      // For FULL payment, user pays the full finalPayableAmount
      // For PARTIAL payment, user always pays a fixed ₹1000 (or less if total is smaller)
      // const payableAmount =
      //   type === "PARTIAL"
      //     ? Math.min(PARTIAL_PAYMENT_FIXED_AMOUNT, finalPayableAmount)
      //     : finalPayableAmount;

      // // ✅ Added amount validation from version 2
      // if (payableAmount < 1) {
      //   setPaymentError(
      //     "Minimum payment amount is ₹1. Please pay full amount.",
      //   );
      //   setShowPaymentChoice(true);
      //   return;
      // }

      // const amountInPaise = Math.round(payableAmount * 100); // ✅ Added from version 2

      const priceBreakdown = {
        roomTotal,
        extraGuestTotal,
        activityTotal,
        grandTotal,
        membershipDiscountAmount,
        couponDiscountAmount,
        finalPayableAmount,
        paidAmount: type === "PARTIAL" ? Math.min(PARTIAL_PAYMENT_FIXED_AMOUNT, finalPayableAmount) : finalPayableAmount,
        remainingAmount: type === "PARTIAL" ? Math.max(0, finalPayableAmount - Math.min(PARTIAL_PAYMENT_FIXED_AMOUNT, finalPayableAmount)) : 0,
        paymentType: type,
        nights,
        rooms: formData.selectedRooms.map(room => ({
          name: room.name,
          plan: room.plan || "ep",
          price: room.priceDetails?.[room.plan || "ep"] || room.pricePerNight,
          quantity: room.quantity,
          subtotal: (room.priceDetails?.[room.plan || "ep"] || room.pricePerNight) * room.quantity * nights,
        })),
        activities: formData.selectedActivities.map(act => ({
          title: act.title,
          price: act.price,
          quantity: Number(act.quantity) || 1,
          subtotal: act.price * (Number(act.quantity) || 1),
        })),
      };

      const res = await api.post("/online-booking/create-order", {
        rooms: formData.selectedRooms.map((room) => ({
          roomId: room._id,
          quantity: Number(room.quantity) || 1,
          plan: room.plan || "ep",
        })),
        plan: formData.selectedRooms[0].plan || "ep",
        checkInDate: formData.checkIn,
        checkOutDate: formData.checkOut,
        adults: formData.adults,
        children: formData.children,
        addOns: formData.selectedActivities.map((a) => ({
          name: a.title,
          quantity: Number(a.quantity) || 1,
        })),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        specialRequest: formData.specialRequests,
        paymentType: type,
        // Tell backend exactly how much we want to pay now when doing PARTIAL
        // partialAmount: type === "PARTIAL" ? payableAmount : undefined,
        isMember,
        couponCode: appliedCoupon?.code || null,
        // amountInPaise, // ✅ Added from version 2
        // totalAmount: finalPayableAmount, // ✅ Added from version 2
        finalAmount: finalPayableAmount,
        // captchaToken: token,// Include Turnstile token
      });

      const { order, transactionId, bookingPayload } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Shiv Ganga Hotel",
        description: "Room Booking",

        handler: async function (response) {
          try {
            const verifyRes = await api.post("/online-booking/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId,
              bookingPayload,
              priceBreakdown
            });
            // ✅ Added verification check from version 2
            if (!verifyRes.data?.success) {
              setPaymentError(
                verifyRes.data?.message || "Payment verification failed",
              );
              setShowPaymentChoice(true);
              return;
            }
          } catch (e) {
            // ✅ Added error handling from version 2
            const msg =
              e.response?.data?.message ||
              e.message ||
              "Payment verification failed. Please contact support.";
            setPaymentError(msg);
            setShowPaymentChoice(true);
            return;
          } finally {
            setPaymentCompleted(true);
            nextStep();
          }
        },

        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
      };

      const rzp = new window.Razorpay(options);
      // ✅ Added payment.failed handler from version 2
      rzp.on("payment.failed", function (response) {
        setPaymentError(
          response.error?.description || "Payment failed. Please try again.",
        );
        setShowPaymentChoice(true);
      });
      rzp.open();
    } catch (err) {
      // ✅ Added detailed error message from version 2
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Unable to start payment. Please try again.";
      console.log(err);
      setPaymentError(msg);
      setShowPaymentChoice(true);
    }
  };


  const canNext =
    (currentStep === 1 && true) ||
    (currentStep === 2 && formData.selectedRooms.length > 0) ||
    (currentStep === 3 && true) ||
    (currentStep === 4 && otpVerified);
  const nextLabel =
    currentStep === 1
      ? "Check Availability"
      : currentStep === 4
        ? "Payment"
        : "Continue";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
      setOtpSent(false);
      setOtpVerified(false);
      // setOtpVerified(true);
      setOtpInput("");
      setOtpSecret("");
      setOtpCountdown(0);
      setOtpError("");
    }
  };

  const selectRoom = (room) => {
    setFormData((prev) => {
      const exists = prev.selectedRooms.some((r) => r._id === room._id);
      if (exists) {
        return {
          ...prev,
          selectedRooms: prev.selectedRooms.filter((r) => r._id !== room._id),
        };
      }

      return {
        ...prev,
        selectedRooms: [
          ...prev.selectedRooms,
          { ...room, quantity: 1, plan: "ep" },
        ],
      };
    });
  };

  const updateRoomPlan = (roomId, plan) => {
    setFormData((prev) => ({
      ...prev,
      selectedRooms: prev.selectedRooms.map((r) =>
        r._id === roomId ? { ...r, plan } : r,
      ),
    }));
  };

  const toggleActivity = (activity) => {
    setFormData((prev) => {
      const exists = prev.selectedActivities.find((a) => a.id === activity.id);
      if (exists) {
        return {
          ...prev,
          selectedActivities: prev.selectedActivities.filter(
            (a) => a.id !== activity.id,
          ),
        };
      } else {
        return {
          ...prev,
          selectedActivities: [
            ...prev.selectedActivities,
            { ...activity, quantity: 1 },
          ],
        };
      }
    });
  };
  const setActivityQuantity = (id, qty) => {
    qty = Number(qty) || 0;
    setFormData((prev) => {
      if (qty <= 0) {
        // remove the activity completely when quantity zero or negative
        return {
          ...prev,
          selectedActivities: prev.selectedActivities.filter(
            (a) => a.id !== id,
          ),
        };
      }
      return {
        ...prev,
        selectedActivities: prev.selectedActivities.map((a) =>
          a.id === id ? { ...a, quantity: qty } : a,
        ),
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpVerified) {
      setOtpError("Please verify OTP to continue");
      return;
    }
    nextStep();
  };

  const parsePrice = (p) => {
    if (!p || p === "Free") return 0;
    return Number(p.replace(/[^0-9.-]+/g, ""));
  };

  const formatDateDisplay = (val) => {
    if (!val) return "-";
    const s = String(val);
    const parts = s.split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return s;
  };

  const nights = Math.round(
    (new Date(formData.checkOut) - new Date(formData.checkIn)) /
    (1000 * 60 * 60 * 24),
  );

  const roomTotal = formData.selectedRooms.reduce((acc, room) => {
    const plan = room.plan || "ep";
    const price = room.priceDetails?.[plan] || room.pricePerNight;
    return acc + price * room.quantity * nights;
  }, 0);

  // Calculate Extra Guest Charges
  const totalCapacity = formData.selectedRooms.reduce(
    (acc, room) => acc + (room.capacity || 2) * room.quantity,
    0,
  );

  const adults = parseInt(formData.adults);
  const children = parseInt(formData.children);

  const coveredAdults = Math.min(adults, totalCapacity);
  const extraAdults = Math.max(0, adults - coveredAdults);

  const remainingCapacity = Math.max(0, totalCapacity - coveredAdults);
  const coveredChildren = Math.min(children, remainingCapacity);
  const extraChildren = Math.max(0, children - coveredChildren);

  const extraAdultCharge = formData.selectedRooms.reduce(
    (sum, room) => sum + (room.extraCharges?.adult || 0) * room.quantity,
    0,
  );

  const extraChildCharge = formData.selectedRooms.reduce(
    (sum, room) => sum + (room.extraCharges?.child || 0) * room.quantity,
    0,
  );

  const extraGuestTotal =
    extraAdults * extraAdultCharge + extraChildren * extraChildCharge;

  const totalPersons = Number(formData.adults) + Number(formData.children);

  const activityTotal = formData.selectedActivities.reduce(
    (acc, act) => acc + act.price * (Number(act.quantity) || 1),
    0,
  );

  const grandTotal = roomTotal + extraGuestTotal + activityTotal;

  const membershipDiscountAmount = isMember
    ? membershipType === "PERCENT"
      ? Math.round((grandTotal * membershipDiscount) / 100)
      : membershipDiscount
    : 0;

  const couponDiscountAmount = appliedCoupon?.discountAmount || 0;

  const finalPayableAmount =
    grandTotal - membershipDiscountAmount - couponDiscountAmount;

  // Payment breakdown (used in confirmation + summary)
  const paidAmount =
    selectedPaymentType === "PARTIAL"
      ? Math.min(PARTIAL_PAYMENT_FIXED_AMOUNT, finalPayableAmount)
      : selectedPaymentType === "FULL"
        ? finalPayableAmount
        : 0;

  const remainingAmount =
    selectedPaymentType === "PARTIAL"
      ? Math.max(0, finalPayableAmount - paidAmount)
      : 0;

  const canApplyCoupon =
    otpVerified &&
    (formData.selectedActivities.length > 0 ||
      formData.selectedRooms.length > 0) &&
    !appliedCoupon; // Only one coupon can be applied at a time

  const bookingReference = (() => {
    const seed = `${formData.checkIn}|${formData.checkOut}|${formData.firstName}|${formData.lastName}|${formData.phone}|${formData.email}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 1000000007;
    }
    return `#SHIV-${String(Math.abs(hash) % 10000).padStart(4, "0")}`;
  })();

  const isValidEmail = (email) => {
    const x = (email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
  };

  const sendOtp = async () => {
    try {
      await api.post("/otp/send", { email: formData.email });

      setOtpSent(true);
      setOtpCountdown(60);

      otpTimerRef.current = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setOtpError("");
    } catch {
      setOtpError("Failed to send OTP");
    }
  };

  const checkExistingMembership = async () => {
    try {
      const res = await api.get("/membership/user/by-email", {
        params: { email: formData.email },
      });

      if (res.data?.isMember) {
        setIsMember(true); // auto member
      }
    } catch (err) {
      console.error("Failed to check membership");
    }
  };

  const verifyOtp = async () => {
    try {
      await api.post("/otp/verify", {
        email: formData.email,
        otp: otpInput,
      });
      setOtpVerified(true);
      setOtpError("");

      await checkExistingMembership();
    } catch (err) {
      setOtpError("Invalid or expired OTP");
    }
  };

  // ================= CHECK EXISTING MEMBERSHIP =================

  // Removed noisy console logs

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      {/* Turnstile CAPTCHA for payment step */}
      <Seo
        title="Book Your Stay | Shiv Ganga Hotel"
        description="Plan your stay at Shiv Ganga Hotel Rishikesh. Check availability, choose rooms, and confirm your booking."
        path="/booking"
        image={bgImage}
      />
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </div>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>

      {/* Dark overlay (controls opacity safely) */}
      <div className="absolute inset-0 bg-primary opacity-80 pointer-events-none"></div>
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div>
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-accent text-xs uppercase tracking-[0.4em] font-medium block mb-3">
                Reservation
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4">
                Book Your Stay
              </h1>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                Experience the pinnacle of luxury and comfort at Shiv Ganga
                Hotel.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-14 sm:mb-20">
          <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
            {/* Background line */}
            <div className="absolute top-5 sm:top-1/2 left-0 w-full h-[1px] bg-white/40 -z-10 sm:-translate-y-1/2" />

            {/* Active progress line */}
            <div
              className="absolute top-5 sm:top-1/2 left-0 h-[2px] bg-accent -z-10 sm:-translate-y-1/2 transition-all duration-700 ease-in-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />

            <div className="flex justify-between items-start sm:items-center w-full">
              {steps.map((step) => {
                const isActive = currentStep >= step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center text-center flex-1 cursor-pointer group relative"
                    onClick={() =>
                      step.id < currentStep && setCurrentStep(step.id)
                    }
                  >
                    {/* Circle */}
                    <div
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                        border transition-all duration-500 text-primary
                        ${isActive
                          ? "border-accent bg-accent"
                          : "border-white bg-white/80"
                        }
                        ${isCurrent ? "ring-4 ring-accent/20 scale-110" : ""}
                      `}
                    >
                      {isActive ? (
                        <step.icon size={14} strokeWidth={1.5} />
                      ) : (
                        <span className="text-xs sm:text-sm">{step.id}</span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`
                        mt-2 text-[9px] sm:text-[11px]
                        uppercase tracking-wide font-medium
                        leading-tight transition-all duration-500
                        ${isActive
                          ? "text-accent opacity-100"
                          : "text-white/60 opacity-70"
                        }
                      `}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* <AnimatePresence>
          {currentStep < 5 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur border-t border-gray-200"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 py-3 text-xs uppercase tracking-widest font-bold border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="inline-block mr-1" size={14} />
                  Back
                </button>
                <div className="flex items-end gap-2">
                  <span className="text-gray-600 text-xs uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-primary">
                    Rs. {finalPayableAmount}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (currentStep < 4) {
                      proceedNext();
                    } else if (currentStep === 4) {
                      setPaymentError(""); // ✅ Clear error before showing popup
                      if (isMember) {
                        setShowPaymentChoice(true); // 🔥 skip membership popup
                      } else {
                        setShowMembershipPopup(true);
                      }
                    }
                  }}
                  disabled={!canNext}
                  className="btn-primary px-6 py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {nextLabel}{" "}
                  <ArrowRight className="inline-block ml-1" size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence> */}

        <AnimatePresence>
          {showMembershipPopup && (
            <motion.div
              className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"
              onClick={() => setShowMembershipPopup(false)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-primary mb-2">
                  Become a Member?
                </h3>

                <p className="text-sm text-gray-600 mb-6">
                  Get <b>{membershipDiscount}% instant discount</b> on your
                  booking.
                </p>

                <div className="flex gap-3">
                  <button
                    className="flex-1 border px-4 py-3 rounded-xl"
                    onClick={() => {
                      setIsMember(false);
                      setShowMembershipPopup(false);
                      setPaymentError(""); // ✅ Clear error before showing payment choice
                      setShowPaymentChoice(true); // 🔥
                    }}
                  >
                    No
                  </button>

                  <button
                    className="flex-1 bg-primary text-white px-4 py-3 rounded-xl"
                    onClick={() => {
                      setIsMember(true);
                      setShowMembershipPopup(false);
                      setPaymentError(""); // ✅ Clear error before showing payment choice
                      setShowPaymentChoice(true); // 🔥
                    }}
                  >
                    Yes, Apply Discount
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= PAYMENT CHOICE POPUP (UPDATED WITH ERROR DISPLAY) ================= */}
        <AnimatePresence>
          {showPaymentChoice && (
            <motion.div
              className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => {
                setShowPaymentChoice(false);
                setPaymentError(""); // ✅ Clear error on close
              }}
            >
              <motion.div
                className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto my-auto transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Choose Payment Option
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentChoice(false);
                      setPaymentError("");
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ✅ Added error display from version 2 */}
                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {paymentError}
                  </div>
                )}

                {/* Cloudflare Turnstile CAPTCHA
                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <Turnstile
                    ref={turnstileRef}
                    onVerify={(token) => {
                      setCaptchaToken(token);
                    }}
                  />
                </div> */}

                <button
                  className="w-full bg-primary text-white py-3 rounded-xl mb-3"
                  onClick={() => {
                    setShowPaymentChoice(false);
                    setPaymentError(""); // ✅ Clear error before payment
                    setSelectedPaymentType("FULL");
                    openRazorpay("FULL");
                  }}
                >
                  Pay Full Amount (₹{finalPayableAmount})
                </button>

                <button
                  className="w-full border py-3 rounded-xl"
                  onClick={() => {
                    setShowPaymentChoice(false);
                    setPaymentError(""); // ✅ Clear error before payment
                    setSelectedPaymentType("PARTIAL");
                    openRazorpay("PARTIAL");
                  }}
                >
                  Pay Partial (₹
                  {Math.min(PARTIAL_PAYMENT_FIXED_AMOUNT, finalPayableAmount)})
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto w-full">
          {/* Main Content Area */}
          <div className="lg:col-span-2 min-w-0">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-primary/20 p-4 sm:p-6 md:p-8 lg:p-12 transition-all duration-300"
                >
                  <h2 className="text-2xl sm:text-3xl font-semibold text-primary mb-6 sm:mb-10 text-center">
                    Select Dates & Guests
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-6 sm:mb-10">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Check-In Date
                      </label>
                      <div className="relative group">
                        <input
                          type="date"
                          name="checkIn"
                          value={formData.checkIn}
                          min={today}
                          onChange={handleInputChange}
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all pl-8 text-lg text-primary placeholder-transparent"
                        />
                        <Calendar
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-300 group-hover:text-accent transition-colors"
                          size={18}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Check-Out Date
                      </label>
                      <div className="relative group">
                        <input
                          type="date"
                          name="checkOut"
                          value={formData.checkOut}
                          min={formData.checkIn || today}
                          onChange={handleInputChange}
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all pl-8 text-lg text-primary"
                        />
                        <Calendar
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-300 group-hover:text-accent transition-colors"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Adults
                      </label>
                      <div className="relative group">
                        <input
                          type="number"
                          name="adults"
                          value={formData.adults}
                          onChange={handleInputChange}
                          min={1}
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all pl-8 text-lg text-primary"
                        />
                        <Users
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-300 group-hover:text-accent transition-colors"
                          size={18}
                        />
                        {/* <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronRight
                            className="rotate-90 text-gray-300"
                            size={14}
                          />
                        </div> */}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Children
                      </label>
                      <div className="relative group">
                        <input
                          type="number"
                          name="children"
                          value={formData.children}
                          onChange={handleInputChange}
                          min={0}
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all pl-8 text-lg text-primary"
                        />
                        <Users
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-300 group-hover:text-accent transition-colors"
                          size={18}
                        />
                        {/* <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronRight
                            className="rotate-90 text-gray-300"
                            size={14}
                          />
                        </div> */}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100"></div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 "
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-gray-100">
                    <h2 className="text-3xl font-semibold text-white">
                      Select Rooms
                    </h2>
                  </div>

                  {availabilityChecked && availableRoomsCount === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-700">
                            Rooms are not available on these dates
                          </h3>
                          <p className="text-sm text-red-700/80">
                            Please adjust your dates or reduce guests and try
                            again.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-8">
                    {rooms.map((room) => {
                      const selected = formData.selectedRooms.find(
                        (r) => r._id === room._id,
                      );
                      const isSelected = !!selected;
                      const currentPlan = selected
                        ? selected.plan || "ep"
                        : "ep";

                      return (
                        <div
                          key={room._id}
                          className={`group bg-white rounded-2xl overflow-hidden transition-all duration-500 border ${isSelected
                            ? "border-accent shadow-xl"
                            : "border-gray-100 shadow-sm hover:shadow-xl"
                            }`}
                        >
                          {/* Card Layout */}
                          <div className="flex flex-col lg:flex-row h-full">
                            {/* Image Section */}
                            <div className="relative w-full lg:w-2/5 h-52 sm:h-64 lg:h-auto overflow-hidden">
                              <img
                                src={room.mainImage}
                                alt={room.name}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-500"></div>
                            </div>

                            {/* Content Section */}
                            <div className="flex flex-col justify-between flex-1 p-5 sm:p-6 lg:p-8">
                              {/* Top Content */}
                              <div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
                                    {room.name}
                                  </h3>

                                  <div className="sm:text-right">
                                    <span className="block text-lg sm:text-xl font-semibold text-accent">
                                      ₹ {room.pricePerNight}
                                    </span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                      + Taxes / Night
                                    </span>
                                  </div>
                                </div>

                                <p className="text-gray-500 text-sm leading-relaxed mb-4 sm:mb-6">
                                  {room.description}
                                </p>

                                {/* Rate Plan */}
                                {isSelected && room.priceDetails && (
                                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                      Select Rate Plan
                                    </label>

                                    <div className="flex flex-wrap gap-3">
                                      {["ep", "cp"].map((plan) => (
                                        <button
                                          key={plan}
                                          onClick={() =>
                                            updateRoomPlan(room._id, plan)
                                          }
                                          className={`px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 border ${currentPlan === plan
                                            ? "bg-primary text-white border-primary"
                                            : "border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                                            }`}
                                        >
                                          {plan.toUpperCase()} (₹{" "}
                                          {room.priceDetails[plan]})
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Amenities - changed */} 
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {(showAllAmenities ? room.features : room.features?.slice(0, 4)).map(
                                    (amenity, idx) => (
                                      <span
                                        key={idx}
                                        className="text-gray-500 text-[10px] uppercase tracking-wider px-3 py-1 border border-gray-200 rounded-full"
                                      >
                                        {amenity}
                                      </span>
                                    )
                                  )}
                                </div>

                                {room.features?.length > 6 && (
                                  <button
                                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                                    className="text-xs text-accent font-medium"
                                  >
                                    {showAllAmenities ? "Show Less" : "Show All Amenities"}
                                  </button>
                                )}
                              </div>

                              {/* Bottom Buttons */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => selectRoom(room)}
                                  className={`w-full sm:flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${isSelected
                                    ? "bg-accent text-primary"
                                    : "border border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                                    }`}
                                >
                                  {isSelected ? "Selected" : "Select Room"}
                                </button>

                                {/* <button
                                  type="button"
                                  onClick={() => {
                                    const marketingIdByCategory = {
                                      "Single Bedroom": "standard-double",
                                      "Deluxe Double AC": "deluxe-double",
                                      "Exclusive Triple": "triple-room",
                                      "Deluxe River View Room":
                                        "himalayan-balcony",
                                      "Grand Family Suite":
                                        "grand-family-suite",
                                      "Single AC Room": "family-four",
                                    };

                                    const mappedId =
                                      marketingIdByCategory[room.category] ||
                                      null;

                                    if (mappedId) {
                                      navigate("/rooms", {
                                        state: { roomId: mappedId },
                                      });
                                    } else {
                                      navigate("/rooms");
                                    }
                                  }}
                                  className="w-full sm:w-auto text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-primary transition-colors underline underline-offset-4"
                                >
                                  View Details
                                </button> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* <div className="flex justify-end pt-8">
                    <button
                      onClick={nextStep}
                      disabled={formData.selectedRooms.length === 0}
                      className="btn-primary flex items-center gap-3 px-10 py-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </div> */}
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-primary/20 p-8 md:p-12 "
                >
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-3xl font-semibold text-primary">
                        Enhance Your Stay
                      </h2>
                      <p className="text-primary text-sm mt-2 font-light">
                        Curated experiences for a memorable journey
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    {ACTIVITIES.map((activity) => {
                      const isSelected = formData.selectedActivities.some(
                        (a) => a.id === activity.id,
                      );
                      return (
                        <div
                          key={activity.id}
                          className={`group relative rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer ${isSelected
                            ? "ring-1 ring-accent"
                            : "hover:shadow-xl ring-1 ring-primary/30"
                            }`}
                          onClick={() => toggleActivity(activity)}
                        >
                          <div className="h-48 relative overflow-hidden">
                            <img
                              src={activity.img}
                              alt={activity.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div
                              className={`absolute inset-0 transition-colors duration-500 ${isSelected
                                ? "bg-accent/20"
                                : "bg-primary/20 group-hover:bg-transparent"
                                }`}
                            ></div>

                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary rounded-2xl">
                              {activity.label}
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white p-3 rounded-full shadow-lg animate-in fade-in zoom-in duration-300">
                                  <Check size={20} className="text-accent" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-6 bg-white border border-t-0 border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-medium text-primary group-hover:text-accent transition-colors">
                                {activity.title}
                              </h3>
                            </div>
                            <p className="text-primary/50 text-sm mb-6 font-light leading-relaxed group-hover:text-primary transition-colors">
                              {activity.desc}
                            </p>
                            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                              <span className="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">
                                {activity.label === "Free"
                                  ? "Complimentary"
                                  : "Per Person"}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isSelected
                                  ? "text-accent"
                                  : "text-gray-300 group-hover:text-primary"
                                  }`}
                              >
                                {isSelected ? "Selected" : "Add to Booking"}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current =
                                        formData.selectedActivities.find(
                                          (a) => a.id === activity.id,
                                        )?.quantity || 1;
                                      setActivityQuantity(
                                        activity.id,
                                        current - 1,
                                      );
                                    }}
                                    className="size-9 rounded-lg border border-gray-200 text-gray-600 hover:border-accent hover:text-accent transition justify-center items-center flex"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      formData.selectedActivities.find(
                                        (a) => a.id === activity.id,
                                      )?.quantity || 0
                                    }
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setActivityQuantity(
                                        activity.id,
                                        e.target.value,
                                      );
                                    }}
                                    className="w-16 text-center border border-gray-200 rounded-lg py-2 font-semibold text-primary justify-center items-center flex"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current =
                                        formData.selectedActivities.find(
                                          (a) => a.id === activity.id,
                                        )?.quantity || 1;
                                      setActivityQuantity(
                                        activity.id,
                                        current + 1,
                                      );
                                    }}
                                    className="size-9 rounded-lg border border-gray-200 bg-primary text-white hover:bg-accent hover:text-primary transition justify-center items-center flex"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                <div className="text-sm font-semibold text-primary">
                                  Rs.{" "}
                                  {activity.price *
                                    (Number(
                                      formData.selectedActivities.find(
                                        (a) => a.id === activity.id,
                                      )?.quantity,
                                    ) || 1)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-primary/20  p-8 md:p-12"
                >
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                    <h2 className="text-3xl font-semibold text-primary">
                      Personal Details
                    </h2>

                    <button
                      onClick={() =>
                        canApplyCoupon &&
                        navigate("/coupons", {
                          state: {
                            mode: "public",
                            amount: finalPayableAmount,

                            bookingDraft: {
                              formData,
                              currentStep, // 🔥 STEP SAVE
                              rooms,
                              isMember,
                              otpSent,
                              otpVerified,
                              otpCountdown,
                            },
                          },
                        })
                      }
                      disabled={!canApplyCoupon}
                      className={`px-5 py-2 border rounded-xl font-bold text-sm transition
             ${canApplyCoupon
                          ? "border-primary text-white bg-primary hover:text-primary hover:bg-accent"
                          : "border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                        }`}
                    >
                      Apply Coupon
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all text-lg text-primary placeholder-gray-300"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all text-lg text-primary placeholder-gray-300"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                          Email Address
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all text-lg text-primary placeholder-gray-300"
                            placeholder="your@email.com"
                          />
                          <button
                            type="button"
                            onClick={sendOtp}
                            disabled={otpVerified || otpCountdown > 0}
                            className={`px-4 py-2 text-xs uppercase tracking-wider font-bold border transition-all cursor-pointer rounded-2xl
                              ${otpVerified
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-primary text-white border-primary"
                              }
                              disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {otpVerified
                              ? "Verified"
                              : otpCountdown > 0
                                ? `Resend in ${otpCountdown}s`
                                : "Send OTP"}
                          </button>
                        </div>
                        {otpError && (
                          <div className="text-red-600 text-xs font-medium tracking-wider">
                            {otpError}
                          </div>
                        )}
                        {otpSent && !otpVerified && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 space-y-3"
                          >
                            <div className="text-xs uppercase tracking-widest text-gray-400">
                              Enter OTP sent to {formData.email}
                            </div>
                            <div className="flex gap-2">
                              <input
                                inputMode="numeric"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) =>
                                  setOtpInput(
                                    e.target.value.replace(/[^0-9]/g, ""),
                                  )
                                }
                                className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all text-lg text-primary tracking-widest"
                                placeholder="••••••"
                              />
                              <button
                                type="button"
                                onClick={verifyOtp}
                                className="px-4 py-2 text-xs uppercase tracking-wider font-bold border bg-accent text-primary border-accent hover:opacity-90 transition-all cursor-pointer"
                              >
                                Verify
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full pb-3 bg-transparent border-b border-gray-200 focus:border-accent outline-none transition-all text-lg text-primary placeholder-gray-300"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full p-4 bg-gray-50/50 border border-primary/20 focus:border-accent outline-none transition-all resize-none text-sm font-light leading-relaxed"
                        placeholder="Dietary requirements, late check-in, etc."
                      ></textarea>
                    </div>
                  </form>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full max-w-3xl overflow-x-hidden bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-white/20 p-4 sm:p-6 md:p-8 lg:p-16 text-center mx-auto"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 animate-in fade-in zoom-in duration-700">
                    <Check
                      size={40}
                      className="sm:w-12 sm:h-12 text-accent"
                      strokeWidth={1}
                    />
                  </div>
                  <span className="text-accent text-xs uppercase tracking-[0.4em] font-medium block mb-3 sm:mb-4">
                    Success
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-primary mb-4 sm:mb-6 px-1">
                    Booking Confirmed
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base md:text-lg mb-8 sm:mb-12 max-w-lg mx-auto font-light leading-relaxed px-1">
                    Thank you for choosing Shiv Ganga Hotel. Your reservation
                    has been confirmed and a confirmation email has been sent to{" "}
                    <span className="font-medium text-primary border-b border-accent/30">
                      {formData.email}
                    </span>
                    .
                  </p>

                  <div className="bg-gray-50/50 p-4 sm:p-6 md:p-8 border border-gray-100 w-full max-w-lg mx-auto mb-8 sm:mb-10 text-left relative overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"></div>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200 border-dashed">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                          Booking Reference
                        </span>
                        <span className="text-base sm:text-xl font-semibold text-primary break-all">
                          {bookingReference}
                        </span>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                          Status
                        </span>
                        <span className="text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 px-2 py-1 border border-green-100 inline-block">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                            Check-In
                          </span>
                          <span className="font-medium text-primary">
                            {formData.checkIn || "Not selected"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                            Check-Out
                          </span>
                          <span className="font-medium text-primary">
                            {formData.checkOut || "Not selected"}
                          </span>
                        </div>
                      </div>

                      {formData.selectedRooms.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                            Rooms
                          </span>
                          <div className="space-y-2">
                            {formData.selectedRooms.map((room, idx) => {
                              const plan = (room.plan || "ep").toLowerCase();
                              const price =
                                (room.priceDetails &&
                                  room.priceDetails[plan] !== undefined &&
                                  room.priceDetails[plan]) ||
                                (typeof room.pricePerNight === "number"
                                  ? room.pricePerNight
                                  : parsePrice(room.price));
                              const nightsCount = Math.max(
                                1,
                                Number(nights) || 1,
                              );
                              return (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-primary">
                                    {room.name}
                                  </span>
                                  <span className="text-gray-500 uppercase text-xs">
                                    Rs. {price} × {nightsCount} nights ×{" "}
                                    {room.quantity} (
                                    {(plan || "ep").toUpperCase()})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {formData.selectedActivities.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                            Activities
                          </span>
                          <div className="space-y-1">
                            {formData.selectedActivities.map((act, idx) => {
                              const qty = Number(act.quantity) || 1;
                              return (
                                <div key={idx} className="text-sm text-primary">
                                  {act.title} x {qty} People
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-6 border-t border-gray-200 border-dashed space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Room & Add-ons</span>
                          <span className="font-medium text-primary">
                            Rs. {grandTotal}
                          </span>
                        </div>

                        {membershipDiscountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Membership Discount</span>
                            <span>- Rs. {membershipDiscountAmount}</span>
                          </div>
                        )}

                        {/* COUPON DISCOUNT - ADD THIS IF MISSING */}
                        {couponDiscountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>
                              Coupon Discount{" "}
                              {appliedCoupon?.code
                                ? `(${appliedCoupon.code})`
                                : ""}
                            </span>
                            <span>- Rs. {couponDiscountAmount}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-end pt-1">
                          <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                            Final Amount
                          </span>
                          <span className="text-2xl font-semibold text-accent">
                            Rs. {finalPayableAmount}
                          </span>
                        </div>

                        {selectedPaymentType && (
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Payment Type
                              </span>
                              <span className="font-medium text-primary">
                                {selectedPaymentType === "PARTIAL"
                                  ? "Partial Payment"
                                  : "Full Payment"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Paid Now</span>
                              <span className="font-semibold text-primary">
                                Rs. {paidAmount}
                              </span>
                            </div>
                            {selectedPaymentType === "PARTIAL" && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Remaining Amount
                                </span>
                                <span className="font-semibold text-primary">
                                  Rs. {remainingAmount}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4">
                    <button
                      onClick={WhatsAppLink}
                      className="group px-6 sm:px-8 py-3 border border-primary text-primary text-xs uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer hover:bg-[#25D366] hover:text-white rounded-2xl flex items-center justify-center gap-2"
                    >
                      <FaWhatsapp
                        size={22}
                        className="text-[#25D366] transition-colors group-hover:text-white shrink-0"
                      />
                      <span className="transition-colors group-hover:text-white">
                        Get Details in WhatsApp
                      </span>
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="btn-primary px-6 sm:px-8 py-3 text-xs rounded-2xl cursor-pointer uppercase tracking-widest font-bold hover:bg-accent transition-all duration-300"
                    >
                      Return Home
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1 min-w-0 order-last lg:order-none">
            <div className="sticky top-24 lg:top-32 transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-xl border border-primary/20 overflow-hidden">
                <div className="bg-primary p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    Booking Summary
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {formData.selectedRooms.length > 0 ? (
                    <div className="space-y-4 pb-6 border-b border-gray-100">
                      {formData.selectedRooms.map((room, idx) => {
                        const plan = (room.plan || "ep").toLowerCase();
                        const price =
                          (room.priceDetails &&
                            room.priceDetails[plan] !== undefined &&
                            room.priceDetails[plan]) ||
                          (typeof room.pricePerNight === "number"
                            ? room.pricePerNight
                            : parsePrice(room.price));
                        const nightsCount = Math.max(1, Number(nights) || 1);
                        return (
                          <div key={idx} className="flex items-start gap-4">
                            <div className="relative">
                              <img
                                src={room.mainImage}
                                alt={room.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                {room.quantity}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-primary text-sm mb-1 line-clamp-1">
                                {room.name}
                              </h4>
                              <span className="text-gray-600 text-sm">
                                Rs. {price} × {nightsCount} nights ×{" "}
                                {room.quantity} ({(plan || "ep").toUpperCase()})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pb-6 border-b border-gray-100 text-center py-8">
                      <span className="text-gray-400 italic text-sm">
                        No room selected yet
                      </span>
                    </div>
                  )}

                  {extraGuestTotal > 0 && (
                    <div className="space-y-3 pb-6 border-b border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary font-bold">
                          Extra Guest Charges
                        </span>
                        <span className="text-accent font-medium">
                          Rs. {extraGuestTotal}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {extraAdults > 0 && extraAdultCharge > 0 && (
                          <span>
                            {extraAdults} Extra Adult(s) @ Rs.{" "}
                            {extraAdultCharge}
                            <br />
                          </span>
                        )}
                        {extraChildren > 0 && extraChildCharge > 0 && (
                          <span>
                            {extraChildren} Extra Child(ren) @ Rs.{" "}
                            {extraChildCharge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.selectedActivities.length > 0 && (
                    <div className="space-y-3 pb-6 border-b border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Activities
                      </h4>
                      {formData.selectedActivities.map((act) => (
                        <div
                          key={act.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-primary">
                            {act.title} ({Number(act.quantity) || 1} × Rs.{" "}
                            {act.price})
                          </span>
                          <span className="text-accent font-medium">
                            {act.price === "Free"
                              ? "Free"
                              : `Rs. ${act.price * (Number(act.quantity) || 1)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Check-In</span>
                      <span className="font-medium text-primary">
                        {formatDateDisplay(formData.checkIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Check-Out</span>
                      <span className="font-medium text-primary">
                        {formatDateDisplay(formData.checkOut)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Guests</span>
                      <span className="font-medium text-primary">
                        {formData.adults} Adults, {formData.children} Children
                      </span>
                    </div>
                  </div>
                  {isMember && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Membership Discount</span>
                      <span>- Rs. {membershipDiscountAmount}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>- Rs. {couponDiscountAmount}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    // <button
                    //   onClick={() =>
                    //     navigate(location.pathname, {
                    //       replace: true,
                    //       state: {
                    //         ...location.state,
                    //         appliedCoupon: null,
                    //       },
                    //     })
                    //   }
                    //   className="text-xs text-red-500 underline text-right block"
                    // >
                    //   Remove coupon
                    // </button>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-xs text-red-500 underline text-right block"
                    >
                      Remove coupon
                    </button>
                  )}

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-600 font-medium">
                        Total Estimate
                      </span>
                      <span className="text-2xl font-bold text-accent">
                        Rs. {finalPayableAmount}
                      </span>
                    </div>

                    {selectedPaymentType && (
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {selectedPaymentType === "PARTIAL"
                              ? "Partial Payment (Paid Now)"
                              : "Paid Now"}
                          </span>
                          <span className="font-semibold text-primary">
                            Rs. {paidAmount}
                          </span>
                        </div>
                        {selectedPaymentType === "PARTIAL" && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Remaining Payable
                            </span>
                            <span className="font-semibold text-primary">
                              Rs. {remainingAmount}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="flex-1 px-6 py-3 text-xs uppercase tracking-widest font-bold border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl cursor-pointer"
                    >
                      <ChevronLeft className="inline-block mr-1" size={14} />
                      Back
                    </button>
                    {currentStep < 5 && (
                      <button
                        onClick={() => {
                          if (currentStep < 4) {
                            proceedNext();
                          } else if (currentStep === 4) {
                            setPaymentError(""); // ✅ Clear error before showing popup
                            if (isMember) {
                              setShowPaymentChoice(true); // 🔥 already member
                            } else {
                              setShowMembershipPopup(true); // 🔥 new user
                            }
                          }
                        }}
                        disabled={
                          (currentStep === 2 &&
                            formData.selectedRooms.length === 0) ||
                          (currentStep === 4 && !otpVerified)
                        }
                        className="flex-1 btn-primary px-2 py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-2xl cursor-pointer"
                      >
                        {currentStep === 1
                          ? "Check Availability"
                          : currentStep === 4
                            ? "Review & Confirm"
                            : "Continue"}{" "}
                        <ArrowRight className="inline-block ml-1" size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Star size={16} className="text-accent fill-accent" />
                <span>Best Rate Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


