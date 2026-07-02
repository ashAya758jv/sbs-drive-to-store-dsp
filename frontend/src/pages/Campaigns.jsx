import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { getDrafts, FALLBACK_OPTIONS } from "../data/campaignApi";
import { recentCampaigns, statusVariants } from "../data/mockData";
import { cn } from "../lib/cn";

const advertiserName = (id) => {
  const found = FALLBACK_OPTIONS.advertisers.find((a) => String(a.value) === String(id));
  return found ? found.label : "—";
};

const formatMad = (value) =>
  `${new Intl.NumberFormat("fr-FR").format(Number(value) || 0)} MAD`;

const draftPeriod = (draft) =>
  draft.start_date && draft.end_date
    ? `${draft.start_date} → ${draft.end_date}`
    : "—";

export default function Campaigns() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    let active = true;
    getDrafts().then((data) => {
      if (active) setDrafts(Array.isArray(data) ? data : []);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Campagnes" }]}
        title="Campagnes"
        subtitle="Gérez vos campagnes drive-to-store et créez-en de nouvelles"
        actions={
          <Button onClick={() => navigate("/campagnes/nouvelle")}>
            <Plus className="h-4 w-4" />
            Créer une campagne
          </Button>
        }
      />

      {/* Drafts created via the wizard */}
      {drafts.length > 0 && (
        <Card className="mb-6">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Vos brouillons
            </h2>
            <p className="text-sm text-slate-400">
              Campagnes enregistrées mais pas encore lancées
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Campagne</th>
                  <th className="px-5 py-3 font-medium">Annonceur</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Période</th>
                  <th className="px-5 py-3 text-right font-medium">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="transition-colors hover:bg-lavender-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {draft.name}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {advertiserName(draft.advertiser_id)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral" dot>
                        Brouillon
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{draftPeriod(draft)}</td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatMad(draft.total_budget)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Existing campaigns (mock data, aligned with the dashboard) */}
      <Card>
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-base font-semibold text-slate-900">
            Toutes les campagnes
          </h2>
          <p className="text-sm text-slate-400">
            Aperçu des campagnes drive-to-store existantes
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Campagne</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Période</th>
                <th className="px-5 py-3 text-right font-medium">Budget</th>
                <th className="px-5 py-3 text-right font-medium">Dépensé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className={cn("transition-colors hover:bg-lavender-50")}
                >
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {campaign.name}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariants[campaign.status]} dot>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{campaign.period}</td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {campaign.budget}
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">
                    {campaign.spent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
