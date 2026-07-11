import { useEffect, useMemo, useState } from "react";
import { Search, Store as StoreIcon, Megaphone, Pencil } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Field from "../ui/Field";
import Modal from "../ui/Modal";
import {
  ADVERTISER_STATUS_LABELS,
  ADVERTISER_STATUS_OPTIONS,
  getAdvertisers,
  updateAdvertiser,
} from "../../data/accountApi";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  ...ADVERTISER_STATUS_OPTIONS,
];

function toForm(advertiser) {
  return {
    name: advertiser.name ?? "",
    sector: advertiser.sector ?? "",
    address: advertiser.address ?? "",
    city: advertiser.city ?? "",
    email: advertiser.email ?? "",
    phone: advertiser.phone ?? "",
    website: advertiser.website ?? "",
    status: advertiser.status ?? "active",
  };
}

/** Detail sheet for a selected advertiser — read-only, plus a "Modifier" entry point. */
function AdvertiserDetail({ advertiser, isAdmin, onEdit }) {
  const rows = [
    ["Secteur", advertiser.sector || "—"],
    ["Adresse", advertiser.address || "—"],
    ["Ville", advertiser.city || "—"],
    ["Email", advertiser.email || "—"],
    ["Téléphone", advertiser.phone || "—"],
    ["Site web", advertiser.website || "—"],
  ];
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{advertiser.name}</h3>
          <Badge
            className="mt-2"
            variant={advertiser.status === "active" ? "success" : "neutral"}
            dot
          >
            {ADVERTISER_STATUS_LABELS[advertiser.status] ?? advertiser.status}
          </Badge>
        </div>
        <div className="flex gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-primary-600" />
            {advertiser.campaigns_count} campagne(s)
          </span>
          <span className="flex items-center gap-1.5">
            <StoreIcon className="h-4 w-4 text-primary-600" />
            {advertiser.stores_count} magasin(s)
          </span>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>

      {isAdmin && (
        <div className="mt-6 flex justify-end">
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        </div>
      )}
    </div>
  );
}

function AdvertiserEditForm({ advertiser, onSaved, onCancel }) {
  const [form, setForm] = useState(() => toForm(advertiser));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Le nom est obligatoire.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Adresse email invalide.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdvertiser(advertiser.id, form);
      onSaved(updated);
    } catch (err) {
      setError(err.message || "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom" htmlFor="adv-name" required error={errors.name}>
        <Input id="adv-name" value={form.name} onChange={setField("name")} invalid={Boolean(errors.name)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Secteur" htmlFor="adv-sector">
          <Input id="adv-sector" value={form.sector} onChange={setField("sector")} />
        </Field>
        <Field label="Statut" htmlFor="adv-status">
          <Select
            id="adv-status"
            value={form.status}
            onChange={setField("status")}
            options={ADVERTISER_STATUS_OPTIONS}
          />
        </Field>
      </div>
      <Field label="Adresse" htmlFor="adv-address">
        <Input id="adv-address" value={form.address} onChange={setField("address")} />
      </Field>
      <Field label="Ville" htmlFor="adv-city">
        <Input id="adv-city" value={form.city} onChange={setField("city")} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" htmlFor="adv-email" error={errors.email}>
          <Input
            id="adv-email"
            type="email"
            value={form.email}
            onChange={setField("email")}
            invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Téléphone" htmlFor="adv-phone">
          <Input id="adv-phone" value={form.phone} onChange={setField("phone")} />
        </Field>
      </div>
      <Field label="Site web" htmlFor="adv-website">
        <Input id="adv-website" value={form.website} onChange={setField("website")} />
      </Field>

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export default function AdvertisersTab({ isAdmin }) {
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);

  // Split in two: `fetchAdvertisers` only ever touches state inside the promise
  // callbacks (safe to call from the mount effect), while `reloadAdvertisers`
  // additionally resets loading/error synchronously for the "Réessayer" button.
  const fetchAdvertisers = () =>
    getAdvertisers()
      .then((data) => setAdvertisers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Impossible de charger les annonceurs."))
      .finally(() => setLoading(false));

  const reloadAdvertisers = () => {
    setLoading(true);
    setError("");
    return fetchAdvertisers();
  };

  useEffect(() => {
    fetchAdvertisers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return advertisers.filter((advertiser) => {
      const matchesSearch = !term || advertiser.name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || advertiser.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [advertisers, search, statusFilter]);

  const selected = advertisers.find((a) => a.id === selectedId) ?? null;

  const handleSaved = (updated) => {
    setAdvertisers((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditing(false);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Annonceurs</h2>
          <p className="text-sm text-slate-400">
            {advertisers.length} annonceur(s) enregistré(s)
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Recherche" htmlFor="adv-search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="adv-search"
                placeholder="Nom de l'annonceur"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
          </Field>
          <Select
            label="Statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-40"
          />
        </div>
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-slate-400">Chargement des annonceurs…</p>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={reloadAdvertisers}>
            Réessayer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-400">
          Aucun annonceur ne correspond à ces critères.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Secteur</th>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Campagnes</th>
                <th className="px-5 py-3 text-right font-medium">Magasins</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((advertiser) => (
                <tr key={advertiser.id} className="transition-colors hover:bg-lavender-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{advertiser.name}</td>
                  <td className="px-5 py-4 text-slate-500">{advertiser.sector || "—"}</td>
                  <td className="px-5 py-4 text-slate-500">{advertiser.city || "—"}</td>
                  <td className="px-5 py-4">
                    <Badge variant={advertiser.status === "active" ? "success" : "neutral"} dot>
                      {ADVERTISER_STATUS_LABELS[advertiser.status] ?? advertiser.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {advertiser.campaigns_count}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {advertiser.stores_count}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedId(advertiser.id);
                        setEditing(false);
                      }}
                    >
                      Voir la fiche
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(selected) && !editing}
        onClose={() => setSelectedId(null)}
        title="Fiche annonceur"
        subtitle="Informations détaillées de l'annonceur sélectionné"
      >
        {selected && (
          <AdvertiserDetail
            advertiser={selected}
            isAdmin={isAdmin}
            onEdit={() => setEditing(true)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(selected) && editing}
        onClose={() => setEditing(false)}
        title="Modifier l'annonceur"
        subtitle={selected?.name}
      >
        {selected && (
          <AdvertiserEditForm
            advertiser={selected}
            onSaved={handleSaved}
            onCancel={() => setEditing(false)}
          />
        )}
      </Modal>
    </div>
  );
}
