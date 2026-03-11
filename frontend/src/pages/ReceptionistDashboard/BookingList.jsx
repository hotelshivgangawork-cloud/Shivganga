import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  BookOpen,
  Luggage,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Trash2,
  FileText,
  Check,
  X,
} from "lucide-react";
import Sidebar from "./Sidebar";
import api from "../axios";

/* ---------------- HELPERS ---------------- */
const capitalize = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1);

/* ---------------- COMPONENT ---------------- */
const Bookings = () => {
  const [rawBookings, setRawBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    myBookingsToday: 0,
    pendingArrivals: 0,
    completedCheckOuts: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const dateInputRef = useRef(null);

  /* ================= FETCH STATS ================= */
  const fetchStats = async () => {
    try {
      const res = await api.get("/receptionist/bookings/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Stats error", err);
    }
  };

  /* ================= FETCH BOOKINGS ================= */
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const params = {};
      if (activeTab !== "All") params.status = activeTab.toLowerCase();
      if (selectedDate) params.date = selectedDate;

      const res = await api.get("/receptionist/bookings", { params });
      setRawBookings(res.data.data || []);
    } catch (err) {
      console.error("Bookings error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [activeTab, selectedDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-trigger") && !e.target.closest(".action-menu-content")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= FORMAT BOOKINGS (UI SAFE) ================= */
  useEffect(() => {
    const formatted = rawBookings.map((b) => {
      let uiStatus = "Confirmed";
      if (b.isCheckedOut) uiStatus = "Check-out";
      else if (b.isCheckedIn) uiStatus = "Check-in";
      else if (b.bookingStatus === "cancelled") uiStatus = "Cancelled";
      else if (b.bookingStatus === "confirmed") uiStatus = "Pending";

      const checkInStr = new Date(b.checkInDate).toLocaleDateString("en-IN");
      const checkOutStr = new Date(b.checkOutDate).toLocaleDateString("en-IN");

      return {
        id: b._id,
        displayId: b.bookingReference || b.guestId || `#BK-${b._id?.slice(-4) || ""}`,
        bookingReference: b.bookingReference || b.guestId || `#BK-${b._id?.slice(-4) || ""}`,
        name: `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.trim() || "Guest",
        status: uiStatus,
        room: b.room?.roomNumber || "-",
        dates: `${checkInStr} - ${checkOutStr}`,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        amount: `₹${(b.totalAmount || 0).toLocaleString("en-IN")}`,
        totalAmount: b.totalAmount || 0,
        initials: `${b.user?.firstName?.[0] || ""}${b.user?.lastName?.[0] || ""}`.trim() || "G",
        tier: "Regular",
        tierColor: "text-slate-400",
      };
    });

    setBookings(formatted);
  }, [rawBookings]);

  /* ================= ACTIONS ================= */
  const handleExport = () => {
    if (!bookings.length) return;

    const headers = ["Booking Reference", "Guest", "Room", "Dates", "Amount", "Status"];
    const rows = bookings.map((b) => [
      b.bookingReference || b.displayId,
      b.name,
      b.room,
      b.dates,
      b.amount,
      b.status,
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `bookings_${selectedDate}.csv`;
    link.click();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await api.delete(`/receptionist/bookings/${id}`);
      setOpenMenuId(null);
      setEditingId(null);
      fetchBookings();
      fetchStats();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditFormData({
      name: row.name,
      room: row.room,
      dates: row.dates,
      amount: row.amount,
      totalAmount: row.totalAmount,
      checkInDate: row.checkInDate,
      checkOutDate: row.checkOutDate,
      status: row.status,
    });
    setOpenMenuId(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const parseDates = (datesStr) => {
    if (!datesStr || typeof datesStr !== "string") return { checkInDate: null, checkOutDate: null };
    const parts = datesStr.split(" - ").map((s) => s.trim());
    if (parts.length < 2) return { checkInDate: null, checkOutDate: null };
    const parseIN = (s) => {
      const [d, m, y] = s.split("/");
      if (d && m && y) return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return new Date(s);
    };
    return { checkInDate: parseIN(parts[0]), checkOutDate: parseIN(parts[1]) };
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const { checkInDate, checkOutDate } = parseDates(editFormData.dates);
      const amountNum = editFormData.totalAmount ?? parseInt(String(editFormData.amount || "0").replace(/[₹,\s]/g, ""), 10);

      await api.put(`/receptionist/bookings/${editingId}`, {
        name: editFormData.name,
        room: editFormData.room,
        checkInDate: checkInDate ? checkInDate.toISOString() : undefined,
        checkOutDate: checkOutDate ? checkOutDate.toISOString() : undefined,
        totalAmount: isNaN(amountNum) ? undefined : amountNum,
      });

      setEditingId(null);
      setEditFormData({});
      fetchBookings();
      fetchStats();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleDeleteAll = () => {
    alert("Bulk delete not enabled (production safety)");
  };

  /* ================= SEARCH ================= */
  const filteredBookings = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room.toString().includes(searchQuery) ||
      (b.displayId || b.bookingReference || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedBookings = filteredBookings.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);

  const getStatusColor = (status) => {
    switch (status) {
      case "Check-in":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Check-out":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Confirmed":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

const handleCalendarClick = () => {
  if (dateInputRef.current?.showPicker) {
    dateInputRef.current.showPicker();
  } else {
    dateInputRef.current?.focus();
  }
};


  return (
    <Sidebar>
      <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-1">Operational Bookings</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your daily desk activities.</p>
          </div>
          
         
          <div className="flex flex-row gap-2 w-full md:w-auto">
            <div 
              className="relative group bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#D4AF37] transition-all cursor-pointer flex items-center h-9 px-3 flex-1 md:flex-none md:w-auto min-w-[120px]"
              onClick={handleCalendarClick}
            >
              <Calendar size={16} className="text-[#0f172a] mr-2" />
              <span className="text-xs font-bold text-[#0f172a] flex-1 truncate">
                {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <input 
                ref={dateInputRef}
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-xl h-9 w-9 md:w-auto md:px-4 bg-white border border-slate-200 text-[#0f172a] text-xs font-bold shadow-sm hover:bg-slate-50 hover:border-[#D4AF37] transition-colors active:scale-95 flex-shrink-0 px-0"
            >
              <Download size={16} />
              <span className="hidden md:inline">Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard title="My Bookings Today" value={bookings.length} icon={<BookOpen size={24} />} color="border-l-[#D4AF37]" />
          <StatCard title="Pending Arrivals" value={bookings.filter(b => b.status === 'Pending').length} icon={<Luggage size={24} />} color="border-l-[#0f172a]" />
          <StatCard title="Completed Check-outs" value={bookings.filter(b => b.status === 'Check-out').length} icon={<LogOut size={24} />} color="border-l-slate-400" />
        </div>

        <div className="flex flex-col gap-4">
          
          <div className="flex flex-row items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
            <div className="flex gap-1 bg-slate-100/50 p-1 rounded-xl overflow-x-auto custom-scrollbar no-scrollbar flex-1 min-w-0">
              {['All', 'Check-in', 'Check-out', 'Pending'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex h-9 items-center justify-center px-4 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0
                    ${activeTab === tab 
                      ? 'bg-[#0f172a] text-white shadow-md' 
                      : 'text-slate-500 hover:bg-white hover:text-[#0f172a]'
                    }
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mobile search */}
            <div className="relative w-full md:w-auto md:min-w-[200px] md:hidden">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search list..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  />
            </div>

            <div className="relative w-full md:w-auto md:min-w-[200px] hidden md:block">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search list..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  />
            </div>

            <div className="flex-shrink-0 relative border-l border-slate-100 pl-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === 'global' ? null : 'global');
                }}
                className="p-2 text-slate-500 hover:text-[#0f172a] hover:bg-slate-100 rounded-lg transition-all action-menu-trigger"
              >
                <MoreVertical size={20} />
              </button>

              {openMenuId === 'global' && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in zoom-in-95 duration-200 action-menu-content origin-top-right">
                  <button 
                    onClick={handleDeleteAll}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete All Data
                  </button>
                  <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                    <FileText size={14} /> Print Summary
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Booking Reference</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Guest Name</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Room</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dates</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBookings.length > 0 ? (
                    paginatedBookings.map((row) => {
                      const isEditing = editingId === row.id;
                      return (
                        <tr key={row.id} className="hover:bg-[#FFF8E1]/40 transition-colors group cursor-pointer relative">
                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold text-[#D4AF37] font-mono break-words">{row.displayId}</td>
                          
                          
                          <td className="py-3 px-3 sm:py-4 sm:px-6">
                            {isEditing ? (
                              <input 
                                type="text" 
                                name="name" 
                                value={editFormData.name} 
                                onChange={handleEditFormChange}
                                className="w-full p-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="size-8 sm:size-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-md">
                                  {row.initials}
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-[#0f172a] break-words">{row.name}</p>
                                  <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${row.tierColor}`}>{row.tier}</p>
                                </div>
                              </div>
                            )}
                          </td>

              
                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm text-center font-bold text-slate-600">
                            {isEditing ? (
                              <input 
                                type="text" 
                                name="room" 
                                value={editFormData.room} 
                                onChange={handleEditFormChange}
                                className="w-16 sm:w-20 p-2 text-xs sm:text-sm text-center border border-slate-200 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                              />
                            ) : row.room}
                          </td>

                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-medium text-slate-500 break-words">
                            {isEditing ? (
                              <input 
                                type="text" 
                                name="dates" 
                                value={editFormData.dates} 
                                onChange={handleEditFormChange}
                                className="w-full p-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                              />
                            ) : row.dates}
                          </td>

                        
                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-black text-[#0f172a] text-right">
                            {isEditing ? (
                              <input 
                                type="text" 
                                name="amount" 
                                value={editFormData.amount} 
                                onChange={handleEditFormChange}
                                className="w-20 sm:w-24 p-2 text-xs sm:text-sm text-right border border-slate-200 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                              />
                            ) : row.amount}
                          </td>

                      
                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-center">
                            {isEditing ? (
                              <select 
                                name="status" 
                                value={editFormData.status} 
                                onChange={handleEditFormChange}
                                className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#D4AF37] bg-white"
                              >
                                <option value="Check-in">Check-in</option>
                                <option value="Check-out">Check-out</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(row.status)}`}>
                                {row.status}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 sm:py-4 sm:px-6 text-center relative">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={handleSaveEdit} className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
                                  <Check size={18} />
                                </button>
                                <button onClick={handleCancelEdit} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === row.id ? null : row.id);
                                  }}
                                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#0f172a] transition-all action-menu-trigger"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {openMenuId === row.id && (
                                  <div className="absolute right-10 top-8 w-32 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in zoom-in-95 duration-200 action-menu-content origin-top-right">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(row);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                                    >
                                      Edit Details
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(row.id);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                        No bookings found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredBookings.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Showing {filteredBookings.length} entries</p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold
                      ${currentPage === i + 1
                        ? "bg-[#0f172a] text-white"
                        : "border border-slate-200 bg-white text-slate-500"}
                    `}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={startIndex + PAGE_SIZE >= filteredBookings.length}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>)}
          </div>

        </div>
        
        <div className="h-40 w-full md:hidden shrink-0"></div>

      </div>
    </Sidebar>
  );
};

/* ---------------- STAT CARD ---------------- */
const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 ${color}`}>
    <p className="text-slate-400 text-xs font-bold uppercase">{title}</p>
    <div className="flex justify-between mt-2">
      <p className="text-3xl font-black text-[#0f172a]">{value}</p>
      <div className="text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-lg">{icon}</div>
    </div>
  </div>
);

export default Bookings;
