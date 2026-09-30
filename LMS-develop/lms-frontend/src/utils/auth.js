import { jwtDecode } from "jwt-decode";

const KEYS = {
  admin:   "admin_token",
  teacher: "teacher_token",
  student: "student_token",
  legacy:  "token",          // old key (optional fallback)
};

function stripBearer(t) { return t?.startsWith?.("Bearer ") ? t.slice(7) : t; }

export function setToken(role, token, { remember = true } = {}) {
  const key = KEYS[role] || KEYS.legacy;
  (remember ? localStorage : sessionStorage).setItem(key, token);
}

export function clearToken(role) {
  const keys = role ? [KEYS[role]] : Object.values(KEYS);
  for (const k of keys) {
    localStorage.removeItem(k); sessionStorage.removeItem(k);
  }
}

/** Only fall back when preferredRole is not provided */
export function getToken(preferredRole) {
  const read = (k) => sessionStorage.getItem(k) || localStorage.getItem(k) || null;

  if (preferredRole && KEYS[preferredRole]) {
    const t = read(KEYS[preferredRole]);
    return t ? stripBearer(t) : null;
  }

  for (const k of [KEYS.student, KEYS.teacher, KEYS.admin, KEYS.legacy]) {
    const t = read(k); if (t) return stripBearer(t);
  }
  return null;
}

export function getAuthHeader(preferredRole) {
  const t = getToken(preferredRole);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function safeDecode(preferredRole) {
  try { const t = getToken(preferredRole); return t ? jwtDecode(t) : null; }
  catch { return null; }
}
