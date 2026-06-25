/**
 * Mock authentication context.
 *
 * There is no real backend yet, so a "session" is just the selected role and
 * email persisted to localStorage. This is enough to drive routing guards and
 * the role-based sidebar while keeping a clean API (`login`, `logout`, `user`)
 * that a real auth service can implement later without changing the consumers.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLES, ROLE_LABELS } from "../data/mockData";

const STORAGE_KEY = "sbs_dsp_auth";

const AuthContext = createContext(null);

/** "aya.achiban@..." → "Aya ACHIBAN" (first name capitalized, surnames upper). */
function nameFromEmail(email) {
  const local = (email || "").split("@")[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "Utilisateur";
  const [first, ...rest] = parts;
  const head = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return [head, ...rest.map((p) => p.toUpperCase())].join(" ");
}

/** "Aya ACHIBAN" → "AA" */
function initialsFromName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Keep localStorage in sync with the in-memory session.
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = ({ email, role = ROLES.ADMIN }) => {
    const name = nameFromEmail(email);
    const nextUser = {
      email,
      role,
      name,
      roleLabel: ROLE_LABELS[role] ?? ROLE_LABELS[ROLES.ADMIN],
      initials: initialsFromName(name),
    };
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => setUser(null);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>.");
  }
  return ctx;
}
