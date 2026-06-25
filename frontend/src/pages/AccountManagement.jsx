import { useState } from "react";
import { Users, ShieldCheck, Store, Lock } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import ModulePreview from "../components/common/ModulePreview";

const tabs = [
  {
    id: "utilisateurs",
    label: "Utilisateurs",
    icon: Users,
    description:
      "Invitez et gérez les membres ayant accès à la plateforme SBS Data Factory.",
    features: [
      "Liste des utilisateurs et statut d'invitation",
      "Ajout et désactivation d'un utilisateur",
      "Historique des connexions",
    ],
  },
  {
    id: "roles",
    label: "Rôles & permissions",
    icon: ShieldCheck,
    description:
      "Définissez ce que chaque rôle peut consulter et modifier sur la plateforme.",
    features: [
      "Attribution des rôles : Admin, Media buyer, Lecteur",
      "Permissions par module (Campagnes, Reporting, ...)",
      "Rôles personnalisés (à venir)",
    ],
  },
  {
    id: "annonceur",
    label: "Paramètres annonceur",
    icon: Store,
    description:
      "Informations et préférences propres à l'annonceur sélectionné.",
    features: [
      "Coordonnées et identité de l'annonceur",
      "Devise et fuseau horaire",
      "Enseignes et points de vente rattachés",
    ],
  },
  {
    id: "securite",
    label: "Sécurité",
    icon: Lock,
    description: "Paramètres de sécurité et de confidentialité du compte.",
    features: [
      "Politique de mot de passe",
      "Authentification à deux facteurs (à venir)",
      "Journal d'activité du compte",
    ],
  },
];

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Gestion du compte" }]}
        title="Gestion du compte"
        subtitle="Gérez les utilisateurs, rôles et paramètres du compte"
      />

      <Card>
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="px-4" />
        <div className="p-10">
          <ModulePreview
            icon={current.icon}
            title={current.label}
            description={current.description}
            features={current.features}
          />
        </div>
      </Card>
    </>
  );
}
