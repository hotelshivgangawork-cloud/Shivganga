import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Public Layout */
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import AvailableCoupons from "./components/AvailableCoupons";
/* Public Pages */
import Home from "./pages/Homepage/Home";
import About from "./pages/About";
import Rooms from "./pages/Rooms";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Offers from "./pages/Offers";
import BookingPage from "./pages/BookingPage";
import Tariff from "./pages/Homepage/Tariff";
import Attractions from "./pages/Attractions";
import AttractionDetailsNew from "./pages/AttractionDetailsNew";
import LoginPage from "./pages/Auth";
import Receipt from "./pages/ReceptionistDashboard/Receipt";

/* Admin  */
import AdminLayout from "./pages/AdminDashboard/AdminLayout";
import Overview from "./pages/AdminDashboard/pages/Overview";
import RoomManagement from "./pages/AdminDashboard/pages/RoomManagement";
import BookingManagement from "./pages/AdminDashboard/pages/BookingManagement";
import Receptionists from "./pages/AdminDashboard/pages/Receptionists";
import GuestManagement from "./pages/AdminDashboard/pages/GuestManagement";
import SystemSettings from "./pages/AdminDashboard/pages/SystemSettings";
import SalaryReports from "./pages/AdminDashboard/pages/SalaryReports";
import GalleryManagement from "./pages/AdminDashboard/pages/GalleryManagement";
import MembershipManagement from "./pages/AdminDashboard/pages/MembershipManagement";
import SetBookingPolicy from "./pages/Policy/Booking";
/* Receptionist */
import Dashboard from "./pages/ReceptionistDashboard/Dashboard";
import NewBooking from "./pages/ReceptionistDashboard/NewBooking";
import PaymentPage from "./pages/ReceptionistDashboard/PaymentPage";
import BookingList from "./pages/ReceptionistDashboard/BookingList";
import RoomStatus from "./pages/ReceptionistDashboard/RoomStatus";
import AdminCoupons from "./pages/AdminDashboard/pages/DiscountCoupons";

import Settings from "./pages/ReceptionistDashboard/Settings";
import GuestDirectory from "./pages/ReceptionistDashboard/GuestDirectory";
import MyProfile from "./pages/ReceptionistDashboard/MyProfile";

// Added Notification Import
import Notifications from "./pages/ReceptionistDashboard/Notifications";

/* Auth Guards */
import AdminRoute from "./Auth/AdminRoute";
import ReceptionistRoute from "./Auth/ReceptionistRoute";

/* Other */
import Unauthorized from "./pages/Unauthorized";
import Privacy from "./pages/Policy/Privacy";
import Cancellation from "./pages/Policy/Cancellation";
import Terms from "./pages/Policy/Terms";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";
import NotFound from "./pages/NotFound";
import TaxesBillingPage from "./pages/Policy/TaxesAndBilling";
import SystemMailSettings from "./pages/MailSettings";

export default function App() {
  return (
    <SystemSettingsProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="contact" element={<Contact />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="offers" element={<Offers />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="tariff" element={<Tariff />} />
            <Route path="attractions" element={<Attractions />} />
            <Route path="attractions/:id" element={<AttractionDetailsNew />} />
            {/* <Route path="auth/login" element={<LoginPage />} /> */}
            <Route path="privacypolicy" element={<Privacy />} />
            <Route path="cancellationpolicy" element={<Cancellation />} />
            <Route path="terms-of-servicespolicy" element={<Terms />} />
            <Route path="/coupons" element={<AvailableCoupons />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ================= ADMIN PROTECTED ================= */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="rooms" element={<RoomManagement />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="receptionists" element={<Receptionists />} />
              <Route path="guest-management" element={<GuestManagement />} />
              <Route path="system-settings" element={<SystemSettings />} />
              <Route path="salary-reports" element={<SalaryReports />} />
              <Route path="gallery" element={<GalleryManagement />} />
              <Route path="memberships" element={<MembershipManagement />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="booking-policy" element={<SetBookingPolicy />} />
              <Route path="taxes-billing" element={<TaxesBillingPage />} />
              <Route path="mail-settings" element={<SystemMailSettings />} />
            </Route>
          </Route>

          {/* ================= RECEPTIONIST PROTECTED ================= */}
          <Route element={<ReceptionistRoute />}>
            <Route path="/receptionist/dashboard" element={<Dashboard />} />
            <Route path="/receptionist/new-booking" element={<NewBooking />} />
            <Route path="/receptionist/billing" element={<PaymentPage />} />
            <Route path="/receptionist/bookinglist" element={<BookingList />} />
            <Route path="/receptionist/rooms" element={<RoomStatus />} />
            <Route path="/receptionist/coupons/select" element={<AvailableCoupons />} />
            <Route path="/receptionist/guests" element={<GuestDirectory />} />
            {/* <Route path="/receptionist/coupons" element={<DiscountCoupons />} /> */}
            <Route path="/receptionist/profile" element={<MyProfile />} />
            <Route
              path="/receptionist/receipt/:bookingId"
              element={<Receipt />}
            />

            {/* Added Notifications and Settings Routes */}
            <Route
              path="/receptionist/notifications"
              element={<Notifications />}
            />
            <Route path="/receptionist/settings" element={<Settings />} />
          </Route>

          {/* ================= MISC ================= */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
          <Route path="auth/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </SystemSettingsProvider>
  );
}
