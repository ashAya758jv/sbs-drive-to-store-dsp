import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Stepper from "../components/campaigns/Stepper";
import StepGeneral from "../components/campaigns/StepGeneral";
import StepTargeting from "../components/campaigns/StepTargeting";
import StepFormats from "../components/campaigns/StepFormats";
import StepCategories from "../components/campaigns/StepCategories";
import {
  createDraft,
  estimateImpressions,
  FALLBACK_OPTIONS,
  getCampaignOptions,
} from "../data/campaignApi";

const STEPS = [
  { id: "general", label: "Informations générales" },
  { id: "targeting", label: "Ciblage technique" },
  { id: "formats", label: "Formats publicitaires" },
  { id: "categories", label: "Catégories d'applications" },
];

const INITIAL_FORM = {
  name: "",
  advertiser_id: "",
  objective: "",
  start_date: "",
  end_date: "",
  total_budget: "",
  daily_budget: "",
  devices: [],
  operating_systems: [],
  time_ranges: [],
  formats: [],
  app_categories: [],
  exclude_games: true,
};

/* --------------------------- validation --------------------------- */
function validateGeneral(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Le nom de la campagne est obligatoire.";
  if (!form.advertiser_id) errors.advertiser_id = "Sélectionnez un annonceur.";
  if (!form.objective) errors.objective = "Sélectionnez un objectif.";
  if (!form.start_date) errors.start_date = "La date de début est obligatoire.";
  if (!form.end_date) errors.end_date = "La date de fin est obligatoire.";
  if (
    form.start_date &&
    form.end_date &&
    form.end_date < form.start_date
  ) {
    errors.end_date = "La date de fin doit être postérieure à la date de début.";
  }
  if (!(Number(form.total_budget) > 0)) {
    errors.total_budget = "Indiquez un budget total supérieur à 0.";
  }
  if (!(Number(form.daily_budget) > 0)) {
    errors.daily_budget = "Indiquez un budget quotidien supérieur à 0.";
  } else if (Number(form.daily_budget) > Number(form.total_budget)) {
    errors.daily_budget =
      "Le budget quotidien ne peut pas dépasser le budget total.";
  }
  return errors;
}

function validateTargeting(form) {
  const errors = {};
  if (form.devices.length === 0) errors.devices = "Choisissez au moins un appareil.";
  if (form.operating_systems.length === 0) {
    errors.operating_systems = "Choisissez au moins un système d'exploitation.";
  }
  return errors;
}

function validateFormats(form) {
  const errors = {};
  if (form.formats.length === 0) {
    errors.formats = "Sélectionnez au moins un format publicitaire.";
  }
  return errors;
}

function validateCategories(form) {
  const errors = {};
  if (form.app_categories.length === 0) {
    errors.app_categories = "Sélectionnez au moins une catégorie.";
  }
  return errors;
}

const VALIDATORS = [
  validateGeneral,
  validateTargeting,
  validateFormats,
  validateCategories,
];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [form, setForm] = useState(INITIAL_FORM);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null); // { type, message }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // saved draft

  useEffect(() => {
    let active = true;
    getCampaignOptions().then((opts) => {
      if (active) setOptions(opts);
    });
    return () => {
      active = false;
    };
  }, []);

  const estimated = useMemo(() => estimateImpressions(form), [form]);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Clear the errors of the fields being edited.
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    advertiser_id: form.advertiser_id ? Number(form.advertiser_id) : null,
    objective: form.objective || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    total_budget: Number(form.total_budget) || 0,
    daily_budget: Number(form.daily_budget) || 0,
    devices: form.devices,
    operating_systems: form.operating_systems,
    time_ranges: form.time_ranges,
    formats: form.formats,
    app_categories: form.app_categories,
    exclude_games: form.exclude_games,
    estimated_impressions: estimated,
  });

  const goToStep = (index) => {
    setNotice(null);
    setStep(index);
  };

  const handleNext = () => {
    const stepErrors = VALIDATORS[step](form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setErrors({});
    setNotice(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSaveDraft = async () => {
    // Lenient: a draft only needs a name.
    if (!form.name.trim()) {
      setStep(0);
      setErrors({ name: "Nommez la campagne avant d'enregistrer le brouillon." });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const saved = await createDraft(buildPayload());
      setNotice({
        type: "success",
        message:
          saved._source === "local"
            ? "Brouillon enregistré localement (API hors ligne)."
            : "Brouillon enregistré.",
      });
    } catch {
      setNotice({ type: "error", message: "Échec de l'enregistrement du brouillon." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Full validation across every step.
    for (let i = 0; i < VALIDATORS.length; i += 1) {
      const stepErrors = VALIDATORS[i](form);
      if (Object.keys(stepErrors).length > 0) {
        setStep(i);
        setErrors(stepErrors);
        setNotice({
          type: "error",
          message: "Veuillez corriger les champs signalés avant de continuer.",
        });
        return;
      }
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const saved = await createDraft(buildPayload());
      setResult(saved);
    } catch {
      setNotice({ type: "error", message: "Échec de la création de la campagne." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setNotice(null);
    setResult(null);
    setStep(0);
  };

  const breadcrumb = [
    { label: "Campagnes", to: "/campagnes" },
    { label: "Créer une campagne" },
  ];

  /* ----------------------------- success ----------------------------- */
  if (result) {
    return (
      <>
        <PageHeader
          breadcrumb={breadcrumb}
          title="Création de campagne"
          subtitle="Configurez une nouvelle campagne drive-to-store"
        />
        <Card className="p-10">
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Campagne enregistrée en brouillon
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              « {result.name} » a bien été enregistrée avec le statut
              <span className="font-medium text-slate-700"> brouillon</span>.
              Vous pourrez la compléter et la lancer depuis la liste des
              campagnes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate("/campagnes")}>
                Voir les campagnes
              </Button>
              <Button variant="secondary" onClick={resetWizard}>
                Créer une autre campagne
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  /* ------------------------------ wizard ------------------------------ */
  const isLastStep = step === STEPS.length - 1;
  const stepProps = { form, update, errors, options, estimated };

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumb}
        title="Création de campagne"
        subtitle="Configurez une nouvelle campagne drive-to-store en 4 étapes"
      />

      <Card className="p-5 sm:p-6">
        <Stepper steps={STEPS} current={step} onStepSelect={goToStep} />

        <div className="my-6 border-t border-slate-100" />

        {step === 0 && <StepGeneral {...stepProps} />}
        {step === 1 && <StepTargeting {...stepProps} />}
        {step === 2 && <StepFormats {...stepProps} />}
        {step === 3 && <StepCategories {...stepProps} />}

        {notice && (
          <div
            className={
              "mt-6 rounded-lg px-4 py-3 text-sm " +
              (notice.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700")
            }
          >
            {notice.message}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer le brouillon
            </Button>

            {isLastStep ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Créer la campagne
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={submitting}>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-400">
        Besoin de revenir en arrière ? Vous pouvez aussi{" "}
        <Link to="/campagnes" className="text-primary-700 hover:underline">
          retourner à la liste des campagnes
        </Link>
        .
      </p>
    </>
  );
}
