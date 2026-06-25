import { CheckCircle2 } from "lucide-react";
import Badge from "../ui/Badge";

/**
 * Icon + title + description + "coming soon" badge + feature checklist.
 * Shared by PlaceholderPage (single module) and AccountManagement (per tab),
 * so every "not built yet" surface stays visually identical.
 */
export default function ModulePreview({
  icon: Icon,
  title,
  description,
  features = [],
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
        {Icon && <Icon className="h-7 w-7" />}
      </div>

      <h2 className="mt-5 text-lg font-semibold text-slate-900">{title}</h2>
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
  );
}
