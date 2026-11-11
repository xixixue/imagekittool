"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CATEGORY_LABELS,
  SIZE_CATEGORIES,
  SIZE_ENTRIES,
  type SizeCategory,
} from "@/lib/data/size-reference";

type Filter = SizeCategory | "all";

/**
 * Image Size Reference (SPEC V2 §8.4, Phase 5). Searchable, filterable table
 * of recommended sizes across six categories. Pure client-side filter over the
 * centrally-managed SIZE_ENTRIES data (no server round-trip).
 */
export function SizeReferenceClient() {
  const tC = useTranslations("Controls");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SIZE_ENTRIES.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.ratio.toLowerCase().includes(q) ||
        CATEGORY_LABELS[e.category].toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tC("isrSearch")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              category === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
            }`}
          >
            {tC("isrAll")}
          </button>
          {SIZE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                category === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} {tC("isrResults")}
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{tC("isrName")}</th>
              <th className="px-4 py-3 font-medium">{tC("isrDimensions")}</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">{tC("isrRatio")}</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">{tC("isrFormats")}</th>
              <th className="px-4 py-3 font-medium">{tC("isrOpenResizer")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{e.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{e.description}</div>
                  <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                    {e.ratio} · {e.formats}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono">
                  {e.width}×{e.height}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">{e.ratio}</td>
                <td className="hidden px-4 py-3 md:table-cell">{e.formats}</td>
                <td className="px-4 py-3">
                  <a
                    href={e.resizerHref}
                    className="inline-flex rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {tC("isrOpenResizer")}
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {tC("isrNoResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
