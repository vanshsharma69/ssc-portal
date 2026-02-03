import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { formatDate } from "../utils/date";

export default function Events() {
  const { user } = useAuth();
  const { members } = useMembers();
  const { events, loading, error, refresh, createEvent } = useEvents();
  const { eventAttendance, refreshEventAttendance } = useAttendance();

  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    venue: "",
  });

  useEffect(() => {
    refresh();
    refreshEventAttendance();
  }, [refresh, refreshEventAttendance]);

  const eventList = useMemo(() => {
    return events.map((ev) => {
      const eidRaw = ev.eventId ?? ev.id ?? ev._id;
      const eidNum = Number(eidRaw);
      const eid = Number.isNaN(eidNum) ? eidRaw : eidNum;

      const assignedMembers = eventAttendance
        .filter((a) => String(a.eventId) === String(eid))
        .map((a) => {
          const member = members.find(
            (m) => String(m.memberId ?? m.id) === String(a.memberId)
          );
          return { ...a, member };
        })
        .filter((a) => a.member);

      return {
        ...ev,
        eventId: eid,
        assignedMembers,
      };
    });
  }, [events, eventAttendance, members]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.venue)
      return alert("Name, date, and venue are required");

    try {
      setBusy(true);
      await createEvent({
        ...form,
        assignedMembers: Array.isArray(form.assignedMembers)
          ? form.assignedMembers
              .map((id) => Number(id))
              .filter((n) => !Number.isNaN(n))
          : [],
      });

      setForm({ name: "", description: "", date: "", venue: "" });
      setShowAdd(false);
    } catch (err) {
      alert(err?.message || "Failed to create event");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Events</h1>

        {(user?.role === "superadmin" || user?.role === "admin") && (
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-black text-white rounded-lg shadow hover:opacity-80 transition"
          >
            + Add Event
          </button>
        )}
      </div>

      {loading && <p className="text-gray-600">Loading events...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {eventList.length === 0 && !loading ? (
        <p className="text-gray-600">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {eventList.map((ev) => (
            <Link
              key={ev.eventId}
              to={`/events/${ev.eventId}`}
              state={{ event: ev }}
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 cursor-pointer">
                
                {/* Icon + Name */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-gray-100">
                    <CalendarDays className="w-6 h-6 text-gray-700" />
                  </div>
                  <h2 className="text-xl font-semibold">{ev.name}</h2>
                </div>

                <div className="w-full h-px bg-gray-200 my-4"></div>

                {/* Event Info */}
                <div className="space-y-2 text-gray-700 text-sm">
                  <p>
                    <span className="font-semibold">Assigned Members:</span>{" "}
                    {ev.assignedMembers.length}
                  </p>

                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDate(ev.date)}
                  </p>

                  <p>
                    <span className="font-semibold">Venue:</span> {ev.venue}
                  </p>
                </div>

                {/* Members Preview */}
                <div className="flex mt-4 -space-x-3">
                  {ev.assignedMembers.slice(0, 3).map((m, i) => (
                    <img
                      key={i}
                      src={m.member?.img}
                      className="w-10 h-10 rounded-full border-2 border-white shadow"
                    />
                  ))}

                  {ev.assignedMembers.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                      +{ev.assignedMembers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showAdd}
        title="Add Event"
        onClose={() => setShowAdd(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAdd(false)}
              type="button"
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={busy}
              type="button"
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create"}
            </button>
          </div>
        }
      >
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              className="w-full rounded-lg border p-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full rounded-lg border p-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border p-2"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Venue</label>
              <input
                className="w-full rounded-lg border p-2"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
