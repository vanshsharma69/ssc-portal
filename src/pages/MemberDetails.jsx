import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import { formatDate } from "../utils/date";

const normalizeMember = (m) => {
  if (!m) return m;
  const id = m.id || m._id;
  const memberId =
    m.memberId !== undefined && m.memberId !== null ? Number(m.memberId) : undefined;
  return { ...m, id, memberId: Number.isNaN(memberId) ? m.memberId : memberId };
};

const memberKey = (m) => m?.id ?? m?._id ?? m?.memberId;

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    members,
    loading: membersLoading,
    getMemberById,
    updateMember,
    deleteMember,
    refresh,
  } = useMembers();

  const [member, setMember] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isAdmin = user && (user.role === "superadmin" || user.role === "admin");

  useEffect(() => {
    const current = getMemberById(id);
    if (current) {
      setMember(normalizeMember(current));
    } else {
      refresh();
    }
  }, [id, getMemberById, refresh]);

  useEffect(() => {
    const latest = getMemberById(id);
    if (latest) setMember(normalizeMember(latest));
  }, [members, id, getMemberById]);

  useEffect(() => {
    if (!newImage) return setImagePreview(null);
    const url = URL.createObjectURL(newImage);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newImage]);

  const memberObj = useMemo(
    () => member || getMemberById(id) || {},
    [member, id, getMemberById]
  );

  const memberExists = useMemo(() => Boolean(memberObj && memberKey(memberObj)), [memberObj]);

  const birthdayValue = (() => {
    if (!memberObj?.birthday) return "";
    const d = new Date(memberObj.birthday);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().substring(0, 10);
  })();

  const updateField = (key, value) => {
    setMember((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const handleSave = async () => {
    setBusy(true);

    try {
      const memberIdValue = Number(memberObj.memberId);
      const common = {
        name: memberObj.name || "",
        role: memberObj.role || "",
        email: memberObj.email,
        points: memberObj.points,
        birthday: memberObj.birthday,
        year: memberObj.year,
        course: memberObj.course,
        instagram: memberObj.instagram,
        bio: memberObj.bio,
        branch: memberObj.branch,
        roll: memberObj.roll,
      };

      if (!Number.isNaN(memberIdValue)) {
        common.memberId = memberIdValue;
      }

      const hasNewImage = Boolean(newImage);
      const payload = hasNewImage ? new FormData() : common;

      if (hasNewImage) {
        Object.entries(common).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            payload.append(key, value);
          }
        });
        payload.append("img", newImage);
      }

      const updated = await updateMember(memberKey(memberObj), payload);

      setMember(normalizeMember(updated || memberObj));
      setEditMode(false);
      setNewImage(null);
    } catch (err) {
      alert(err?.message || "Error saving changes");
    }

    setBusy(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    setBusy(true);

    try {
      await deleteMember(memberKey(memberObj));
      navigate("/members");
    } catch (err) {
      alert(err?.message || "Error deleting member");
    }

    setBusy(false);
  };

  if (!memberObj?.name) {
    if (!memberExists && membersLoading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center text-gray-700">
          Loading member details...
        </div>
      );
    }

    if (!memberExists) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl shadow p-10">
          <h1 className="text-2xl font-bold text-gray-900">Member not found</h1>
          <p className="text-gray-600 max-w-md">
            We could not locate this member. It may have been removed or you may not have access.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
              type="button"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate("/members")}
              className="px-4 py-2 rounded-lg bg-black text-white shadow hover:bg-gray-800 transition"
              type="button"
            >
              View Members
            </button>
          </div>
        </div>
      );
    }
  }

  const displayedImg = imagePreview || memberObj.img;
  const today = new Date().toISOString().substring(0, 10);

  const displayName = memberObj.name || "Unnamed Member";
  const displayRole = memberObj.role || "Member";
  const displayMemberId = memberObj.memberId ?? memberObj.id ?? "—";
  const displayYear = memberObj.year || "Year N/A";
  const displayCourse = memberObj.course || "Course N/A";
  const displayBranch = memberObj.branch || "Branch N/A";
  const displayPoints = Number(memberObj.points) || 0;

  // ✨ Nice UI classes
  const valueClass = "text-gray-900";
  const inputClass =
    "border rounded-lg p-2 text-gray-900 w-full bg-gray-50 focus:ring-2 focus:ring-black focus:outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white">
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Profile</p>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Member Details</h1>
            <p className="text-gray-600 mt-1">Review and update core member information.</p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-3">
              <button
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white shadow-sm hover:-translate-y-[1px] hover:shadow-md transition"
                disabled={busy}
                onClick={() => setEditMode((prev) => !prev)}
                type="button"
              >
                {editMode ? "Cancel" : "Edit"}
              </button>

              <button
                className="px-5 py-2 rounded-lg bg-black text-white shadow hover:bg-gray-800 transition disabled:opacity-60"
                disabled={busy || !editMode}
                onClick={handleSave}
                type="button"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>

              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white shadow hover:bg-red-700 transition disabled:opacity-60"
                disabled={busy}
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs uppercase text-gray-500">Points</p>
            {editMode ? (
              <input
                type="number"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-lg font-semibold text-gray-900"
                value={memberObj.points ?? ""}
                onChange={(e) => updateField("points", e.target.value)}
                placeholder="0"
              />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 mt-1">{displayPoints}</p>
            )}
            <p className="text-sm text-gray-500">Achievement</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs uppercase text-gray-500">Member ID</p>
            {editMode ? (
              <input
                type="text"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-lg font-semibold text-gray-900"
                value={memberObj.memberId ?? ""}
                onChange={(e) => updateField("memberId", e.target.value)}
                placeholder="ID"
              />
            ) : (
              <p className="text-xl font-semibold text-gray-900 mt-1">{displayMemberId}</p>
            )}
            <p className="text-sm text-gray-500">Unique identifier</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs uppercase text-gray-500">Year</p>
            {editMode ? (
              <select
                value={memberObj.year || ""}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-lg text-gray-900"
                onChange={(e) => updateField("year", e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            ) : (
              <p className="text-xl font-semibold text-gray-900 mt-1">{displayYear}</p>
            )}
            <p className="text-sm text-gray-500">Academic</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs uppercase text-gray-500">Course / Branch</p>
            {editMode ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
                  value={memberObj.course || ""}
                  onChange={(e) => updateField("course", e.target.value)}
                  placeholder="Course"
                />
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900"
                  value={memberObj.branch || ""}
                  onChange={(e) => updateField("branch", e.target.value)}
                  placeholder="Branch"
                />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900 mt-1">{displayCourse}</p>
                <p className="text-sm text-gray-500">{displayBranch}</p>
              </>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col md:flex-row gap-12 border border-gray-100">
          {/* Left - Image */}
          <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={displayedImg}
                alt={displayName}
                className="w-100 h-100 object-cover rounded-lg shadow-md border"
              />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black text-white text-xs shadow">
                {displayRole}
              </span>
            </div>

            {editMode && (
              <input
                type="file"
                accept="image/*"
                className="mt-3 w-full border border-gray-300 p-2 rounded-lg"
                onChange={(e) => setNewImage(e.target.files?.[0] || null)}
              />
            )}
          </div>

          {/* Right - Information */}
          <div className="w-full md:w-1/2 space-y-6">
            {/* Name + Role */}
            <div className="space-y-2">
              {!editMode ? (
                <h2 className="text-3xl font-bold text-gray-900">{displayName}</h2>
              ) : (
                <input
                  type="text"
                  value={memberObj.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={`${inputClass} text-2xl`}
                  placeholder="Enter member name"
                />
              )}

              {!editMode ? (
                <p className="text-gray-600 text-lg">{displayRole}</p>
              ) : (
                <input
                  type="text"
                  value={memberObj.role || ""}
                  onChange={(e) => updateField("role", e.target.value)}
                  className={`${inputClass} text-lg`}
                  placeholder="Role / Position (e.g., President, Web Dev Head)"
                />
              )}
            </div>

            {/* Details list */}
            <div className="space-y-3">
              {[{
                label: "Member ID",
                render: () => <p className={valueClass}>{displayMemberId}</p>,
              },
              {
                label: "Email",
                render: () => <p className={valueClass}>{memberObj.email || "Not provided"}</p>,
              },
              {
                label: "Achievement Points",
                render: () => (!editMode ? (
                  <p className={valueClass}>{displayPoints}</p>
                ) : (
                  <input
                    type="number"
                    className={inputClass}
                    value={memberObj.points ?? ""}
                    onChange={(e) => updateField("points", e.target.value)}
                    placeholder="0"
                  />
                )),
              },
              {
                label: "Birthday",
                render: () => (!editMode ? (
                  <p className={valueClass}>{formatDate(memberObj.birthday)}</p>
                ) : (
                  <input
                    type="date"
                    className={inputClass}
                    max={today}
                    value={birthdayValue}
                    onChange={(e) => updateField("birthday", e.target.value)}
                  />
                )),
              },
              {
                label: "College Year",
                render: () => (!editMode ? (
                  <p className={valueClass}>{displayYear}</p>
                ) : (
                  <select
                    value={memberObj.year || ""}
                    className={inputClass}
                    onChange={(e) => updateField("year", e.target.value)}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                )),
              },
              {
                label: "Course",
                render: () => (!editMode ? (
                  <p className={valueClass}>{displayCourse}</p>
                ) : (
                  <input
                    type="text"
                    className={inputClass}
                    value={memberObj.course || ""}
                    onChange={(e) => updateField("course", e.target.value)}
                    placeholder="Course"
                  />
                )),
              },
              {
                label: "Instagram",
                render: () => (!editMode ? (
                  <p className={valueClass}>{memberObj.instagram || "N/A"}</p>
                ) : (
                  <input
                    type="text"
                    className={inputClass}
                    value={memberObj.instagram || ""}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="@handle"
                  />
                )),
              },
              {
                label: "Bio",
                render: () => (!editMode ? (
                  <p className={valueClass}>{memberObj.bio || "N/A"}</p>
                ) : (
                  <textarea
                    className={inputClass}
                    value={memberObj.bio || ""}
                    onChange={(e) => updateField("bio", e.target.value)}
                    placeholder="Short bio"
                  />
                )),
              },
              {
                label: "Branch",
                render: () => (!editMode ? (
                  <p className={valueClass}>{displayBranch}</p>
                ) : (
                  <input
                    type="text"
                    className={inputClass}
                    value={memberObj.branch || ""}
                    onChange={(e) => updateField("branch", e.target.value)}
                    placeholder="Branch"
                  />
                )),
              },
              {
                label: "University Roll No",
                render: () => (!editMode ? (
                  <p className={valueClass}>{memberObj.roll || "N/A"}</p>
                ) : (
                  <input
                    type="text"
                    className={inputClass}
                    value={memberObj.roll || ""}
                    onChange={(e) => updateField("roll", e.target.value)}
                    placeholder="Roll number"
                  />
                )),
              }].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm uppercase tracking-wide text-gray-500">{row.label}</span>
                  <div className="text-right w-1/2 sm:w-auto">{row.render()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
