import React, { useEffect, useState } from "react";
import {
  Save,
  BadgePercent,
  Users,
  MoreVertical,
  Edit2,
  X, Download, Trash2
} from "lucide-react";
import api from "../../axios";

export default function MembershipManagement() {
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    discountType: "PERCENT",
    discountValue: "",
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    name: "",
    discountType: "PERCENT",
    discountValue: "",
    isActive: true
  });

  useEffect(() => {
    fetchMembership();
    fetchMembers();
  }, []);

  const fetchMembership = async () => {
    try {
      const res = await api.get("/membership/active");
      setMembership(res.data?.data || null);
    } catch { }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/membership/members");
      setMembers(res.data?.data || []);
    } catch { }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await api.post("/membership", {
        ...createForm,
        discountValue: Number(createForm.discountValue)
      });
      alert("Membership created");
      setCreateForm({
        name: "",
        discountType: "PERCENT",
        discountValue: "",
        isActive: true
      });
      fetchMembership();
    } catch {
      alert("Create failed");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      name: membership.name,
      discountType: membership.discountType,
      discountValue: membership.discountValue,
      isActive: membership.isActive
    });
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await api.patch("/membership", {
        ...editForm,
        discountValue: Number(editForm.discountValue)
      });
      alert("Membership updated");
      setShowEdit(false);
      fetchMembership();
    } catch {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // 4 march 
  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this membership? This cannot be undone.",
      )
    )
      return;

    try {
      setLoading(true);
      await api.delete("/membership"); // Assuming your endpoint is DELETE /api/membership
      alert("Membership deleted successfully");
      setMembership(null);
      setShowEdit(false);
      fetchMembership();
    } catch (error) {
      alert("Delete failed. Make sure the endpoint is correct.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (members.length === 0) return alert("No members to export");

    // Define headers
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Joined Date",
    ];

    // Map member data to rows
    const rows = members.map((m) => [
      m.firstName,
      m.lastName,
      m.email,
      m.phoneNumber || "N/A",
      new Date(m.createdAt).toLocaleDateString("en-IN"),
    ]);

    // Combine headers and rows into CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create a download link and click it
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Members_List_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <BadgePercent className="text-primary" />
        <h1 className="text-2xl font-black tracking-tight">
          Membership Management
        </h1>
      </div>

      {/* CREATE MEMBERSHIP */}
      <div className="bg-white border rounded-2xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Edit2 size={16} /> Create Membership
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Membership Name
            </label>
            <input
              className="w-full mt-1 border rounded-xl px-4 py-2.5"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Discount Type
            </label>
            {/* 4 march */}
            {/* <select
              className="w-full mt-1 border rounded-xl px-4 py-2.5"
              value={createForm.discountType}
              onChange={(e) =>
                setCreateForm({ ...createForm, discountType: e.target.value })
              }
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select> */}
            <input
              className="w-full mt-1 border rounded-xl px-4 py-2.5 bg-gray-100"
              value="Percentage (%)"
              disabled
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Discount Value
            </label>
            <input
              type="number"
              className="w-full mt-1 border rounded-xl px-4 py-2.5"
              value={createForm.discountValue}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  discountValue: e.target.value
                })
              }
            />
          </div>

          {/* 4 march
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={createForm.isActive}
              onChange={(e) =>
                setCreateForm({ ...createForm, isActive: e.target.checked })
              }
            />
            Active Membership
          </label>
          */}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Save size={14} /> Create Membership
        </button>
      </div>

      {/* ACTIVE MEMBERSHIP */}
      {membership && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">{membership.name}</h3>
            <p className="text-sm text-slate-500">
              {membership.discountType === "PERCENT"
                ? `${membership.discountValue}% Discount`
                : `₹${membership.discountValue} Discount`}
            </p>
            <span className="inline-block mt-2 text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
              ACTIVE
            </span>
          </div>

          <button
            onClick={openEdit}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <MoreVertical />
          </button>
        </div>
      )}

      {/* EDIT MEMBERSHIP */}
      {showEdit && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Update Membership</h2>
            <button onClick={() => setShowEdit(false)}>
              <X />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              className="border rounded-xl px-4 py-2.5"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            {/* 4 March */}
            {/* <select
              className="border rounded-xl px-4 py-2.5"
              value={editForm.discountType}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  discountType: e.target.value
                })
              }
            >
              <option value="PERCENT">Percentage</option>
              <option value="FLAT">Flat</option>
            </select> */}

            <input
              className="border rounded-xl px-4 py-2.5 bg-gray-100"
              value="Percentage (%)"
              disabled
            />
            <input
              type="number"
              className="border rounded-xl px-4 py-2.5"
              value={editForm.discountValue}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  discountValue: e.target.value
                })
              }
            />
          </div>

          {/*\
          4 march

          <button
            onClick={handleUpdate}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Save size={14} /> Update Membership
          </button>
          */} 
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Save size={14} /> Update Membership
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-rose-50 text-rose-600 border border-rose-100 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-100 transition-all"
            >
              <Trash2 size={14} /> Delete Membership
            </button>
          </div>
        </div>
      )}

      {/* MEMBERS LIST */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        
        {/* 4 march */}
        {/* <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Users /> Members ({members.length})
        </h2> */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users /> Members ({members.length})
          </h2>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {members.length === 0 ? (
          <p className="text-center text-slate-400 py-6">
            No members yet
          </p>
        ) : (
          <div className="space-y-3">
            {/* TABLE HEADINGS */}
            <div className="hidden md:grid grid-cols-4 gap-3 px-4 pb-2 mb-2 border-b text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Joined On</div>
            </div>

            {members.map((m) => (
              <div
                key={m._id}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4  rounded-xl text-sm"
              >
                <div className="font-semibold">
                  {m.firstName} {m.lastName}
                </div>
                <div className="text-slate-600 break-all">
                  {m.email}
                </div>
                <div className="text-slate-600">
                  {m.phoneNumber || "-"}
                </div>
                <div className="text-slate-500">
                  {new Date(m.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
