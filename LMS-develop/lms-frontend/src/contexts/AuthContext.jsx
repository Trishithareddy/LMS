import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

/* -------------------------------------------------------
   Minimal token helpers (per-role + legacy fallback)
------------------------------------------------------- */
const KEYS = {
  admin: "admin_token",
  teacher: "teacher_token",
  student: "student_token",
  legacy: "token",
};

const stripBearer = (t) => (t?.startsWith?.("Bearer ") ? t.slice(7) : t);

function readStore(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
}
function writeStore(key, val) {
  localStorage.setItem(key, val);
}

function setRoleToken(role, token, { remember = true } = {}) {
  const key = KEYS[role] || KEYS.legacy;
  (remember ? localStorage : sessionStorage).setItem(key, token);
}
function clearAllTokens(role) {
  const keys = role ? [KEYS[role]] : Object.values(KEYS);
  for (const k of keys) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
}
function getAnyToken() {
  for (const k of [KEYS.admin, KEYS.teacher, KEYS.student, KEYS.legacy]) {
    const t = readStore(k);
    if (t) return stripBearer(t);
  }
  return null;
}
function getRoleToken(preferredRole) {
  if (preferredRole && KEYS[preferredRole]) {
    const t = readStore(KEYS[preferredRole]);
    if (t) return stripBearer(t);
  }
  return getAnyToken();
}
function inferRoleFromPath() {
  try {
    const p = window.location.pathname.toLowerCase();
    if (p.startsWith("/admin")) return "admin";
    if (p.startsWith("/teacher")) return "teacher";
    if (p.startsWith("/student")) return "student";
    return null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------
   Context
------------------------------------------------------- */
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Always end with /api
const RAW = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const API = RAW
  ? RAW.endsWith("/api")
    ? RAW
    : `${RAW}/api`
  : "http://localhost:5000/api";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAnyToken() || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("lms_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  // Interceptor: attach correct role token automatically
  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      if (!config.headers?.Authorization) {
        const role = inferRoleFromPath();
        const t = getRoleToken(role);
        if (t) {
          config.headers = { ...(config.headers || {}), Authorization: `Bearer ${t}` };
        }
      }
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  // Hydrate user after refresh if we have a token but no user
  useEffect(() => {
    const anyToken = getAnyToken();
    if (!anyToken || user) return;
    setLoading(true);
    (async () => {
      try {
        const r = await axios.get(`${API}/auth/me`).catch(() => null);
        if (r?.data?.user) {
          setUser(r.data.user);
          writeStore("lms_user", JSON.stringify(r.data.user));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Login (backend must accept role)
  const login = async ({ email, password, role }) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password, role });
    const tk = data.token;
    const usr =
      data.user || {
        role: data.role || role,
        email: data.email || email,
        name: data.name || "",
        id: data.id || data._id,
      };

    // Save role-specific token + legacy "token" for older code
    setRoleToken(role, tk, { remember: true });
    localStorage.setItem("token", tk);

    setToken(tk);
    setUser(usr);
    writeStore("lms_user", JSON.stringify(usr));
    return usr;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    clearAllTokens(); // remove admin/teacher/student/legacy
    localStorage.removeItem("lms_user");
  };

  const value = useMemo(
    () => ({ user, token, login, logout, loading }),
    [user, token, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
