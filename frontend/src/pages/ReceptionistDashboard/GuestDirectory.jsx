import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Users, RotateCw, Mail, Phone, MapPin, 
  Calendar, User, CheckCircle2, Home, Bed, Star, 
  ChevronRight, Users2, ShieldCheck, UserCheck,
  UserX, PhoneCall
} from 'lucide-react';
import Sidebar from './Sidebar';
import api from "../axios";
import { toast } from 'react-hot-toast';

// Helper function to format currency
const formatINR = (amount) => {
  if (!amount || isNaN(amount)) return "₹ 0";
  return `₹ ${amount.toLocaleString('en-IN')}`;
};

const GuestDirectory = () => {
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    checkedInGuests: 0,
    activeGuests: 0,
    inactiveGuests: 0
  });
  const [activeGuestId, setActiveGuestId] = useState(null);
  const [activeGuestDetails, setActiveGuestDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Get initial from name
  const getInitial = (name) => {
    if (!name) return "G";
    return name.charAt(0).toUpperCase();
  };

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

  const handlePayNow = async () => {
    const details = activeGuestDetails?.transactionDetails;
    if (!details?.pendingAmount || !details?.bookingId) return;

    try {
      setPaying(true);

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment system failed to load. Please refresh.");
        return;
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await api.post(
        "/online-booking/remaining/create-order",
        { bookingId: details.bookingId },
        { headers },
      );

      if (!res.data?.success || !res.data?.order?.id) {
        toast.error(res.data?.message || "Failed to create remaining order");
        return;
      }

      const { order, transactionId, pendingAmount } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Shiv Ganga Hospitality",
        description: "Remaining Booking Payment",
        order_id: order.id,
        handler: async function (paymentResponse) {
          try {
            const verifyResp = await api.post(
              "/online-booking/remaining/verify",
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                transactionId,
              },
              { headers },
            );

            if (verifyResp.data?.success) {
              toast.success("Remaining amount paid successfully");
              fetchGuestDetails(activeGuestId, activeGuestDetails);
              fetchGuestStats();
            } else {
              toast.error(
                verifyResp.data?.message || "Payment verification failed",
              );
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          }
        },
        prefill: {
          name: activeGuestDetails?.name || "",
          email: activeGuestDetails?.email || "",
          contact:
            activeGuestDetails?.phoneNumber ||
            activeGuestDetails?.phone ||
            "0000000000",
        },
        theme: { color: "#D4AF37" },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Unable to process payment");
    } finally {
      setPaying(false);
    }
  };


  // Fetch guest stats
  const fetchGuestStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.get("/guests/stats", { headers });
      if (response.data?.success) {
        setStats({
          totalGuests: response.data.totalGuests ?? 0,
          checkedInGuests: response.data.checkedInGuests ?? 0,
          activeGuests: response.data.activeGuests ?? 0,
          inactiveGuests: response.data.inactiveGuests ?? 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch guest stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch guest list
  const fetchGuestList = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        ...(search && { search })
      };
      
      const response = await api.get("/guests", { 
        headers,
        params 
      });
      
      if (response.data?.success) {
        const { data, total, totalPages, page } = response.data;
        const guestList = data || [];
        setGuests(guestList);
        setTotalPages(totalPages || 1);
        setTotalRecords(total || 0);
        setCurrentPage(page || 1);

        // If current selection no longer in list, clear it
        if (activeGuestId && !guestList.some((g) => String(g.id) === String(activeGuestId))) {
          setActiveGuestId(null);
          setActiveGuestDetails(null);
        }
        // Set first guest as active on initial load (pass guest to avoid stale closure)
        else if (guestList.length > 0 && !activeGuestId) {
          setActiveGuestId(guestList[0].id);
          fetchGuestDetails(guestList[0].id, guestList[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch guest list:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch guest details (guestOverride avoids stale closure when guests state hasn't updated yet)
  const fetchGuestDetails = async (guestId, guestOverride = null) => {
    if (!guestId) return;

    try {
      setDetailsLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [detailsRes, transactionsRes] = await Promise.all([
        api.get(`/guests/${guestId}/details`, { headers }),
        api.get(`/guests/${guestId}/transactions`, { headers }),
      ]);

      if (detailsRes.data?.success && transactionsRes.data?.success) {
        const guestFromList = guestOverride ?? guests.find((g) => String(g.id) === String(guestId));

        setActiveGuestDetails({
          ...guestFromList,
          id: guestId,
          name: guestFromList?.name ?? "Guest",
          email: guestFromList?.email ?? "",
          phoneNumber: guestFromList?.phoneNumber ?? guestFromList?.phone ?? "",
          status: guestFromList?.status,
          bookingDetails: detailsRes.data.data,
          transactionDetails: transactionsRes.data.data,
        });
      }
    } catch (error) {
      console.error("Failed to fetch guest details:", error);
      toast.error("Failed to load guest details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Fetch payment summary
  const fetchPaymentSummary = async (guestId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.get(`/guests/${guestId}/payment-summary`, { headers });
      return response.data?.success ? response.data.data : null;
    } catch (error) {
      console.error("Failed to fetch payment summary:", error);
      return null;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchGuestStats();
    fetchGuestList(1, "");
  }, []);

  // Handle guest selection (fetch details when user clicks a row)
  useEffect(() => {
    if (activeGuestId) {
      const guestFromList = guests.find((g) => String(g.id) === String(activeGuestId));
      fetchGuestDetails(activeGuestId, guestFromList ?? undefined);
    } else {
      setActiveGuestDetails(null);
    }
  }, [activeGuestId]);

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGuestList(1, searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchGuestList(newPage, searchQuery);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'checked_in':
      case 'checked-in':
      case 'active':
        return "bg-green-100 text-green-700";
      case 'checked_out':
      case 'checked-out':
      case 'inactive':
        return "bg-gray-100 text-gray-700";
      case 'pending':
        return "bg-amber-100 text-amber-700";
      case 'confirmed':
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format status text
  const formatStatus = (status) => {
    if (!status) return "Inactive";
    const s = String(status).replace(/_/g, " ");
    return s.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Sidebar>
      <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 font-sans text-slate-900 w-full max-w-none"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users2 className="text-gray-700" />
          <div className="text-sm font-bold uppercase tracking-widest text-gray-600">
            Guest Management
          </div>
          <div className="h-[1px] w-8 bg-accent"></div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Total Guests
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {statsLoading ? "..." : stats.totalGuests || 0}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10">
              <Users className="text-primary" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Checked In
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {statsLoading ? "..." : stats.checkedInGuests || 0}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-green-100">
              <UserCheck className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Active Guests
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {statsLoading ? "..." : stats.activeGuests || 0}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-100">
              <Users className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Inactive Guests
              </div>
              <div className="text-2xl font-bold text-gray-600 mt-1">
                {statsLoading ? "..." : stats.inactiveGuests || 0}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-gray-100">
              <UserX className="text-gray-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN TABLE SECTION */}
        <div className="flex-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            {/* SEARCH BOX */}
            <div className="p-4">
              <div className="flex items-center gap-2 border border-gray-300 rounded-2xl px-3 py-2.5 max-w-md">
                <Search size={18} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-[15px] outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading guests...
                </div>
              ) : guests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No guests found
                </div>
              ) : (
                <>
                  <table className="w-full text-left border-t border-gray-200">
                    <thead className="bg-primary/5">
                      <tr className="text-[11px] uppercase font-bold border border-gray-200 text-gray-500 tracking-widest">
                        <th className="px-6 py-4">Guest Info</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4 text-center">Family</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {guests.map((g) => (
                        <tr 
                          key={g.id} 
                          onClick={() => setActiveGuestId(g.id)}
                          className={`cursor-pointer transition-colors ${activeGuestId === g.id ? "bg-primary/[0.04]" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-primary/10 text-primary">
                                {getInitial(g.name)}
                              </div>
                              <div>
                                <p className="text-[15px] font-bold text-gray-800">{g.name}</p>
                                <p className="text-[11px] text-gray-400 uppercase font-medium">
                                  {g.email || "No email"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[14px] text-gray-600 font-medium">{g.email}</span>
                              <span className="text-[12px] text-gray-400">{g.phoneNumber || "No phone"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[15px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                              {g.familyMembers || (g.adults + g.children) || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                g.status === "CHECKED_IN" ? "bg-green-500" :
                                g.status === "BOOKED" || g.status === "CONFIRMED" ? "bg-blue-500" :
                                g.status === "PENDING" ? "bg-amber-500" :
                                g.status === "CHECKED_OUT" ? "bg-gray-400" : "bg-gray-300"
                              }`} />
                              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                g.status === "CHECKED_IN" ? "text-green-600" :
                                g.status === "BOOKED" || g.status === "CONFIRMED" ? "text-blue-600" :
                                g.status === "PENDING" ? "text-amber-600" :
                                g.status === "CHECKED_OUT" ? "text-gray-600" : "text-gray-400"
                              }`}>
                                {formatStatus(g.status)}
                              </span>
                              <ChevronRight size={16} className={`${activeGuestId === g.id ? 'text-primary' : 'text-gray-300'}`} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* PAGINATION */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest">
                      Page {currentPage} of {totalPages} • {totalRecords} guests
                    </span>

                    <div className="flex gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border 
                          ${currentPage === 1
                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                            : "text-gray-600 border-gray-300 hover:bg-gray-50"}
                        `}
                      >
                        Previous
                      </button>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border 
                          ${currentPage === totalPages
                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                            : "text-gray-600 border-gray-300 hover:bg-gray-50"}
                        `}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* GUEST DETAILS SIDEBAR */}
        <div className="w-full lg:w-[420px]">
          {activeGuestId && activeGuestDetails ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeGuestDetails.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden sticky top-4"
              >
                {detailsLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading details...
                  </div>
                ) : (
                  <>
                    {/* Header Profile Section */}
                    <div className="relative p-6 text-center bg-gray-50/50 border-b border-gray-100">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-primary mx-auto flex items-center justify-center text-3xl font-black text-white shadow-2xl mb-4 border-4 border-white">
                        {getInitial(activeGuestDetails.name)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                        {activeGuestDetails.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusClass(activeGuestDetails.status)}`}>
                          {formatStatus(activeGuestDetails.status)}
                        </span>
                      </div>
                    </div>

                    {/* Sidebar Content */}
                    <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
                      
                      {/* 1. BOOKING DETAILS */}
                      {activeGuestDetails.bookingDetails && (
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-6 bg-primary rounded-full" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-600">Booking Details</h4>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                  Check In
                                </p>
                                <p className="text-sm font-semibold text-gray-700">
                                  {new Date(activeGuestDetails.bookingDetails.checkInDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                  Check Out
                                </p>
                                <p className="text-sm font-semibold text-gray-700">
                                  {new Date(activeGuestDetails.bookingDetails.checkOutDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-center">
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                  Total
                                </p>
                                <p className="text-[15px] font-semibold text-primary">
                                  {activeGuestDetails.bookingDetails.totalGuests || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                  Adults
                                </p>
                                <p className="text-[15px] font-semibold text-primary">
                                  {activeGuestDetails.bookingDetails.adults || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                  Children
                                </p>
                                <p className="text-[15px] font-semibold text-primary">
                                  {activeGuestDetails.bookingDetails.children || 0}
                                </p>
                              </div>
                            </div>
                            {activeGuestDetails.bookingDetails.room && (
                              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                                <Home size={18} className="text-gray-400" />
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                                    Room Info
                                  </p>
                                  <p className="text-sm font-semibold text-gray-700">
                                    {activeGuestDetails.bookingDetails.room}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {/* 2. TRANSACTION DETAILS */}
                      {activeGuestDetails.transactionDetails && (
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-6 bg-emerald-500 rounded-full" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-600">
                              Payment Details
                            </h4>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
                            {/* AMOUNTS */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                  Total Amount
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                  {formatINR(activeGuestDetails.transactionDetails.totalAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                  Paid Amount
                                </p>
                                <p className="text-sm font-semibold text-emerald-600">
                                  {formatINR(activeGuestDetails.transactionDetails.paidAmount)}
                                </p>
                              </div>
                            </div>

                            {/* PAYMENT STATUS */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                  Payment Type
                                </p>
                                <p className="text-sm font-semibold text-gray-700">
                                  {activeGuestDetails.transactionDetails.paymentType || "N/A"}
                                </p>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                activeGuestDetails.transactionDetails.paymentStatus === 'paid' ? 
                                'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {activeGuestDetails.transactionDetails.paymentStatus || "Pending"}
                              </span>
                            </div>

                            {/* PENDING AMOUNT + PAY NOW */}
                            {activeGuestDetails.transactionDetails.pendingAmount > 0 && (
                              <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                    Pending Amount
                                  </p>
                                  <p className="text-sm font-semibold text-red-600">
                                    {formatINR(activeGuestDetails.transactionDetails.pendingAmount)}
                                  </p>
                                </div>

                                <button
                                  onClick={handlePayNow}
                                  disabled={paying}
                                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all
                                    ${
                                      paying
                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                        : "bg-primary text-white hover:bg-primary/90"
                                    }
                                  `}
                                >
                                  {paying ? "Processing..." : "Pay Now"}
                                </button>
                              </div>
                            )}

                            {/* TRANSACTIONS LIST */}
                            {activeGuestDetails.transactionDetails.transactions && 
                             activeGuestDetails.transactionDetails.transactions.length > 0 && (
                              <div className="pt-4 border-t border-gray-100">
                                <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                                  Transactions
                                </p>
                                <div className="space-y-2">
                                  {activeGuestDetails.transactionDetails.transactions.map((txn, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                      <div>
                                        <p className="font-medium">{txn.mode}</p>
                                        <p className="text-xs text-gray-500">{txn.date ? new Date(txn.date).toLocaleDateString() : "N/A"}</p>
                                      </div>
                                      <p className="font-semibold">{formatINR(txn.amount)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {/* 3. CONTACT INFO */}
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-1 w-6 bg-accent rounded-full" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-600">Contact Info</h4>
                        </div>
                        <div className="grid gap-3">
                          <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                            <Mail size={18} className="text-primary" />
                            <span className="text-sm font-semibold text-gray-700">
                              {activeGuestDetails.email || "No email"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                            <Phone size={18} className="text-primary" />
                            <span className="text-sm font-semibold text-gray-700">
                              {activeGuestDetails.phoneNumber || activeGuestDetails.phone || "No phone"}
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center">
              <Users2 className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Select a guest to view details</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </Sidebar>
  );
};

export default GuestDirectory;
