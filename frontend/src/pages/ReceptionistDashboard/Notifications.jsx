import React, { useState, useEffect } from "react";
import {
  Bell,
  Trash2,
  Check,
  AlertTriangle,
  CheckCircle,
  Info,
  Search,
} from "lucide-react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= AXIOS INSTANCE ================= */
  const API = axios.create({
    baseURL: "/api",
  });

  // const API = axios.create({
  //   baseURL: "http://localhost:5001/api",
  // });

  API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  /* ================= FETCH NOTIFICATIONS ================= */
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notification");
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15 sec polling

    return () => clearInterval(interval);
  }, []);

  /* ================= MARK SINGLE READ ================= */
  const markAsRead = async (id) => {
    try {
      const res = await API.patch(`/notification/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
      }
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  /* ================= MARK ALL READ ================= */
  const markAllRead = async () => {
    try {
      const res = await API.patch("/notification/read-all");
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  /* ================= DELETE (CLIENT SIDE SAFE) ================= */
  const deleteNotification = async (id) => {
    try {
      const res = await API.delete(`/notification/${id}`);
      if (res.status === 200) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  /* ================= FILTER ================= */
  const filteredNotifications = notifications.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Sidebar>
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-2">
              Notifications
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage your recent alerts and updates.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto md:min-w-[250px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all shadow-sm text-sm"
              />
            </div>

            <button
              onClick={markAllRead}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-lg shadow-slate-900/10 active:scale-95 whitespace-nowrap"
            >
              <Check className="w-4 h-4" /> Mark all as read
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">
              Loading alerts...
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <div
                key={n._id}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  n.isRead
                    ? "bg-white/50 border-slate-100 opacity-75"
                    : "bg-white border-blue-100 shadow-sm ring-1 ring-blue-50/50"
                }`}
              >
                {/* ICON */}
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    n.title.toLowerCase().includes("urgent") ||
                    n.title.toLowerCase().includes("cancel")
                      ? "bg-red-50 text-red-500"
                      : n.title.toLowerCase().includes("payment")
                        ? "bg-green-50 text-green-500"
                        : "bg-blue-50 text-blue-500"
                  }`}
                >
                  {n.title.toLowerCase().includes("urgent") ? (
                    <AlertTriangle size={20} />
                  ) : n.title.toLowerCase().includes("payment") ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`font-bold truncate ${
                        n.isRead ? "text-slate-600" : "text-slate-900"
                      }`}
                    >
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {n.createdAt
                        ? formatDistanceToNow(new Date(n.createdAt)) + " ago"
                        : "Recently"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex gap-4 mt-4">
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="text-xs font-bold text-rose-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {!n.isRead && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold">
                No notifications found
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Try searching for something else or check back later.
              </p>
            </div>
          )}
        </div>
        <div className="h-40 md:hidden shrink-0"></div>
      </div>
    </Sidebar>
  );
}
