import { useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import StoreTargetingPanel from "../components/stores/StoreTargetingPanel";

/**
 * Magasins page — import the client store DB, review it, then select stores and
 * set their geofencing radius. The whole experience lives in the reusable
 * <StoreTargetingPanel /> (also used inside the campaign-creation wizard);
 * this page just owns the persistent state and the page header.
 */
export default function StoreSelection() {
  const [preview, setPreview] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [radii, setRadii] = useState({});

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Magasins" }]}
        title="Magasins"
        subtitle="Importez la base de données client des points de vente"
      />
      <StoreTargetingPanel
        preview={preview}
        onPreviewChange={setPreview}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        radii={radii}
        onRadiiChange={setRadii}
      />
    </>
  );
}
