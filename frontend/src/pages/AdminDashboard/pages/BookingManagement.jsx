import React, { useState, useMemo, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { CalendarCheck2, Search, Loader2, Ban } from "lucide-react";
import api from "../../axios"; // Path updated to fix resolution error

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  // 4 march
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 1. DATA LINKING: Fetching Bookings from Backend
  useEffect(() => {
    fetchBookings();
  }, []);

  // 4 march
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/bookings");
      if (res.data.success) {
        setBookings(res.data.data);
        setCurrentPage(1); // 4 march
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. CONTROLLER LINK: cancelOfflineBooking

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = bookings
      .filter((b) => {
        const guestName = `${b.user?.firstName || ""} ${b.user?.lastName || ""}`
          .trim()
          .toLowerCase();
        return (
          guestName.includes(q) || (b.guestId || "").toLowerCase().includes(q)
        );
      })
      .filter((b) =>
        statusFilter === "All"
          ? true
          : b.paymentStatus === statusFilter.toLowerCase(),
      );

    return filtered.sort((a, b) => {
      const ta = new Date(
        a.createdAt || a.updatedAt || a.checkInDate,
      ).getTime();
      const tb = new Date(
        b.createdAt || b.updatedAt || b.checkInDate,
      ).getTime();
      return tb - ta; // recent first
    });
  }, [bookings, search, statusFilter]);

  // 4 march
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / ITEMS_PER_PAGE),
  );

  const paginatedBookings = useMemo(
    () =>
      filteredBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [filteredBookings, currentPage],
  );

  const statusBadgeClass = (status) => {
    if (status === "paid")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "pending")
      return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* HEADER: New Booking Button Removed */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CalendarCheck2 />
          <div className="text-sm font-bold uppercase tracking-widest text-gray-600">
            Booking Management
          </div>
          <div className="h-[1px] w-8 bg-accent" />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 border border-gray-300 rounded-2xl px-3 py-2">
            <Search size={16} className="text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest..."
              className="flex-1 text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-2xl px-3 py-2"
          >
            <option>All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* TABLE DATA LINKED TO CONTROLLERS */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full border-t border-gray-200">
              <thead className="bg-primary/5">
                <tr>
                  <th className="text-left text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Guest
                  </th>
                  <th className="text-left text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Room
                  </th>
                  <th className="text-left text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Payment
                  </th>
                  <th className="text-left text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs uppercase tracking-widest text-gray-500 px-4 py-3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b) => (
                  <tr
                    key={b._id}
                    className="border-t border-gray-200 hover:bg-gray-50/50"
                  >
                    {/* Guest */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold">
                        {b.user?.firstName} {b.user?.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {b.guestId}
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3 text-sm">
                      {b.rooms && b.rooms.length > 0 
                        ? b.rooms.map(r => 
                            `${r.room?.name || 'Room'} ${r.room?.roomNumber ? `- ${r.room.roomNumber}` : ''}`
                          ).join(", ")
                        : "—"}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-sm">
                      {new Date(b.checkInDate).toLocaleDateString()}
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-1 border rounded-2xl ${statusBadgeClass(b.paymentStatus)}`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>

                    {/* 🔥 Status (YAHI missing tha) */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-1 border rounded-2xl bg-blue-100 text-blue-700 border-blue-200">
                        {b.bookingStatus}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-bold text-accent">
                      ₹ {b.totalAmount}
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bookings found</div>
          ) : (
            <div className="p-3 space-y-3">
              {paginatedBookings.map((b) => (
                <div key={b._id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-800">
                        {b.user?.firstName} {b.user?.lastName}
                      </div>
                      <div className="text-[10px] text-primary font-bold uppercase tracking-widest">
                        {b.guestId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent text-sm">₹ {b.totalAmount}</div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400">Room</div>
                      <div className="text-sm text-gray-700">
                        {b.rooms && b.rooms.length > 0 
                          ? b.rooms.map(r => 
                              `${r.room?.name || 'Room'} ${r.room?.roomNumber ? `- ${r.room.roomNumber}` : ''}`
                            ).join(", ")
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400">Date</div>
                      <div className="text-sm text-gray-700">
                        {new Date(b.checkInDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400">Payment</div>
                      <span className={`inline-block text-[11px] px-2 py-1 border rounded-2xl ${statusBadgeClass(b.paymentStatus)}`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-400">Status</div>
                      <span className="inline-block text-[11px] px-2 py-1 border rounded-2xl bg-blue-100 text-blue-700 border-blue-200">
                        {b.bookingStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 4 march */}
        {/* Pagination */}
        {!loading && filteredBookings.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
            
            <span>
              Page {currentPage} of {totalPages} • {filteredBookings.length} bookings
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold uppercase tracking-widest ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold uppercase tracking-widest ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>

          </div>
        )}
      </div>
    </Motion.div>
  );
}