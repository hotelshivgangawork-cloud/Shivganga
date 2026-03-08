import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  TicketIcon,
  Bell,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo1.webp";

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Elena V.",
    fullName: "Elena Vance",
    role: "Admin",
    initials: "EV",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const mainContentRef = useRef(null);
  const notificationRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isSettingsActive = location.pathname === "/receptionist/settings";

  const getPageTitle = (path) => {
    if (path.includes("dashboard")) return "Dashboard Overview";
    if (path.includes("new-booking")) return "New Reservation";
    if (path.includes("guests")) return "Guest Directory";
    if (path.includes("rooms")) return "Room Status";
    if (path.includes("billing")) return "Billing & Invoices";
    if (path.includes("coupons")) return "Marketing & Coupons";
    if (path.includes("profile")) return "My Profile";
    if (path.includes("settings")) return "Settings";
    if (path.includes("notifications")) return "Notifications";
    if (path.includes("bookinglist")) return "Booking List";
    return "Shiv Ganga Hotel";
  };

  const currentPageTitle = getPageTitle(location.pathname);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const API = axios.create({
    baseURL: "/api",
  });

  API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await API.get("/receptionist/profile");

      if (res.data.success) {
        const profileData = res.data.data?.profile || res.data.data;

        // Extract name and role
        const firstName = profileData.firstName || "";
        const lastName = profileData.lastName || "";
        const role = profileData.role || "Receptionist";
        const email = profileData.email || "";

        // Create display name
        let displayName = "User";
        let shortName = "U";

        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
          shortName =
            `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        } else if (firstName) {
          displayName = firstName;
          shortName = firstName.charAt(0).toUpperCase();
        } else if (email) {
          displayName = email.split("@")[0];
          shortName = displayName.charAt(0).toUpperCase();
        }

        setUserProfile({
          name: `${firstName.charAt(0)}${lastName.charAt(0) ? lastName.charAt(0) : ""}`.toUpperCase(),
          fullName: displayName,
          role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
          initials: shortName,
          firstName: firstName,
          lastName: lastName,
          email: email,
          employeeId: profileData.employeeId || "",
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      // Fallback to localStorage if API fails
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData.firstName || userData.lastName || userData.name) {
          const firstName = userData.firstName || "";
          const lastName = userData.lastName || "";
          const role = userData.role || "Receptionist";

          const displayName =
            userData.name || `${firstName} ${lastName}`.trim();
          const shortName = userData.firstName
            ? `${userData.firstName.charAt(0)}${userData.lastName ? userData.lastName.charAt(0) : ""}`.toUpperCase()
            : userData.name
              ? userData.name.charAt(0).toUpperCase()
              : "U";

          setUserProfile({
            name: shortName,
            fullName: displayName,
            role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
            initials: shortName,
            firstName: firstName,
            lastName: lastName,
            email: userData.email || "",
            employeeId: userData.employeeId || "",
          });
        }
      } catch (localError) {
        console.log("Using default profile data");
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notification");
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Sidebar notification error", err);
    }
  };

  useEffect(() => {
    // Fetch user profile first
    fetchUserProfile();

    // Then fetch notifications
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15 sec

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setIsScrolled(scrollTop > 20);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setIsOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/receptionist/dashboard",
    },
    {
      name: "Reservations",
      icon: <CalendarDays size={20} />,
      path: "/receptionist/new-booking",
    },
    { name: "Guests", icon: <Users size={20} />, path: "/receptionist/guests" },
    {
      name: "Room Status",
      icon: <BedDouble size={20} />,
      path: "/receptionist/rooms",
    },
    // { name: 'Billing', icon: <CreditCard size={20} />, path: '/receptionist/billing' },
    // { name: 'Coupons', icon: <TicketIcon size={20} />, path: '/receptionist/coupons' },
    {
      name: "My Profile",
      icon: <User size={20} />,
      path: "/receptionist/profile",
    },
  ];

  const handleNotificationClick = async (notif) => {
    try {
      await API.patch(`/notification/${notif._id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }

    setSelectedNotification(notif);
    setIsNotificationsOpen(false);
  };

  const markAllRead = async () => {
    try {
      await API.patch("/notification/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Mark all read failed", err);
    }
  };

  const markUnread = async (id) => {
    try {
      await API.patch(`/notification/${id}/unread`);
      await fetchNotifications();
      setSelectedNotification(null);
    } catch (err) {
      console.error("Mark unread failed", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await API.delete(`/notification/${id}`);
      if (res.status === 200) {
        await fetchNotifications();
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleViewFullDetails = () => {
    navigate("/receptionist/notifications");
    setSelectedNotification(null);
  };

  const MenuList = () => (
    <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar p-1">
      <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
        Main Menu
      </p>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            to={item.path}
            key={item.name}
            className="block"
            onClick={() => setIsOpen(false)}
          >
            <div
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer
                        ${isActive
                  ? "bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white shadow-md shadow-slate-900/20 scale-[1.02] ring-1 ring-white/10"
                  : "text-slate-500 hover:bg-slate-50/80 hover:text-[#0f172a]"
                }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 transition-colors ${isActive ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-[#D4AF37]"}`}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">
                {item.name}
              </span>
              {isActive && (
                <ChevronRight size={16} className="ml-auto text-[#D4AF37]" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50/80 text-slate-800 font-sans shadow-[4px_0_30px_-10px_rgba(0,0,0,0.05)] z-50">
      <div className="h-28 flex items-center justify-center border-b border-slate-100/50 px-6">
        <img
          src={logo}
          alt="Shiv Ganga"
          className="h-12 sm:h-14 md:h-22 lg:h-24 rounded-2xl mt-4 object-contain"
        />
      </div>

      <div className="flex-1 px-4 py-6 overflow-hidden flex flex-col">
        <MenuList />

        <div className="pt-4 mt-auto border-t border-slate-100/50 pb-safe">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all group cursor-pointer"
          >
            <LogOut
              size={20}
              className="text-slate-400 group-hover:text-red-500 transition-colors"
            />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Generate avatar URL with user's initials
  const getAvatarUrl = () => {
    if (userProfile.firstName || userProfile.lastName) {
      const name =
        `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.role)}&background=0f172a&color=fff`;
  };

  return (
    <div className="flex h-screen w-full max-w-[100vw] bg-[#F8FAFC] overflow-hidden font-sans">
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm md:max-w-md rounded-[2rem] shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-300 m-4 border border-white/40 ring-1 ring-black/5">
            <div className="bg-[#0f172a] p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#D4AF37] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
                <Info size={20} className="text-[#D4AF37]" /> Notification
              </h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-white transition-colors relative z-10 p-1.5 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 shadow-sm
                            ${selectedNotification.type === "booking"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : selectedNotification.type === "payment"
                        ? "bg-green-50 text-green-700 border border-green-100"
                        : "bg-orange-50 text-orange-700 border border-orange-100"
                    }`}
                >
                  {selectedNotification.type === "booking" && (
                    <CalendarDays size={10} />
                  )}
                  {selectedNotification.type === "payment" && (
                    <CreditCard size={10} />
                  )}
                  {selectedNotification.type}
                </span>
                <h4 className="text-xl font-bold text-slate-900 mb-1 leading-tight">
                  {selectedNotification.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <ClockIcon size={12} /> {selectedNotification.time}
                </p>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100/80 mb-6">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedNotification.booking && (
                    // <>
                    // {console.log(selectedNotification.booking)}
                    //   Room: {selectedNotification.booking.room?.name} (
                    //   {selectedNotification.booking.room?.roomNumber}) <br />
                    //   <p>
                    //     <b>Guest:</b>{" "}
                    //     {selectedNotification.booking.user?.firstName
                    //       ? `${selectedNotification.booking.user.firstName} ${selectedNotification.booking.user.lastName || ""}`.trim()
                    //       : selectedNotification.guest?.firstName
                    //         ? `${selectedNotification.guest.firstName} ${selectedNotification.guest.lastName || ""}`.trim()
                    //         : (selectedNotification.message || "")
                    //             .match(/Guest:\s*([^\n]+)/)?.[1]
                    //             ?.trim() || "Unknown"}
                    //   </p>
                    //   Status: {selectedNotification.booking.bookingStatus}{" "}
                    //   <br />
                    //   Payment: {selectedNotification.booking.paymentStatus}{" "}
                    //   <br />
                    //   Paid: ₹{selectedNotification.booking.paidAmount} / ₹
                    //   {selectedNotification.booking.totalAmount} <br />
                    //   Remaining: ₹
                    //   {selectedNotification.booking.totalAmount -
                    //     selectedNotification.booking.paidAmount}
                    // </>
                    <>
                      <p>
                        <b>Room:</b>{" "}
                        {selectedNotification.booking.rooms
                          ?.map(
                            (r) => `${r.room?.name || "N/A"} (${r.room?.roomNumber || "N/A"})`
                          )
                          .join(", ")}
                      </p>

                      <p>
                        <b>Guest:</b>{" "}
                        {selectedNotification.booking.user?.firstName
                          ? `${selectedNotification.booking.user.firstName} ${selectedNotification.booking.user.lastName || ""}`.trim()
                          : selectedNotification.guest?.firstName
                            ? `${selectedNotification.guest.firstName} ${selectedNotification.guest.lastName || ""}`.trim()
                            : (selectedNotification.message || "")
                              .match(/Guest:\s*([^\n]+)/)?.[1]
                              ?.trim() || "Unknown"}
                      </p>

                      <p>
                        <b>Status:</b> {selectedNotification.booking.bookingStatus}
                      </p>

                      <p>
                        <b>Payment:</b> {selectedNotification.booking.paymentStatus}
                      </p>

                      <p>
                        <b>Paid:</b> ₹{selectedNotification.booking.paidAmount} / ₹
                        {selectedNotification.booking.totalAmount}
                      </p>

                      <p>
                        <b>Remaining:</b> ₹
                        {selectedNotification.booking.totalAmount -
                          selectedNotification.booking.paidAmount - selectedNotification.booking.membershipDiscount
                        }
                      </p>
                      {/* <p>
                        <b>Membership Discount:</b> ₹
                        {selectedNotification.booking.membershipDiscount
                        }
                      </p> */}
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                {selectedNotification && (
                  <>
                    <button
                      onClick={() => markUnread(selectedNotification._id)}
                      className="flex-1 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                    >
                      Mark Unread
                    </button>
                    <button
                      onClick={() =>
                        deleteNotification(selectedNotification._id)
                      }
                      className="flex-1 py-3 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={handleViewFullDetails}
                  className="flex-1 py-3 text-sm font-bold text-[#0f172a] bg-[#D4AF37] hover:bg-[#b5952f] rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95"
                >
                  See History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-64 flex-col h-full shrink-0 z-30 relative">
        <DesktopSidebarContent />
      </aside>

      <div
        className={`
          md:hidden fixed inset-0 z-40 bg-[#0f172a]/40 backdrop-blur-md transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={`
          md:hidden fixed top-0 left-0 w-full z-50 
          bg-gradient-to-b from-white to-slate-50
          shadow-2xl rounded-b-[2rem] overflow-hidden flex flex-col max-h-[85vh]
          transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          ${isOpen ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100/50">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X size={28} />
          </button>
          <div className="h-14 w-auto">
            <img
              src={logo}
              alt="Shiv Ganga"
              className="h-24 sm:h-10 md:h-14 lg:h-16 rounded-2xl object-contain"
            />
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#0f172a] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            Log Out
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col">
          <MenuList />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-[#F8FAFC]">
        <header
          className={`
                flex items-center justify-between px-4 md:px-8 
                sticky top-0 z-40 shrink-0 gap-6 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isScrolled
              ? "h-18 bg-white/70 backdrop-blur-2xl border-b border-white/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] supports-[backdrop-filter]:bg-white/60"
              : "h-24 bg-transparent border-b border-transparent"
            }
            `}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#0f172a] shadow-sm transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>

            <div
              className={`flex flex-col justify-center transition-all duration-500 ${isScrolled ? "opacity-90" : "opacity-100"}`}
            >
              <h1
                className={`font-bold text-[#0f172a] tracking-tight transition-all duration-300 ${isScrolled ? "text-lg" : "text-xl md:text-2xl"}`}
              >
                {currentPageTitle}
              </h1>
              <p
                className={`text-slate-500 font-medium flex items-center gap-1.5 transition-all duration-300 ${isScrolled ? "text-[10px]" : "text-xs"}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]"></span>{" "}
                {currentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`
                        relative p-3 rounded-full transition-all duration-300 group
                        ${isNotificationsOpen
                    ? "bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/30 scale-110"
                    : isScrolled
                      ? "bg-white/80 text-slate-600 hover:text-[#D4AF37] shadow-sm hover:shadow-[0_4px_12px_-2px_rgba(212,175,55,0.2)] backdrop-blur-md"
                      : "bg-white/60 text-slate-600 hover:bg-white hover:text-[#D4AF37] hover:shadow-md backdrop-blur-sm"
                  }
                    `}
              >
                <Bell
                  size={20}
                  className={
                    isNotificationsOpen ? "" : "group-hover:animate-swing"
                  }
                />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="fixed inset-x-4 top-20 z-50 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-4 md:w-96 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 ring-1 ring-[#D4AF37]/10 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                      Updates
                    </h3>
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-[#D4AF37] font-bold hover:underline flex items-center gap-1 bg-[#D4AF37]/10 px-2.5 py-1 rounded-full transition-colors hover:bg-[#D4AF37]/20"
                    >
                      <CheckCircle2 size={12} /> MARK ALL READ
                    </button>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer flex gap-4 group"
                      >
                        <div className="size-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                          <Bell size={18} />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-bold text-slate-800">
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {formatDistanceToNow(new Date(notif.createdAt))}{" "}
                              ago
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {notif.booking
                              ? `${notif.booking.room?.name} - ${notif.booking.bookingStatus} - ${notif.booking.paymentStatus}`
                              : notif.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                    <Link to="/receptionist/notifications">
                      <div className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all shadow-sm uppercase tracking-wider hover:shadow-md active:scale-[0.98] text-center cursor-pointer flex items-center justify-center">
                        View All Notifications
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`h-8 w-px transition-colors duration-300 hidden sm:block ${isScrolled ? "bg-slate-200" : "bg-slate-300/40"}`}
            ></div>

            <Link to="/receptionist/profile">
              <div
                className={`
                    flex items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-full transition-all duration-300 group
                    ${isScrolled
                    ? "bg-white/80 border border-slate-100 shadow-sm hover:border-[#D4AF37]/50 hover:shadow-[0_4px_12px_-2px_rgba(212,175,55,0.15)] backdrop-blur-md"
                    : "bg-white/40 border border-white/40 hover:bg-white/80 hover:shadow-sm backdrop-blur-sm"
                  }
                `}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8a701e] p-[2px] shadow-md group-hover:scale-105 transition-transform duration-300 ring-2 ring-white">
                  {loadingProfile ? (
                    <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <img
                      src={getAvatarUrl()}
                      alt="Profile"
                      className="rounded-full w-full h-full object-cover border-2 border-white"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${userProfile.initials}&background=0f172a&color=fff`;
                      }}
                    />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#D4AF37] transition-colors leading-tight">
                    {loadingProfile
                      ? "Loading..."
                      : `${userProfile.firstName?.charAt(0) || ""}${userProfile.lastName?.charAt(0) || userProfile.role?.charAt(0) || "U"}.`}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-tight">
                    {loadingProfile ? "Loading..." : userProfile.role}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-400 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all hidden sm:block"
                />
              </div>
            </Link>
          </div>
        </header>

        <main
          ref={mainContentRef}
          onScroll={handleScroll}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth custom-scrollbar"
        >
          <div className="max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const ClockIcon = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default Sidebar;
