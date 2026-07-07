import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";

/**
 * Step 1 — general information: name, advertiser, objective, dates, budgets.
 */
export default function StepGeneral({ form, update, errors, options }) {
  const advertiserOptions = [
    { value: "", label: "Sélectionnez un annonceur" },
    ...options.advertisers,
  ];
  const objectiveOptions = [
    { value: "", label: "Sélectionnez un objectif" },
    ...options.objectives,
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field
        label="Nom de la campagne"
        htmlFor="name"
        required
        error={errors.name}
        className="sm:col-span-2"
      >
        <Input
          id="name"
          value={form.name}
          invalid={Boolean(errors.name)}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Ex. Marjane Ramadan 2026"
        />
      </Field>

      <Field label="Annonceur" htmlFor="advertiser" required error={errors.advertiser_id}>
        <Select
          id="advertiser"
          value={form.advertiser_id}
          onChange={(e) => update({ advertiser_id: e.target.value })}
          options={advertiserOptions}
          selectClassName={errors.advertiser_id ? "border-rose-300" : undefined}
        />
      </Field>

      <Field label="Objectif" htmlFor="objective" required error={errors.objective}>
        <Select
          id="objective"
          value={form.objective}
          onChange={(e) => update({ objective: e.target.value })}
          options={objectiveOptions}
          selectClassName={errors.objective ? "border-rose-300" : undefined}
        />
      </Field>

      <Field label="Date de début" htmlFor="start_date" required error={errors.start_date}>
        <Input
          id="start_date"
          type="date"
          value={form.start_date}
          invalid={Boolean(errors.start_date)}
          onChange={(e) => update({ start_date: e.target.value })}
        />
      </Field>

      <Field label="Date de fin" htmlFor="end_date" required error={errors.end_date}>
        <Input
          id="end_date"
          type="date"
          value={form.end_date}
          invalid={Boolean(errors.end_date)}
          onChange={(e) => update({ end_date: e.target.value })}
        />
      </Field>

      <Field
        label="Budget total (MAD)"
        htmlFor="total_budget"
        required
        error={errors.total_budget}
      >
        <Input
          id="total_budget"
          type="number"
          min="0"
          step="100"
          value={form.total_budget}
          invalid={Boolean(errors.total_budget)}
          onChange={(e) => update({ total_budget: e.target.value })}
          placeholder="Ex. 50000"
        />
      </Field>

      <Field
        label="Budget quotidien (MAD)"
        htmlFor="daily_budget"
        error={errors.daily_budget}
        hint="Optionnel"
      >
        <Input
          id="daily_budget"
          type="number"
          min="0"
          step="50"
          value={form.daily_budget}
          invalid={Boolean(errors.daily_budget)}
          onChange={(e) => update({ daily_budget: e.target.value })}
          placeholder="Ex. 1600 (optionnel)"
        />
      </Field>
    </div>
  );
}
