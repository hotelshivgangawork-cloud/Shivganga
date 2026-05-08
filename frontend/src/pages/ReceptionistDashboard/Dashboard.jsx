import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  TrendingUp,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
  Hotel,
  IndianRupee,
  ChevronRight,
  Edit,
  Trash,
  X,
} from "lucide-react";
import api from "../axios";

const Dashboard = () => {
  const navigate = useNavigate();

  // Backend data states
  const [overview, setOverview] = useState({});
  const [todayStats, setTodayStats] = useState({});
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [latestBookings, setLatestBookings] = useState([]);

  // ✅ NEW: Receptionist name state
  const [receptionistName, setReceptionistName] = useState("Elena");
  const [loadingName, setLoadingName] = useState(false);

  // Frontend table states
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    // ✅ Fetch receptionist name first
    fetchReceptionistName();

    // Then fetch other data
    fetchOverview();
    fetchTodayStats();
    fetchWeeklyTrends();
    fetchRecentActivities();
    fetchLatestBookings();
  }, []);

  // ✅ NEW: Fetch receptionist name from API
  const fetchReceptionistName = async () => {
    try {
      setLoadingName(true);
      const res = await api.get("/receptionist/profile");

      if (res.data.success) {
        const profileData = res.data.data?.profile || res.data.data;

        // Get the name from profile
        let name = "Elena"; // Default fallback

        if (profileData.firstName || profileData.lastName) {
          name =
            `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();
        } else if (profileData.name) {
          name = profileData.name;
        }

        setReceptionistName(name || "Elena");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      // Fallback to localStorage or default
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData.firstName || userData.lastName) {
          setReceptionistName(
            `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          );
        } else if (userData.name) {
          setReceptionistName(userData.name);
        }
      } catch (e) {
        console.log("Using default name");
      }
    } finally {
      setLoadingName(false);
    }
  };

  // Existing fetch functions...
  const fetchOverview = async () => {
    try {
      const res = await api.get("/receptionist/overview");
      if (res.data.success) setOverview(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const res = await api.get("/receptionist/today-stats");
      if (res.data?.success) {
        setTodayStats({
          checkIns: res.data.checkIns ?? 0,
          checkOuts: res.data.checkOuts ?? 0,
          availableRooms: res.data.availableRooms ?? 0,
          pendingPayments: res.data.pendingPayments ?? 0,
          revenue: res.data.revenue ?? 0,
        });
      }
    } catch (err) {
      console.error("Today stats fetch error:", err);
    }
  };

  const fetchWeeklyTrends = async () => {
    try {
      const res = await api.get("/receptionist/weekly-trends");
      if (res.data.success) setWeeklyTrends(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await api.get("/receptionist/recent-activities");
      if (res.data.success) setRecentActivities(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLatestBookings = async () => {
    try {
      const res = await api.get("/receptionist/latest-bookings");
      if (res.data.success) {
        const raw = Array.isArray(res.data.data) ? res.data.data : [];
        setLatestBookings(raw);
        setBookings(
          raw.map((b) => {
            const firstName =
              b?.user?.firstName || b?.guest?.firstName || "Guest";
            const lastName = b?.user?.lastName || b?.guest?.lastName || "";
            const name = `${firstName} ${lastName}`.trim();
            const initials = `${(firstName || "G")[0] || "G"}${(lastName || "")[0] || ""}`;
            const dateSrc = b.checkInDate || b.createdAt;
            // Status: Checked In > Pending (payment) > Confirmed (paid) - use paymentStatus for Pending/Confirmed filter
            let status = "Confirmed";
            if (b.isCheckedIn) status = "Checked In";
            else if (b.paymentStatus === "pending") status = "Pending";
            else if (b.paymentStatus === "paid" || b.bookingStatus === "confirmed") status = "Confirmed";
            return {
              id: b._id,
              name,
              room: b.rooms?.[0]?.room?.roomNumber || "",
              type: b.rooms?.[0]?.room?.name || "",
              date: dateSrc
                ? new Date(dateSrc).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "",
              price: Number(b.totalAmount) || 0,
              status,
              initials,
            };
          }),
        );
      }
    } catch (err) {
      console.error(err);
      setLatestBookings([]);
      setBookings([]);
    }
  };

  // Utility
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ========== BACKEND CONNECTED HANDLERS ==========

  const handleDeleteBooking = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const res = await api.delete(`/receptionist/bookings/${id}`);

        if (res.data.success) {
          setBookings((prev) => prev.filter((b) => b.id !== id));
          fetchLatestBookings();
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete booking. Please try again.");
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await api.put(`/receptionist/bookings/${editingId}`, {
        name: editFormData.name,
        room: editFormData.room,
        type: editFormData.type,
        date: editFormData.date,
        price: editFormData.price,
      });

      if (res.data.success) {
        setBookings((prev) =>
          prev.map((item) => (item.id === editingId ? editFormData : item)),
        );
        setEditingId(null);
        setEditFormData({});
        fetchLatestBookings();
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update booking. Please try again.");
    }
  };

  // ========== SAME AS BEFORE ==========

  const handleEditClick = (booking) => {
    setEditingId(booking.id);
    setEditFormData(booking);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter =
      filterStatus === "All" || booking.status === filterStatus;
    const matchesSearch =
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.room.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <Sidebar>
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
        {/* Welcome card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-8 md:p-10 shadow-2xl shadow-slate-900/10 group">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              Welcome back,{" "}
              <span className="text-[#D4AF37]">
                {loadingName ? "Loading..." : receptionistName}
              </span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed max-w-lg">
              Your dashboard is ready. You have a few new check-ins scheduled
              for today and housekeeping is on track.
            </p>
            <Link to="/receptionist/new-booking">
              <button className="px-6 py-3 bg-[#D4AF37] hover:bg-[#b5952f] text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-95 flex items-center gap-2">
                <Plus size={18} /> New Reservation
              </button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-full h-full md:w-1/2 pointer-events-none opacity-20">
            <div className="absolute -top-20 -right-20 size-96 bg-[#D4AF37] rounded-full blur-[100px] opacity-20"></div>
            <Hotel
              size={320}
              strokeWidth={0.5}
              className="absolute -bottom-10 -right-10 text-white opacity-5 rotate-[-10deg]"
            />
          </div>
        </div>

        {/* Pending Payments & Recent Bookings - Top Priority */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-6">
            <h3 className="text-base font-bold text-rose-800 mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500"></span>
              Pending Payments
            </h3>
            <p className="text-3xl font-black text-rose-700">{todayStats.pendingPayments ?? 0}</p>
            <p className="text-sm text-rose-600 mt-1">Require action today</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">Recent Bookings</h3>
            <p className="text-3xl font-black text-[#0f172a]">{bookings.length}</p>
            <p className="text-sm text-slate-500 mt-1">Latest reservations</p>
            <Link to="/receptionist/bookinglist" className="inline-flex items-center gap-1 text-sm font-bold text-[#D4AF37] mt-2 hover:underline">
              View all <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Stats Cards - Live Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            label="Check-ins"
            value={todayStats.checkIns ?? 0}
            sub="Today"
            icon={<TrendingUp size={20} />}
            trend="Scheduled"
            trendUp={true}
            color="text-emerald-600 bg-emerald-50 border-emerald-100"
          />
          <StatCard
            label="Check-outs"
            value={todayStats.checkOuts ?? 0}
            sub="Today"
            icon={<ArrowDownRight size={20} />}
            trend="Scheduled"
            trendUp={true}
            color="text-blue-600 bg-blue-50 border-blue-100"
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(todayStats.revenue ?? 0)}
            sub="Today"
            icon={<IndianRupee size={20} />}
            trend="Actual"
            trendUp={true}
            color="text-[#D4AF37] bg-amber-50 border-amber-100"
          />
          <StatCard
            label="Pending"
            value={todayStats.pendingPayments ?? 0}
            sub="Payments"
            icon={<User size={20} />}
            trend="Action"
            trendUp={false}
            color="text-rose-600 bg-rose-50 border-rose-100"
          />
        </div>

        {/* Occupancy & Activity - EXACTLY SAME */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          {/* Occupancy chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Occupancy</h3>
                <p className="text-sm text-slate-400 font-medium">
                  Weekly Performance
                </p>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="size-2 rounded-full bg-[#D4AF37]"></span>{" "}
                  Current
                </span>
              </div>
            </div>
            <div className="h-64 w-full relative group flex items-end justify-between px-2 gap-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-slate-50"></div>
                ))}
              </div>
              {(() => {
                const fallbackData = [45, 72, 58, 84, 61, 90, 75];
                let chartData = fallbackData;

                if (weeklyTrends && weeklyTrends.length > 0) {
                  const counts = weeklyTrends.map(
                    (d) => d.count || d.occupancy || 0,
                  );
                  const maxCount = Math.max(...counts, 1);
                  chartData = counts.map((count) =>
                    Math.round((count / maxCount) * 100),
                  );
                  while (chartData.length < 7) chartData.push(0);
                  chartData = chartData.slice(0, 7);
                }

                return chartData.map((height, i) => (
                  <div
                    key={i}
                    className="relative z-10 w-full bg-transparent h-full flex flex-col justify-end group/bar"
                  >
                    <div
                      className="w-full md:w-3/4 mx-auto bg-[#D4AF37]/20 rounded-t-lg relative overflow-hidden transition-all duration-300 hover:bg-[#D4AF37]/40 hover:h-[calc(100%+5px)] cursor-pointer"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-0 w-full bg-[#D4AF37] h-1.5 shadow-[0_0_10px_#D4AF37]"></div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                        {weeklyTrends?.[i]?.count || height}%
                      </div>
                    </div>
                    <span className="text-[10px] text-center font-bold text-slate-400 uppercase mt-2">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Activity</h3>
              <button
                onClick={() => navigate("/receptionist/notifications")}
                className="text-[#D4AF37] hover:text-[#b5952f] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                All
              </button>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-y-2 before:left-[19px] before:w-[2px] before:bg-slate-100 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {recentActivities.map((a, i) => (
                <ActivityItem
                  key={i}
                  icon={<User size={14} />}
                  color="bg-[#D4AF37]"
                  title={a.type}
                  desc={`${a.guest} • ${a.room}`}
                  time={new Date(a.time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  onClick={() => navigate("/receptionist/notifications")}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Recent Bookings
              </h3>
              <p className="text-sm text-slate-400 font-medium">
                Operational Overview
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {["All", "Confirmed", "Pending"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative group md:w-48">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>

              <Link
                to="/receptionist/bookinglist"
                className="flex-1 md:flex-none"
              >
                <button className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  View List <ChevronRight size={16} />
                </button>
              </Link>
              <Link
                to="/receptionist/new-booking"
                className="flex-1 md:flex-none"
              >
                <button className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95">
                  <Plus size={16} /> New Booking
                </button>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50">
                <tr>
                  {[
                    "Guest Name",
                    "Room",
                    "Type",
                    "Date",
                    "Price",
                    "Status",
                    "Action",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.length > 0 ? (
                  filteredBookings
                    .slice(0, 5)
                    .map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        formatCurrency={formatCurrency}
                        onDelete={handleDeleteBooking}
                        onEditClick={handleEditClick}
                        isEditing={editingId === b.id}
                        editFormData={editFormData}
                        handleEditFormChange={handleEditFormChange}
                        handleCancelEdit={handleCancelEdit}
                        handleSaveEdit={handleSaveEdit}
                      />
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <p className="text-slate-500 font-medium mb-1">No bookings found</p>
                      <p className="text-slate-400 text-sm">
                        {filterStatus !== "All" || searchQuery
                          ? "Try adjusting your filters or search."
                          : "Recent bookings will appear here."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="h-40 w-full md:hidden shrink-0"></div>
      </div>
    </Sidebar>
  );
};

// ---------- Subcomponents - EXACTLY SAME ----------
const StatCard = ({ label, value, sub, icon, trend, trendUp, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`size-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
      >
        {trend}
      </span>
    </div>
    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
      {label}
    </p>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-extrabold text-slate-900 group-hover:text-[#D4AF37] transition-colors">
        {value}
      </span>
      <span className="text-xs text-slate-400 font-medium">{sub}</span>
    </div>
  </div>
);

const ActivityItem = ({ icon, color, title, desc, time, onClick }) => (
  <div className="relative pl-10 group cursor-pointer" onClick={onClick}>
    <div
      className={`absolute left-0 top-1 size-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white z-10 ${color}`}
    >
      {icon}
    </div>
    <div className="bg-slate-50/50 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-[10px] text-slate-400 font-bold">{time}</p>
      </div>
      <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  </div>
);

const BookingRow = ({
  booking,
  formatCurrency,
  onDelete,
  onEditClick,
  isEditing,
  editFormData,
  handleEditFormChange,
  handleCancelEdit,
  handleSaveEdit,
}) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            name="name"
            value={editFormData.name}
            onChange={handleEditFormChange}
            className="px-2 py-1 border rounded-md w-full text-sm"
          />
        ) : (
          booking.name
        )}
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            name="room"
            value={editFormData.room}
            onChange={handleEditFormChange}
            className="px-2 py-1 border rounded-md w-full text-sm"
          />
        ) : (
          booking.room
        )}
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            name="type"
            value={editFormData.type}
            onChange={handleEditFormChange}
            className="px-2 py-1 border rounded-md w-full text-sm"
          />
        ) : (
          booking.type
        )}
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            name="date"
            value={editFormData.date}
            onChange={handleEditFormChange}
            className="px-2 py-1 border rounded-md w-full text-sm"
          />
        ) : (
          booking.date
        )}
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            name="price"
            value={editFormData.price}
            onChange={handleEditFormChange}
            className="px-2 py-1 border rounded-md w-full text-sm"
          />
        ) : (
          formatCurrency(booking.price)
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            booking.status === "Checked In"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : booking.status === "Pending"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-50 text-slate-700 border border-slate-200"
          }`}
        >
          {booking.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right flex gap-2 justify-end">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="text-green-600 hover:text-green-800"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEditClick(booking)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(booking.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash size={16} />
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default Dashboard;
