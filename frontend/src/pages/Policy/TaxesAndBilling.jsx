import React, { useEffect, useState } from "react";
import axios from "axios";
import { Save, Loader2 } from "lucide-react";

const TaxesBillingPage = () => {

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        gstPercentage: "",
        extraBedPricePerNight: ""
    });

    const API = axios.create({
        baseURL: "/api"
    });

    API.interceptors.request.use((req) => {
        const token = localStorage.getItem("token");
        if (token) req.headers.Authorization = `Bearer ${token}`;
        return req;
    });

    // ✅ Load settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {

                const res = await API.get("/taxes-billing");

                const data = res.data.data;

                setForm({
                    gstPercentage: data.gstPercentage,
                    extraBedPricePerNight: data.extraBedPricePerNight
                });

            } catch (err) {
                console.error(err);
                alert("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // ✅ Form change
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ Save / Update
    const handleSubmit = async () => {

        try {

            setSaving(true);

            await API.put("/taxes-billing", {
                gstPercentage: Number(form.gstPercentage),
                extraBedPricePerNight: Number(form.extraBedPricePerNight)
            });

            alert("Settings updated successfully");

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }

    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">

            <h1 className="text-3xl font-bold mb-6">
                Taxes & Billing Settings
            </h1>

            <div className="bg-white p-8 rounded-2xl shadow border border-gray-200">

                {/* GST */}
                <div className="mb-6">
                    <label className="block font-bold mb-2">
                        GST Percentage
                    </label>

                    <input
                        type="number"
                        name="gstPercentage"
                        value={form.gstPercentage}
                        onChange={handleChange}
                        className="w-full border border-gray-200 bg-amber-50 rounded-lg px-4 py-3"
                    />
                </div>

                {/* Extra Bed */}
                <div className="mb-8">
                    <label className="block font-bold mb-2">
                        Extra Bed Price (Per Night)
                    </label>

                    <input
                        type="number"
                        name="extraBedPricePerNight"
                        value={form.extraBedPricePerNight}
                        onChange={handleChange}
                        className="w-full border border-gray-200 bg-amber-50 rounded-lg px-4 py-3"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-[#0f172a] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-[#D4AF37]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Settings
                        </>
                    )}
                </button>

            </div>

        </div>
    );
};

export default TaxesBillingPage;