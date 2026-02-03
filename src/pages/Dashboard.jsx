import { useEffect, useMemo, useState } from "react";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/date";

export default function Dashboard() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers();
  // Projects section removed
  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { loading: attendanceLoading, error: attendanceError } = useAttendance();

  const currentMember = members.find(
    (m) =>
      m?.id === user?.memberId ||
      m?.memberId === user?.memberId ||
      m?.id === user?.id ||
      m?.memberId === user?.id
  );

  const welcomeName = currentMember?.name || user?.name || user?.email || "there";
  const userRole = currentMember?.role || user?.role || "Member";

  const totalMembers = members.length;
  const totalEvents = events.length;

  const birthdaysByDay = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      if (!m?.birthday) return;
      const d = new Date(m.birthday);
      if (Number.isNaN(d.getTime())) return;
      if (d.getMonth() !== monthDate.getMonth()) return;
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(m.name || "Member");
    });
    return map;
  }, [members, monthDate]);

  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [monthDate]);

  // Clear any selected day when the month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [monthDate]);

  const selectedBirthdays = selectedDay ? birthdaysByDay[selectedDay] || [] : [];
  const selectedDateLabel = useMemo(() => {
    if (!selectedDay) return "";
    return formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), selectedDay), {
      formatOptions: { year: "numeric", month: "long", day: "numeric" },
    });
  }, [selectedDay, monthDate]);

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const goMonth = (delta) => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const today = new Date();

  const topMembers = useMemo(
    () => [...members].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 7),
    [members]
  );
  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .slice(0, 3);

  return (
    <div className="text-black">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-700 mt-2 text-xl">Welcome back, <span className="text-red-500">{welcomeName} </span></p>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Members */}
        <div className="bg-white p-5 shadow rounded-xl border">
          <p className="text-gray-500">Total Members</p>
          <h2 className="text-3xl font-bold mt-2">{totalMembers}</h2>
        </div>

        {/* Events */}
        <div className="bg-white p-5 shadow rounded-xl border">
          <p className="text-gray-500">Total Events</p>
          <h2 className="text-3xl font-bold mt-2">{totalEvents}</h2>
        </div>

        {/* You */}
        <div className="bg-white p-5 shadow rounded-xl border">
          <p className="text-gray-500">Logged in as</p>
          <h2 className="text-2xl font-bold mt-2 truncate">{welcomeName}</h2>
          <p className="text-sm text-gray-600 mt-1">{userRole}</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Members (fills height) */}
        <div className="bg-white p-6 rounded-xl shadow border flex flex-col h-full">
          <h2 className="text-2xl font-semibold mb-4">Top Members</h2>
          {topMembers.length === 0 ? (
            <p className="text-gray-600">No members available.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {topMembers.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-4 py-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-semibold">
                    {idx + 1}
                  </div>
                  <img src={m.img} className="w-14 h-14 rounded-full object-cover shadow" />
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">{m.name}</p>
                    <p className="text-sm text-gray-600">{m.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Points</p>
                    <p className="text-lg font-semibold text-gray-900">{m.points}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Birthday Calendar (right on desktop) */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow border">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Birthdays Calendar</h2>
              <p className="text-gray-600">Switch months to see upcoming birthdays.</p>
              <p className="text-sm text-gray-500 mt-1">
                Today: {formatDate(today, { formatOptions: { year: "numeric", month: "long", day: "numeric" } })}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => goMonth(-1)}
                className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 text-sm"
                type="button"
              >
                Prev
              </button>
              <div className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 font-semibold text-sm sm:text-base text-center">
                {formatDate(monthDate, { formatOptions: { year: "numeric", month: "long" } })}
              </div>
              <button
                onClick={() => goMonth(1)}
                className="px-3 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 text-sm"
                type="button"
              >
                Next
              </button>
              <button
                onClick={() => setMonthDate(new Date())}
                className="px-3 py-2 rounded-lg border bg-black text-white hover:bg-gray-900 text-sm"
                type="button"
              >
                Today
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1 sm:gap-3 text-center text-xs sm:text-sm font-semibold text-gray-600">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="uppercase tracking-wide">{d}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-3 text-[11px] sm:text-xs">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="h-24 rounded-xl border border-dashed border-gray-200" />;
              }

              const isToday =
                day === today.getDate() &&
                monthDate.getMonth() === today.getMonth() &&
                monthDate.getFullYear() === today.getFullYear();

              const birthdays = birthdaysByDay[day] || [];

              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`h-20 sm:h-24 rounded-xl border p-2 text-left flex flex-col gap-1 transition
                    ${isToday ? "border-black shadow bg-black text-white" : "border-gray-200"}
                    ${isSelected && !isToday ? "ring-2 ring-black" : ""}
                    ${birthdays.length > 0 ? "hover:border-black hover:shadow" : "hover:border-gray-300"}
                  `}
                >
                  <div className={`text-xs sm:text-sm font-semibold ${isToday ? "bg-black text-white" : "text-gray-700"}`}>
                    {day}
                  </div>
                  {birthdays.length === 0 ? (
                    <span className="text-[10px] sm:text-xs text-gray-400"></span>
                  ) : (
                    birthdays.map((name) => (
                      <span key={`${day}-${name}`} className="text-[10px] sm:text-xs font-medium text-indigo-700 truncate">
                        🎂 {name}
                      </span>
                    ))
                  )}
                </button>
              );
            })}
          </div>

          {/* Birthday detail for selected day */}
          <div className="mt-4 rounded-xl border bg-gray-50 p-4">
            {selectedDay ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">{selectedDateLabel}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white border text-gray-700">
                    {selectedBirthdays.length} birthday{selectedBirthdays.length === 1 ? "" : "s"}
                  </span>
                </div>
                {selectedBirthdays.length === 0 ? (
                  <p className="text-sm text-gray-600">No birthdays on this date.</p>
                ) : (
                  <ul className="space-y-1 text-sm text-gray-800">
                    {selectedBirthdays.map((name) => (
                      <li key={`${selectedDay}-${name}`} className="flex items-center gap-2">
                        <span className="text-lg">🎂</span>
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Tap a date to see whose birthday it is.</p>
            )}
          </div>
        </div>

      </div>

      {(membersLoading || eventsLoading || attendanceLoading) && (
        <p className="text-gray-600 mt-4">Loading dashboard data...</p>
      )}
      {(eventsError || attendanceError) && (
        <p className="text-red-600 mt-2">{eventsError || attendanceError}</p>
      )}

      {/* UPCOMING EVENTS */}
      <div className="mt-10 bg-white p-6 rounded-xl shadow border">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-gray-600">No upcoming events.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingEvents.map((e) => (
              <li
                key={e.id}
                className="flex justify-between p-4 border rounded-lg bg-gray-50"
              >
                <span className="font-semibold">{e.name}</span>
                <span className="text-gray-600">{formatDate(e.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
