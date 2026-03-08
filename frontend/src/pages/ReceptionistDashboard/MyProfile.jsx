import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { toast } from "react-hot-toast";

import { 
  Activity, 
  Briefcase, 
  Calendar, 
  MoreVertical,
  Download 
} from 'lucide-react';
import Sidebar from './Sidebar';

const MyProfile = () => {
  const navigate = useNavigate();
  const API_BASE = "/api";

  // ✅ STATES
  const [profile, setProfile] = React.useState(null);
  const [loginHistory, setLoginHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // ✅ FETCH PROFILE + LOGIN ACTIVITY
  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE}/receptionist/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setProfile(res.data.data.profile);
        setLoginHistory(res.data.data.recentLogins || []);
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ EXPORT REAL LOGIN ACTIVITY
  const exportLoginHistory = () => {
    const headers = ["Date", "Device", "Browser", "Status"];

    const csvContent = [
      headers.join(","),
      ...loginHistory.map(item =>
        [
          new Date(item.createdAt).toLocaleString(),
          item.device,
          item.browser,
          item.status
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "login_activity_report.csv";
    link.click();
  };

  return (
    <Sidebar>
      <div className="flex flex-col gap-6">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-[#0f172a] h-28 relative"></div>
          <div className="px-6 pb-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-end md:flex-row gap-4 -mt-12">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-xl bg-slate-900 flex items-center justify-center text-white text-3xl font-bold relative">
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
                <div className="absolute bottom-2 right-2 size-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 pt-2">
                <h1 className="text-2xl font-black text-slate-900 leading-none">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mt-1 mb-2">
                  {profile?.role}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-400 font-bold uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Briefcase size={14}/> #{profile?.employeeId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14}/> 
                    {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/receptionist/settings')}
                className="w-full md:w-auto px-8 py-3 bg-[#0f172a] hover:bg-[#D4AF37] hover:text-[#0f172a] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* LOGIN ACTIVITY */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0f172a]">
              <Activity size={20} className="text-[#D4AF37]" />
              Recent Login Activity
            </h2>

            <div className="flex items-center gap-2">
              <button 
                onClick={exportLoginHistory}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loginHistory.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-[#D4AF37]/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {new Date(item.createdAt).toLocaleString()} • {item.browser} on {item.device}
                  </p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 tracking-widest">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-40 w-full md:hidden shrink-0"></div>
      </div>
    </Sidebar>
  );
};

export default MyProfile;
