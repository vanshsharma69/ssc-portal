import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Modal from "../components/Modal";
import { useAttendance } from "../context/AttendanceContext";
import { useEvents } from "../context/EventsContext";
import { formatDate } from "../utils/date";

const normalizeMember = (m) => {
  if (!m) return m;
  const id = m.memberId ?? m.id ?? m._id;
  return { ...m, id };
};

export default function AttendanceDetails() {
  const { state } = useLocation();
  const { user } = useAuth();
  const {
    daily,
    eventAttendance,
    loading,
    error,
    createDaily,
    updateDaily,
    deleteDaily,
    createEventAtt,
    updateEventAtt,
    deleteEventAtt,
  } = useAttendance();

  const { events, loading: eventsLoading, error: eventsError } = useEvents();

  const eventsList = events || [];
  const member = normalizeMember(state?.member);

  const memberKey = member?.memberId ?? member?.id;

  const memberDaily = (daily || []).filter(
    (d) => String(d.memberId) === String(memberKey)
  );
  const memberEventAttendance = (eventAttendance || []).filter(
    (e) => String(e.memberId) === String(memberKey)
  );

  const [showDay, setShowDay] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [dayForm, setDayForm] = useState({ date: "", present: true });
  const [eventForm, setEventForm] = useState({ eventId: "", attended: true });

  if (!member) {
    return <h1 className="text-xl font-bold text-center mt-10">Member not found</h1>;
  }

  // SUMMARY
  const totalDays = memberDaily.length;
  const presentDays = memberDaily.filter((d) => d.present).length;
  const percent = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;

  const addNewDay = async () => {
    if (!dayForm.date) return alert("Date is required");
    await createDaily({
      memberId: Number(memberKey),
      date: dayForm.date,
      present: dayForm.present,
    });
    setDayForm({ date: "", present: true });
    setShowDay(false);
  };

  const recordKey = (rec) => rec?.id ?? rec?._id;

  const deleteDay = async (index) => {
    const entry = memberDaily[index];
    if (!entry) return;
    const id = recordKey(entry);
    if (!id) return alert("Missing id for this entry");
    if (!confirm("Delete this entry?")) return;
    await deleteDaily(id);
  };

  const toggleDay = (index) => {
    const entry = memberDaily[index];
    const id = recordKey(entry);
    if (!id) return;
    updateDaily(id, { present: !entry.present });
  };

  const addNewEvent = async () => {
    const eventIdNum = Number(eventForm.eventId);

    // FIXED lookup
    const eventObj = eventsList.find((e) => Number(e.eventId) === eventIdNum);

    if (!eventObj) return alert("Select a valid event");

    await createEventAtt({
      memberId: Number(memberKey),
      eventId: eventIdNum, // FIXED ✔ numeric
      attended: eventForm.attended,
    });

    setEventForm({ eventId: "", attended: true });
    setShowEvent(false);
  };

  const deleteEvent = async (index) => {
    const entry = memberEventAttendance[index];
    if (!entry) return;
    const id = recordKey(entry);
    if (!id) return alert("Missing id for this entry");
    if (!confirm("Delete this event attendance?")) return;
    await deleteEventAtt(id);
  };

  const toggleEvent = (index) => {
    const entry = memberEventAttendance[index];
    const id = recordKey(entry);
    if (!id) return;
    updateEventAtt(id, { attended: !entry.attended });
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Attendance Details</h1>

      {/* MEMBER CARD */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-6 shadow rounded-lg mb-10">
        <img src={member.img} alt={member.name} className="w-36 h-36 rounded-full shadow object-contain" />

        <div>
          <h2 className="text-2xl font-bold">{member.name}</h2>
          <p className="text-gray-600">{member.role}</p>

          <div className="mt-4 text-gray-700 space-y-1">
            <p><strong>Attendance %:</strong> {percent}%</p>
            <p><strong>Present:</strong> {presentDays} days</p>
            <p><strong>Absent:</strong> {totalDays - presentDays} days</p>
          </div>
        </div>
      </div>

      {(loading || eventsLoading) && (
        <p className="text-gray-600 mb-4">Loading attendance...</p>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {eventsError && <p className="text-red-600 mb-4">{eventsError}</p>}

      {/* DAILY ATTENDANCE */}
      <div className="bg-white p-6 rounded-lg shadow mb-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Daily Attendance</h3>

          {user?.role === "superadmin" && (
            <button onClick={() => setShowDay(true)} className="px-4 py-2 bg-black text-white rounded-lg">
              + Add Day
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {memberDaily.map((d, i) => (
            <li key={d.id || i} className="flex justify-between items-center p-3 bg-gray-50 border rounded">
              <span>{formatDate(d.date)}</span>

              <div className="flex items-center gap-3">
                <span className={d.present ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {d.present ? "Present" : "Absent"}
                </span>

                {user?.role === "superadmin" && (
                  <>
                    <button onClick={() => toggleDay(i)} className="text-blue-600 text-xs">Toggle</button>
                    <button onClick={() => deleteDay(i)} className="text-red-600 text-xs">Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* EVENT ATTENDANCE */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Event Attendance</h3>

          {user?.role === "superadmin" && (
            <button onClick={() => setShowEvent(true)} className="px-4 py-2 bg-black text-white rounded-lg">
              + Add Event
            </button>
          )}
        </div>

        {memberEventAttendance.length === 0 ? (
          <p className="text-gray-500">No event attendance recorded.</p>
        ) : (
          <ul className="space-y-2">
            {memberEventAttendance.map((e, i) => (
              <li key={e.id || i} className="flex justify-between items-center p-3 bg-gray-50 border rounded">
                {/* FIXED event name resolution */}
                <span>
                  {eventsList.find((evt) => Number(evt.eventId) === Number(e.eventId))?.name ||
                    "Event"}
                </span>

                <div className="flex items-center gap-3">
                  <span className={e.attended ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {e.attended ? "Attended" : "Missed"}
                  </span>

                  {user?.role === "superadmin" && (
                    <>
                      <button onClick={() => toggleEvent(i)} className="text-blue-600 text-xs">Toggle</button>
                      <button onClick={() => deleteEvent(i)} className="text-red-600 text-xs">Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DAILY MODAL */}
      <Modal
        open={showDay}
        title="Add Daily Attendance"
        onClose={() => setShowDay(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDay(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button onClick={addNewDay} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border p-2"
              value={dayForm.date}
              onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="present"
              checked={dayForm.present}
              onChange={(e) => setDayForm({ ...dayForm, present: e.target.checked })}
            />
            <label htmlFor="present" className="text-sm text-gray-700">Marked Present</label>
          </div>
        </div>
      </Modal>

      {/* EVENT MODAL */}
      <Modal
        open={showEvent}
        title="Add Event Attendance"
        onClose={() => setShowEvent(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowEvent(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button onClick={addNewEvent} className="px-4 py-2 rounded-lg bg-black text-white">Save</button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event</label>
            <select
              className="w-full rounded-lg border p-2"
              value={eventForm.eventId}
              onChange={(e) => setEventForm({ ...eventForm, eventId: e.target.value })}
            >
              <option value="">Select event</option>

              {/* FIXED: Use event.eventId (NUMBER) */}
              {eventsList.map((evt) => (
                <option key={evt.eventId} value={evt.eventId}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attended"
              checked={eventForm.attended}
              onChange={(e) => setEventForm({ ...eventForm, attended: e.target.checked })}
            />
            <label htmlFor="attended" className="text-sm text-gray-700">Attended</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
