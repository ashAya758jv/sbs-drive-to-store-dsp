import { BarChart3 } from "lucide-react";
import PlaceholderPage from "../components/common/PlaceholderPage";

export default function Reporting() {
  return (
    <PlaceholderPage
      breadcrumb={[{ label: "Reporting" }]}
      title="Reporting"
      subtitle="Analysez les performances de vos campagnes"
      icon={BarChart3}
      description="Le module de reporting offrira des tableaux de bord détaillés et des exports pour suivre la performance drive-to-store dans le temps."
      features={[
        "Indicateurs clés par campagne et par magasin",
        "Comparaison de périodes et tendances",
        "Mesure des visites en magasin (uplift)",
        "Export des rapports (PDF / CSV)",
      ]}
    />
  );
}
