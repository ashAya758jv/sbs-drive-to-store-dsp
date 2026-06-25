import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Radar, ShieldCheck, MapPin, BarChart3 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ROLES, ROLE_OPTIONS } from "../data/mockData";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";

const highlights = [
  { icon: MapPin, text: "Ciblage drive-to-store et géofencing des points de vente" },
  { icon: BarChart3, text: "Reporting temps réel des performances de campagne" },
  { icon: ShieldCheck, text: "Accès par rôle : Admin, Media buyer, Lecteur" },
];

/**
 * Mock login screen. Credentials are not verified — submitting stores the
 * selected role in the auth context (localStorage) and routes to the dashboard.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("aya.achiban@sbsdatafactory.ma");
  const [password, setPassword] = useState("demo1234");
  const [role, setRole] = useState(ROLES.ADMIN);

  const handleSubmit = (event) => {
    event.preventDefault();
    login({ email, role });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="grid min-h-screen bg-lavender-100 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Radar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">SBS Data Factory</p>
            <p className="text-sm text-white/70">Drive-to-Store DSP</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            La plateforme drive-to-store des annonceurs marocains.
          </h2>
          <p className="mt-4 text-white/80">
            Créez, pilotez et mesurez vos campagnes pour transformer
            l&apos;audience digitale en visites en magasin.
          </p>

          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/90">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">
          © 2026 SBS Data Factory — Projet PFA
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary-600 text-white">
              <Radar className="h-6 w-6" />
            </div>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 lg:justify-start">
            <h1 className="text-2xl font-semibold text-slate-900">
              SBS Data Factory
            </h1>
            <Badge variant="primary">Drive-to-Store DSP</Badge>
          </div>
          <p className="mb-8 text-center text-sm text-slate-500 lg:text-left">
            Connectez-vous pour accéder à votre espace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@sbsdatafactory.ma"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>

            {/* Role */}
            <Select
              id="role"
              label="Rôle"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLE_OPTIONS}
            />

            <Button type="submit" size="lg" className="w-full">
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Démo — l&apos;authentification est simulée, aucune donnée
            n&apos;est envoyée.
          </p>
        </div>
      </div>
    </div>
  );
}
