/**
 * schema.org structured-data builders (SPEC V2 §9.2).
 *
 * Pure functions: no filesystem, no env, no React. Callers resolve localized
 * strings and the site URL, then pass them in. This keeps the JSON-LD shape
 * unit-testable and the data always matches the real page content — V2 §9.2
 * requires "结构化数据必须匹配页面真实内容" (structured data must match the
 * page's real content; rich results are never guaranteed).
 */

export interface FAQEntry {
  q: string;
  a: string;
}

/** Build a FAQPage graph from the Q/A pairs actually rendered on the page. */
export function buildFaqPage(faq: FAQEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface WebApplicationInput {
  name: string;
  description: string;
  /** Canonical absolute URL of the tool page. */
  url: string;
}

/**
 * Build a WebApplication graph for a tool page. Every core tool is free and
 * browser-based, so `offers.price` is "0" and `operatingSystem` is "Web".
 */
export function buildWebApplication(input: WebApplicationInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    applicationCategory: "ImageProcessingApplication",
    operatingSystem: "Web",
    url: input.url,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export interface ArticleInput {
  headline: string;
  description: string;
  /** ISO date string (YYYY-MM-DD). */
  datePublished: string;
  /** Optional absolute cover image URL. */
  image?: string;
  /** Canonical absolute URL of the article. */
  url: string;
  author?: string;
  publisher?: string;
}

/** Build an Article graph for a guide page. */
export function buildArticle(input: ArticleInput): Record<string, unknown> {
  const author = input.author ?? "ImageKitTools";
  const publisher = input.publisher ?? "ImageKitTools";
  // Derive a publisher logo URL from the article origin when the URL is
  // absolute (Next.js serves /icon as the app icon). Omit otherwise rather
  // than throw, so a relative test URL does not break the builder.
  let logoUrl: string | undefined;
  try {
    logoUrl = `${new URL(input.url).origin}/icon`;
  } catch {
    logoUrl = undefined;
  }
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    url: input.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    ...(input.image ? { image: input.image } : {}),
    author: { "@type": "Organization", name: author },
    publisher: {
      "@type": "Organization",
      name: publisher,
      ...(logoUrl ? { logo: { "@type": "ImageObject", url: logoUrl } } : {}),
    },
  };
}

export interface Crumb {
  name: string;
  /** Site-relative path (e.g. "/tools") or an absolute URL. */
  href: string;
}

/**
 * Build a BreadcrumbList graph from a trail. The trail runs from the home page
 * (first) to the current page (last); the current page is included as the final
 * item per schema.org guidance.
 */
export function buildBreadcrumbList(trail: Crumb[], siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href.startsWith("http") ? c.href : `${siteUrl}${c.href}`,
    })),
  };
}
