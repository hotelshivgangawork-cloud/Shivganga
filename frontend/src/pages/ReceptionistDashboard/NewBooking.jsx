import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Calendar,
  ChevronRight,
  Minus,
  Plus,
  Check,
  HelpCircle,
  Hotel,
  Users,
  ArrowRight,
  Star,
  CheckCircle2,
  ChevronDown,
  MapPin,
  X,
} from "lucide-react";
import Sidebar from "./Sidebar";

const ACTIVITIES = [
  {
    id: "rafting",
    title: "River Rafting",
    price: 2500,
    label: "Rs. 2500",
    desc: "Experience the thrill of the Ganges rapids.",
    img: "https://i.pinimg.com/736x/5b/c0/a7/5bc0a7da9c7f969f63a25a9f46566b62.jpg",
  },
  {
    id: "bungee",
    title: "Bungee Jumping",
    price: 4000,
    label: "Rs. 4000",
    desc: "India's highest bungee jumping platform.",
    img: "https://i.pinimg.com/1200x/f9/15/a3/f915a356c686516973d6b322fc8974ef.jpg",
  },
  {
    id: "aarti",
    title: "Ganga Aarti",
    price: 0,
    label: "Free",
    desc: "Spiritual evening ceremony by the river.",
    img: "https://www.hotelshivgangarishikesh.com/assets/images/attractions/a1.jpg",
  },
  {
    id: "yoga",
    title: "Yoga Session",
    price: 1500,
    label: "Rs. 1500",
    desc: "Find peace in the Yoga Capital of the World.",
    img: "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
  },
];

// const API = axios.create({
//   baseURL: "https://shiv-ganga-3.onrender.com/api",
// });

const API = axios.create({
  baseURL: "http://localhost:5001/api",
});

const NewBooking = () => {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const getTodayString = () => new Date().toISOString().split("T")[0];
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const navigate = useNavigate();

  const [extraMattresses, setExtraMattresses] = useState(0);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isRestored, setIsRestored] = useState(false); //Added

  API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idType: "Aadhar Card",
    idNumber: "",
    otherIdName: "",
    checkIn: getTodayString(),
    checkOut: getTomorrowString(),
  });

  const location = useLocation();
  const appliedCoupon = location.state?.appliedCoupon;
  const bookingDraft = location.state?.bookingDraft;

  // Restore draft from localStorage on first load
  useEffect(() => {
    const savedDraft = localStorage.getItem("receptionistBookingDraft");

    if (savedDraft) {
      const draft = JSON.parse(savedDraft);

      if (draft.formData) setFormData(draft.formData);
      if (draft.selectedRoomIds) setSelectedRoomIds(draft.selectedRoomIds);
      if (draft.adults !== undefined) setAdults(draft.adults);
      if (draft.children !== undefined) setChildren(draft.children);
      if (draft.extraMattresses !== undefined)
        setExtraMattresses(draft.extraMattresses);
      if (draft.selectedActivities)
        setSelectedActivities(draft.selectedActivities);
    }

    setIsRestored(true);   // VERY IMPORTANT
  }, []);

  // Auto-save draft whenever booking data changes
  useEffect(() => {
    if (!isRestored) return;   // 👈 STOP early overwrite

    const draft = {
      formData,
      selectedRoomIds,
      adults,
      children,
      extraMattresses,
      selectedActivities,
    };

    localStorage.setItem(
      "receptionistBookingDraft",
      JSON.stringify(draft)
    );
  }, [
    isRestored,
    formData,
    selectedRoomIds,
    adults,
    children,
    extraMattresses,
    selectedActivities,
  ]);

  // Fetch Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setRoomsLoading(true);

        const res = await API.post("/room/available", {
          checkInDate: formData.checkIn,
          checkOutDate: formData.checkOut,
        });

        if (res.data.success) {
          setRooms(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [formData.checkIn, formData.checkOut]); // refetch when dates change

  const availableRooms = rooms;

  // Load Draft Data
  useEffect(() => {
    if (bookingDraft) {
      setFormData(bookingDraft.formData);
      setSelectedRoomIds(bookingDraft.selectedRoomIds);
      setAdults(bookingDraft.adults);
      setChildren(bookingDraft.children);
      setExtraMattresses(bookingDraft.extraMattresses);

      if (bookingDraft.selectedActivities) {
        // Clean up data to prevent NaN errors
        const cleanActivities = bookingDraft.selectedActivities.map((act) => {
          let safeCount = Number(act.count);
          if (isNaN(safeCount) || safeCount < 1) safeCount = 1;
          return { ...act, count: safeCount };
        });
        setSelectedActivities(cleanActivities);
      }
    }
  }, [bookingDraft]);

  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const updateActivityCount = (activity, delta) => {
    const totalGuests = Math.max(1, Number(adults) + Number(children));

    setSelectedActivities((prev) => {
      const existing = prev.find((a) => a.id === activity.id);

      if (existing) {
        let currentCount = Number(existing.count);
        if (isNaN(currentCount)) currentCount = 1;

        const newCount = currentCount + delta;

        if (newCount <= 0) {
          return prev.filter((a) => a.id !== activity.id);
        }

        if (newCount > totalGuests) {
          return prev;
        }

        return prev.map((a) =>
          a.id === activity.id ? { ...a, count: newCount } : a,
        );
      } else {
        if (delta > 0) {
          return [...prev, { ...activity, count: 1 }];
        }
        return prev;
      }
    });
  };

  const calculateNights = () => {
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();

  const roomBaseTotal = selectedRoomIds.reduce((total, id) => {
    const room = availableRooms.find((r) => r._id === id);
    return total + (room ? room.pricePerNight * nights : 0);
  }, 0);

  const activityTotal = selectedActivities.reduce((acc, act) => {
    const price = Number(act.price) || 0;
    let count = Number(act.count);
    if (isNaN(count)) count = 1;
    return acc + price * count;
  }, 0);

  const extraMattressTotal = extraMattresses * 500 * nights;
  const serviceFee = roomBaseTotal * 0.1;
  const tourismLevy = 500 * selectedRoomIds.length;

  let grandTotal =
    roomBaseTotal +
    serviceFee +
    tourismLevy +
    extraMattressTotal +
    activityTotal;
  if (isNaN(grandTotal)) grandTotal = 0;

  const discount = appliedCoupon?.discountAmount || 0;
  const finalTotal = grandTotal - discount;

  const selectedRoomNames = selectedRoomIds
    .map((id) => {
      const r = availableRooms.find((room) => room._id === id);
      return r ? `${r.name} (${r.roomNumber})` : "";
    })
    .join(", ");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount) => {
    const safeAmount = isNaN(amount) ? 0 : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const handleProceedToBilling = () => {
    navigate("/receptionist/billing", {
      state: {
        bookingData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          nights,
          adults,
          children,
          extraMattresses,
          selectedActivities,
          roomIds: selectedRoomIds,
          roomTotal: roomBaseTotal,
          serviceFee,
          tourismLevy,
          extraMattressTotal,
          activityTotal,
          appliedCoupon: appliedCoupon || null,
          couponDiscount: discount || 0,
          grandTotal: finalTotal,
        },
      },
    });
  };

  const handleRemoveCoupon = () => {
    navigate("/receptionist/new-booking", {
      replace: true,
      state: {
        bookingDraft: {
          formData,
          selectedRoomIds,
          adults,
          children,
          extraMattresses,
          selectedActivities,
        },
      },
    });
  };

  return (
    <Sidebar>
      <div className="flex flex-col animate-in fade-in duration-500 relative">
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-medium">
          <span className="hover:text-[#D4AF37] cursor-pointer transition-colors">
            Bookings
          </span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-bold">New Booking</span>
        </nav>

        <div className="flex flex-col mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-2">
            Create Reservation
          </h1>
          <p className="text-slate-500 font-medium">
            Enter guest details and select accommodations for walk-in or phone
            requests.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="space-y-8 order-2 xl:order-1">
            {/* ================= GUEST INFO SECTION ================= */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 transition-shadow duration-300">
              <div className="bg-[#0f172a] p-5 flex items-center gap-4">
                <div className="p-2.5 bg-[#D4AF37] rounded-xl text-[#0f172a] shadow-lg shadow-[#D4AF37]/20">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    Guest Information
                  </h3>
                  <p className="text-slate-400 text-xs font-medium">
                    Primary contact details
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g. Jonathan"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="e.g. Doe"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="guest@example.com"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                  />
                </div>

                <div className="md:col-span-2 pt-6 border-t border-slate-100 mt-2">
                  <h4 className="text-sm font-bold text-[#0f172a] mb-4">
                    Identity Proof
                  </h4>
                  <div
                    className={`grid grid-cols-1 ${formData.idType === "Other Govt ID" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ID Type
                      </label>
                      <div className="relative">
                        <select
                          name="idType"
                          value={formData.idType}
                          onChange={handleInputChange}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                          <option value="Aadhar Card">Aadhar Card</option>
                          <option value="Voter ID">Pan Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving Licence">
                            Driving Licence
                          </option>
                          <option value="Other Govt ID">
                            Other Govt Authorised ID
                          </option>
                        </select>
                        <ChevronRight
                          className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none"
                          size={16}
                        />
                      </div>
                    </div>
                    {formData.idType === "Other Govt ID" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          ID Name
                        </label>
                        <input
                          name="otherIdName"
                          value={formData.otherIdName}
                          onChange={handleInputChange}
                          type="text"
                          placeholder="e.g. Voter ID"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ID Number
                      </label>
                      <input
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Enter ID Number"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= STAY DETAILS SECTION ================= */}
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 transition-shadow duration-300">
              <div className="bg-[#0f172a] p-5 flex items-center gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl text-[#D4AF37]">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Stay Details</h3>
                  <p className="text-slate-400 text-xs font-medium">
                    Dates and occupancy
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Check-in Date
                  </label>
                  <input
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    min={getTodayString()}
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Check-out Date
                  </label>
                  <input
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    min={formData.checkIn || getTodayString()}
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all text-sm font-bold text-slate-700 cursor-pointer"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Guests
                    </label>

                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                          Adults
                        </div>
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="size-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm active:scale-90"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-bold text-[#0f172a] text-lg">
                          {adults}
                        </span>
                        <button
                          onClick={() => setAdults(adults + 1)}
                          className="size-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-white hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all shadow-md active:scale-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider w-16">
                          Children
                        </div>
                        <button
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="size-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm active:scale-90"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-bold text-[#0f172a] text-lg">
                          {children}
                        </span>
                        <button
                          onClick={() => setChildren(children + 1)}
                          className="size-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-white hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all shadow-md active:scale-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider w-16 leading-tight">
                          Extra Mattress
                        </div>
                        <button
                          onClick={() =>
                            setExtraMattresses(Math.max(0, extraMattresses - 1))
                          }
                          className="size-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm active:scale-90"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-bold text-[#0f172a] text-lg">
                          {extraMattresses}
                        </span>
                        <button
                          onClick={() =>
                            setExtraMattresses(extraMattresses + 1)
                          }
                          className="size-10 flex items-center justify-center rounded-lg bg-[#0f172a] text-white hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all shadow-md active:scale-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                  <Hotel className="text-[#D4AF37]" size={24} />
                  Select Rooms
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {selectedRoomIds.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {availableRooms.map((room) => {
                  const isSelected = selectedRoomIds.includes(room._id);

                  return (
                    <div
                      key={room._id}
                      onClick={() => toggleRoomSelection(room._id)}
                      className={`
                        relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col
                        ${isSelected
                          ? "ring-2 ring-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 scale-[1.01]"
                          : "border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#D4AF37]/50 bg-white"
                        }
                      `}
                    >
                      <div className="h-40 bg-slate-200 relative overflow-hidden shrink-0">
                        <img
                          src={room.mainImage || room.gallery?.[0]}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-[#0f172a]/20 to-transparent"></div>

                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-[#0f172a] px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                          Room {room.roomNumber}
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-[#D4AF37] text-[#0f172a] p-1.5 rounded-full shadow-lg">
                            <Check size={16} strokeWidth={4} />
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
                          <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded">
                            <Users size={12} />{" "}
                            {room.capacityAdults + room.capacityChildren} Guests
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 flex flex-col flex-1">
                        <h4
                          className={`font-bold text-base ${isSelected ? "text-[#D4AF37]" : "text-[#0f172a]"}`}
                        >
                          {room.name}
                        </h4>

                        <div className="flex flex-wrap gap-2 my-3">
                          {room.features?.slice(0, 3).map((feat, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-xl font-black text-[#0f172a]">
                              {formatCurrency(room.pricePerNight)}
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold">
                              PER NIGHT
                            </span>
                          </div>

                          <button
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors
                            ${isSelected
                                ? "bg-[#0f172a] text-white"
                                : "bg-slate-50 text-slate-600 group-hover:bg-[#D4AF37] group-hover:text-[#0f172a]"
                              }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="xl:h-full flex flex-col order-1 xl:order-2">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-[#0f172a] p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-lg">
                      Booking Summary
                    </h3>
                    <p className="text-[#D4AF37] text-xs font-bold mt-1 tracking-wide">
                      REF: #NEW-8834
                    </p>
                  </div>

                  <div className="absolute -right-6 -top-6 size-24 bg-[#D4AF37] rounded-full blur-2xl opacity-20"></div>
                  <div className="absolute -left-6 -bottom-6 size-20 bg-blue-500 rounded-full blur-2xl opacity-10"></div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Dates
                      </p>
                      <p className="text-sm font-bold text-[#0f172a]">
                        {new Date(formData.checkIn).toLocaleDateString(
                          "en-IN",
                          { month: "short", day: "numeric" },
                        )}{" "}
                        -{" "}
                        {new Date(formData.checkOut).toLocaleDateString(
                          "en-IN",
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-[#D4AF37]">
                      {nights} Nights
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {!appliedCoupon && (
                      <button
                        onClick={() =>
                          navigate("/receptionist/coupons/select", {
                            state: {
                              mode: "receptionist",
                              amount: grandTotal,
                              bookingDraft: {
                                formData,
                                selectedRoomIds,
                                adults,
                                children,
                                extraMattresses,
                                selectedActivities,
                              },
                            },
                          })
                        }
                        className="w-full border border-dashed border-[#D4AF37] text-[#D4AF37] py-3 rounded-xl font-bold"
                      >
                        Apply Coupon
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium w-1/2 truncate">
                      {selectedRoomIds.length > 0
                        ? selectedRoomNames
                        : "Select a Room"}
                    </span>
                    <span className="font-bold text-[#0f172a]">
                      {formatCurrency(roomBaseTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      Service Fee (10%)
                    </span>
                    <span className="font-bold text-[#0f172a]">
                      {formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">
                      Tourism Levy
                    </span>
                    <span className="font-bold text-[#0f172a]">
                      {formatCurrency(tourismLevy)}
                    </span>
                  </div>

                  {extraMattresses > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Extra Mattress ({extraMattresses})
                      </span>
                      <span className="font-bold text-[#0f172a]">
                        {formatCurrency(extraMattressTotal)}
                      </span>
                    </div>
                  )}

                  {selectedActivities.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-dashed border-slate-200 mt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Activities
                      </div>
                      {selectedActivities.map((act) => {
                        const safeCount = isNaN(act.count) ? 1 : act.count;
                        const safePrice = isNaN(act.price) ? 0 : act.price;
                        return (
                          <div
                            key={act.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-slate-500 font-medium">
                              {act.title}{" "}
                              <span className="text-xs font-bold text-[#D4AF37]">
                                x {safeCount}
                              </span>
                            </span>
                            <span className="font-bold text-[#0f172a]">
                              {safePrice === 0
                                ? "Free"
                                : formatCurrency(safePrice * safeCount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="my-4 border-t border-dashed border-slate-200"></div>

                  {appliedCoupon && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-700">
                        <span>
                          Coupon Applied:{" "}
                          <span className="font-mono">
                            {appliedCoupon.code}
                          </span>
                        </span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex justify-between text-sm text-emerald-600 font-bold">
                        <span>Discount</span>
                        <span>- {formatCurrency(discount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-bold text-[#0f172a]">
                      Total
                    </span>
                    <span className="text-2xl font-black text-[#D4AF37]">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {selectedRoomIds.length > 0 ? (
                      <button
                        onClick={() => setShowActivityModal(true)}
                        className="w-full bg-[#0f172a] hover:bg-[#D4AF37] hover:text-[#0f172a] text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-[#D4AF37]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group duration-300"
                      >
                        Proceed to Payment{" "}
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-300 text-slate-500 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Select a Room to Proceed
                      </button>
                    )}
                    <button className="w-full bg-white border-2 border-[#D4AF37] hover:bg-amber-50 text-[#0f172a] font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                      Save as Draft
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF8E1] border border-[#EAB308]/20 p-5 rounded-2xl flex gap-4 items-start">
                <div className="shrink-0 size-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#0f172a] shadow-sm">
                  <HelpCircle size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-[#0f172a] text-sm">
                    Have a Promo Code?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                    You can apply membership discounts or priority codes in the
                    next step.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="h-40 w-full md:hidden shrink-0"></div>

        {/* ================= ACTIVITY POPUP MODAL (RESPONSIVE FIX) ================= */}
        {showActivityModal && (
          <div className="fixed inset-0 z-[100] bg-[#0f172a]/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
            {/* Optimized for mobile bottom-sheet style */}
            <div className="bg-white w-full md:max-w-4xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
              {/* Header */}
              <div className="bg-[#0f172a] p-4 md:p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-2.5 bg-white/10 rounded-xl text-[#D4AF37]">
                    <MapPin size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg md:text-xl">
                      Enhance Your Stay
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm font-medium">
                      Add exclusive experiences
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={20} className="md:w-6 md:h-6" />
                </button>
              </div>

              {/* Content (Scrollable) */}
              <div className="p-4 md:p-8 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pb-20 md:pb-0">
                  {ACTIVITIES.map((activity) => {
                    const selectedActivity = selectedActivities.find(
                      (a) => a.id === activity.id,
                    );
                    const isSelected = !!selectedActivity;
                    let count = selectedActivity ? selectedActivity.count : 0;
                    if (isNaN(count)) count = 1;

                    return (
                      <div
                        key={activity.id}
                        className={`
                          relative rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col h-full bg-white
                          ${isSelected
                            ? "ring-2 ring-[#D4AF37] shadow-xl shadow-[#D4AF37]/10 scale-[1.01]"
                            : "border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#D4AF37]/50"
                          }
                        `}
                      >
                        <div className="h-40 relative overflow-hidden shrink-0">
                          <img
                            src={activity.img}
                            alt={activity.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div
                            className={`absolute inset-0 transition-colors duration-500 ${isSelected ? "bg-[#D4AF37]/20" : "bg-gradient-to-t from-[#0f172a]/80 to-transparent"}`}
                          ></div>

                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0f172a] rounded-lg shadow-sm">
                            {activity.label}
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h4
                            className={`font-bold text-base mb-1 ${isSelected ? "text-[#D4AF37]" : "text-[#0f172a]"}`}
                          >
                            {activity.title}
                          </h4>
                          <p className="text-slate-500 text-xs mb-4 leading-relaxed line-clamp-2">
                            {activity.desc}
                          </p>

                          <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {activity.label === "Free"
                                ? "Complimentary"
                                : "Per Person"}
                            </span>

                            {isSelected ? (
                              <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateActivityCount(activity, -1);
                                  }}
                                  className="size-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-red-500 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-bold text-[#0f172a] w-3 text-center">
                                  {count}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateActivityCount(activity, 1);
                                  }}
                                  className="size-6 flex items-center justify-center bg-[#0f172a] rounded shadow-sm text-white hover:bg-[#D4AF37] hover:text-[#0f172a] transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => updateActivityCount(activity, 1)}
                                className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#0f172a] transition-colors"
                              >
                                Add Activity
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="text-sm w-full md:w-auto flex justify-between md:block">
                  <span className="text-slate-500">Activity Total: </span>
                  <span className="font-bold text-[#0f172a] text-lg">
                    {formatCurrency(activityTotal)}
                  </span>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleProceedToBilling}
                    className="flex-1 md:flex-none px-4 md:px-6 py-3 text-slate-600 font-bold text-xs md:text-sm hover:text-[#0f172a] hover:underline bg-slate-100 md:bg-transparent rounded-xl md:rounded-none text-center"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleProceedToBilling}
                    className="flex-[2] md:flex-none bg-[#0f172a] hover:bg-[#D4AF37] hover:text-[#0f172a] text-white px-6 md:px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    Confirm & Proceed <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default NewBooking;
