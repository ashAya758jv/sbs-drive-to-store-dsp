/**
 * Account management data layer (Semaine 6, Jour 1).
 *
 * Thin wrappers around the `/advertisers` and `/users` endpoints — no offline
 * fallback here (unlike the campaign wizard) since the whole screen is about
 * managing live backend state, so a failed call should surface as an error.
 */
import { apiGet, apiPatch, apiPost } from "../lib/api";

/* Advertisers --------------------------------------------------------- */
export const getAdvertisers = () => apiGet("/advertisers");
export const getAdvertiser = (advertiserId) => apiGet(`/advertisers/${advertiserId}`);
export const updateAdvertiser = (advertiserId, payload) =>
  apiPatch(`/advertisers/${advertiserId}`, payload);

/* Account settings (global, single-tenant — Paramètres tab) -------------- */
export const getGlobalAccountSettings = () => apiGet("/account-settings");
export const updateGlobalAccountSettings = (payload) =>
  apiPatch("/account-settings", payload);

/* Users ------------------------------------------------------------------ */
export const getUsers = () => apiGet("/users");
export const createUser = (payload) => apiPost("/users", payload);
export const updateUser = (userId, payload) => apiPatch(`/users/${userId}`, payload);
export const setUserStatus = (userId, status) =>
  apiPatch(`/users/${userId}/status`, { status });

export const ADVERTISER_STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
];

export const USER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "media_buyer", label: "Media buyer" },
  { value: "lecteur", label: "Lecteur (viewer)" },
];

export const USER_STATUS_LABELS = {
  active: "Actif",
  invited: "Invité",
  disabled: "Désactivé",
};

export const ADVERTISER_STATUS_LABELS = {
  active: "Actif",
  inactive: "Inactif",
};
