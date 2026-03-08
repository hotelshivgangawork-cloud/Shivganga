import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Pencil, Trash2, Users, Eye, EyeOff } from "lucide-react";
import API from "../../axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ================= API CONFIG ================= */

/* ================= HELPER FUNCTIONS ================= */
const formatIndianPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/* ================= MOTION VARIANTS ================= */
const rowVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalBox = {
  hidden: { scale: 0.92, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 220, damping: 18 },
  },
};

/* ================= ROLES DROPDOWN OPTIONS ================= */
const ROLE_OPTIONS = [
  { value: "receptionist", label: "Receptionist" },
  { value: "front_desk", label: "Front Desk" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "kitchen", label: "Kitchen" },
  { value: "security", label: "Security" },
  { value: "management", label: "Management" },
];

/* ================= COMPONENT ================= */
export default function Receptionists() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    basicSalary: "",
    role: "receptionist",
  });
  const [showPassword, setShowPassword] = useState(false);

  /* ================= FETCH RECEPTIONISTS ================= */
  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const response = await API.get("/staff");
      if (response.data.success) {
        const formattedData = response.data.data.map((staff) => ({
          id: staff.id,
          employeeId: staff.employeeId,
          fullName: staff.name,
          firstName: staff.name.split(" ")[0],
          lastName: staff.name.split(" ").slice(1).join(" "),
          email: staff.email,
          mobile: staff.mobile,
          role: staff.role,
          basicSalary: staff.basicSalary,
          isActive: staff.isActive,
        }));
        setList(formattedData);
      }
    } catch (error) {
      toast.error("Failed to fetch receptionists");
      console.error("Error fetching receptionists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  /* ================= FORM HANDLERS ================= */
  const openCreate = () => {
    setEditingId(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: generatePassword(),
      basicSalary: "",
      role: "receptionist",
    });
    setOpen(true);
  };

  const openEdit = (staff) => {
    setEditingId(staff.id);
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phoneNumber: staff.mobile,
      password: "********", // Empty for edit - user can set new password if needed
      basicSalary: staff.basicSalary ?? "",
      role: staff.role,
    });
    setOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "role") {
        if (value !== "receptionist") {
          next.password = "";
        } else if (!editingId && !next.password) {
          next.password = generatePassword();
        }
      }
      return next;
    });
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  /* ================= API CALLS ================= */
  const createReceptionist = async (staffData) => {
    try {
      const response = await API.post("/receptionist/register", staffData);
      if (response.data.success) {
        toast.success("Receptionist created successfully");
        fetchReceptionists();
        return true;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Staff member already exists");
      } else {
        toast.error("Failed to create receptionist");
      }
      console.error("Error creating receptionist:", error);
      return false;
    }
  };

  // Deprecated: unified to receptionist/register with role-aware payload

  const updateReceptionist = async (id, staffData) => {
    try {
      const response = await API.put(`/receptionists/${id}`, staffData);
      if (response.data.success) {
        toast.success("Receptionist updated successfully");
        return true;
      }
    } catch (error) {
      toast.error("Failed to update receptionist");
      console.error("Error updating receptionist:", error);
      return false;
    }
  };

  // Deprecated: unified to /receptionists/:id

  const deleteReceptionist = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receptionist?")) {
      return;
    }

    try {
      const response = await API.delete(`/receptionist/${id}`);
      if (response.data.success) {
        toast.success("Receptionist deleted successfully");
        fetchReceptionists();
      }
    } catch (error) {
      toast.error("Failed to delete receptionist");
      console.error("Error deleting receptionist:", error);
    }
  };

  const toggleActive = async (staff) => {
    const targetStatus = !staff.isActive;
    const confirmMsg = targetStatus
      ? "Activate this staff member? They will be able to log in to the receptionist dashboard."
      : "Deactivate this staff member? They will no longer be able to log in to the receptionist dashboard.";
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await API.put(`/receptionists/${staff.id}`, {
        isActive: targetStatus,
      });
      if (response.data.success) {
        toast.success(
          `Staff ${targetStatus ? "activated" : "deactivated"} successfully`,
        );
        setList((prev) =>
          prev.map((s) =>
            s.id === staff.id ? { ...s, isActive: targetStatus } : s,
          ),
        );
      }
    } catch (error) {
      toast.error("Failed to update staff status");
      console.error("Error toggling staff active status:", error);
    }
  };

  /* ================= SAVE HANDLER ================= */
  const save = async () => {
    // Validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!form.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!form.basicSalary || form.basicSalary <= 0) {
      toast.error("Valid basic salary is required");
      return;
    }

    // Prepare data for API (unified receptionist register payload)
    const isReceptionist = form.role === "receptionist";
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role,
      basicSalary: Number(form.basicSalary),
    };
    // Include password only for receptionist role
    if (
      isReceptionist &&
      (!editingId || (form.password && form.password !== "********"))
    ) {
      payload.password = form.password.trim();
    }

    setLoading(true);

    if (editingId) {
      // Update existing
      const success = await updateReceptionist(editingId, payload);
      if (success) {
        setList((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, basicSalary: Number(form.basicSalary) }
              : s,
          ),
        );
        setOpen(false);
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: "",
          basicSalary: "",
          role: "receptionist",
        });
      }
    } else {
      // Create new
      const success = await createReceptionist(payload);
      if (success) {
        setOpen(false);
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: generatePassword(),
          basicSalary: "",
          role: "receptionist",
        });
      }
    }

    setLoading(false);
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-5">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="text-primary" />
          <div className="text-sm font-bold uppercase tracking-widest text-gray-600">
            Staff Management
          </div>
          <div className="h-[1px] w-8 bg-accent" />
        </div>

        <button
          onClick={openCreate}
          disabled={loading}
          className="btn-primary px-4 py-2 text-xs flex items-center gap-2 rounded-xl shadow disabled:opacity-50"
        >
          <UserPlus size={14} /> Create Staff
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-x-auto shadow-sm">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-8 px-4 py-3 text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 bg-gray-50">
            <div>Name</div>
            <div>Employee ID</div>
            <div>Email</div>
            <div>Mobile</div>
            <div>Username</div>
            <div>Role</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {loading && list.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Loading staff...
            </div>
          ) : list.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No staff created yet.
            </div>
          ) : (
            list.map((staff) => (
              <motion.div
                key={staff.employeeId}
                variants={rowVariant}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.01 }}
                className="grid grid-cols-8 px-4 py-3 items-center transition bg-white hover:bg-gray-50"
              >
                <div className="font-medium">{staff.fullName}</div>
                <div className="text-primary">{staff.employeeId}</div>
                <div className="truncate">{staff.email}</div>
                <div>{formatIndianPhone(staff.mobile)}</div>
                <div className="text-sm text-gray-600">
                  {staff.email.split("@")[0]}
                </div>
                <div className="text-sm capitalize">
                  {staff.role.replace("_", " ")}
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      staff.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}
                  >
                    {staff.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-3">
                  {/* Edit Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEdit(staff)}
                    className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 shadow-sm"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </motion.button>

                  {/* Delete Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteReceptionist(staff.id)}
                    className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-200 shadow-sm"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </motion.button>

                  {/* Toggle Active Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleActive(staff)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-xl shadow-sm transition-all duration-200 ${
                      staff.isActive
                        ? "bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                        : "bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                    }`}
                  >
                    {staff.isActive ? "Deactivate" : "Activate"}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <motion.div
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50"
        >
          <motion.div
            variants={modalBox}
            initial="hidden"
            animate="visible"
            className="bg-white w-full max-w-2xl rounded-2xl p-5 shadow-xl"
          >
            <div className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-4">
              {editingId ? "Edit Staff" : "Create New Staff"}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* First Name */}
              <div>
                <label className="text-xs text-gray-500">First Name *</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="text-xs text-gray-500">Last Name *</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs text-gray-500">Phone Number *</label>
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary"
                  placeholder="10-digit Indian number"
                  required
                />
              </div>

              {/* Basic Salary */}
              <div>
                <label className="text-xs text-gray-500">Basic Salary *</label>
                <input
                  name="basicSalary"
                  type="number"
                  value={form.basicSalary}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary"
                  min="0"
                  required
                />
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="text-xs text-gray-500">Role *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-2xl text-sm focus:ring-1 focus:ring-primary bg-white"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Field */}
              {form.role === "receptionist" && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">
                    {editingId
                      ? "New Password (leave empty to keep current)"
                      : "Password *"}
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (form.password === "********") {
                          setForm((prev) => ({ ...prev, password: "" }));
                        }
                      }}
                      className="w-full border px-3 py-2 rounded-2xl text-sm pr-10"
                      required={!editingId}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!editingId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Password will be automatically generated and sent to the
                      receptionist's email
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-xs border rounded-2xl hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="btn-primary px-4 py-2 text-xs rounded-2xl disabled:opacity-50"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}