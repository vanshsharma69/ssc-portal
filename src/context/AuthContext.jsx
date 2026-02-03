import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistSession = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem("droidToken", nextToken);
      localStorage.setItem("droidUser", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("droidToken");
      localStorage.removeItem("droidUser");
    }
  };

  const bootstrap = useCallback(async () => {
    const savedToken = localStorage.getItem("droidToken");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const me = await api.me(savedToken);
      persistSession(me?.user || me, savedToken);
    } catch {
      persistSession(null, null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      const nextUser = res.user || null;
      const nextToken = res.token;
      if (!nextToken) throw new Error("Missing token from server");

      persistSession(nextUser, nextToken);
      return { success: true };
    } catch (err) {
      const message = err?.message || "Invalid credentials";
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (payload) => {
    setError(null);
    try {
      const res = await api.register(payload);
      const nextUser = res.user || null;
      const nextToken = res.token;
      if (!nextToken) throw new Error("Missing token from server");

      persistSession(nextUser, nextToken);
      return { success: true };
    } catch (err) {
      const message = err?.message || "Registration failed";
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    persistSession(null, null);
  };

  const changePassword = async (payload) => {
    setError(null);
    try {
      const res = await api.changePassword(payload);
      const nextUser = res.user || null;
      const nextToken = res.token;
      if (!nextToken) throw new Error("Missing token from server");

      persistSession(nextUser, nextToken);
      return { success: true, user: nextUser };
    } catch (err) {
      const message = err?.message || "Password change failed";
      setError(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, login, register, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
