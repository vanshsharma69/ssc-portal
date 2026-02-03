import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useMembers } from "../context/MembersContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

export default function Attendance() {
  const { members, loading, error } = useMembers();
  const { user } = useAuth();
  const { daily, loading: attLoading, error: attError, createDaily, bulkMarkDailyPresent } = useAttendance();
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ memberId: "", date: "", present: true });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const attendanceView = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = members.map((m) => {
      const memberKey = m.memberId ?? m.id;
      const memberDaily = (daily || []).filter((a) => String(a.memberId) === String(memberKey));
      const total = memberDaily.length;
      const present = memberDaily.filter((a) => a.present).length;
      const percent = total ? Math.round((present / total) * 100) : 0;
      return { member: m, total, present, percent };
    });

    const filtered = list.filter(({ member }) => {
      if (!query) return true;
      const haystack = [member.name, member.role, member.email, member.memberId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "attendance") return b.percent - a.percent;
      return String(a.member.name || "").localeCompare(String(b.member.name || ""));
    });
  }, [members, daily, search, sortBy]);

  return (
    <>
    <div>
      <h1 className="text-3xl font-bold mb-6">Attendance</h1>

      {(loading || attLoading) && <p className="text-gray-600">Loading attendance...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {attError && <p className="text-red-600">{attError}</p>}

      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            Member Attendance Overview
          </h2>

          <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 shadow-sm w-full md:w-72">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none text-sm bg-transparent"
                placeholder="Search members..."
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border rounded-lg px-3 py-2 shadow-sm text-sm"
            >
              <option value="name">Sort by Name (A-Z)</option>
              <option value="attendance">Sort by Attendance %</option>
            </select>

            {(user?.role === "superadmin" || user?.role === "admin") && (
              <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 bg-black text-white rounded-lg shadow hover:opacity-85 transition"
              >
                + Add Attendance
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {attendanceView.map(({ member: m, total, present, percent }) => (
            <Link
              key={m.id}
              to={`/attendance/${m.id}`}
              state={{ member: m }}
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 
                  hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer">

                {/* HEADER: User */}
                <div className="flex items-center gap-4">
                  <img
                    src={m.img}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  />
                  <div>
                    <p className="font-semibold text-lg">{m.name}</p>
                    <p className="text-sm text-gray-600">{m.role}</p>
                  </div>
                </div>

                {/* ATTENDANCE SECTION */}
                <div className="mt-5 space-y-2 text-gray-700 text-sm">

                  {/* Percentage Badge */}
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold 
                      bg-gray-100 text-gray-800 border border-gray-300">
                    {percent}% Attendance
                  </div>

                  <p>
                    <span className="font-semibold">Present:</span> {present} days
                  </p>
                  <p>
                    <span className="font-semibold">Absent:</span> {total - present} days
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    
      <Modal
        open={showAdd}
        title="Add Daily Attendance"
        onClose={() => setShowAdd(false)}
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAdd(false)} type="button" className="px-4 py-2 rounded border">
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!form.date) return alert("Date is required");
                const selected = selectedMembers.length ? selectedMembers : form.memberId ? [form.memberId] : [];
                const allIds = members.map((m) => String(m.memberId ?? m.id));
                const presentIds = selected.map((t) => String(t));
                const absentIds = allIds.filter((id) => !presentIds.includes(id));

                try {
                  setBusy(true);

                  // mark selected as present
                  if (presentIds.length > 0) {
                    const presentNum = presentIds.map((t) => Number(t)).filter((n) => !Number.isNaN(n));
                    await bulkMarkDailyPresent({ date: form.date, memberIds: presentNum });
                  }

                  // mark others as absent
                  if (absentIds.length > 0) {
                    const absentNum = absentIds.map((t) => Number(t)).filter((n) => !Number.isNaN(n));
                    // create entries as absent for each
                    const ops = absentNum.map((idVal) =>
                      createDaily({ memberId: idVal, date: form.date, present: false })
                    );
                    await Promise.all(ops);
                  }

                  setForm({ memberId: "", date: "", present: true });
                  setSelectedMembers([]);
                  setShowAdd(false);
                } catch (err) {
                  alert(err?.message || "Failed to add attendance");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              type="button"
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Members</label>
            <div className="max-h-48 overflow-auto border rounded-lg p-3 space-y-2">
              {members.map((m) => {
                const idStr = String(m.memberId ?? m.id);
                const checked = selectedMembers.includes(idStr);
                return (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedMembers((prev) =>
                          e.target.checked
                            ? [...prev, idStr]
                            : prev.filter((id) => id !== idStr)
                        );
                      }}
                    />
                    <span>{m.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border p-2"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 mt-6 md:mt-8">
              <input
                id="present"
                type="checkbox"
                checked={form.present}
                onChange={(e) => setForm({ ...form, present: e.target.checked })}
              />
              <label htmlFor="present" className="text-sm text-gray-700">Marked Present</label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
