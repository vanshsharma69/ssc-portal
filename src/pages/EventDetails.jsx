import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useAttendance } from "../context/AttendanceContext";
import Modal from "../components/Modal";

export default function EventDetails() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { members } = useMembers();
  const { getEventById, fetchEvent, events, deleteEvent } = useEvents();
  const {
    eventAttendance,
    refreshEventAttendance,
    createEventAtt,
    updateEventAtt,
    deleteEventAtt,
  } = useAttendance();

  const [event, setEvent] = useState(state?.event || null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ memberId: "", attended: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ FIXED — Only use numeric eventId
  const resolveEventId = () => {
    return Number(state?.event?.eventId ?? id);
  };

  const eventId = resolveEventId();

  useEffect(() => {
    if (!eventId) {
      setError("Invalid event id");
      return;
    }

    const existing = getEventById(eventId);

    if (existing) {
      setEvent(existing);
    } else {
      fetchEvent(eventId)
        .then(setEvent)
        .catch(() => setError("Event not found"));
    }
  }, [eventId, state, getEventById, fetchEvent]);

  useEffect(() => {
    refreshEventAttendance();
  }, [refreshEventAttendance]);

  useEffect(() => {
    const updated = getEventById(eventId);
    if (updated) setEvent(updated);
  }, [events, getEventById, eventId]);

  // Assigned Members
  const assigned = useMemo(() => {
    return eventAttendance
      .filter((ea) => Number(ea.eventId) === Number(eventId))
      .map((ea) => ({
        ...ea,
        member: members.find((m) => Number(m.memberId ?? m.id) === Number(ea.memberId)),
      }))
      .filter((ea) => ea.member);
  }, [eventAttendance, members, eventId]);

  const availableMembers = useMemo(() => {
    const list = members.filter((m) => {
      const mid = Number(m.memberId ?? m.id);
      return !assigned.some((rec) => Number(rec.memberId) === mid);
    });

    return list.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [members, assigned]);

  if (!event && !error) {
    return <h1 className="text-xl font-bold mt-10 text-center">Loading event...</h1>;
  }

  if (error || !event) {
    return (
      <h1 className="text-xl font-bold mt-10 text-center text-red-600">
        {error || "Event Not Found"}
      </h1>
    );
  }

  // ---------------- ACTIONS ---------------- //

  const assignMember = async () => {
    const memberIdNum = Number(assignForm.memberId);
    if (!memberIdNum) return alert("Select valid member");

    setBusy(true);
    try {
      await createEventAtt({
        memberId: memberIdNum,
        eventId: eventId, // ALWAYS NUMBER
        attended: assignForm.attended,
      });
      setAssignForm({ memberId: "", attended: false });
      setShowAssign(false);
    } catch {
      alert("Failed to assign member");
    } finally {
      setBusy(false);
    }
  };

  const toggleAttendance = async (rec) => {
    const attId = rec.id ?? rec._id;
    if (!attId) return alert("Invalid attendance record");

    setBusy(true);
    try {
      await updateEventAtt(attId, {
        attended: !rec.attended,
      });
    } catch {
      alert("Failed to update attendance");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (rec) => {
    if (!confirm("Remove this member?")) return;

    const attId = rec.id ?? rec._id;
    if (!attId) return alert("Invalid attendance record");

    setBusy(true);
    try {
      await deleteEventAtt(attId);
    } catch {
      alert("Failed to remove member");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("Delete event?")) return;

    setBusy(true);
    try {
      await deleteEvent(eventId);
      navigate("/events");
    } catch {
      alert("Failed to delete event");
    } finally {
      setBusy(false);
    }
  };

  // ---------------- UI ---------------- //
  return (
    <>
      <div className="max-w-6xl mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">{event.name}</h1>

        <div className="bg-white p-6 rounded-xl shadow mb-10 border">
          <p className="text-lg">
            <span className="font-semibold">Event Type:</span>{" "}
            {event.type || "General"}
          </p>

          <p className="text-lg mt-1">
            <span className="font-semibold">Assigned Members:</span>{" "}
            {assigned.length}
          </p>

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAssign(true)}
                className="px-4 py-2 bg-black text-white rounded-lg"
              >
                + Assign Member
              </button>

              <button
                onClick={handleDeleteEvent}
                disabled={busy}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-60"
              >
                {busy ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-semibold mb-4">Assigned Members</h2>

        <div className="bg-white p-6 rounded-xl shadow border">
          {assigned.length === 0 ? (
            <p className="text-gray-600">No members assigned.</p>
          ) : (
            <ul className="space-y-4">
              {assigned.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={record.member.img}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold">{record.member.name}</p>
                      <p className="text-gray-500 text-sm">{record.member.role}</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          record.attended ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {record.attended ? "Attended" : "Not Attended"}
                      </p>
                    </div>
                  </div>

                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAttendance(record)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        Toggle
                      </button>

                      <button
                        onClick={() => removeMember(record)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        open={showAssign}
        title="Assign Member"
        onClose={() => setShowAssign(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 border rounded" onClick={() => setShowAssign(false)}>
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-black text-white rounded"
              onClick={assignMember}
              disabled={busy}
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        <label className="block text-sm font-medium">Member</label>
        <select
          className="w-full border p-2 rounded"
          value={assignForm.memberId}
          onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
        >
          <option value="">Select member</option>
          {availableMembers.map((m) => (
            <option key={m.id} value={m.memberId ?? m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            checked={assignForm.attended}
            onChange={(e) => setAssignForm({ ...assignForm, attended: e.target.checked })}
          />
          Mark attended
        </label>
      </Modal>
    </>
  );
}
