import { Megaphone } from "lucide-react";
import PlaceholderPage from "../components/common/PlaceholderPage";

export default function CampaignCreate() {
  return (
    <PlaceholderPage
      breadcrumb={[
        { label: "Campagnes", to: "/campagnes" },
        { label: "Créer une campagne" },
      ]}
      title="Création de campagne"
      subtitle="Configurez une nouvelle campagne drive-to-store"
      icon={Megaphone}
      description="L'assistant de création de campagne permettra de définir objectifs, budget, période de diffusion et audience cible."
      features={[
        "Paramètres généraux (nom, objectif, budget)",
        "Période et planning de diffusion",
        "Audience et ciblage géographique",
        "Récapitulatif et lancement",
      ]}
    />
  );
}
