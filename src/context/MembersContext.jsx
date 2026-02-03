import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const MembersContext = createContext(null);

const memberKey = (m) => m?.id ?? m?._id ?? m?.memberId;
const sameMember = (m, id) => String(memberKey(m)) === String(id);

const normalizeMember = (m) => {
  if (!m) return m;
  const id = m.id || m._id;
  const memberId = m.memberId !== undefined && m.memberId !== null ? Number(m.memberId) : undefined;
  return { ...m, id, memberId: Number.isNaN(memberId) ? m.memberId : memberId };
};

export function MembersProvider({ children }) {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMembers(token);
      const list = Array.isArray(res) ? res : res?.members || [];
      setMembers(list.map(normalizeMember));
    } catch (err) {
      setError(err?.message || "Failed to fetch members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createMember = async (payload) => {
    const res = await api.createMember(payload, token);
    const created = normalizeMember(res?.member || res);
    if (created) setMembers((prev) => [...prev, created]);
    return created;
  };

  const updateMember = async (id, payload) => {
    const res = await api.updateMember(id, payload, token);
    const updated = normalizeMember(res?.member || res);
    setMembers((prev) =>
      prev.map((m) => {
        if (!sameMember(m, id)) return m;
        const nextImg = updated?.img || m.img; // preserve existing image if backend omits it
        return { ...m, ...updated, img: nextImg };
      })
    );
    return updated;
  };

  const deleteMember = async (id) => {
    await api.deleteMember(id, token);
    setMembers((prev) => prev.filter((m) => !sameMember(m, id)));
  };

  const getMemberById = (id) => members.find((m) => sameMember(m, id));

  return (
    <MembersContext.Provider
      value={{ members, loading, error, refresh, createMember, updateMember, deleteMember, getMemberById }}
    >
      {children}
    </MembersContext.Provider>
  );
}

export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error("useMembers must be used inside MembersProvider");
  return ctx;
}
