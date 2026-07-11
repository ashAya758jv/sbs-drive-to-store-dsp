import { useState } from "react";
import { Users, Building2, Settings as SettingsIcon } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Tabs from "../components/ui/Tabs";
import AdvertisersTab from "../components/account/AdvertisersTab";
import UsersTab from "../components/account/UsersTab";
import SettingsTab from "../components/account/SettingsTab";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../data/mockData";

const tabs = [
  { id: "annonceurs", label: "Annonceurs", icon: Building2 },
  { id: "utilisateurs", label: "Utilisateurs", icon: Users },
  { id: "parametres", label: "Paramètres", icon: SettingsIcon },
];

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Gestion du compte" }]}
        title="Gestion du compte"
        subtitle={
          isAdmin
            ? "Gérez les annonceurs, utilisateurs et paramètres du compte"
            : "Consultez les annonceurs, utilisateurs et paramètres du compte (lecture seule)"
        }
      />

      <Card>
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="px-4" />
        {activeTab === "annonceurs" && <AdvertisersTab isAdmin={isAdmin} />}
        {activeTab === "utilisateurs" && <UsersTab isAdmin={isAdmin} />}
        {activeTab === "parametres" && <SettingsTab isAdmin={isAdmin} />}
      </Card>
    </>
  );
}
