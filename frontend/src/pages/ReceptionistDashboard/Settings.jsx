import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Lock, Shield, 
  Camera, Save, Mail, Phone, 
  ChevronRight, Loader2, AlertCircle, CheckCircle, Key
} from 'lucide-react';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [apiError, setApiError] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: ''
  });
  
  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailBooking: true,
    emailPromos: false,
    smsAlerts: true,
    browserPush: true
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState('Profile');

  // API base URL
  const API_BASE_URL = '/api';

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/receptionist/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const profile = response.data.data.profile;
        setProfileData(profile);
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phoneNumber: profile.phoneNumber || '',
          bio: profile.bio || ''
        });
        setApiError(false);
      }
    } catch (error) {
  toast.error("Failed to load profile");
}
 finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_BASE_URL}/receptionist/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        // Update local state with new data
        setProfileData(prev => ({
          ...prev,
          ...formData
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Note: You need to create this endpoint in backend
      const response = await axios.put(
        `${API_BASE_URL}/receptionist/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        bio: profileData.bio || ''
      });
    }
    toast.success('Changes discarded');
  };

  const handleEnable2FA = () => {
    toast.success('2FA setup initiated. Check your email for instructions.');
  };

  const tabs = [
    { id: 'Profile', icon: <User size={18} />, label: 'My Profile', desc: 'Personal details' },
  
  ];

  return (
    <Sidebar>
      
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
        
        {/* API Error Alert */}
        {apiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={24} className="text-yellow-600" />
            <div className="flex-1">
              <p className="text-yellow-800 font-medium">Demo Mode Active</p>
              <p className="text-yellow-600 text-sm">Using demo data. Backend server connection failed.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col mb-4">
          <h1 className="text-2xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Sidebar - Tabs */}
          <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 z-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar snap-x">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all whitespace-nowrap snap-start w-full
                    ${activeTab === tab.id 
                      ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/10' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-[#0f172a]'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-white/10 text-[#D4AF37]' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all'}`}>
                    {tab.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${activeTab === tab.id ? 'text-white' : 'text-slate-700'}`}>{tab.label}</p>
                    <p className={`text-[11px] ${activeTab === tab.id ? 'text-slate-400' : 'text-slate-400'}`}>{tab.desc}</p>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight size={16} className="opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full space-y-8 min-w-0">
            
            {/* Profile Tab */}
            {activeTab === 'Profile' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
                
                {/* Header Banner */}
                <div className="h-40 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                <div className="px-6 md:px-10 pb-10">
                  
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 size={32} className="text-slate-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Profile Header */}
                      <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-center xl:items-end -mt-12 mb-8">
                        
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                          <div className="size-28 rounded-full p-1.5 bg-white shadow-xl">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent((profileData?.firstName || '') + ' ' + (profileData?.lastName || ''))}&background=0f172a&color=fff&size=256`} 
                              alt="Avatar" 
                              className="w-full h-full rounded-full object-cover border border-slate-100"
                            />
                          </div>
                          <button className="absolute bottom-1 right-1 bg-[#D4AF37] text-white p-2 rounded-full shadow-lg hover:scale-105 hover:bg-[#b5952f] transition-all cursor-pointer border-[3px] border-white">
                            <Camera size={16} />
                          </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center xl:text-left pt-2 xl:pt-0 xl:mb-2 min-w-0">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {profileData?.firstName} {profileData?.lastName}
                          </h2>
                          <p className="text-slate-500 text-sm font-medium">
                            {profileData?.role || 'Front Desk Manager'} • ID: {profileData?.employeeId || '#EMP-042'}
                          </p>
                        </div>

                        <div className="xl:mb-2 shrink-0">
                          <button className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap">
                            Remove Photo
                          </button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                          <input 
                            type="text" 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-slate-300" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                          <input 
                            type="text" 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-slate-300" 
                          />
                        </div>
                        
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                          <div className="relative group">
                            <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                            <input 
                              type="email" 
                              value={profileData?.email || 'elena.vance@shivganga.com'} 
                              readOnly
                              className="w-full pl-11 p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed focus:outline-none" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                          <div className="relative group">
                            <Phone size={18} className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                            <input 
                              type="tel" 
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all placeholder:text-slate-300" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                          <input 
                            type="text" 
                            value={profileData?.role || 'Senior Receptionist'} 
                            readOnly 
                            className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed" 
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Bio / Notes</label>
                          <textarea 
                            rows="3" 
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all resize-none placeholder:text-slate-300"
                          ></textarea>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="px-6 md:px-10 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={handleDiscard}
                    className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-8 py-3 bg-[#0f172a] text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Save size={18} /> Save Changes
                      </>
                    )}
                  </button>
                </div>

                </div>
              )}

            {/* Notifications Tab */}
            {activeTab === 'Notifications' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="p-8 md:p-10 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">Alert Preferences</h2>
                  <p className="text-sm text-slate-500 mt-1">Customize how and when you want to be notified.</p>
                </div>
                
                <div className="p-8 md:p-10 space-y-8">
                  {[
                    { id: 'emailBooking', label: 'New Booking Alerts', desc: 'Receive an email when a new reservation is made.' },
                    { id: 'smsAlerts', label: 'Urgent SMS Alerts', desc: 'Get SMS notifications for high-priority guest requests.' },
                    { id: 'browserPush', label: 'Browser Notifications', desc: 'Show popup notifications on your desktop while active.' },
                    { id: 'emailPromos', label: 'Marketing Updates', desc: 'Receive news about internal promotions and updates.' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-[#D4AF37]/50 transition-colors group">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#D4AF37] transition-colors">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px] sm:max-w-md leading-relaxed">{item.desc}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleToggle(item.id)}
                        className={`shrink-0 w-12 h-6 rounded-full p-1 transition-all duration-300 ${notifications[item.id] ? 'bg-[#0f172a]' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications[item.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Save Button for Notifications */}
                <div className="px-8 md:px-10 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => toast.success('Notification preferences saved!')}
                    className="px-8 py-3 bg-[#0f172a] text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'Security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                
                {/* Change Password Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 md:p-10">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                      <Key size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
                      <p className="text-sm text-slate-500 mt-0.5">Ensure your account uses a long, random password.</p>
                    </div>
                  </div>
                  
                  <div className="max-w-lg space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                      <input 
                        type="password" 
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••" 
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                        <input 
                          type="password" 
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="New password" 
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                        <input 
                          type="password" 
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm password" 
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all" 
                        />
                      </div>
                    </div>
                    
                    <div className="pt-3">
                      <button 
                        onClick={handleUpdatePassword}
                        disabled={loading}
                        className="px-6 py-3 bg-[#0f172a] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#D4AF37] hover:text-[#0f172a] transition-all active:scale-95 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2FA Card */}
                <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="p-4 bg-[#f59e0b]/10 rounded-2xl text-[#d97706]">
                    <Shield size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#92400e]">Two-Factor Authentication</h3>
                    <p className="text-sm text-[#b45309] mt-1 max-w-xl">Add an extra layer of security to your account by requiring a verification code whenever you log in.</p>
                  </div>
                  <button 
                    onClick={handleEnable2FA}
                    className="px-6 py-3 bg-[#d97706] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#b45309] transition-all whitespace-nowrap active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle size={18} /> Enable 2FA
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
        
        <div className="h-40 w-full md:hidden shrink-0"></div>
      </div>
    </Sidebar>
  );
};

export default Settings;