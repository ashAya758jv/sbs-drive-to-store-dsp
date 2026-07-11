/**
 * Centralized mock data for the first frontend version.
 *
 * Everything the UI renders today lives here so screens stay declarative and
 * the data layer can later be swapped for the FastAPI backend without touching
 * the components.
 */
import {
  LayoutDashboard,
  Megaphone,
  Store,
  Images,
  BarChart3,
  Settings,
  Eye,
  MousePointerClick,
  Wallet,
  Activity,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Roles & access                                                     */
/* ------------------------------------------------------------------ */
export const ROLES = {
  ADMIN: "admin",
  MEDIA_BUYER: "media_buyer",
  READER: "lecteur",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MEDIA_BUYER]: "Media buyer",
  [ROLES.READER]: "Lecteur",
};

/** Options for the role selector on the login screen. */
export const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: "Admin" },
  { value: ROLES.MEDIA_BUYER, label: "Media buyer" },
  { value: ROLES.READER, label: "Lecteur" },
];

/* ------------------------------------------------------------------ */
/*  Advertisers (top-bar selector)                                     */
/* ------------------------------------------------------------------ */
export const advertisers = ["Marjane", "Carrefour", "BIM", "CIH Bank"];

/* ------------------------------------------------------------------ */
/*  Sidebar navigation                                                 */
/*  `roles` controls which roles can see / reach the item.             */
/* ------------------------------------------------------------------ */
export const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER, ROLES.READER],
  },
  {
    label: "Campagnes",
    to: "/campagnes",
    icon: Megaphone,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER],
  },
  {
    label: "Magasins",
    to: "/magasins",
    icon: Store,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER, ROLES.READER],
  },
  {
    label: "Créations / DCO",
    to: "/dco",
    icon: Images,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER],
  },
  {
    label: "Reporting",
    to: "/reporting",
    icon: BarChart3,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER, ROLES.READER],
  },
  {
    label: "Gestion du compte",
    to: "/compte",
    icon: Settings,
    roles: [ROLES.ADMIN, ROLES.MEDIA_BUYER, ROLES.READER],
  },
];

/* ------------------------------------------------------------------ */
/*  Dashboard · KPI cards                                               */
/* ------------------------------------------------------------------ */
export const kpis = [
  {
    id: "impressions",
    label: "Impressions totales",
    value: "2,4M",
    delta: "+12,4%",
    trend: "up",
    icon: Eye,
  },
  {
    id: "clics",
    label: "Clics totaux",
    value: "18 420",
    delta: "+8,1%",
    trend: "up",
    icon: MousePointerClick,
  },
  {
    id: "budget",
    label: "Budget dépensé",
    value: "126 500 MAD",
    delta: "+5,3%",
    trend: "up",
    icon: Wallet,
  },
  {
    id: "actives",
    label: "Campagnes actives",
    value: "8",
    delta: "-1,0%",
    trend: "down",
    icon: Activity,
  },
];

/* ------------------------------------------------------------------ */
/*  Dashboard · recent campaigns table                                 */
/* ------------------------------------------------------------------ */
export const recentCampaigns = [
  {
    id: 1,
    name: "Marjane Ramadan 2026",
    status: "Active",
    period: "01 mars → 30 mars 2026",
    budget: "50 000 MAD",
    spent: "38 400 MAD",
    impressions: "1 245 900",
    clics: "9 850",
  },
  {
    id: 2,
    name: "Carrefour Weekend Promo",
    status: "En pause",
    period: "12 fév → 28 fév 2026",
    budget: "30 000 MAD",
    spent: "21 200 MAD",
    impressions: "640 300",
    clics: "4 120",
  },
  {
    id: 3,
    name: "BIM Casablanca Local",
    status: "Brouillon",
    period: "—",
    budget: "18 000 MAD",
    spent: "0 MAD",
    impressions: "0",
    clics: "0",
  },
  {
    id: 4,
    name: "CIH Mobile Drive-to-Store",
    status: "Terminée",
    period: "05 jan → 31 jan 2026",
    budget: "45 000 MAD",
    spent: "45 000 MAD",
    impressions: "980 200",
    clics: "7 340",
  },
];

/** Maps a campaign status to a Badge variant. */
export const statusVariants = {
  Active: "success",
  "En pause": "warning",
  Brouillon: "neutral",
  Terminée: "info",
};

/* ------------------------------------------------------------------ */
/*  Dashboard · filters                                                */
/* ------------------------------------------------------------------ */
export const statusFilterOptions = [
  "Tous les statuts",
  "Active",
  "En pause",
  "Brouillon",
  "Terminée",
];

export const periodFilterOptions = [
  "7 derniers jours",
  "30 derniers jours",
  "90 derniers jours",
  "Cette année",
];

/* ------------------------------------------------------------------ */
/*  Dashboard · performance chart                                      */
/* ------------------------------------------------------------------ */
export const performanceData = [
  { period: "Jan", impressions: 820000, clics: 5400 },
  { period: "Fév", impressions: 932000, clics: 6120 },
  { period: "Mar", impressions: 1245000, clics: 9850 },
  { period: "Avr", impressions: 1080000, clics: 8430 },
  { period: "Mai", impressions: 1390000, clics: 10240 },
  { period: "Jun", impressions: 1510000, clics: 11680 },
];
