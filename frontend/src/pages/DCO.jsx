import { Images } from "lucide-react";
import PlaceholderPage from "../components/common/PlaceholderPage";

export default function DCO() {
  return (
    <PlaceholderPage
      breadcrumb={[
        { label: "Campagnes", to: "/campagnes" },
        { label: "Créations / DCO" },
      ]}
      title="Créations / DCO"
      subtitle="Gérez les créatives dynamiques (Dynamic Creative Optimization)"
      icon={Images}
      description="Le module DCO permettra de gérer les bannières et de composer des créatives dynamiques adaptées à chaque magasin et audience."
      features={[
        "Bibliothèque de créatives (images, formats)",
        "Modèles dynamiques par magasin / promotion",
        "Prévisualisation multi-format",
        "Règles d'optimisation automatique (DCO)",
      ]}
    />
  );
}
