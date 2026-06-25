import { NavLink } from "react-router-dom";
import { LogOut, Radar } from "lucide-react";
import { navItems } from "../../data/mockData";
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../lib/cn";

/**
 * Left navigation rail.
 *
 * Items are filtered by the current user's role, so the menu itself reflects
 * the role-based access model (e.g. a "Lecteur" never sees "Gestion du
 * compte"). The active route is highlighted in lavender/violet.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = navItems.filter(
    (item) => !user || item.roles.includes(user.role),
  );

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200/70 bg-white">
      {/* Brand mark */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30">
          <Radar className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">SBS DSP</p>
          <p className="text-[11px] text-slate-400">Drive-to-Store</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </p>
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    isActive ? "text-primary-600" : "text-slate-400",
                  )}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
