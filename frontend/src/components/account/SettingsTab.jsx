import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Field from "../ui/Field";
import Toggle from "../ui/Toggle";
import { getGlobalAccountSettings, updateGlobalAccountSettings } from "../../data/accountApi";

const CURRENCY_OPTIONS = [
  { value: "MAD", label: "MAD — Dirham marocain" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — Dollar américain" },
];

const TIMEZONE_OPTIONS = [
  { value: "Africa/Casablanca", label: "Africa/Casablanca (GMT+1)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1/+2)" },
  { value: "UTC", label: "UTC" },
];

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

function toForm(data) {
  return {
    company_name: data.company_name ?? "",
    default_currency: data.default_currency ?? "MAD",
    timezone: data.timezone ?? "Africa/Casablanca",
    language: data.language ?? "fr",
    notification_email: data.notification_email ?? "",
    tracking_enabled: Boolean(data.tracking_enabled),
  };
}

export default function SettingsTab({ isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState(null);

  // `fetchSettings` only touches state inside the promise callbacks (safe to
  // call from the mount effect); `reloadSettings` additionally resets
  // loading/error synchronously for the "Réessayer" button.
  const fetchSettings = () =>
    getGlobalAccountSettings()
      .then((data) => setForm(toForm(data)))
      .catch((err) => setError(err.message || "Impossible de charger les paramètres."))
      .finally(() => setLoading(false));

  const reloadSettings = () => {
    setLoading(true);
    setError("");
    return fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSuccessMessage("");
    try {
      const payload = {
        ...form,
        notification_email: form.notification_email.trim() === "" ? null : form.notification_email,
      };
      const updated = await updateGlobalAccountSettings(payload);
      setForm(toForm(updated));
      setSuccessMessage("Paramètres enregistrés avec succès.");
    } catch (err) {
      setSaveError(err.message || "Échec de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Paramètres du compte</h2>
        <p className="text-sm text-slate-400">
          Paramètres globaux de la plateforme SBS Data Factory
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Chargement des paramètres…</p>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={reloadSettings}>
            Réessayer
          </Button>
        </div>
      ) : form ? (
        <form onSubmit={handleSave} className="mt-6 max-w-xl space-y-4">
          <Field label="Nom de l'entreprise" htmlFor="settings-company-name" required>
            <Input
              id="settings-company-name"
              value={form.company_name}
              onChange={setField("company_name")}
              disabled={!isAdmin}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Devise" htmlFor="settings-currency">
              <Select
                id="settings-currency"
                value={form.default_currency}
                onChange={setField("default_currency")}
                options={CURRENCY_OPTIONS}
                disabled={!isAdmin}
              />
            </Field>
            <Field label="Fuseau horaire" htmlFor="settings-timezone">
              <Select
                id="settings-timezone"
                value={form.timezone}
                onChange={setField("timezone")}
                options={TIMEZONE_OPTIONS}
                disabled={!isAdmin}
              />
            </Field>
          </div>
          <Field label="Langue" htmlFor="settings-language">
            <Select
              id="settings-language"
              value={form.language}
              onChange={setField("language")}
              options={LANGUAGE_OPTIONS}
              disabled={!isAdmin}
            />
          </Field>
          <Field label="Email de notification" htmlFor="settings-notification-email">
            <Input
              id="settings-notification-email"
              type="email"
              value={form.notification_email}
              onChange={setField("notification_email")}
              disabled={!isAdmin}
            />
          </Field>
          <Toggle
            label="Tracking activé"
            description="Suivi des performances (impressions, clics, visites) pour l'ensemble du compte"
            checked={form.tracking_enabled}
            onChange={(value) =>
              isAdmin && setForm((prev) => ({ ...prev, tracking_enabled: value }))
            }
          />

          {saveError && <p className="text-sm font-medium text-rose-600">{saveError}</p>}
          {successMessage && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
              </Button>
            </div>
          )}
        </form>
      ) : null}
    </div>
  );
}
