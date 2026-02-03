const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = "GET", data, token } = {}) {
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;
  const headers = isForm ? {} : { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: data ? (isForm ? data : JSON.stringify(data)) : undefined,
  });

  const text = await res.text();
  let json = null;  

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const message = json?.message || json?.error || res.statusText;
    throw new Error(message || "Request failed");
  }

  return json;
}

export const api = {
  login: (payload) => request("/api/auth/login", { method: "POST", data: payload }),
  register: (payload) => request("/api/auth/register", { method: "POST", data: payload }),
  changePassword: (payload) =>
    request("/api/auth/change-password", { method: "POST", data: payload }),
  me: (token) => request("/api/auth/me", { token }),
  adminCreateMember: (payload, token) =>
    request("/api/auth/admin/create-member", { method: "POST", data: payload, token }),

  getMembers: (token) => request("/api/members", { token }),
  createMember: (payload, token) =>
    request("/api/members/create", { method: "POST", data: payload, token }),
  updateMember: (id, payload, token) =>
    request(`/api/members/${id}`, { method: "PUT", data: payload, token }),
  deleteMember: (id, token) => request(`/api/members/${id}`, { method: "DELETE", token }),

  // Events
  getEvents: (token) => request("/api/events", { token }),
  getEvent: (id, token) => request(`/api/events/${id}`, { token }),
  createEvent: (payload, token) => request("/api/events", { method: "POST", data: payload, token }),
  updateEvent: (id, payload, token) => request(`/api/events/${id}`, { method: "PUT", data: payload, token }),
  deleteEvent: (id, token) => request(`/api/events/${id}`, { method: "DELETE", token }),

  // Attendance - daily
  listDailyAttendance: (token) => request("/api/attendance/daily", { token }),
  createDailyAttendance: (payload, token) =>
    request("/api/attendance/daily", { method: "POST", data: payload, token }),
  updateDailyAttendance: (id, payload, token) =>
    request(`/api/attendance/daily/${id}`, { method: "PUT", data: payload, token }),
  deleteDailyAttendance: (id, token) =>
    request(`/api/attendance/daily/${id}`, { method: "DELETE", token }),
  bulkMarkDailyPresent: (payload, token) =>
    request("/api/attendance/daily/bulk-present", { method: "POST", data: payload, token }),

  // Attendance - event
  listEventAttendance: (token) => request("/api/attendance/event", { token }),
  createEventAttendance: (payload, token) =>
    request("/api/attendance/event", { method: "POST", data: payload, token }),
  updateEventAttendance: (id, payload, token) =>
    request(`/api/attendance/event/${id}`, { method: "PUT", data: payload, token }),
  deleteEventAttendance: (id, token) =>
    request(`/api/attendance/event/${id}`, { method: "DELETE", token }),
};

export default api;
