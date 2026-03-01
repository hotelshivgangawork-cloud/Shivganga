import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Toaster } from "react-hot-toast";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* Push content below fixed navbar */}
      <main className="flex-grow pt-[60px] sm:pt-[72px]"> {/* pt-24 */}
        <Outlet />
      </main>

      <Toaster position="top-right" />
      <Footer />
    </div>
  );
}