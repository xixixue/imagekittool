# AdSense Compliance & Ad Placement

This document describes how ImageKitTools integrates Google AdSense in a
policy-compliant way, and how to enable ads once your AdSense account is
approved.

The site was reviewed against the three AdSense risk points for tool/utility
sites (low-value content, misleading ad placement, ads on processing/result
interfaces). Each is addressed below.

---

## 1. Low-value content — already addressed by rich, original copy

Every tool page renders a localized **SEO content section** below the tool
(`components/tools/tool-seo-content.tsx`, data in `messages/<locale>.json` under
the `ToolSeo` namespace). For each of the 10 tools, in all 8 locales, it
includes:

- **How to use** — 5 numbered steps.
- **When to use it** — 4 real-world use cases.
- **Knowledge** — 2 short original articles (format/algorithm explainers).
- **FAQ** — 3 Q&A entries.
- **Related tools** — internal links.

This means tool pages are **not** "UI-only" pages; they carry substantial
original text content, which is the primary defense against the "Low-Value
Content" / "ads on non-content pages" rejection.

Policy pages required by AdSense already exist: `/privacy-policy`,
`/terms`, `/cookie-policy`.

## 2. Misleading ad placement — safe margins and labeled units

- Ad units are rendered by `components/ads/ad-slot.tsx` as a **labeled**
  `<aside>` ("Advertisement" / localized) inside a dashed, muted container with
  `my-10` vertical margins — clear visual separation from any other element.
- Ad slots are **only ever placed inside content zones** (the tool SEO content
  section, and between homepage sections). They are **never** rendered inside
  `ImageToolWorkspace` — so no ad sits near the drop zone, the process button,
  the file list, or the download buttons.

## 3. No ads on processing/result interfaces

- The tool workspace (upload → process → result/download) contains **zero** ad
  slots by design. Ads live only in the editorial content below it.
- Ad slots are **static in-content units** — no interstitial pop-up, no
  auto-refresh, never overlaid on a processing or download view.

---

## Ad slot locations

| Location           | Component        | Slot ID             | Zone              |
| ------------------ | ---------------- | ------------------- | ----------------- |
| Tool page, top     | `ToolSeoContent` | `tool-content-top`  | SEO content       |
| Tool page, bottom  | `ToolSeoContent` | `tool-content-bottom`| SEO content      |
| Homepage, mid      | `HomePage`       | `home-mid`          | Between sections  |

No ad slots exist on: the tool workspace, auth pages, account/cloud pages,
policy pages, or any processing/result view.

---

## How to enable AdSense

Ads are **off by default**. Nothing loads until you configure the publisher
client ID.

1. Get AdSense approval for `imagekittool.com`.
2. In AdSense, create ad units and note their **slot IDs** (numeric).
3. Set the env var (Vercel → Settings → Environment Variables):
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   ```
   This is a `NEXT_PUBLIC_*` value (exposed to the browser); it is a public
   publisher ID, not a secret.
4. Replace the placeholder `slot` props in
   `components/tools/tool-seo-content.tsx` and `app/page.tsx` with your real
   AdSense unit slot IDs.
5. Redeploy. The AdSense loader (`adsbygoogle.js`) is injected by
   `components/analytics/analytics.tsx` only when the client ID is set.

While `NEXT_PUBLIC_ADSENSE_CLIENT` is empty, `<AdSlot/>` renders nothing and no
AdSense script is loaded — so the site ships no ad code before approval.

## CSP

`next.config.ts` adds the AdSense origins to the Content-Security-Policy
**only when** `NEXT_PUBLIC_ADSENSE_CLIENT` is set:

- `script-src-elem … https://pagead2.googlesyndication.com`
- `frame-src 'self' https://googleads.g.doubleclick.net https://*.googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://tpc.googlesyndication.com`
- `img-src` already permits any `https:` (impression pixels).
- `connect-src 'self' https:` already covers ad beacons.

`Permissions-Policy` keeps `browsing-topics=()` (Topics API disabled).
