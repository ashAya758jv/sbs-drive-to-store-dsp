import { useMemo, useState } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp, Download } from "lucide-react";
import Button from "../ui/Button";
import { cn } from "../../lib/cn";

const COLUMNS = [
  { key: "storeName", label: "Magasin", align: "left", type: "string" },
  { key: "city", label: "Ville", align: "left", type: "string" },
  { key: "campaignLabel", label: "Campagne", align: "left", type: "string" },
  { key: "radiusKm", label: "Rayon", align: "right", type: "number" },
  { key: "impressions", label: "Impressions", align: "right", type: "number" },
  { key: "clicks", label: "Clics", align: "right", type: "number" },
  { key: "ctr", label: "CTR", align: "right", type: "number" },
  { key: "spend", label: "Budget dépensé", align: "right", type: "number" },
  { key: "visits", label: "Visites estimées", align: "right", type: "number" },
];

const CSV_FILENAME = "reporting-magasins.csv";

function formatCell(row, column) {
  switch (column.key) {
    case "radiusKm":
      return `${row.radiusKm} km`;
    case "ctr":
      return `${row.ctr.toFixed(2).replace(".", ",")}%`;
    case "spend":
      return `${Math.round(row.spend).toLocaleString("fr-FR")} MAD`;
    case "impressions":
    case "clicks":
    case "visits":
      return row[column.key].toLocaleString("fr-FR");
    default:
      return row[column.key];
  }
}

// --------------------------- CSV export only ---------------------------
// Kept separate from `formatCell`/`COLUMNS` (used by the on-screen table)
// so the export can be made maximally Excel-safe without touching the
// table's own display, which uses accented labels and locale-grouped
// numbers on purpose.

/** ASCII-only header labels \u2014 accents are what triggers mojibake in Excel
 * when it fails to honor the file's UTF-8 encoding. */
const CSV_HEADERS = [
  "Magasin",
  "Ville",
  "Campagne",
  "Rayon",
  "Impressions",
  "Clics",
  "CTR",
  "Budget depense",
  "Visites estimees",
];

/** Strip accents so exported text can never be mangled if Excel misreads the
 * file's encoding \u2014 e.g. "Ma\u00e2rif" -> "Maarif", "d\u00e9pens\u00e9" -> "depense". Uses
 * decomposition (NFD) + stripping the resulting combining marks, same
 * technique already used for the DCO landing-page slug (see DCO.jsx). */
function stripAccents(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Plain, locale-free cell value for the CSV \u2014 no thousands grouping at all,
 * so there's no whitespace character (regular, NBSP or the narrow NBSP
 * `Intl`/`toLocaleString` uses) that could turn into mojibake if Excel
 * misreads the encoding. E.g. 330977, never "330 977". Text fields are
 * accent-stripped for the same reason (e.g. "Ma\u00e2rif" -> "Maarif"). */
function formatCsvCell(row, column) {
  switch (column.key) {
    case "radiusKm":
      return `${row.radiusKm} km`;
    case "ctr":
      return `${row.ctr.toFixed(2).replace(".", ",")}%`;
    case "spend":
      return `${Math.round(row.spend)} MAD`;
    case "impressions":
    case "clicks":
    case "visits":
      return String(row[column.key]);
    default:
      return stripAccents(row[column.key]);
  }
}

/** Wrap a CSV field in quotes if it contains the delimiter, a quote or a newline. */
function escapeCsvField(value) {
  const str = String(value ?? "");
  return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Semicolon-delimited (Excel/French convention) with a UTF-8 BOM so accents
 * render correctly. The leading "sep=;" line is Excel's own directive to
 * force that delimiter when the file is opened by double-click \u2014 without it,
 * Excel falls back to the OS's regional "list separator" setting, and when
 * that's a comma (common outside France) the whole file lands in one column
 * even though it's correctly semicolon-delimited.
 */
function buildCsv(rows) {
  const lines = ["sep=;", CSV_HEADERS.join(";")];
  rows.forEach((row) => {
    lines.push(COLUMNS.map((col) => escapeCsvField(formatCsvCell(row, col))).join(";"));
  });
  return `\uFEFF${lines.join("\r\n")}`;
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sortable per-store performance table + CSV export — Jour 5. Exports
 * exactly what's currently displayed (same sort order), which is the least
 * surprising behaviour for a "what you see is what you export" button.
 */
export default function StorePerformanceTable({ rows }) {
  const [sortKey, setSortKey] = useState("impressions");
  const [sortDir, setSortDir] = useState("desc");

  const sortedRows = useMemo(() => {
    const column = COLUMNS.find((col) => col.key === sortKey);
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp =
        column?.type === "string" ? String(va).localeCompare(String(vb)) : va - vb;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    if (sortedRows.length === 0) return;
    downloadCsv(buildCsv(sortedRows), CSV_FILENAME);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Détail par magasin
          </h2>
          <p className="text-sm text-slate-400">
            Cliquez sur une colonne pour trier. L'export reprend l'ordre affiché.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={sortedRows.length === 0}
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              {COLUMNS.map((col) => {
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn("px-4 py-3 font-medium", col.align === "right" && "text-right")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-slate-700",
                        col.align === "right" && "flex-row-reverse",
                        isActive && "text-primary-700",
                      )}
                    >
                      {col.label}
                      {isActive ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  Aucun magasin ne correspond à ce filtre.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={row.storeId} className="transition-colors hover:bg-lavender-50">
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-slate-600",
                        col.align === "right" && "text-right",
                        col.key === "storeName" && "font-medium text-slate-800",
                      )}
                    >
                      {formatCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
