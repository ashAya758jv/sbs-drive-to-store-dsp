import Breadcrumb from "./Breadcrumb";

/**
 * Standard page heading: breadcrumb + title + subtitle, with an optional
 * `actions` slot on the right (filters, buttons, ...). Used by every screen so
 * headers stay consistent with the Figma mockups.
 */
export default function PageHeader({ breadcrumb = [], title, subtitle, actions }) {
  return (
    <div className="mb-6">
      <Breadcrumb items={breadcrumb} />
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-end gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
