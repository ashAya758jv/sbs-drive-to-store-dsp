import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import { advertisers } from "../../data/mockData";
import { useAuth } from "../../auth/AuthContext";

/**
 * Top application bar: project identity on the left, advertiser context and the
 * signed-in user on the right. Sticky so it stays in view while content
 * scrolls.
 */
export default function Header() {
  const { user } = useAuth();
  const [advertiser, setAdvertiser] = useState(advertisers[0]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur lg:px-8">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">SBS Data Factory</h1>
        <Badge variant="primary">Drive-to-Store DSP</Badge>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Advertiser selector */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs text-slate-400">Annonceur</span>
          <Select
            value={advertiser}
            onChange={(e) => setAdvertiser(e.target.value)}
            options={advertisers}
            className="w-40"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">
            {user?.initials ?? "AA"}
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-medium text-slate-800">
              {user?.name ?? "Aya ACHIBAN"}
            </p>
            <p className="text-xs text-slate-400">{user?.roleLabel ?? "Admin"}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
        </div>
      </div>
    </header>
  );
}
