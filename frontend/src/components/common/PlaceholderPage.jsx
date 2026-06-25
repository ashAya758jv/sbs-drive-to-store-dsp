import PageHeader from "../layout/PageHeader";
import Card from "../ui/Card";
import ModulePreview from "./ModulePreview";

/**
 * Shared "module not built yet" screen. Keeps every upcoming page on the same
 * layout (breadcrumb + heading) while clearly signalling what comes next, and
 * lists the features planned for that module.
 */
export default function PlaceholderPage({
  breadcrumb,
  title,
  subtitle,
  icon,
  description,
  features = [],
}) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} title={title} subtitle={subtitle} />

      <Card className="p-10">
        <ModulePreview
          icon={icon}
          title="Module en préparation"
          description={description}
          features={features}
        />
      </Card>
    </>
  );
}
