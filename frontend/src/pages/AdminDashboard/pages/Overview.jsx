import React, { memo, useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  CalendarCheck2,
  DoorOpen,
  BedDouble,
  IndianRupee,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import api from "../../axios";

/* ================= DATA ================= */

const initialStats = [
  { label: "Total Bookings", value: 0, icon: CalendarCheck2 },
  { label: "Today Check-ins", value: 0, icon: DoorOpen },
  { label: "Occupied Rooms", value: 0, icon: BedDouble },
  { label: "Monthly Revenue", value: "₹ 0", icon: IndianRupee },
];

const initialRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const initialOccupancy = [0, 0, 0, 0, 0, 0, 0];
const initialBookingsTrend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const highlights = [
  { label: "Guests Today", value: 0, icon: Users },
  { label: "Avg Stay", value: "0 Nights", icon: Clock },
  { label: "Conversion Rate", value: "0%", icon: TrendingUp },
];

const topRooms = [];

// const formatINRShort = (num) => {
//   if (!num || isNaN(num)) return "₹ 0";
//   if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(1)}Cr`;
//   if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)}L`;
//   if (num >= 1000) return `₹ ${(num / 1000).toFixed(1)}K`;
//   return `₹ ${num}`;
// };

// 4 march 11.58 pm
const formatINRShort = (num) => {
  if (!num || isNaN(num)) return "₹ 0";
  const numStr = Math.round(num).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== '') {
    return `₹ ${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`;
  } else {
    return `₹ ${lastThree}`;
  }
};

/* ================= MOTION PRESET ================= */

const springChart = {
  type: "spring",
  stiffness: 80,
  damping: 18,
};

const springCard = {
  type: "spring",
  stiffness: 70,
  damping: 18,
};

/* ================= COMPONENT ================= */

export default function Overview() {
  const [stats, setStats] = useState(initialStats);
  const [revenue, setRevenue] = useState(initialRevenue);
  const [occupancy, setOccupancy] = useState(initialOccupancy);
  const [bookingsTrend, setBookingsTrend] = useState(initialBookingsTrend);
  const [highlightsState, setHighlightsState] = useState(highlights);
  const [topRoomsState, setTopRoomsState] = useState(topRooms);
  const maxRevenue = Math.max(...revenue) || 1;
  const maxBookings = Math.max(...bookingsTrend) || 1;
  const [recent, setRecent] = useState([]);
  const [bookingDays, setBookingDays] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchDashboard = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/dashboard/total-bookings", { headers }),
          api.get("/dashboard/today-checkins", { headers }),
          api.get("/dashboard/occupancy", { headers }),
          api.get("/dashboard/revenue/monthly", { headers }),
          api.get("/dashboard/occupancy/trends", { headers }),
          api.get("/dashboard/recent-activities", { headers }),
          api.get("/admin/bookings", { headers }),
        ]);

        const totalBookingsRes =
          results[0].status === "fulfilled" ? results[0].value : { data: {} };
        const todaysCheckInsRes =
          results[1].status === "fulfilled" ? results[1].value : { data: {} };
        const occupancyRes =
          results[2].status === "fulfilled" ? results[2].value : { data: {} };
        const monthlyRevenueRes =
          results[3].status === "fulfilled" ? results[3].value : { data: {} };
        const occupancyTrendsRes =
          results[4].status === "fulfilled" ? results[4].value : { data: {} };
        const recentRes =
          results[5].status === "fulfilled" ? results[5].value : { data: {} };
        const bookingsRes =
          results[6].status === "fulfilled"
            ? results[6].value
            : { data: { data: [] } };

        // ---------- STATS ----------
        const totalBookings = totalBookingsRes.data?.totalBookings ?? 0;
        const todaysCheckIns = todaysCheckInsRes.data?.todaysCheckIns ?? 0;
        const occupiedRooms = occupancyRes.data?.occupiedRooms ?? 0;

        // Monthly Revenue logic
        const today = new Date();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const monthlyArr = monthlyRevenueRes.data?.data || [];
        const currentMonthObj = monthlyArr[currentMonthIndex];
        let currentMonthRevenue = currentMonthObj?.revenue || 0;

        // Fallback: derive from bookings for current month
        if (currentMonthRevenue === 0) {
          const startOfMonth = new Date(currentYear, currentMonthIndex, 1);
          const endOfMonth = new Date(
            currentYear,
            currentMonthIndex + 1,
            0,
            23,
            59,
            59,
            999,
          );
          const list = Array.isArray(bookingsRes.data?.data)
            ? bookingsRes.data.data
            : [];
          currentMonthRevenue = list
            .filter(
              (b) =>
                b.paymentStatus === "paid" &&
                new Date(b.createdAt) >= startOfMonth &&
                new Date(b.createdAt) <= endOfMonth,
            )
            .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
        }

        const monthlyStatValue = formatINRShort(currentMonthRevenue);

        setStats([
          {
            label: "Total Bookings",
            value: totalBookings,
            icon: CalendarCheck2,
          },
          { label: "Today Check-ins", value: todaysCheckIns, icon: DoorOpen },
          { label: "Occupied Rooms", value: occupiedRooms, icon: BedDouble },
          {
            label: "Monthly Revenue",
            value: monthlyStatValue,
            icon: IndianRupee,
          },
        ]);

        // ---------- MONTHLY GRAPH ----------
        const monthlyData = monthlyRevenueRes.data?.data || [];
        if (monthlyData.length === 12) {
          const revK = monthlyData.map((m) =>
            Math.round((m.revenue || 0) / 1000),
          );
          setRevenue(revK);
        }

        // ---------- OCCUPANCY WEEK ----------
        const occData = occupancyTrendsRes.data?.data || [];

        if (occData.length === 7) {
          const max = Math.max(...occData.map((d) => d.count || 0)) || 1;

          const percents = occData.map((d) =>
            Math.round(((d.count || 0) / max) * 100),
          );

          setOccupancy(percents);

          const mondayFirstOrder = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const sortedOccData = mondayFirstOrder.map(
            (day) => occData.find((d) => d.day === day) || { day, count: 0 },
          );

          setBookingsTrend(sortedOccData.map((d) => d.count || 0));
          setBookingDays(sortedOccData.map((d) => d.day));
        }

        // ---------- RECENT ----------
        const activitiesRecent = (recentRes.data?.activities || []).map(
          (a, i) => ({
            id: `ACT-${i + 1}`,
            name: a.user,
            room: a.description,
            amount: a.amount ? formatINRShort(a.amount) : "--",
            status:
              a.type === "CHECK_IN"
                ? "Checked In"
                : a.type === "CHECK_OUT"
                  ? "Checked Out"
                  : "Confirmed",
          }),
        );

        if (activitiesRecent.length > 0) {
          setRecent(activitiesRecent);
        } else {
          const list = Array.isArray(bookingsRes.data?.data)
            ? bookingsRes.data.data
            : [];
          // const recentBookings = list
          //   .slice()
          //   .sort((a, b) => {
          //     const ta = new Date(
          //       a.createdAt || a.updatedAt || a.checkInDate,
          //     ).getTime();
          //     const tb = new Date(
          //       b.createdAt || b.updatedAt || b.checkInDate,
          //     ).getTime();
          //     return tb - ta;
          //   })
          //   .slice(0, 10)
          //   .map((b, i) => ({
          //     id: b.guestId || `BK-${i + 1}`,
          //     name: `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.trim(),
          //     room: `${b.room?.name || ""} · Room ${b.room?.roomNumber || ""}`.trim(),
          //     amount: formatINRShort(b.totalAmount || 0),
          //     status: b.bookingStatus || "confirmed",
          //   }));

          // 4 march 11.59 pm
          const recentBookings = list
            .slice()
            .sort((a, b) => {
              const ta = new Date(
                a.createdAt || a.updatedAt || a.checkInDate
              ).getTime();
              const tb = new Date(
                b.createdAt || b.updatedAt || b.checkInDate
              ).getTime();
              return tb - ta;
            })
            .slice(0, 10)
            .map((b) => {
              // Get room names properly from the rooms array
              let roomNames = "Room not specified";
              
              if (b.rooms && Array.isArray(b.rooms) && b.rooms.length > 0) {
                roomNames = b.rooms
                  .map(r => {
                    // Check if room data exists and has name
                    if (r.room && r.room.name) {
                      return r.room.roomNumber 
                        ? `${r.room.name} - Room ${r.room.roomNumber}`
                        : r.room.name;
                    }
                    return null;
                  })
                  .filter(name => name !== null)
                  .join(", ");
              }
              
              // If still no room names, try the old structure as fallback
              if (roomNames === "Room not specified" && b.room) {
                roomNames = b.room.roomNumber 
                  ? `${b.room.name || "Room"} - Room ${b.room.roomNumber}`
                  : b.room.name || "Room not specified";
              }

              return {
                id: b.guestId || b._id || "N/A",
                name: `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.trim() || "Guest",
                room: roomNames,
                amount: formatINRShort(b.totalAmount || 0),
                status: b.bookingStatus === "confirmed" ? "Confirmed" : b.bookingStatus || "Pending",
              };
            });
          setRecent(recentBookings);
        }

        // ---------- HIGHLIGHTS ----------
        const guestsToday = todaysCheckInsRes.data?.todaysCheckIns ?? 0;
        const occVal = occupancyRes.data?.occupancy ?? 0;
        const conversionRateValue =
          typeof occVal === "number" ? `${occVal}%` : "0%";
        const bookingsList = Array.isArray(bookingsRes.data?.data)
          ? bookingsRes.data.data
          : [];
        const todayHL = new Date();
        const startOfMonthHL = new Date(
          todayHL.getFullYear(),
          todayHL.getMonth(),
          1,
        );
        const endOfMonthHL = new Date(
          todayHL.getFullYear(),
          todayHL.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        const stayDurations = bookingsList
          .filter((b) => b.checkInDate && b.checkOutDate)
          .filter(
            (b) =>
              b.bookingStatus === "confirmed" && b.paymentStatus === "paid",
          )
          .filter((b) => {
            const ci = new Date(b.checkInDate);
            const co = new Date(b.checkOutDate);
            return co >= startOfMonthHL && ci <= endOfMonthHL;
          })
          .map((b) => {
            const ci = new Date(b.checkInDate);
            const co = new Date(b.checkOutDate);
            const start = ci < startOfMonthHL ? startOfMonthHL : ci;
            const end = co > endOfMonthHL ? endOfMonthHL : co;
            const diffMs = end.getTime() - start.getTime();
            const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return Math.max(1, nights);
          });
        const avgStay =
          stayDurations.length > 0
            ? Math.round(
                (stayDurations.reduce((sum, v) => sum + v, 0) /
                  stayDurations.length) *
                  10,
              ) / 10
            : 0;
        const avgStayLabel = `${avgStay} Nights`;

        setHighlightsState([
          { label: "Guests Today", value: guestsToday, icon: Users },
          { label: "Avg Stay", value: avgStayLabel, icon: Clock },
          {
            label: "Conversion Rate",
            value: conversionRateValue,
            icon: TrendingUp,
          },
        ]);

        // ---------- TOP ROOMS (Derived from Activity) ----------
        const activities = recentRes.data?.activities || [];
        // const activities = recentRes.data?.activities || [];
        if (activities.length > 0) {
          const roomStats = {};
          activities.forEach((a) => {
            const key = a.description || "";
            if (!key) return;
            if (!roomStats[key]) {
              roomStats[key] = { count: 0, revenue: 0 };
            }
            roomStats[key].count += 1;
            if (a.amount) {
              roomStats[key].revenue += a.amount;
            }
          });
          const sortedRooms = Object.entries(roomStats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 4)
            .map(([name, stat]) => {
              const occ = Math.min(100, stat.count * 10 + 50);
              return {
                name,
                occ,
                rev: stat.revenue ? formatINRShort(stat.revenue) : "₹ 0",
              };
            });
          setTopRoomsState(sortedRooms);
        } else {
          const list = Array.isArray(bookingsRes.data?.data)
            ? bookingsRes.data.data
            : [];
          const today = new Date();
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
          );
          const endOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          const stats = {};
          list
            .filter((b) => b.bookingStatus === "confirmed")
            .forEach((b) => {
              const name =
                `${b.room?.name || ""} (${b.room?.roomNumber || ""})`.trim();
              if (!name) return;
              if (!stats[name]) {
                stats[name] = { count: 0, revenue: 0, nightsInMonth: 0 };
              }
              stats[name].count += 1;
              if (b.paymentStatus === "paid") {
                stats[name].revenue += Number(b.totalAmount || 0);
              }
              if (b.checkInDate && b.checkOutDate) {
                const ci = new Date(b.checkInDate);
                const co = new Date(b.checkOutDate);
                const start = ci < startOfMonth ? startOfMonth : ci;
                const end = co > endOfMonth ? endOfMonth : co;
                const diffMs = Math.max(0, end.getTime() - start.getTime());
                const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                stats[name].nightsInMonth += Math.max(0, nights);
              }
            });
          const daysInMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
          ).getDate();
          const sorted = Object.entries(stats)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 4)
            .map(([name, stat]) => {
              const occ = Math.min(
                100,
                Math.round((stat.nightsInMonth / daysInMonth) * 100),
              );
              return {
                name,
                occ,
                rev: stat.revenue ? formatINRShort(stat.revenue) : "₹ 0",
              };
            });
          setTopRoomsState(sorted);
        }
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 0.05} />
        ))}
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ================= REVENUE ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 overflow-hidden">
          <Header
            title="Total & Monthly Revenue"
            subtitle={`FY ${new Date().getFullYear()}`}
          />

          {/* MOBILE SCROLL WRAPPER */}
          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
            <div className="min-w-[520px] sm:min-w-0">
              <div className="flex items-end gap-4 sm:gap-3 h-32 sm:h-44">
                {revenue.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-end h-full w-[34px] sm:flex-1 sm:w-auto shrink-0"
                  >
                    <span className="text-[10px] sm:text-[11px] text-gray-600 font-semibold mb-1 sm:mb-2">
                      ₹{v}K
                    </span>

                    <Motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(v / maxRevenue) * 100}%` }}
                      transition={{
                        ...springChart,
                        delay: i * 0.04,
                      }}
                      className="w-full sm:w-[30px] rounded-xl bg-gradient-to-t from-primary to-accent/60 shadow-sm"
                    />
                  </div>
                ))}
              </div>

              {/* MONTH LABELS */}
              <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-400 mt-2 sm:mt-3">
                {[
                  "J",
                  "F",
                  "M",
                  "A",
                  "M",
                  "J",
                  "J",
                  "A",
                  "S",
                  "O",
                  "N",
                  "D",
                ].map((m, i) => (
                  <span
                    key={i}
                    className="w-[34px] sm:flex-1 text-center shrink-0"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= OCCUPANCY ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <Header title="Available vs Occupied Rooms" subtitle="This Week" />

          <div className="space-y-4">
            {occupancy.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="w-14 text-xs text-gray-500">Day {i + 1}</div>

                <div className="flex-1 max-w-[220px] sm:max-w-none mx-auto h-3 bg-gray-100 rounded overflow-hidden">
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v}%` }}
                    transition={springChart}
                    className="h-full bg-gradient-to-r from-primary/60 to-accent/60 rounded-2xl"
                  />
                </div>

                <div className="w-10 text-xs text-gray-500 text-right">
                  {v}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= HIGHLIGHTS ================= */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <Header title="Highlights" subtitle="Today" />

          {/* RESPONSIVE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlightsState.map((h, i) => (
              <Motion.div
                key={h.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...springCard,
                  delay: i * 0.05,
                }}
                className="rounded-2xl p-4 border bg-primary/5 flex items-center gap-3 min-w-0"
              >
                <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <h.icon size={18} />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 truncate">
                    {h.label}
                  </div>
                  <div className="text-lg font-semibold text-primary truncate ">
                    {h.value}
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>

          {/* BOOKINGS TREND */}
          <div className="mt-6">
            <Header title="Booking Trends" subtitle="Days" />

            <div className="flex items-end gap-2 h-28 sm:h-32 overflow-hidden">
              {bookingsTrend.map((v, i) => (
                <Motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(v / maxBookings) * 100}%` }}
                  transition={{
                    ...springChart,
                    delay: i * 0.025,
                  }}
                  className="flex-1 bg-accent/40 rounded-lg border"
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              {bookingDays.map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* TOP ROOMS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <Header title="Top Performing Rooms" subtitle="Month" />

          <div className="space-y-4">
            {topRoomsState.map((r, i) => (
              <div key={r.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="text-primary font-semibold">{r.rev}</span>
                </div>

                <div className="h-2 bg-gray-100 rounded">
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.occ}%` }}
                    transition={springChart}
                    className="h-2 bg-gradient-to-r from-primary/60 to-accent/60 rounded-2xl"
                  />
                </div>

                <div className="text-[11px] text-gray-500">
                  Occupancy {r.occ}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RECENT BOOKINGS ================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <Header title="Recent Bookings" subtitle="Live" />

        {/* DESKTOP */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="min-w-[640px] grid grid-cols-5 text-xs uppercase tracking-widest text-gray-500 border-b pb-2 place-items-center">
            <div>ID</div>
            <div>Guest</div>
            <div>Room</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {recent.map((b, i) => (
            <Motion.div
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="min-w-[640px] grid grid-cols-5 py-2 text-sm place-items-center text-center"
            >
              <div className="text-primary">{b.id}</div>
              <div>{b.name}</div>
              <div className="truncate max-w-[140px]">{b.room}</div>
              <div className="text-accent font-semibold">{b.amount}</div>

              <div
                className={`rounded-2xl w-28 flex items-center justify-center
      ${
        b.status === "Checked In"
          ? "text-green-600 bg-green-200"
          : b.status === "Confirmed"
            ? "text-blue-600 bg-blue-100"
            : "text-gray-600 bg-gray-200"
      }`}
              >
                {b.status}
              </div>
            </Motion.div>
          ))}
        </div>

        {/* MOBILE */}
        <div className="sm:hidden space-y-3">
          {recent.map((b, i) => (
            <Motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...springCard,
                delay: i * 0.05,
              }}
              className="p-3 border rounded-xl bg-gray-50 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">{b.name}</div>
                  <div className="text-xs text-primary">{b.id}</div>
                </div>

                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    b.status === "Checked In"
                      ? "bg-green-100 text-green-700"
                      : b.status === "Confirmed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {b.status}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm gap-3">
                <div className="text-gray-600 truncate flex-1 min-w-0">
                  {b.room}
                </div>
                <div className="font-bold text-accent whitespace-nowrap">
                  {b.amount}
                </div>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

const StatCard = memo(({ label, value, icon, delay }) => (
  <Motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      type: "spring",
      stiffness: 70,
      damping: 18,
      delay,
    }}
    className="bg-white rounded-2xl p-4 sm:p-5 flex items-center gap-3 shadow-sm"
  >
    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
      {React.createElement(icon, { size: 20 })}
    </div>

    <div>
      <div className="text-[10px] uppercase tracking-widest text-gray-500">
        {label}
      </div>
      <div className="text-xl font-semibold text-primary">{value}</div>
    </div>
  </Motion.div>
));

const Header = ({ title, subtitle }) => (
  <div className="flex justify-between mb-4">
    <div className="text-xs font-bold uppercase tracking-widest text-gray-600">
      {title}
    </div>
    <div className="text-[10px] text-gray-500">{subtitle}</div>
  </div>
);
