import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const { token } = useAuth();
  const [daily, setDaily] = useState([]);
  const [eventAttendance, setEventAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const keyMatch = (record, id) => String(record?.id ?? record?._id) === String(id);

  const refreshDaily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDailyAttendance(token);
      setDaily(Array.isArray(res) ? res : res?.attendance || []);
    } catch (err) {
      setError(err?.message || "Failed to fetch daily attendance");
      setDaily([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshEventAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listEventAttendance(token);
      setEventAttendance(Array.isArray(res) ? res : res?.attendance || []);
    } catch (err) {
      setError(err?.message || "Failed to fetch event attendance");
      setEventAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshDaily();
    refreshEventAttendance();
  }, [refreshDaily, refreshEventAttendance]);

  const createDaily = useCallback(
    async (payload) => {
      const res = await api.createDailyAttendance(payload, token);
      const created = res?.attendance || res;
      if (created) setDaily((prev) => [...prev, created]);
      return created;
    },
    [token]
  );

  const updateDaily = useCallback(
    async (id, payload) => {
      const res = await api.updateDailyAttendance(id, payload, token);
      const updated = res?.attendance || res;
      setDaily((prev) => prev.map((d) => (keyMatch(d, id) ? { ...d, ...updated } : d)));
      return updated;
    },
    [token]
  );

  const deleteDaily = useCallback(
    async (id) => {
      await api.deleteDailyAttendance(id, token);
      setDaily((prev) => prev.filter((d) => !keyMatch(d, id)));
    },
    [token]
  );

  const bulkMarkDailyPresent = useCallback(
    async ({ date, memberIds }) => {
      const numericIds = (memberIds || []).map((m) => Number(m)).filter((n) => !Number.isNaN(n));
      const res = await api.bulkMarkDailyPresent({ date, memberIds: numericIds }, token);
      const newRecords = Array.isArray(res) ? res : res?.attendance || [];
      if (!Array.isArray(newRecords) || newRecords.length === 0) return newRecords;
      setDaily((prev) => {
        const byKey = new Map(prev.map((r) => [String(r.id || r._id || `${r.memberId}-${r.date}`), r]));
        newRecords.forEach((r) => {
          const id = String(r.id || r._id || `${r.memberId}-${r.date}`);
          byKey.set(id, r);
        });
        return Array.from(byKey.values());
      });
      return newRecords;
    },
    [token]
  );

  const createEventAtt = useCallback(
    async (payload) => {
      const res = await api.createEventAttendance(payload, token);
      const created = res?.attendance || res;
      if (created) setEventAttendance((prev) => [...prev, created]);
      return created;
    },
    [token]
  );

  const updateEventAtt = useCallback(
    async (id, payload) => {
      const res = await api.updateEventAttendance(id, payload, token);
      const updated = res?.attendance || res;
      setEventAttendance((prev) => prev.map((e) => (keyMatch(e, id) ? { ...e, ...updated } : e)));
      return updated;
    },
    [token]
  );

  const deleteEventAtt = useCallback(
    async (id) => {
      await api.deleteEventAttendance(id, token);
      setEventAttendance((prev) => prev.filter((e) => !keyMatch(e, id)));
    },
    [token]
  );

  return (
    <AttendanceContext.Provider
      value={{
        daily,
        eventAttendance,
        loading,
        error,
        refreshDaily,
        refreshEventAttendance,
        createDaily,
        updateDaily,
        deleteDaily,
        bulkMarkDailyPresent,
        createEventAtt,
        updateEventAtt,
        deleteEventAtt,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
