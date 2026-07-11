import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Power } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Field from "../ui/Field";
import Modal from "../ui/Modal";
import {
  USER_ROLE_OPTIONS,
  USER_STATUS_LABELS,
  createUser,
  getAdvertisers,
  getUsers,
  setUserStatus,
  updateUser,
} from "../../data/accountApi";

const ROLE_FILTER_OPTIONS = [{ value: "all", label: "Tous les rôles" }, ...USER_ROLE_OPTIONS];

const ROLE_LABELS = Object.fromEntries(USER_ROLE_OPTIONS.map((r) => [r.value, r.label]));

const STATUS_BADGE_VARIANT = {
  active: "success",
  invited: "info",
  disabled: "neutral",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatLastLogin(value) {
  if (!value) return "Jamais connecté";
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return "—";
  }
}

const emptyForm = { name: "", email: "", role: "media_buyer", advertiser_id: "" };

function UserForm({ initial, advertiserOptions, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(() => initial ?? emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Le nom est obligatoire.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Adresse email invalide.";
    }
    if (!form.role) next.role = "Le rôle est obligatoire.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        advertiser_id: form.advertiser_id ? Number(form.advertiser_id) : null,
      });
    } catch (err) {
      setError(err.message || "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom complet" htmlFor="user-name" required error={errors.name}>
        <Input id="user-name" value={form.name} onChange={setField("name")} invalid={Boolean(errors.name)} />
      </Field>
      <Field label="Email" htmlFor="user-email" required error={errors.email}>
        <Input
          id="user-email"
          type="email"
          value={form.email}
          onChange={setField("email")}
          invalid={Boolean(errors.email)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Rôle" htmlFor="user-role" required error={errors.role}>
          <Select id="user-role" value={form.role} onChange={setField("role")} options={USER_ROLE_OPTIONS} />
        </Field>
        <Field label="Annonceur associé" htmlFor="user-advertiser" hint="Optionnel">
          <Select
            id="user-advertiser"
            value={form.advertiser_id ?? ""}
            onChange={setField("advertiser_id")}
            options={[{ value: "", label: "Aucun" }, ...advertiserOptions]}
          />
        </Field>
      </div>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function UsersTab({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);

  // `fetchUsers` only touches state inside the promise callbacks (safe to call
  // from the mount effect); `reloadUsers` additionally resets loading/error
  // synchronously for the "Réessayer" button.
  const fetchUsers = () =>
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Impossible de charger les utilisateurs."))
      .finally(() => setLoading(false));

  const reloadUsers = () => {
    setLoading(true);
    setError("");
    return fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
    getAdvertisers()
      .then((data) => setAdvertisers(Array.isArray(data) ? data : []))
      .catch(() => setAdvertisers([]));
  }, []);

  const advertiserOptions = useMemo(
    () => advertisers.map((a) => ({ value: a.id, label: a.name })),
    [advertisers],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || user.name.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const flashSuccess = (message) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleCreate = async (payload) => {
    const created = await createUser(payload);
    setUsers((prev) => [...prev, created]);
    setCreating(false);
    flashSuccess(`Utilisateur « ${created.name} » ajouté.`);
  };

  const handleUpdate = async (payload) => {
    const updated = await updateUser(editingUser.id, payload);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
    flashSuccess(`Utilisateur « ${updated.name} » mis à jour.`);
  };

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "disabled" ? "active" : "disabled";
    setBusyUserId(user.id);
    try {
      const updated = await setUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      flashSuccess(
        nextStatus === "disabled"
          ? `Utilisateur « ${updated.name} » désactivé.`
          : `Utilisateur « ${updated.name} » réactivé.`,
      );
    } catch (err) {
      setError(err.message || "Échec de la mise à jour du statut.");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Utilisateurs</h2>
          <p className="text-sm text-slate-400">{users.length} utilisateur(s)</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Recherche" htmlFor="user-search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="user-search"
                placeholder="Nom de l'utilisateur"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
          </Field>
          <Select
            label="Rôle"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={ROLE_FILTER_OPTIONS}
            className="w-44"
          />
          {isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          )}
        </div>
      </div>

      {statusMessage && (
        <p className="mx-5 mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {statusMessage}
        </p>
      )}

      {loading ? (
        <p className="p-10 text-center text-sm text-slate-400">Chargement des utilisateurs…</p>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={reloadUsers}>
            Réessayer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-400">
          Aucun utilisateur ne correspond à ces critères.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rôle</th>
                <th className="px-5 py-3 font-medium">Annonceur associé</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Dernière connexion</th>
                {isAdmin && <th className="px-5 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-lavender-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{user.name}</td>
                  <td className="px-5 py-4 text-slate-500">{user.email}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{user.advertiser_name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE_VARIANT[user.status] ?? "neutral"} dot>
                      {USER_STATUS_LABELS[user.status] ?? user.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatLastLogin(user.last_login)}</td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Button>
                        <Button
                          variant={user.status === "disabled" ? "secondary" : "danger"}
                          size="sm"
                          disabled={busyUserId === user.id}
                          onClick={() => toggleStatus(user)}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {user.status === "disabled" ? "Activer" : "Désactiver"}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Ajouter un utilisateur"
        subtitle="Renseignez les informations du nouvel utilisateur"
      >
        <UserForm
          advertiserOptions={advertiserOptions}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          submitLabel="Ajouter"
        />
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Modifier l'utilisateur"
        subtitle={editingUser?.name}
      >
        {editingUser && (
          <UserForm
            initial={{
              name: editingUser.name,
              email: editingUser.email,
              role: editingUser.role,
              advertiser_id: editingUser.advertiser_id ?? "",
            }}
            advertiserOptions={advertiserOptions}
            onSubmit={handleUpdate}
            onCancel={() => setEditingUser(null)}
            submitLabel="Enregistrer"
          />
        )}
      </Modal>
    </div>
  );
}
