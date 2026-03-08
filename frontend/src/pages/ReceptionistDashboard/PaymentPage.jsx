import React, { useState, useEffect } from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import axios from "axios"; // 1. Use standard axios import
import {
  Printer,
  CreditCard,
  Banknote,
  ArrowLeft,
  Check,
  FileText,
  Edit2,
  Tag,
  X,
  Globe,
  CirclePercent,
  Loader2,
  AlertCircle,
  ChevronRight,
  Crown,
  UserCheck,
} from "lucide-react";
import Sidebar from "./Sidebar";
import logo from "../../assets/logo1.webp";

// 2. REMOVED the broken import line that caused the Red Screen error.

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);
  const [membershipDetails, setMembershipDetails] = useState(null);
  const [pendingPaymentType, setPendingPaymentType] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [potentialMembershipDiscount, setPotentialMembershipDiscount] =
    useState(0);

  const location = useLocation();
  const initialBookingData = location.state?.bookingData;

  const [billing, setBilling] = useState({
    roomTotal: 0,
    serviceFee: 0,
    tourismLevy: 0,
    extraMattressTotal: 0,
    activityTotal: 0,
    companyDiscount: 0,
    couponDiscount: 0,
    membershipDiscount: 0,
    grandTotal: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState(null);

  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState(0);
  const [showPartialModal, setShowPartialModal] = useState(false);

  const navigate = useNavigate();

  // 3. FIX: Define API locally to guarantee it works and attaches the token
  const API = axios.create({
    baseURL: "/api",
  });

  // const API = axios.create({
  //   baseURL: "http://localhost:5001/api",
  // });

  // 4. Token Interceptor (Fixes 401 Unauthorized)
  API.interceptors.request.use((req) => {
    // Ensure this key ('token') matches what you set during login!
    const token = localStorage.getItem("token");
    console.log("Using Token for Payment:", token ? "Exists" : "Missing"); // Debugging

    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  // 5. Error Interceptor (Handles Session Expiry Gracefully)
  API.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // This is exactly why you see the alert
        alert("Session expired. Please log in again.");
        // navigate("/login"); // Optional: Redirect to login automatically
      }
      return Promise.reject(error);
    },
  );

  // 1. Initialize Data
  useEffect(() => {
    if (!initialBookingData) return;
    setBilling((prev) => ({
      ...prev,
      roomTotal: Number(initialBookingData.roomTotal) || 0,
      serviceFee: Number(initialBookingData.serviceFee) || 0,
      tourismLevy: Number(initialBookingData.tourismLevy) || 0,
      extraMattressTotal: Number(initialBookingData.extraMattressTotal) || 0,
      activityTotal: Number(initialBookingData.activityTotal) || 0,
      couponDiscount: Number(initialBookingData.couponDiscount) || 0,
      companyDiscount: 0,
      membershipDiscount: 0,
    }));
    if (initialBookingData.appliedCoupon) {
      setActiveCoupon(initialBookingData.appliedCoupon);
    }
  }, [initialBookingData]);

  // 2. Calculate Membership Discount
  const calculateMembershipDiscount = (membership, baseAmount) => {
    if (!membership || !membership.isActive) return 0;

    if (membership.discountType === "PERCENT") {
      return Math.round((baseAmount * membership.discountValue) / 100);
    } else if (membership.discountType === "FLAT") {
      return Math.min(membership.discountValue, baseAmount);
    }
    return 0;
  };

  // 3. Fetch Membership
  useEffect(() => {
    const fetchMembershipDetails = async () => {
      try {
        const response = await API.get("/membership/active");
        if (response.data.success && response.data.data) {
          const membership = response.data.data;
          setMembershipDetails(membership);

          if (initialBookingData && membership.isActive) {
            const baseAmount =
              Number(initialBookingData.roomTotal) +
              Number(initialBookingData.extraMattressTotal || 0) +
              Number(initialBookingData.activityTotal || 0);

            const memDiscount = calculateMembershipDiscount(
              membership,
              baseAmount,
            );

            setPotentialMembershipDiscount(memDiscount);
          }
        }
      } catch (error) {
        console.error("Error fetching membership:", error);
      }
    };

    if (initialBookingData) {
      fetchMembershipDetails();
    }
  }, [initialBookingData]);

  // 4. Load Razorpay
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpay();
  }, []);

  // 5. Calculate Grand Total
  useEffect(() => {
    const subTotal =
      Number(billing.roomTotal) +
      Number(billing.serviceFee) +
      Number(billing.tourismLevy) +
      Number(billing.extraMattressTotal) +
      Number(billing.activityTotal);

    const totalDiscounts =
      Number(billing.companyDiscount) +
      Number(billing.couponDiscount) +
      (isMember ? Number(billing.membershipDiscount) : 0);

    const total = Math.max(0, subTotal - totalDiscounts);

    setBilling((prev) => ({
      ...prev,
      grandTotal: total,
    }));
  }, [
    billing.roomTotal,
    billing.serviceFee,
    billing.tourismLevy,
    billing.extraMattressTotal,
    billing.activityTotal,
    billing.companyDiscount,
    billing.couponDiscount,
    billing.membershipDiscount,
    isMember,
  ]);

  if (!initialBookingData) {
    return <Navigate to="/receptionist/new-booking" replace />;
  }

  // 6. Confirm Cash Booking
  const confirmCashBooking = async (useMembership = false) => {
    try {
      setIsProcessing(true);

      const payload = {
        roomId: initialBookingData.roomIds[0],
        firstName: initialBookingData.firstName,
        lastName: initialBookingData.lastName,
        email: initialBookingData.email,
        phoneNumber: initialBookingData.phone || "0000000000",
        checkInDate: initialBookingData.checkIn,
        checkOutDate: initialBookingData.checkOut,
        adults: initialBookingData.adults,
        children: initialBookingData.children,
        extraBedsCount: initialBookingData.extraMattresses,

        addOns: (initialBookingData.selectedActivities || []).map((act) => ({
          name: act.title,
          price: act.price,
          quantity: act.count,
        })),

        paymentMethod: "cash",
        couponCode: activeCoupon?.code || null,
        isMember: useMembership,
      };

      console.log("Sending Cash Payment Payload:", payload);

      const res = await API.post("/offline-booking/cash", payload);
      localStorage.removeItem("receptionistBookingDraft"); //Added
      navigate(`/receptionist/receipt/${res.data.data._id}`);
    } catch (err) {
      console.error("Cash booking error:", err);
      setPaymentError(err.response?.data?.message || err.message);
      alert("Cash booking failed. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Razorpay Payment
  const initiateRazorpayPayment = async (useMembership = false) => {
    try {
      setIsProcessing(true);
      setPaymentError("");

      if (!window.Razorpay) {
        throw new Error(
          "Payment system not loaded. Please refresh and try again.",
        );
      }

      const amountToCharge = isPartialPayment ? partialAmount : (billing.grandTotal - (useMembership ? potentialMembershipDiscount : 0));
      const amountInPaise = Math.round(amountToCharge * 100);

      const payload = {
        // rooms: initialBookingData.roomIds,
        rooms: initialBookingData.roomIds.map((id) => ({
          room: id,
          quantity: 1,
        })),
        firstName: initialBookingData.firstName,
        lastName: initialBookingData.lastName,
        email: initialBookingData.email,
        phoneNumber: initialBookingData.phone || "0000000000",
        checkInDate: initialBookingData.checkIn,
        checkOutDate: initialBookingData.checkOut,
        adults: initialBookingData.adults,
        children: initialBookingData.children,
        extraBedsCount: initialBookingData.extraMattresses || 0,

        addOns: (initialBookingData.selectedActivities || []).map((act) => ({
          name: act.title,
          price: act.price,
          quantity: act.count,
        })),

        membershipDiscount: useMembership ? potentialMembershipDiscount : 0,

        paymentType: isPartialPayment ? "PARTIAL" : "FULL",
        couponCode: activeCoupon?.code || null,
        specialRequest: initialBookingData.specialRequest || "",
        isMember: useMembership,
        bypassEmailVerification: true,
        partialAmount: isPartialPayment ? partialAmount : undefined,

        amountInPaise,
        totalAmount: billing.grandTotal,
        paidAmountNow: amountToCharge,
      };

      if (isPartialPayment && activeCoupon?.code) {
        alert(
          "Partial payment cannot be combined with a coupon. Please remove the coupon or pay full amount.",
        );
        setIsProcessing(false);
        return;
      }

      const response = await API.post("/offline-booking/create-order", payload);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to create payment order",
        );
      }

      const { order, transactionId, bookingPayload } = response.data;

      if (!order || !order.id) {
        throw new Error("Invalid order response from server");
      }

      const razorpayKey =
        import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SE6CPbCWExgDOK";

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Shiv Ganga Hospitality",
        description: "Booking Payment",
        order_id: order.id,
        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await API.post(
              "/offline-booking/verify-payment",
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                transactionId,
                bookingPayload,
                priceBreakdown: billing
              },
            );

            const data = verifyResponse?.data;
            const bookingId = data?.booking?._id || data?.data?.booking?._id;

            if (data?.success && bookingId) {
              localStorage.removeItem("receptionistBookingDraft");
              navigate(`/receptionist/receipt/${bookingId}`, { replace: true });
            } else {
              throw new Error(
                data?.message || "Payment verification failed",
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            const errMsg =
              error.response?.data?.message ||
              error.message ||
              "Payment verification failed";
            setPaymentError(errMsg);
            alert("Payment verification failed: " + errMsg);
          }
        },
        prefill: {
          name: `${initialBookingData.firstName} ${initialBookingData.lastName}`,
          email: initialBookingData.email,
          contact: initialBookingData.phone || "0000000000",
        },
        theme: {
          color: "#D4AF37",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      let errorMessage = "Failed to initialize payment";
      if (error.response) {
        if (error.response.status === 403)
          errorMessage = "Access denied. Email not verified.";
        else if (error.response.status === 401)
          errorMessage = "Session expired. Please login again.";
        else if (error.response.data && error.response.data.message)
          errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = "No response from server. Check your connection.";
      } else {
        errorMessage = error.message;
      }
      setPaymentError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentButtonClick = (paymentType) => {
    if (isProcessing) return;

    if (paymentType === "online" && !window.Razorpay) {
      alert("Payment system is loading. Please wait a moment and try again.");
      return;
    }

    if (
      membershipDetails &&
      membershipDetails.isActive &&
      potentialMembershipDiscount > 0
    ) {
      setPendingPaymentType(paymentType);
      setShowMembershipPopup(true);
    } else {
      if (paymentType === "online") {
        initiateRazorpayPayment(false);
      } else {
        confirmCashBooking(false);
      }
    }
  };

  const handleMembershipDecision = (becomeMember) => {
    setShowMembershipPopup(false);
    setIsMember(becomeMember);
    setBilling((prev) => ({
      ...prev,
      membershipDiscount: becomeMember ? potentialMembershipDiscount : 0,
    }));

    if (pendingPaymentType === "online") {
      initiateRazorpayPayment(becomeMember);
    } else {
      confirmCashBooking(becomeMember);
    }

    setPendingPaymentType(null);
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    setBilling((prev) => ({ ...prev, couponDiscount: 0 }));
  };

  const handlePartialClick = () => {
    setShowPartialModal(true);
  };

  const confirmPartialPayment = () => {
    if (partialAmount > 0 && partialAmount <= billing.grandTotal) {
      setIsPartialPayment(true);
      setShowPartialModal(false);
    } else {
      if (partialAmount === 0 || partialAmount === "") {
        setIsPartialPayment(false);
        setPartialAmount(0);
        setShowPartialModal(false);
      } else {
        alert("Please enter a valid amount (less than or equal to total).");
      }
    }
  };

  const cancelPartialModal = () => {
    setShowPartialModal(false);
    if (!isPartialPayment) {
      setPartialAmount(0);
    }
  };

  const payableAmount = isPartialPayment ? partialAmount : billing.grandTotal;

  const invoiceData = {
    id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    guestName: `${initialBookingData.firstName} ${initialBookingData.lastName}`,
    email: initialBookingData.email || "N/A",
    phone: initialBookingData.phone || "N/A",
    room: initialBookingData.roomIds.join(", "),
    checkIn: new Date(initialBookingData.checkIn).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
    checkOut: new Date(initialBookingData.checkOut).toLocaleDateString(
      "en-IN",
      { month: "short", day: "numeric" },
    ),
    items: [
      {
        desc: `Room Booking - ${initialBookingData.nights} nights`,
        qty: initialBookingData.nights,
        amount: billing.roomTotal,
      },
      ...(billing.extraMattressTotal > 0
        ? [
          {
            desc: "Extra Mattress",
            qty: initialBookingData.extraMattresses,
            amount: billing.extraMattressTotal,
          },
        ]
        : []),
      ...(initialBookingData.selectedActivities || []).map((act) => ({
        desc: act.title,
        qty: act.count,
        amount: act.price * act.count,
      })),
      {
        desc: "Service Fee (10%)",
        qty: 1,
        amount: billing.serviceFee,
      },
      {
        desc: "Tourism Fee",
        qty: 1,
        amount: billing.tourismLevy,
      },
    ],
    discounts: [
      ...(billing.membershipDiscount > 0
        ? [
          {
            desc: "Membership Discount",
            amount: -billing.membershipDiscount,
            type: "membership",
          },
        ]
        : []),
      ...(billing.companyDiscount > 0
        ? [
          {
            desc: "Additional Discount",
            amount: -billing.companyDiscount,
            type: "company",
          },
        ]
        : []),
      ...(billing.couponDiscount > 0
        ? [
          {
            desc: `Coupon: ${activeCoupon?.code || "Discount"}`,
            amount: -billing.couponDiscount,
            type: "coupon",
          },
        ]
        : []),
    ],
    total: billing.grandTotal,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Sidebar>
      {/* Membership Popup Modal */}
      {showMembershipPopup &&
        membershipDetails &&
        potentialMembershipDiscount > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#F4C542] p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Crown size={32} className="text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Become a Member?
                </h3>
                <p className="text-white/90 text-sm">
                  You're eligible for membership discount!
                </p>
              </div>

              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <UserCheck className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm mb-1">
                        {membershipDetails.name || "Premium Membership"}
                      </h4>
                      <p className="text-amber-700 text-xs">
                        {membershipDetails.discountType === "PERCENT"
                          ? `${membershipDetails.discountValue}% discount`
                          : `₹${membershipDetails.discountValue} flat discount`}{" "}
                        on all bookings
                      </p>
                      <p className="text-amber-700 text-xs mt-1">
                        Potential discount:{" "}
                        <span className="font-bold">
                          {formatCurrency(potentialMembershipDiscount)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Booking Amount
                    </span>
                    <span className="font-bold text-[#0f172a]">
                      {formatCurrency(billing.grandTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      Membership Discount
                    </span>
                    <span className="font-bold text-emerald-600">
                      - {formatCurrency(potentialMembershipDiscount)}
                    </span>
                  </div>

                  {isPartialPayment && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">
                        Partial Payment Selected
                      </span>
                      <span className="font-bold text-[#0f172a]">
                        {formatCurrency(
                          Math.min(
                            partialAmount || 0,
                            Math.max(
                              0,
                              billing.grandTotal - potentialMembershipDiscount,
                            ),
                          ),
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm font-bold text-[#0f172a]">
                      Payable Amount
                    </span>
                    <span className="font-bold text-[#D4AF37] text-lg">
                      {formatCurrency(
                        isPartialPayment
                          ? Math.min(
                            partialAmount || 0,
                            Math.max(
                              0,
                              billing.grandTotal -
                              potentialMembershipDiscount,
                            ),
                          )
                          : Math.max(
                            0,
                            billing.grandTotal - potentialMembershipDiscount,
                          ),
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleMembershipDecision(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4C542] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Crown size={18} />
                    Yes, Become a Member & Pay
                  </button>

                  <button
                    onClick={() => handleMembershipDecision(false)}
                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    No Thanks, Pay as Guest
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                  Membership will be applied to your account for future
                  bookings.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Partial Payment Modal */}
      {showPartialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#0f172a] p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Partial Payment</h3>
              <button
                onClick={cancelPartialModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Total Due Amount</p>
                <p className="text-xl font-black text-[#0f172a]">
                  {formatCurrency(billing.grandTotal)}
                </p>
              </div>

              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Enter Amount to Pay Now
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  autoFocus
                  value={partialAmount || ""}
                  onChange={(e) => setPartialAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="0"
                />
              </div>

              {partialAmount > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-bold text-orange-800">
                    Remaining Balance
                  </span>
                  <span className="text-sm font-bold text-orange-800">
                    {formatCurrency(
                      Math.max(0, billing.grandTotal - partialAmount),
                    )}
                  </span>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {isPartialPayment && (
                  <button
                    onClick={() => {
                      setIsPartialPayment(false);
                      setPartialAmount(0);
                      setShowPartialModal(false);
                    }}
                    className="px-4 py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={cancelPartialModal}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPartialPayment}
                  className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-[#D4AF37] hover:bg-[#b5952f] rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-medium">
          <Link
            to="/receptionist/dashboard"
            className="hover:text-[#D4AF37] cursor-pointer transition-colors"
          >
            Bookings
          </Link>
          <ChevronRight size={14} />
          <Link
            to="/receptionist/new-booking"
            className="hover:text-[#D4AF37] cursor-pointer transition-colors"
          >
            New Booking
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-bold">Payment</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-2">
              Finalize Reservation
            </h1>
            <p className="text-slate-500 font-medium">
              Guest:{" "}
              <span className="text-slate-900 font-bold">
                {invoiceData.guestName}
              </span>{" "}
              • Room: {invoiceData.room}
            </p>
          </div>
        </div>

        {paymentError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle size={20} />
              <span className="font-bold">Payment Error</span>
            </div>
            <p className="text-red-700 text-sm">{paymentError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7 flex flex-col gap-6">
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50/80 px-8 py-4 border-b border-slate-200/60 backdrop-blur-sm flex justify-between items-center">
                <h3 className="text-base font-bold text-[#0f172a]">
                  Billing Summary
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit Invoice Manually"
                >
                  {isEditing ? <Check size={20} /> : <Edit2 size={18} />}
                </button>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <p className="text-slate-600 text-sm font-medium truncate flex-1">
                    Room Booking ({initialBookingData.nights} nights)
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="roomTotal"
                      value={billing.roomTotal}
                      onChange={handleBillingChange}
                      className="w-24 px-2 py-1 text-right border border-slate-300 rounded-md text-sm font-bold text-[#0f172a]"
                    />
                  ) : (
                    <p className="text-[#0f172a] text-sm font-bold whitespace-nowrap">
                      {formatCurrency(billing.roomTotal)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <p className="text-slate-600 text-sm font-medium truncate flex-1">
                    Service Fee (10%)
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="serviceFee"
                      value={billing.serviceFee}
                      onChange={handleBillingChange}
                      className="w-24 px-2 py-1 text-right border border-slate-300 rounded-md text-sm font-bold text-[#0f172a]"
                    />
                  ) : (
                    <p className="text-[#0f172a] text-sm font-bold whitespace-nowrap">
                      {formatCurrency(billing.serviceFee)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <p className="text-slate-600 text-sm font-medium truncate flex-1">
                    Tourism Fee
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="tourismLevy"
                      value={billing.tourismLevy}
                      onChange={handleBillingChange}
                      className="w-24 px-2 py-1 text-right border border-slate-300 rounded-md text-sm font-bold text-[#0f172a]"
                    />
                  ) : (
                    <p className="text-[#0f172a] text-sm font-bold whitespace-nowrap">
                      {formatCurrency(billing.tourismLevy)}
                    </p>
                  )}
                </div>

                {billing.extraMattressTotal > 0 && (
                  <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                    <p className="text-slate-600 text-sm font-medium truncate flex-1">
                      Extra Mattress
                    </p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="extraMattressTotal"
                        value={billing.extraMattressTotal}
                        onChange={handleBillingChange}
                        className="w-24 px-2 py-1 text-right border border-slate-300 rounded-md text-sm font-bold text-[#0f172a]"
                      />
                    ) : (
                      <p className="text-[#0f172a] text-sm font-bold whitespace-nowrap">
                        {formatCurrency(billing.extraMattressTotal)}
                      </p>
                    )}
                  </div>
                )}

                {billing.activityTotal > 0 && (
                  <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                    <p className="text-slate-600 text-sm font-medium truncate flex-1">
                      Activities & Add-ons
                    </p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="activityTotal"
                        value={billing.activityTotal}
                        onChange={handleBillingChange}
                        className="w-24 px-2 py-1 text-right border border-slate-300 rounded-md text-sm font-bold text-[#0f172a]"
                      />
                    ) : (
                      <p className="text-[#0f172a] text-sm font-bold whitespace-nowrap">
                        {formatCurrency(billing.activityTotal)}
                      </p>
                    )}
                  </div>
                )}

                {billing.membershipDiscount > 0 && (
                  <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0 bg-amber-50/50 -mx-4 px-4 rounded-lg my-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Crown size={14} className="text-amber-600" />
                      <p className="text-amber-700 text-sm font-bold truncate">
                        Membership Discount
                      </p>
                    </div>
                    <p className="text-amber-600 text-sm font-bold whitespace-nowrap">
                      - {formatCurrency(billing.membershipDiscount)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <p className="text-emerald-600 text-sm font-bold truncate flex-1">
                    Additional Discount
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="companyDiscount"
                      value={billing.companyDiscount}
                      onChange={handleBillingChange}
                      placeholder="0"
                      className="w-24 px-2 py-1 text-right border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md text-sm font-bold"
                    />
                  ) : (
                    <p className="text-emerald-600 text-sm font-bold whitespace-nowrap">
                      - {formatCurrency(billing.companyDiscount)}
                    </p>
                  )}
                </div>

                {activeCoupon && (
                  <div className="flex justify-between items-center gap-4 py-3 border-b border-slate-100 last:border-0 bg-blue-50/50 -mx-4 px-4 rounded-lg my-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Tag size={14} className="text-blue-600" />
                      <p className="text-blue-700 text-sm font-bold truncate">
                        Coupon Applied: {activeCoupon.code}
                      </p>
                      <button
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-blue-600 text-sm font-bold whitespace-nowrap">
                      - {formatCurrency(billing.couponDiscount)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center gap-4 pt-4 mt-6 border-t border-slate-100">
                  <p className="text-[#0f172a] text-lg font-bold">
                    {isPartialPayment ? "Payable Now (Partial)" : "Grand Total"}
                  </p>
                  <p className="text-[#D4AF37] text-2xl font-black whitespace-nowrap">
                    {formatCurrency(payableAmount)}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-bold text-[#0f172a] ml-1">
                Select Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  disabled={isProcessing}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === "cash" ? "bg-white border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 scale-[1.02]" : "bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-lg"}`}
                >
                  <Banknote
                    size={32}
                    className={`mb-3 transition-colors ${paymentMethod === "cash" ? "text-[#0f172a]" : "text-slate-400 group-hover:text-[#0f172a]"}`}
                  />
                  <span
                    className={`text-xs md:text-sm font-bold ${paymentMethod === "cash" ? "text-[#0f172a]" : "text-slate-500 group-hover:text-[#0f172a]"}`}
                  >
                    Cash
                  </span>
                  {paymentMethod === "cash" && (
                    <div className="absolute top-3 right-3 text-[#D4AF37] animate-in zoom-in">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod("online")}
                  disabled={isProcessing}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === "online" ? "bg-white border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 scale-[1.02]" : "bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-lg"}`}
                >
                  <Globe
                    size={32}
                    className={`mb-3 transition-colors ${paymentMethod === "online" ? "text-[#0f172a]" : "text-slate-400 group-hover:text-[#0f172a]"}`}
                  />
                  <span
                    className={`text-xs md:text-sm font-bold ${paymentMethod === "online" ? "text-[#0f172a]" : "text-slate-500 group-hover:text-[#0f172a]"}`}
                  >
                    Pay Online
                  </span>
                  {paymentMethod === "online" && (
                    <div className="absolute top-3 right-3 text-[#D4AF37] animate-in zoom-in">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                </button>

                <button
                  onClick={handlePartialClick}
                  disabled={isProcessing}
                  className={`relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed ${isPartialPayment ? "bg-white border-2 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 scale-[1.02]" : "bg-white border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-lg"}`}
                >
                  <CirclePercent
                    size={32}
                    className={`mb-3 transition-colors ${isPartialPayment ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-[#D4AF37]"}`}
                  />
                  <span
                    className={`text-xs md:text-sm font-bold ${isPartialPayment ? "text-[#0f172a]" : "text-slate-500 group-hover:text-[#0f172a]"}`}
                  >
                    Partial Payment
                  </span>
                  {isPartialPayment && (
                    <div className="absolute top-3 right-3 text-[#D4AF37] animate-in zoom-in">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                </button>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              {paymentMethod === "cash" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-left-4 fade-in duration-300">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Receipt Number
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-white outline-none transition-all"
                      placeholder="RCPT-8822"
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Amount Tendered
                    </label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-white outline-none transition-all"
                      placeholder={formatCurrency(payableAmount)}
                      value={formatCurrency(payableAmount)}
                      readOnly
                      type="text"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "online" && (
                <div className="animate-in slide-in-from-left-4 fade-in duration-300">
                  <p className="text-center text-slate-500 font-medium py-4">
                    Click the button below to proceed with secure online payment
                  </p>
                </div>
              )}
            </section>

            <div className="flex gap-4 mt-2">
              {/* <Link to="/receptionist/new-booking" className="flex-1">
                <button className="w-full h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group">
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform"
                  />{" "}
                  Back
                </button>
              </Link> */}
              <button
                onClick={() => navigate(-1)}
                className="flex-1 h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group"
              >
                <ArrowLeft
                  size={18}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Back
              </button>

              {paymentMethod === "cash" ? (
                <button
                  onClick={() => handlePaymentButtonClick("cash")}
                  disabled={isProcessing}
                  className="flex-[2] h-14 bg-[#0f172a] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={18} /> Confirm & Print Invoice
                </button>
              ) : (
                <button
                  onClick={() => handlePaymentButtonClick("online")}
                  disabled={isProcessing}
                  className="flex-[2] h-14 bg-[#0f172a] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay Online {formatCurrency(payableAmount)}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="xl:col-span-5">
            <div className="sticky top-28">
              <h3 className="text-base font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                <FileText className="text-[#D4AF37]" size={20} />
                Invoice Preview
              </h3>

              <div className="bg-white rounded-xl shadow-2xl shadow-slate-200/50 min-h-[640px] text-[#0f172a] flex flex-col border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D4AF37]"></div>

                <div className="p-6 md:p-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <div className="h-16 w-auto mb-4">
                        <img
                          src={logo}
                          alt="Shiv Ganga Logo"
                          className="h-full object-contain drop-shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-light text-slate-300 mb-1 select-none">
                        INVOICE
                      </h2>
                      <p className="text-xs font-bold text-[#0f172a]">
                        {invoiceData.id}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Date: {invoiceData.date}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-[#D4AF37] mb-2 tracking-widest">
                        Bill To
                      </p>
                      <p className="font-bold text-[#0f172a] text-sm">
                        {invoiceData.guestName}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        {invoiceData.email}
                        <br />
                        {invoiceData.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-[#D4AF37] mb-2 tracking-widest">
                        Stay Details
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Check-in:{" "}
                        <span className="text-[#0f172a] font-bold">
                          {invoiceData.checkIn}
                        </span>
                        <br />
                        Check-out:{" "}
                        <span className="text-[#0f172a] font-bold">
                          {invoiceData.checkOut}
                        </span>
                        <br />
                        Nights:{" "}
                        <span className="text-[#0f172a] font-bold">
                          {initialBookingData.nights}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-3 text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                            Description
                          </th>
                          <th className="pb-3 text-[9px] uppercase font-bold text-slate-400 text-right tracking-widest">
                            Qty
                          </th>
                          <th className="pb-3 text-[9px] uppercase font-bold text-slate-400 text-right tracking-widest">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceData.items.map((item, i) => (
                          <tr key={i}>
                            <td className="py-4 font-bold text-[#0f172a] truncate max-w-[150px]">
                              {item.desc}
                            </td>
                            <td className="py-4 text-right text-slate-500 font-medium">
                              {item.qty}
                            </td>
                            <td className="py-4 text-right text-[#0f172a] font-bold whitespace-nowrap">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}

                        {billing.membershipDiscount > 0 && (
                          <tr>
                            <td className="py-4 font-bold text-amber-600 truncate max-w-[150px]">
                              Membership Discount
                            </td>
                            <td className="py-4 text-right text-slate-500 font-medium">
                              1
                            </td>
                            <td className="py-4 text-right text-amber-600 font-bold whitespace-nowrap">
                              - {formatCurrency(billing.membershipDiscount)}
                            </td>
                          </tr>
                        )}

                        {billing.companyDiscount > 0 && (
                          <tr>
                            <td className="py-4 font-bold text-emerald-600 truncate max-w-[150px]">
                              Additional Discount
                            </td>
                            <td className="py-4 text-right text-slate-500 font-medium">
                              1
                            </td>
                            <td className="py-4 text-right text-emerald-600 font-bold whitespace-nowrap">
                              - {formatCurrency(billing.companyDiscount)}
                            </td>
                          </tr>
                        )}

                        {billing.couponDiscount > 0 && (
                          <tr>
                            <td className="py-4 font-bold text-blue-600 truncate max-w-[150px]">
                              Coupon: {activeCoupon?.code}
                            </td>
                            <td className="py-4 text-right text-slate-500 font-medium">
                              1
                            </td>
                            <td className="py-4 text-right text-blue-600 font-bold whitespace-nowrap">
                              - {formatCurrency(billing.couponDiscount)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-10 pt-6 border-t border-slate-100">
                    {isPartialPayment ? (
                      <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            Total Invoice
                          </p>
                          <p className="text-base font-bold text-[#0f172a]">
                            {formatCurrency(
                              billing.grandTotal +
                              billing.membershipDiscount +
                              billing.companyDiscount +
                              billing.couponDiscount,
                            )}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-500 uppercase">
                            Total Discount
                          </p>
                          <p className="text-base font-bold text-emerald-600">
                            -{" "}
                            {formatCurrency(
                              billing.membershipDiscount +
                              billing.companyDiscount +
                              billing.couponDiscount,
                            )}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-[#D4AF37] uppercase">
                            Paid Now
                          </p>
                          <p className="text-base font-bold text-[#D4AF37]">
                            {formatCurrency(partialAmount)}
                          </p>
                        </div>
                        <div className="border-t border-slate-200 my-2"></div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-black text-[#0f172a] uppercase tracking-widest">
                            Balance Due
                          </p>
                          <p className="text-xl font-black text-slate-800">
                            {formatCurrency(
                              Math.max(0, billing.grandTotal - partialAmount),
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-widest">
                          Total Due
                        </p>
                        <p className="text-2xl font-black text-[#D4AF37] whitespace-nowrap">
                          {formatCurrency(payableAmount)}
                        </p>
                      </div>
                    )}

                    <div className="mt-12 flex justify-between items-end px-2">
                      <div className="border-t border-slate-300 w-36 pt-2">
                        <p className="text-[9px] text-center text-slate-400 uppercase font-bold tracking-tighter">
                          Authorized Signature
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#D4AF37] italic font-serif">
                          Shiv Ganga Hospitality
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-40 w-full md:hidden shrink-0"></div>
      </div>
    </Sidebar>
  );
};

export default PaymentPage;
