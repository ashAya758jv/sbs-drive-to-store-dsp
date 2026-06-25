import { Store } from "lucide-react";
import PlaceholderPage from "../components/common/PlaceholderPage";

export default function StoreSelection() {
  return (
    <PlaceholderPage
      breadcrumb={[
        { label: "Campagnes", to: "/campagnes" },
        { label: "Sélection des magasins" },
      ]}
      title="Sélection des magasins"
      subtitle="Choisissez les points de vente et zones de géofencing"
      icon={Store}
      description="Ce module permettra de sélectionner les magasins à promouvoir et de définir les rayons de géofencing autour de chaque point de vente."
      features={[
        "Recherche et filtrage des points de vente",
        "Sélection multiple par enseigne ou ville",
        "Définition des rayons de géofencing",
        "Aperçu cartographique des zones ciblées",
      ]}
    />
  );
}
