import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import Modal from "../components/Modal";

export default function Members() {
  const { user } = useAuth();
  const { members, loading, error, refresh, createMember, deleteMember } = useMembers();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "member", memberId: "", password: "" });
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = members.filter((m) => {
      if (!query) return true;
      const haystack = [m.name, m.role, m.email, m.memberId].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "points") return (Number(b.points) || 0) - (Number(a.points) || 0);
      if (sortBy === "recent") return (new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [members, search, sortBy]);

  const addMember = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name || !form.email) return alert("Name and email are required");
    if (!form.memberId) return alert("Member ID is required");
    const memberIdNum = Number(form.memberId);
    if (Number.isNaN(memberIdNum)) return alert("Member ID must be a number");

    try {
      setBusyId("create");

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("role", form.role);
      payload.append("memberId", memberIdNum);
      if (form.password) payload.append("password", form.password);
      if (imageFile) payload.append("img", imageFile);

      await createMember(payload);
      setShowAdd(false);
      const createdEmail = form.email;
      const createdPassword = form.password;
      setForm({ name: "", email: "", role: "member", memberId: "", password: "" });
      setImageFile(null);

      // Redirect new member to login with prefilled credentials set by admin
      if (createdEmail && createdPassword) {
        navigate("/login", { state: { email: createdEmail, password: createdPassword } });
      }
    } catch (err) {
      alert(err?.message || "Failed to create member");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this member?")) return;
    try {
      setBusyId(id);
      await deleteMember(id);
    } catch (err) {
      alert(err?.message || "Failed to delete member");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6 ">
        <h1 className="text-3xl font-bold">Members</h1>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:items-center">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm w-full md:w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none text-sm"
              placeholder="Search by name, role, email..."
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border rounded-lg px-3 py-2 shadow-sm text-sm"
          >
            <option value="name">Sort by Name (A-Z)</option>
            <option value="points">Sort by Points</option>
            <option value="recent">Sort by Recent</option>
          </select>

          {(user?.role === "superadmin" || user?.role === "admin") && (
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-black text-white rounded-lg shadow hover:opacity-80 transition"
            >
              + Add Member
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-gray-600">Loading members...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && members.length === 0 && (
        <p className="text-gray-600">No members found.</p>
      )}

      {/* MEMBERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8  p-4 rounded-xl">
        {filteredMembers.map((m) => (
          <div
            key={m.id}
            className="bg-white border hover:shadow-lg p-4 rounded-xl transition relative"
          >
            {/* Link to Details */}
            <Link to={`/members/${m.id}`} state={{ m }}>
              <img
                src={m.img}
                alt={m.name}
                className="w-full h-80 object-cover rounded-xl"
              />

              <h2 className="text-xl font-bold mt-3">{m.name}</h2>
              <p className="text-gray-600">{m.role}</p>
            </Link>

            {/* CRUD BUTTONS */}
            {(user?.role === "superadmin" || user?.role === "admin" || String(user?.id) === String(m.id)) && (
              <div className="flex gap-3 mt-4">
                <Link
                  to={`/members/${m.id}`}
                  state={{ m, editMode: true }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                >
                  Edit
                </Link>

                {(user?.role === "superadmin" || user?.role === "admin") && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={busyId === m.id}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded disabled:opacity-60"
                  >
                    {busyId === m.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <Modal
      open={showAdd}
      title="Add Member"
      onClose={() => setShowAdd(false)}
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowAdd(false)}
            type="button"
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>
          <button
            onClick={addMember}
            disabled={busyId === "create"}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {busyId === "create" ? "Creating..." : "Create"}
          </button>
        </div>
      )}
    >
      <form className="space-y-3" onSubmit={addMember}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border p-2"
            placeholder="Member name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border p-2"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border p-2"
              placeholder="member"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member ID</label>
            <input
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="w-full rounded-lg border p-2"
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border p-2"
            placeholder="Set login password"
          />
          <p className="text-xs text-gray-500 mt-1">If left blank, backend default rules apply.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border p-2"
          />
          <p className="text-xs text-gray-500 mt-1">Images upload to the backend (Cloudinary).</p>
        </div>
      </form>
    </Modal>
    </>
  );
}
