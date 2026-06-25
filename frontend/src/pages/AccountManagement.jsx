import { Settings } from "lucide-react";
import PlaceholderPage from "../components/common/PlaceholderPage";

export default function AccountManagement() {
  return (
    <PlaceholderPage
      breadcrumb={[{ label: "Gestion du compte" }]}
      title="Gestion du compte"
      subtitle="Gérez les utilisateurs, rôles et paramètres du compte"
      icon={Settings}
      description="Cet espace permettra d'administrer les utilisateurs, leurs rôles (Admin, Media buyer, Lecteur) et les paramètres de l'annonceur."
      features={[
        "Gestion des utilisateurs et invitations",
        "Attribution des rôles et permissions",
        "Paramètres de l'annonceur",
        "Préférences et sécurité du compte",
      ]}
    />
  );
}
