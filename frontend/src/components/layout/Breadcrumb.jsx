import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * Breadcrumb trail. Always starts with "Accueil" (links to the dashboard),
 * followed by the `items` for the current screen.
 *
 * @param {{ label: string, to?: string }[]} items
 *        The last item is rendered as the current (non-link) page.
 */
export default function Breadcrumb({ items = [] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-1.5 text-sm text-slate-500"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 transition-colors hover:text-primary-700 active:text-primary-800"
      >
        <Home className="h-3.5 w-3.5" />
        Accueil
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="transition-colors hover:text-primary-700 active:text-primary-800"
              >
                {item.label}
              </Link>
            ) : isLast ? (
              <span className="font-medium text-slate-700">{item.label}</span>
            ) : (
              <span className="text-slate-500">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
