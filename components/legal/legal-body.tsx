import Link from "next/link";

/**
 * Shared types and renderer for the localized legal/content pages
 * (`Legal` message namespace: about, contact, privacy-policy, terms,
 * cookie-policy).
 *
 * A section `body` is either a plain string or an array of segments. A segment
 * is either plain text (`{ t }`) or an inline internal link (`{ link, text }`),
 * where `link` is a stable key resolved to a route via `LEGAL_LINK_HREFS`. This
 * keeps inline links inside translated copy without any rich-text dependency.
 */

export interface LegalSegment {
  t?: string;
  link?: string;
  text?: string;
}

export interface LegalSection {
  heading: string;
  body: string | LegalSegment[];
  items?: string[];
  after?: string | LegalSegment[];
}

export interface LegalCookieRow {
  name: string;
  purpose: string;
  duration: string;
}

export interface LegalPage {
  title: string;
  metaDescription: string;
  lastUpdated?: string;
  paragraphs?: (string | LegalSegment[])[];
  intro?: string;
  sections?: LegalSection[];
  tableHeaders?: { cookie: string; purpose: string; duration: string };
  essentialCookies?: LegalCookieRow[];
}

export interface LegalMessages {
  about: LegalPage;
  contact: LegalPage;
  privacy: LegalPage;
  terms: LegalPage;
  cookie: LegalPage;
}

/** Stable link keys -> routes, used by inline link segments. */
export const LEGAL_LINK_HREFS: Record<string, string> = {
  "privacy-policy": "/privacy-policy",
  contact: "/contact",
};

/** Render a section/paragraph body (plain string or segment array) as a <p>. */
export function renderLegalBody(body: string | LegalSegment[]) {
  if (typeof body === "string") {
    return <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>;
  }
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {body.map((seg, i) =>
        seg.link ? (
          <Link key={i} href={LEGAL_LINK_HREFS[seg.link] ?? "#"} className="text-primary hover:underline">
            {seg.text}
          </Link>
        ) : (
          <span key={i}>{seg.t}</span>
        )
      )}
    </p>
  );
}
