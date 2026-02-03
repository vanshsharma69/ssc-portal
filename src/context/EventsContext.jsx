import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const EventsContext = createContext(null);
const eventKey = (evt) => evt?.eventId ?? evt?.id ?? evt?._id;
const sameEvent = (evt, id) => String(eventKey(evt)) === String(id);

export function EventsProvider({ children }) {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents(token);
      setEvents(Array.isArray(res) ? res : res?.events || []);
    } catch (err) {
      setError(err?.message || "Failed to fetch events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getEventById = (id) => events.find((e) => sameEvent(e, id));

  const fetchEvent = useCallback(
    async (id) => {
      const res = await api.getEvent(id, token);
      const evt = res?.event || res;
      if (evt) {
        setEvents((prev) => {
          const key = eventKey(evt);
          const exists = prev.find((e) => sameEvent(e, key));
          if (exists) return prev.map((e) => (sameEvent(e, key) ? evt : e));
          return [...prev, evt];
        });
      }
      return evt;
    },
    [token]
  );

  const createEvent = useCallback(
    async (payload) => {
      const res = await api.createEvent(payload, token);
      const created = res?.event || res;
      if (created) setEvents((prev) => [...prev, created]);
      return created;
    },
    [token]
  );

  const updateEvent = useCallback(
    async (id, payload) => {
      const res = await api.updateEvent(id, payload, token);
      const updated = res?.event || res;
      setEvents((prev) => prev.map((e) => (sameEvent(e, id) ? { ...e, ...updated } : e)));
      return updated;
    },
    [token]
  );

  const deleteEvent = useCallback(
    async (id) => {
      await api.deleteEvent(id, token);
      setEvents((prev) => prev.filter((e) => !sameEvent(e, id)));
    },
    [token]
  );

  return (
    <EventsContext.Provider
      value={{ events, loading, error, refresh, getEventById, fetchEvent, createEvent, updateEvent, deleteEvent }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
