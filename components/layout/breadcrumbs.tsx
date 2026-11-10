import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbList, type Crumb } from "@/lib/seo/json-ld";

/**
 * Visual breadcrumb trail + BreadcrumbList JSON-LD (SPEC V2 §9.2).
 *
 * Server component. `trail` is the full path from the home page to the current
 * page, with the current page last (rendered as non-link text with
 * `aria-current="page"`). Names are pre-resolved by the caller so this
 * component stays locale-agnostic and trivially testable.
 */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${crumb.href}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className="text-muted-foreground/50">/</span>}
              {isLast ? (
                <span aria-current="page" className="text-foreground/80">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={buildBreadcrumbList(trail, SITE_URL)} />
    </nav>
  );
}
