import { CheckCircle2 } from "lucide-react";
import PageHeader from "../layout/PageHeader";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

/**
 * Shared "module not built yet" screen. Keeps every upcoming page on the same
 * layout (breadcrumb + heading) while clearly signalling what comes next, and
 * lists the features planned for that module.
 */
export default function PlaceholderPage({
  breadcrumb,
  title,
  subtitle,
  icon: Icon,
  description,
  features = [],
}) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} title={title} subtitle={subtitle} />

      <Card className="p-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
            {Icon && <Icon className="h-7 w-7" />}
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            Module en préparation
          </h2>
          {description && (
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          )}

          <Badge variant="primary" className="mt-4">
            Prêt à être développé à la prochaine étape
          </Badge>

          {features.length > 0 && (
            <div className="mx-auto mt-8 max-w-sm text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Fonctionnalités prévues
              </p>
              <ul className="mt-3 space-y-2.5">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
