import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import { Printer } from "lucide-react";
import Sidebar from "./Sidebar";

const Receipt = () => {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        console.log("Fetching receipt for:", bookingId);

        const res = await api.get(
          `/offline-booking/receipt/${bookingId}`
        );

        console.log("Receipt response:", res.data);
        setBooking(res.data.data);
      } catch (err) {
        console.error("Failed to fetch receipt", err);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);



  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);

  if (loading) {
    return (
      <Sidebar>
        <div className="p-10 text-center font-bold">Loading receipt...</div>
      </Sidebar>
    );
  }

  if (!booking) {
    return (
      <Sidebar>
        <div className="p-10 text-center text-red-500 font-bold">
          Receipt not found
        </div>
      </Sidebar>
    );
  }

  // const billing = booking.priceBreakdown || {};
  const billing = booking.priceBreakdown?.grandTotal
    ? booking.priceBreakdown
    : booking.computedPriceBreakdown || {};

  const nights =
    (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) /
    (1000 * 60 * 60 * 24);

  return (
    <Sidebar>
      <div className="min-h-screen w-full overflow-x-hidden flex items-start justify-center px-3 sm:px-4 md:px-6 py-6 md:py-10">
        <div className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                Booking Receipt
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Booking ID: <span className="font-bold">{booking.guestId}</span>
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#D4AF37] transition-colors shrink-0"
            >
              <Printer size={16} /> Print
            </button>
          </div>

          {/* GUEST & STAY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 md:mb-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                Guest Details
              </h3>
              <p className="font-bold text-[#0f172a]">
                {booking.user.firstName} {booking.user.lastName}
              </p>
              <p className="text-sm text-slate-500">{booking.user.email}</p>
              <p className="text-sm text-slate-500">{booking.user.phoneNumber}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                Stay Details
              </h3>
              <p className="text-sm">
                Check-in:{" "}
                <span className="font-bold">
                  {new Date(booking.checkInDate).toDateString()}
                </span>
              </p>
              <p className="text-sm">
                Check-out:{" "}
                <span className="font-bold">
                  {new Date(booking.checkOutDate).toDateString()}
                </span>
              </p>
              <p className="text-sm">
                Nights: <span className="font-bold">{nights}</span>
              </p>
            </div>
          </div>

          {/* ROOM INFO */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Room Details
            </h3>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border">
              <div className="min-w-0">
                {/* <p className="font-bold text-[#0f172a]">
                  Room {booking.rooms?.[0]?.room?.roomNumber}
                </p> */}
                <p className="font-bold text-[#0f172a]">
                  Rooms:{" "}
                  {booking.rooms?.map((r) => r.room?.roomNumber).join(", ")}
                </p>
                <p className="text-sm text-slate-500 truncate">{booking.rooms?.[0]?.room?.name}</p>
                <p className="text-xs text-slate-400">
                  Adults: {booking.adults} | Children: {booking.children}
                </p>
              </div>
              <div className="text-left sm:text-right font-bold shrink-0">
                {formatCurrency(billing?.roomTotal)}
              </div>
            </div>
          </div>

          {/* ADD-ONS / ACTIVITIES */}
          {booking.addOns && booking.addOns.length > 0 && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                Activities / Add-ons
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                {booking.addOns.map((addon, index) => {
                  const unitPrice = addon.price || 0;
                  const qty = addon.quantity || 1;
                  const total = unitPrice * qty;

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-bold text-[#0f172a]">
                          {addon.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {qty} × {formatCurrency(unitPrice)}
                        </p>
                      </div>

                      <div className="font-bold">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PAYMENT SUMMARY */}
          <div className="border-t pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Total Amount</span>
              <span className="font-bold">
                {formatCurrency(billing.grandTotal ?? booking.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span>Paid</span>
              <span className="font-bold text-green-600">
                {/* {formatCurrency(billing.paidAmountNow ?? booking.paidAmount)} */}
                {formatCurrency(booking.paidAmount)}
              </span>
            </div>

            {booking.pendingAmount > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span>Pending</span>
                <span className="font-bold text-red-500">
                  {formatCurrency(booking.pendingAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-lg font-black mt-4">
              <span>Status</span>
              <span
                className={`${booking.paymentStatus === "paid"
                  ? "text-green-600"
                  : "text-orange-500"
                  }`}
              >
                {booking.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 md:mt-10 text-center text-xs text-slate-400">
            Thank you for staying with us • Shiv Ganga Hospitality
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Receipt;
