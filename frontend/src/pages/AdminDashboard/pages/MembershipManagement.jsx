import React, { useEffect, useState } from "react";
import {
  Save,
  BadgePercent,
  Users,
  MoreVertical,
  Edit2,
  X
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
            <select
              className="w-full mt-1 border rounded-xl px-4 py-2.5"
              value={createForm.discountType}
              onChange={(e) =>
                setCreateForm({ ...createForm, discountType: e.target.value })
              }
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
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
            <select
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
            </select>
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

          <button
            onClick={handleUpdate}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Save size={14} /> Update Membership
          </button>
        </div>
      )}

      {/* MEMBERS LIST */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Users /> Members ({members.length})
        </h2>

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
