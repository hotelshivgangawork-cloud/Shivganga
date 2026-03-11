// import React, { useState, useEffect } from "react";
// import { Outlet, Link, useLocation } from "react-router-dom";
// import { BadgePercent } from "lucide-react"; // top imports me add

// import {
//   Menu,
//   Bell,
//   Search,
//   UserRound,
//   LogOut,
//   Gauge,
//   BedDouble,
//   CalendarCheck2,
//   Users,
//   IndianRupee,
//   ArrowLeft,
//   ArrowRight,
//   X,
//   Settings,
//   Images,
// } from "lucide-react";
// import { AnimatePresence, motion as Motion } from "framer-motion";
// import logo from "../../assets/logo1.webp";
// import { motion } from "framer-motion";
// import api from "../axios";

// export default function AdminLayout() {
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const location = useLocation();
//   const [open, setOpen] = useState(false);
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [notifications, setNotifications] = useState([]);
//   const [detail, setDetail] = useState(null);

//   useEffect(() => {
//     const t = setTimeout(() => {
//       setProfileOpen(false);
//       setMobileOpen(false);
//     }, 0);
//     return () => clearTimeout(t);
//   }, [location.pathname]);

//   const toRelative = (dateStr) => {
//     const now = Date.now();
//     const then = new Date(dateStr).getTime();
//     const diff = Math.max(0, Math.floor((now - then) / 1000));
//     if (diff < 60) return `${diff}s`;
//     const m = Math.floor(diff / 60);
//     if (m < 60) return `${m}m`;
//     const h = Math.floor(m / 60);
//     if (h < 24) return `${h}h`;
//     const d = Math.floor(h / 24);
//     return `${d}d`;
//   };

//   const mapNotification = (n) => {
//     const booking = n.booking || {};
//     const room = booking.room || {};
//     const guest = n.guest || booking.user || {};

//     const title = n.title || "Notification";
//     const lower = title.toLowerCase();

//     let type = "booking";
//     let status = "info";

//     if (lower.includes("payment")) {
//       type = "payment";
//       status = "success";
//     } else if (lower.includes("checked in") || lower.includes("checked out")) {
//       type = "booking";
//       status = "success";
//     } else if (lower.includes("cancel")) {
//       type = "booking";
//       status = "warning";
//     }

//     const msg = n.message || "";
//     const m = msg.match(/Guest:\s*(.+)/);
//     const msgName = m ? m[1].split("\n")[0].trim() : "";

//     const roomName = room.name || "";
//     const roomNumber = room.roomNumber || "N/A";
//     const roomLine =
//       roomName && String(roomName) !== String(roomNumber)
//         ? `Room: ${roomName} (${roomNumber})`
//         : `Room: ${roomNumber}`;

//     const fullName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
//     const guestName =
//       fullName && fullName !== ""
//         ? fullName
//         : guest.name || "" || msgName || "N/A";

//     const formattedDesc = `
// ${roomLine}
// Guest: ${guestName}

// Status: ${booking.bookingStatus || "N/A"}
// Payment: ${booking.paymentStatus || "N/A"}
// Paid: ₹${booking.paidAmount || 0} / ₹${booking.totalAmount || 0}
// Remaining: ₹${booking.pendingAmount || 0}
// `.trim();

//     return {
//       type,
//       title: n.title,
//       desc: formattedDesc,
//       time: toRelative(n.createdAt),
//       status,
//       unread: !n.isRead,
//       id: n._id || n.id,
//       bookingId: n.booking,
//     };
//   };

//   useEffect(() => {
//     let timer;
//     const token = localStorage.getItem("token");
//     const headers = token ? { Authorization: `Bearer ${token}` } : {};

//     const fetchNotifications = async () => {
//       try {
//         const { data } = await api.get("/notification", { headers });
//         const list = (data?.data || []).map(mapNotification);
//         setNotifications(list);
//       } catch (error) {
//         console.error("Failed to fetch notifications:", error);
//       }
//     };

//     fetchNotifications();
//     timer = setInterval(fetchNotifications, 15000);
//     return () => clearInterval(timer);
//   }, []);

//   const deleteNotification = async (id) => {
//     try {
//       const token = localStorage.getItem("token");
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};
//       await api.delete(`/notification/${id}`, { headers });
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//       if (detail && detail.id === id) setDetail(null);
//     } catch (error) {
//       console.error("Failed to delete notification:", error);
//     }
//   };

//   const navItems = [
//     { to: "/admin", label: "Dashboard", exact: true, icon: Gauge },
//     { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
//     { to: "/admin/gallery", label: "Gallery Management", icon: Images },
//     { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck2 },
//     { to: "/admin/guest-management", label: "Guest Directory", icon: Users },
//     { to: "/admin/receptionists", label: "Receptionists", icon: Users },

//     /* 🔥 NEW MEMBERSHIP TAB */
//     {
//       to: "/admin/memberships",
//       label: "Memberships",
//       icon: BadgePercent,
//     },
//     {
//       to: "/admin/coupons",
//       label: "Coupons",
//       icon: BadgePercent,
//     },
//     {
//       to: "/admin/salary-reports",
//       label: "Staff Salary Management",
//       icon: IndianRupee,
//     },
//     {
//       to: "/admin/system-settings",
//       label: "System Settings",
//       icon: Settings,
//     },
//     {
//       to: "/admin/mail-settings",
//       label: "Mail Settings",
//       icon: Settings,
//     },
//   ];

//   const isActive = (to, exact = false) =>
//     exact ? location.pathname === to : location.pathname.startsWith(to);

//   const currentDate = new Date().getFullYear();

//   const rowVariant = {
//     hidden: { opacity: 0, y: 10 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.3, ease: "easeOut" },
//     },
//   };

//   const modalBackdrop = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1 },
//   };

//   const modalBox = {
//     hidden: { scale: 0.92, opacity: 0 },
//     visible: {
//       scale: 1,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 220, damping: 18 },
//     },
//   };

//   return (
//     <div className="relative h-screen max-w-[100vw] overflow-hidden bg-gray-50 text-gray-800">
//       <div className="flex h-full min-w-0">
//         {/* ================= SIDEBAR (NO SCROLL) ================= */}
//         <aside
//           className={`bg-gradient-to-t from-primary via-primary/80 to-accent/40 text-primary transition-all duration-300 ${
//             collapsed ? "w-16" : "w-64"
//           } hidden lg:flex flex-col border-r-2 border-accent`}
//         >
//           {/* TOP */}
//           <div className="flex items-center justify-between p-4">
//             {!collapsed && (
//               <span className="font-bold text-lg w-full flex items-center justify-center">
//                 <img src={logo} alt="logo" className="h-30 aspect-square rounded-2xl" />
//               </span>
//             )}
//             <button
//               onClick={() => setCollapsed(!collapsed)}
//               className="p-2 rounded-xl bg-white/10 hover:bg-primary/20 transition"
//             >
//               {!collapsed ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
//             </button>
//           </div>

//           {/* NAV (NO SCROLL) */}
//           <nav className="px-2 space-y-1 flex-1">
//             {navItems.map((item) => (
//               <Link
//                 key={item.to}
//                 to={item.to}
//                 title={item.label}
//                 className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition relative ${
//                   isActive(item.to, item.exact)
//                     ? "bg-primary/60"
//                     : "hover:bg-primary/20"
//                 }`}
//               >
//                 <div
//                   className={`absolute left-0 top-0 h-full w-1 ${
//                     isActive(item.to, item.exact)
//                       ? "bg-primary"
//                       : "bg-transparent"
//                   } rounded-r`}
//                 />
//                 <item.icon
//                   size={18}
//                   className={
//                     isActive(item.to, item.exact)
//                       ? "text-white"
//                       : "text-white/70"
//                   }
//                 />
//                 {!collapsed && (
//                   <span
//                     className={`${
//                       isActive(item.to, item.exact)
//                         ? "text-white font-semibold"
//                         : "text-white/90"
//                     }`}
//                   >
//                     {item.label}
//                   </span>
//                 )}
//               </Link>
//             ))}
//           </nav>

//           {/* FOOTER */}
//           <div className="relative z-10 p-4 border-t border-white/10 text-[11px] text-white/60 leading-relaxed">
//             <p>
//               ©{currentDate}
//               {!collapsed && (
//                 <>
//                   <br />
//                   <span className="tracking-wide">
//                     Shiv Ganga Hotel. All Rights Reserved.
//                   </span>
//                 </>
//               )}
//             </p>
//           </div>
//         </aside>

//         {/* ================= MAIN AREA ================= */}
//         <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-50">
//           {/* HEADER */}
//           <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
//               {/* LEFT */}
//               <div className="flex items-center gap-3 flex-1 min-w-[200px]">
//                 <button
//                   onClick={() => setMobileOpen(true)}
//                   className="lg:hidden p-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-all"
//                 >
//                   <Menu size={18} />
//                 </button>

//                 {/* SEARCH */}
//                 {/* <div className="relative flex-1 max-w-[420px] transition-all">
//                   <Search
//                     size={16}
//                     className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//                   />
//                   <input
//                     placeholder="Search..."
//                     className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border
//                 focus:outline-none focus:ring-2 focus:ring-primary/40
//                 transition-all"
//                   />
//                 </div> */}
//                  <div>
//                   <h1 className="text-xl font-bold text-primary">
//                     Admin Dashboard
//                   </h1>
//                 </div>

//               </div>

//               {/* RIGHT */}
//               <div className="flex items-center gap-3">
//                 {/* NOTIFICATION */}
//                 <button
//                   onClick={() => setOpen((v) => !v)}
//                   className="p-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-all relative"
//                 >
//                   <Bell size={18} />
//                   {notifications.some((n) => n.unread) && (
//                     <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//                   )}
//                 </button>
//                 <AnimatePresence>
//                   {open && (
//                     <Motion.div
//                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
//                       animate={{ opacity: 1, y: 0, scale: 1 }}
//                       exit={{ opacity: 0, y: 10, scale: 0.98 }}
//                       transition={{ duration: 0.2 }}
//                       className="absolute right-2 sm:right-4 top-[64px] w-[calc(100vw-1rem)] max-w-[360px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-40"
//                     >
//                       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
//                         <div className="flex items-center gap-2">
//                           <span className="text-sm font-semibold text-primary">
//                             Notifications
//                           </span>
//                           <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
//                             {notifications.length}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <button
//                             className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
//                             onClick={async () => {
//                               try {
//                                 const token = localStorage.getItem("token");
//                                 const headers = token
//                                   ? { Authorization: `Bearer ${token}` }
//                                   : {};
//                                 await api.patch(
//                                   "/notification/read-all",
//                                   null,
//                                   {
//                                     headers,
//                                   },
//                                 );
//                               } catch {}
//                               setNotifications((prev) =>
//                                 prev.map((n) => ({ ...n, unread: false })),
//                               );
//                             }}
//                           >
//                             Mark all read
//                           </button>
//                           <button
//                             className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
//                             onClick={() => setOpen(false)}
//                           >
//                             <X size={16} />
//                           </button>
//                         </div>
//                       </div>
//                       <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-gray-300">
//                         {[
//                           { id: "all", label: "All" },
//                           { id: "booking", label: "Bookings" },
//                           { id: "payment", label: "Payments" },
//                           { id: "salary", label: "Staff Salary" },
//                         ].map((f) => (
//                           <button
//                             key={f.id}
//                             onClick={() => setActiveFilter(f.id)}
//                             className={`text-[11px] px-3 py-1 rounded-full transition ${
//                               activeFilter === f.id
//                                 ? "bg-primary text-white"
//                                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                             }`}
//                           >
//                             {f.label}
//                           </button>
//                         ))}
//                       </div>
//                       <div className="max-h-[360px] overflow-auto">
//                         {notifications
//                           .filter(
//                             (n) =>
//                               activeFilter === "all" || n.type === activeFilter,
//                           )
//                           .map((n) => {
//                             const tone =
//                               n.status === "success"
//                                 ? "bg-green-50 text-green-700 border-green-100"
//                                 : n.status === "warning"
//                                   ? "bg-yellow-50 text-yellow-700 border-yellow-100"
//                                   : "bg-blue-50 text-blue-700 border-blue-100";
//                             const IconComp =
//                               n.type === "booking"
//                                 ? CalendarCheck2
//                                 : n.type === "payment"
//                                   ? IndianRupee
//                                   : Users;
//                             return (
//                               <Motion.div
//                                 key={n.id}
//                                 variants={rowVariant}
//                                 initial="hidden"
//                                 animate="visible"
//                                 className={`flex items-start gap-3 px-4 py-3 border-b border-gray-300 hover:bg-gray-50 transition cursor-pointer`}
//                                 onClick={() => setDetail(n)}
//                               >
//                                 <div
//                                   className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tone}`}
//                                 >
//                                   <IconComp size={16} />
//                                 </div>
//                                 <div className="flex-1 min-w-0">
//                                   <div className="flex items-center gap-2">
//                                     <span
//                                       className={`text-sm text-primary truncate ${n.unread ? "font-extrabold" : "font-light"}`}
//                                     >
//                                       {n.title}
//                                     </span>
//                                     {n.unread && (
//                                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
//                                         New
//                                       </span>
//                                     )}
//                                   </div>
//                                   <div
//                                     className={`text-[12px] mt-0.5 truncate ${n.unread ? "text-gray-800 font-medium" : "text-gray-600"}`}
//                                   >
//                                     {n.desc}
//                                   </div>
//                                   <div className="text-[11px] text-gray-400 mt-1">
//                                     {n.time}
//                                   </div>
//                                 </div>
//                               </Motion.div>
//                             );
//                           })}
//                       </div>
//                       <div className="px-4 py-3 flex items-center justify-between">
//                         <span className="text-[11px] text-gray-500">
//                           Showing{" "}
//                           {
//                             notifications.filter(
//                               (n) =>
//                                 activeFilter === "all" ||
//                                 n.type === activeFilter,
//                             ).length
//                           }{" "}
//                           of {notifications.length}
//                         </span>
//                       </div>
//                     </Motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* PROFILE */}
//                 <div className="relative">
//                   <button
//                     onClick={() => setProfileOpen(!profileOpen)}
//                     className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white
//                 hover:bg-primary/90 transition-all"
//                   >
//                     <UserRound size={18} />
//                     <span className="hidden sm:block text-xs font-medium">
//                       Admin
//                     </span>
//                   </button>

//                   {/* DROPDOWN */}
//                   <AnimatePresence>
//                     {profileOpen && (
//                       <Motion.div
//                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
//                         transition={{ duration: 0.2 }}
//                         className="absolute right-0 mt-2 w-44 bg-white rounded-xl border shadow-lg overflow-hidden"
//                       >
//                         <Link
//                           to="/"
//                           className="flex items-center gap-2 px-4 py-3 text-sm
//                       hover:bg-gray-100 transition-colors"
//                         >
//                           <LogOut size={16} />
//                           Logout
//                         </Link>
//                       </Motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>
//           </header>

//           {/* CONTENT */}
//           <Motion.main
//             key={location.pathname}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3, ease: "easeOut" }}
//             className="flex-1 min-w-0 overflow-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin"
//           >
//             <Outlet />
//           </Motion.main>
//         </div>
//       </div>

//       {/* phone view */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <Motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 lg:hidden"
//           >
//             {/* BACKDROP */}
//             <Motion.div
//               onClick={() => setMobileOpen(false)}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 0.5 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               className="absolute inset-0 bg-white/50 "
//             />

//             {/* DRAWER */}
//             <div className="bg-white absolute left-0 top-0 h-full w-64">
//               <Motion.div
//                 initial={{ x: -260 }}
//                 animate={{ x: 0 }}
//                 exit={{ x: -260 }}
//                 transition={{ type: "spring", stiffness: 240, damping: 28 }}
//                 className="absolute left-0 top-0 h-full w-64
//         bg-gradient-to-t from-primary via-primary/80 to-accent/40
//         text-white border-r border-accent shadow-xl flex flex-col"
//               >
//                 {/* HEADER */}
//                 <div className="flex items-center justify-between p-4">
//                 <span className="font-bold text-lg w-full flex items-center justify-center">
//                 <img src={logo} alt="logo" className="h-30 aspect-square rounded-2xl" />
//               </span>
//                   <button
//                     onClick={() => setMobileOpen(false)}
//                     className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-primary"
//                   >
//                     <X size={18} />
//                   </button>
//                 </div>

//                 {/* NAV */}
//                 <nav className="px-2 space-y-1 flex-1">
//                   {navItems.map((item) => {
//                     const active = isActive(item.to, item.exact);

//                     return (
//                       <Link
//                         key={item.to}
//                         to={item.to}
//                         className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
//                 ${active ? "bg-primary/60" : "hover:bg-primary/20"}`}
//                       >
//                         <span
//                           className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
//                   ${active ? "bg-primary" : "bg-transparent"}`}
//                         />
//                         <item.icon
//                           size={18}
//                           className={active ? "text-white" : "text-white/70"}
//                         />
//                         <span
//                           className={
//                             active
//                               ? "text-white font-semibold"
//                               : "text-white/90"
//                           }
//                         >
//                           {item.label}
//                         </span>
//                       </Link>
//                     );
//                   })}
//                 </nav>
//                 {/* FOOTER */}
//                 <div className="relative z-10 p-4 border-t border-white/10 text-[11px] text-white/60 leading-relaxed">
//                   <p>
//                     ©{currentDate}
//                     <br />
//                     <span className="tracking-wide">
//                       Shiv Ganga Hotel. All Rights Reserved.
//                     </span>
//                   </p>
//                 </div>
//               </Motion.div>
//             </div>
//           </Motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {detail && (
//           <Motion.div
//             initial="hidden"
//             animate="visible"
//             exit="hidden"
//             variants={modalBackdrop}
//             className="fixed inset-0 z-50"
//           >
//             <Motion.div
//               onClick={() => {
//                 setNotifications((prev) =>
//                   prev.map((x) =>
//                     x.id === detail.id ? { ...x, unread: false } : x,
//                   ),
//                 );
//                 setDetail(null);
//               }}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 0.4 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black"
//             />
//             <Motion.div
//               variants={modalBox}
//               className="absolute top-6 inset-x-4 md:top-24 md:right-6 md:inset-x-auto w-[calc(100%-32px)] md:w-[440px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[75vh] md:max-h-[60vh]"
//             >
//               <div className="px-5 py-4 border-b flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
//                       detail.status === "success"
//                         ? "bg-green-50 text-green-700 border-green-100"
//                         : detail.status === "warning"
//                           ? "bg-yellow-50 text-yellow-700 border-yellow-100"
//                           : "bg-blue-50 text-blue-700 border-blue-100"
//                     }`}
//                   >
//                     {(detail.type === "booking" && (
//                       <CalendarCheck2 size={16} />
//                     )) ||
//                       (detail.type === "payment" && (
//                         <IndianRupee size={16} />
//                       )) ||
//                       (detail.type === "salary" && <Users size={16} />)}
//                   </div>
//                   <div>
//                     <div className="text-sm font-bold text-primary">
//                       {detail.title}
//                     </div>
//                     <div className="text-[11px] text-gray-500">
//                       {detail.time}
//                     </div>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setNotifications((prev) =>
//                       prev.map((x) =>
//                         x.id === detail.id ? { ...x, unread: false } : x,
//                       ),
//                     );
//                     setDetail(null);
//                   }}
//                   className="px-3 py-1 text-[11px] rounded-full bg-gray-200 text-primary hover:bg-primary/90 hover:text-white transition"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//               <div className="px-5 py-4 max-h-[calc(75vh-128px)] md:max-h-[calc(60vh-128px)] overflow-auto">
//                 <div
//                   className="text-sm text-gray-800 leading-relaxed"
//                   dangerouslySetInnerHTML={{
//                     __html: detail.desc
//                       .replace(/\n\n/g, "\n")
//                       .replace(/Room:/g, "<strong>Room:</strong>")
//                       .replace(/Guest:/g, "<strong>Guest:</strong>")
//                       .replace(/Status:/g, "<strong>Status:</strong>")
//                       .replace(/Payment:/g, "<strong>Payment:</strong>")
//                       .replace(/Paid:/g, "<strong>Paid:</strong>")
//                       .replace(/Remaining:/g, "<strong>Remaining:</strong>")
//                       .replace(/\n/g, "<br/>"),
//                   }}
//                 />

//                 <div className="mt-4 flex items-center gap-2 text-[11px]">
//                   <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
//                     {detail.type}
//                   </span>
//                   <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
//                     {detail.status}
//                   </span>
//                 </div>
//               </div>
//               <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
//                 <button
//                   onClick={() => deleteNotification(detail.id)}
//                   className="text-[11px] px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
//                 >
//                   Delete
//                 </button>
//                 <Link
//                   to={
//                     detail.type === "booking"
//                       ? "/admin/bookings"
//                       : detail.type === "payment"
//                         ? "/admin/bookings"
//                         : "/admin/salary-reports"
//                   }
//                   className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
//                   onClick={async () => {
//                     try {
//                       const token = localStorage.getItem("token");
//                       const headers = token
//                         ? { Authorization: `Bearer ${token}` }
//                         : {};
//                       await api.patch(`/notification/${detail.id}/read`, null, {
//                         headers,
//                       });
//                     } catch {}
//                     setNotifications((prev) =>
//                       prev.map((x) =>
//                         x.id === detail.id ? { ...x, unread: false } : x,
//                       ),
//                     );
//                     setDetail(null);
//                   }}
//                 >
//                   Open related section
//                 </Link>
//               </div>
//             </Motion.div>
//           </Motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { BadgePercent } from "lucide-react"; // top imports me add

import {
  Menu,
  Bell,
  Search,
  UserRound,
  LogOut,
  Gauge,
  BedDouble,
  CalendarCheck2,
  Users,
  IndianRupee,
  ArrowLeft,
  ArrowRight,
  X,
  Settings,
  Images,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import logo from "../../assets/logo1.webp";
import { motion } from "framer-motion";
import api from "../axios";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setProfileOpen(false);
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const toRelative = (dateStr) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `${diff}s`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

const mapNotification = (n) => {
  const booking = n.booking || {};
  // Fix: Handle rooms array properly
  const rooms = booking.rooms || [];
  const guest = n.guest || booking.user || {};

  const title = n.title || "Notification";
  const lower = title.toLowerCase();

  let type = "booking";
  let status = "info";

  if (lower.includes("payment")) {
    type = "payment";
    status = "success";
  } else if (lower.includes("checked in") || lower.includes("checked out")) {
    type = "booking";
    status = "success";
  } else if (lower.includes("cancel")) {
    type = "booking";
    status = "warning";
  }

  const msg = n.message || "";
  const m = msg.match(/Guest:\s*(.+)/);
  const msgName = m ? m[1].split("\n")[0].trim() : "";

  // Fix: Handle multiple rooms
  let roomLine = "Room: Not assigned";
  
  if (rooms.length > 0) {
    const roomNames = rooms.map((roomData, index) => {
      if (roomData.room && typeof roomData.room === 'object') {
        const roomName = roomData.room.name || "N/A";
        const roomNumber = roomData.room.roomNumber || "N/A";
        return `${roomName} (${roomNumber})`;
      } else if (roomData.room && typeof roomData.room === 'string') {
        return `Room ID: ${roomData.room.substring(0, 8)}`;
      }
      return "Unknown Room";
    });
    
    if (roomNames.length === 1) {
      roomLine = `Room: ${roomNames[0]}`;
    } else {
      roomLine = `Rooms: ${roomNames.join(', ')}`;
    }
  }

  const fullName = `${guest.firstName || ""} ${guest.lastName || ""}`.trim();
  const guestName =
    fullName && fullName !== ""
      ? fullName
      : guest.name || "" || msgName || "N/A";

  const formattedDesc = `
${roomLine}
Guest: ${guestName}

Status: ${booking.bookingStatus || "N/A"}
Payment: ${booking.paymentStatus || "N/A"}
Paid: ₹${booking.paidAmount || 0} / ₹${booking.totalAmount || 0}
Remaining: ₹${booking.pendingAmount || 0}
`.trim();

  return {
    type,
    title: n.title,
    desc: formattedDesc,
    time: toRelative(n.createdAt),
    status,
    unread: !n.isRead,
    id: n._id || n.id,
    bookingId: n.booking,
    rooms: rooms,
  };
};

useEffect(() => {
  let timer;
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notification", { headers });
      console.log("Raw notification data:", data); // Debug log
      const list = (data?.data || []).map(mapNotification);
      console.log("Mapped notifications:", list); // Debug log
      setNotifications(list);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  fetchNotifications();
  timer = setInterval(fetchNotifications, 15000);
  return () => clearInterval(timer);
}, []);

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/notification/${id}`, { headers });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (detail && detail.id === id) setDetail(null);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const navItems = [
    { to: "/admin", label: "Dashboard", exact: true, icon: Gauge },
    { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
    { to: "/admin/gallery", label: "Gallery Management", icon: Images },
    { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck2 },
    { to: "/admin/guest-management", label: "Guest Directory", icon: Users },

    /* 🔥 NEW MEMBERSHIP TAB */
    {
      to: "/admin/memberships",
      label: "Memberships",
      icon: BadgePercent,
    },
    {
      to: "/admin/coupons",
      label: "Coupons",
      icon: BadgePercent,
    },
    { to: "/admin/receptionists", label: "Staff", icon: Users },
    {
      to: "/admin/salary-reports",
      label: "Staff Salary Management",
      icon: IndianRupee,
    },
    {
      to: "/admin/system-settings",
      label: "System Settings",
      icon: Settings,
    },
    {
      to: "/admin/mail-settings",
      label: "Mail Settings",
      icon: Settings,
    },
  ];

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const currentDate = new Date().getFullYear();

  const rowVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalBox = {
    hidden: { scale: 0.92, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 220, damping: 18 },
    },
  };

  return (
    <div className="relative h-screen max-w-[100vw] overflow-hidden bg-gray-50 text-gray-800">
      <div className="flex h-full min-w-0">
        {/* ================= SIDEBAR (NO SCROLL) ================= */}
        <aside
          className={`bg-gradient-to-t from-primary via-primary/80 to-accent/40 text-primary transition-all duration-300 ${
            collapsed ? "w-16" : "w-64"
          } hidden lg:flex flex-col border-r-2 border-accent`}
        >
          {/* TOP */}
          <div className="flex items-center justify-between p-4">
            {!collapsed && (
              <span className="font-bold text-lg w-full flex items-center justify-center">
                <img src={logo} alt="logo" className="h-30 aspect-square rounded-2xl" />
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl bg-white/10 hover:bg-primary/20 transition"
            >
              {!collapsed ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </button>
          </div>

          {/* NAV (NO SCROLL) */}
          <nav className="px-2 space-y-1 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition relative ${
                  isActive(item.to, item.exact)
                    ? "bg-primary/60"
                    : "hover:bg-primary/20"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${
                    isActive(item.to, item.exact)
                      ? "bg-primary"
                      : "bg-transparent"
                  } rounded-r`}
                />
                <item.icon
                  size={18}
                  className={
                    isActive(item.to, item.exact)
                      ? "text-white"
                      : "text-white/70"
                  }
                />
                {!collapsed && (
                  <span
                    className={`${
                      isActive(item.to, item.exact)
                        ? "text-white font-semibold"
                        : "text-white/90"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* FOOTER */}
          <div className="relative z-10 p-4 border-t border-white/10 text-[11px] text-white/60 leading-relaxed">
            <p>
              ©{currentDate}
              {!collapsed && (
                <>
                  <br />
                  <span className="tracking-wide">
                    Shiv Ganga Hotel. All Rights Reserved.
                  </span>
                </>
              )}
            </p>
          </div>
        </aside>

        {/* ================= MAIN AREA ================= */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-50">
          {/* HEADER */}
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              {/* LEFT */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-all"
                >
                  <Menu size={18} />
                </button>

                {/* SEARCH */}
                {/* <div className="relative flex-1 max-w-[420px] transition-all">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition-all"
                  />
                </div> */}
                 <div>
                  <h1 className="text-xl font-bold text-primary">
                    Admin Dashboard
                  </h1>
                </div>

              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3">
                {/* NOTIFICATION */}
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="p-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white transition-all relative"
                >
                  <Bell size={18} />
                  {notifications.some((n) => n.unread) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
                <AnimatePresence>
                  {open && (
                    <Motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-2 sm:right-4 top-[64px] w-[calc(100vw-1rem)] max-w-[360px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-40"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            Notifications
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {notifications.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                const headers = token
                                  ? { Authorization: `Bearer ${token}` }
                                  : {};
                                await api.patch(
                                  "/notification/read-all",
                                  null,
                                  {
                                    headers,
                                  },
                                );
                              } catch {}
                              setNotifications((prev) =>
                                prev.map((n) => ({ ...n, unread: false })),
                              );
                            }}
                          >
                            Mark all read
                          </button>
                          <button
                            className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
                            onClick={() => setOpen(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-gray-300">
                        {[
                          { id: "all", label: "All" },
                          { id: "booking", label: "Bookings" },
                          { id: "payment", label: "Payments" },
                          { id: "salary", label: "Staff Salary" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`text-[11px] px-3 py-1 rounded-full transition ${
                              activeFilter === f.id
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <div className="max-h-[360px] overflow-auto">
                        {notifications
                          .filter(
                            (n) =>
                              activeFilter === "all" || n.type === activeFilter,
                          )
                          .map((n) => {
                            const tone =
                              n.status === "success"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : n.status === "warning"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                  : "bg-blue-50 text-blue-700 border-blue-100";
                            const IconComp =
                              n.type === "booking"
                                ? CalendarCheck2
                                : n.type === "payment"
                                  ? IndianRupee
                                  : Users;
                            return (
                              <Motion.div
                                key={n.id}
                                variants={rowVariant}
                                initial="hidden"
                                animate="visible"
                                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-300 hover:bg-gray-50 transition cursor-pointer`}
                                onClick={() => setDetail(n)}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tone}`}
                                >
                                  <IconComp size={16} />
                                </div>

                                
                               <div className="flex-1 min-w-0">
  <div className="flex items-center gap-2">
    <span className={`text-sm text-primary truncate ${n.unread ? "font-extrabold" : "font-light"}`}>
      {n.title}
    </span>
    {n.unread && (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
        New
      </span>
    )}
  </div>
  <div className={`text-[12px] mt-0.5 truncate ${n.unread ? "text-gray-800 font-medium" : "text-gray-600"}`}>
    {/* The desc already contains formatted room info */}
    {n.desc.split('\n')[0]} {/* Shows just the first line (room info) */}
  </div>
  <div className="text-[11px] text-gray-400 mt-1">
    {n.time}
  </div>
</div>
                              </Motion.div>
                            );
                          })}
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">
                          Showing{" "}
                          {
                            notifications.filter(
                              (n) =>
                                activeFilter === "all" ||
                                n.type === activeFilter,
                            ).length
                          }{" "}
                          of {notifications.length}
                        </span>
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                {/* PROFILE */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white
                hover:bg-primary/90 transition-all"
                  >
                    <UserRound size={18} />
                    <span className="hidden sm:block text-xs font-medium">
                      Admin
                    </span>
                  </button>

                  {/* DROPDOWN */}
                  <AnimatePresence>
                    {profileOpen && (
                      <Motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-44 bg-white rounded-xl border shadow-lg overflow-hidden"
                      >
                        <Link
                          to="/"
                          className="flex items-center gap-2 px-4 py-3 text-sm
                      hover:bg-gray-100 transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </Link>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <Motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 min-w-0 overflow-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin"
          >
            <Outlet />
          </Motion.main>
        </div>
      </div>

      {/* phone view */}
      <AnimatePresence>
        {mobileOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* BACKDROP */}
            <Motion.div
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white/50 "
            />

            {/* DRAWER */}
            <div className="bg-white absolute left-0 top-0 h-full w-64">
              <Motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 240, damping: 28 }}
                className="absolute left-0 top-0 h-full w-64
        bg-gradient-to-t from-primary via-primary/80 to-accent/40
        text-white border-r border-accent shadow-xl flex flex-col"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between p-4">
                <span className="font-bold text-lg w-full flex items-center justify-center">
                <img src={logo} alt="logo" className="h-30 aspect-square rounded-2xl" />
              </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* NAV */}
                <nav className="px-2 space-y-1 flex-1">
                  {navItems.map((item) => {
                    const active = isActive(item.to, item.exact);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${active ? "bg-primary/60" : "hover:bg-primary/20"}`}
                      >
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
                  ${active ? "bg-primary" : "bg-transparent"}`}
                        />
                        <item.icon
                          size={18}
                          className={active ? "text-white" : "text-white/70"}
                        />
                        <span
                          className={
                            active
                              ? "text-white font-semibold"
                              : "text-white/90"
                          }
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
                {/* FOOTER */}
                <div className="relative z-10 p-4 border-t border-white/10 text-[11px] text-white/60 leading-relaxed">
                  <p>
                    ©{currentDate}
                    <br />
                    <span className="tracking-wide">
                      Shiv Ganga Hotel. All Rights Reserved.
                    </span>
                  </p>
                </div>
              </Motion.div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detail && (
          <Motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalBackdrop}
            className="fixed inset-0 z-50"
          >
            <Motion.div
              onClick={() => {
                setNotifications((prev) =>
                  prev.map((x) =>
                    x.id === detail.id ? { ...x, unread: false } : x,
                  ),
                );
                setDetail(null);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />
            <Motion.div
              variants={modalBox}
              className="absolute top-6 inset-x-4 md:top-24 md:right-6 md:inset-x-auto w-[calc(100%-32px)] md:w-[440px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[75vh] md:max-h-[60vh]"
            >
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      detail.status === "success"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : detail.status === "warning"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}
                  >
                    {(detail.type === "booking" && (
                      <CalendarCheck2 size={16} />
                    )) ||
                      (detail.type === "payment" && (
                        <IndianRupee size={16} />
                      )) ||
                      (detail.type === "salary" && <Users size={16} />)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">
                      {detail.title}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {detail.time}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === detail.id ? { ...x, unread: false } : x,
                      ),
                    );
                    setDetail(null);
                  }}
                  className="px-3 py-1 text-[11px] rounded-full bg-gray-200 text-primary hover:bg-primary/90 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-4 max-h-[calc(75vh-128px)] md:max-h-[calc(60vh-128px)] overflow-auto">
                <div
                  className="text-sm text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: detail.desc
                      .replace(/\n\n/g, "\n")
                      .replace(/Room:/g, "<strong>Room:</strong>")
                      .replace(/Guest:/g, "<strong>Guest:</strong>")
                      .replace(/Status:/g, "<strong>Status:</strong>")
                      .replace(/Payment:/g, "<strong>Payment:</strong>")
                      .replace(/Paid:/g, "<strong>Paid:</strong>")
                      .replace(/Remaining:/g, "<strong>Remaining:</strong>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />

                <div className="mt-4 flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {detail.type}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {detail.status}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
                <button
                  onClick={() => deleteNotification(detail.id)}
                  className="text-[11px] px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  Delete
                </button>
                <Link
                  to={
                    detail.type === "booking"
                      ? "/admin/bookings"
                      : detail.type === "payment"
                        ? "/admin/bookings"
                        : "/admin/salary-reports"
                  }
                  className="text-[11px] px-3 py-1 rounded-full bg-gray-100 hover:bg-primary hover:text-white transition"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const headers = token
                        ? { Authorization: `Bearer ${token}` }
                        : {};
                      await api.patch(`/notification/${detail.id}/read`, null, {
                        headers,
                      });
                    } catch {}
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === detail.id ? { ...x, unread: false } : x,
                      ),
                    );
                    setDetail(null);
                  }}
                >
                  Open related section
                </Link>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}