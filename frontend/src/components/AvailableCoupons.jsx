import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

const AvailableCoupons = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // yaha se aayega
  const mode = location.state?.mode || "public";
  const amount = location.state?.amount || 0;
  const bookingDraft = location.state?.bookingDraft || {}; // preserve booking form data when returning

  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const url =
        mode === "receptionist" ? "/receptionist/coupon" : "/public/coupon";

      const res = await api.get(url);
      setCoupons(res.data.data || []);
    } catch {
      setError("Failed to load coupons");
    }
  };

  const applyCoupon = async (code) => {
    try {
      const url =
        mode === "receptionist"
          ? "/receptionist/coupon/apply"
          : "/public/coupon/apply";

      const res = await api.post(url, { code, amount });

      const redirectPath =
        mode === "receptionist" ? "/receptionist/new-booking" : "/booking";

      navigate(redirectPath, {
        replace: true,
        state: {
          appliedCoupon: res.data.coupon,
          bookingDraft,
          fromCoupon: true, // 🔥 FLAG
        },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Invalid coupon");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-primary mb-3">
          Available Coupons
        </h1>
        <p className="text-gray-500 text-sm">
          Apply a coupon to enjoy exclusive savings on your booking
        </p>
      </div>

      {/* Back Button */}
      <div className="mb-8">
  <button
    onClick={() => {
      const redirectPath =
        mode === "receptionist"
          ? "/receptionist/new-booking"
          : "/booking";

      navigate(redirectPath, {
        replace: true,
        state: {
          bookingDraft,
          fromCoupon: true,
        },
      });
    }}
    className="px-4 py-2 rounded-xl border 
               font-semibold text-sm uppercase tracking-wider
               transition-all duration-300 
               text-white bg-primary hover:text-primary hover:bg-accent hover:border-transparent"
  >
    Back to Booking
  </button>
</div>

      {error && <p className="text-red-500">{error}</p>}

      {/* show placeholder if no coupons available */}
      {coupons.length === 0 && !error && (
        <div className="border rounded-xl p-6 mb-4 text-center min-h-[500px] flex flex-col items-center justify-center">
          <p className="text-lg font-semibold mb-3">No coupons here</p>
          <p className="text-sm text-slate-500 mb-4">
            There are currently no coupons available for your booking.
          </p>
          <button
            onClick={() => {
              // navigate back to booking page retaining draft state
              const redirectPath =
                mode === "receptionist"
                  ? "/receptionist/new-booking"
                  : "/booking";
              navigate(redirectPath, {
                replace: true,
                state: {
                  bookingDraft, // keep original object under bookingDraft key
                  fromCoupon: true, // flag so page restores values
                },
              });
            }}
            className="px-5 py-2 border rounded-lg font-semibold text-sm bg-gray-100 hover:bg-gray-200"
          >
            Back
          </button>
        </div>
      )}

      {coupons.map((c) => (
        <div
          key={c._id}
          className="border rounded-xl p-4 mb-3 flex justify-between items-center"
        >
          <div>
            <p className="font-mono font-bold">{c.code}</p>
            <p className="text-sm text-slate-500">{c.discountPercent}% OFF</p>
          </div>

          <button
            onClick={() => applyCoupon(c.code)}
            className="bg-[#0f172a] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-accent hover:text-primary transition-all duration-200"
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
};

export default AvailableCoupons;
