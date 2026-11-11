import { describe, expect, it } from "vitest";
import {
  buildArticle,
  buildBreadcrumbList,
  buildFaqPage,
  buildHowTo,
  buildItemList,
  buildWebApplication,
} from "@/lib/seo/json-ld";

describe("buildFaqPage", () => {
  it("maps Q/A pairs to Question/Answer entries under FAQPage", () => {
    const ld = buildFaqPage([
      { q: "Is there a file size limit?", a: "Yes — 25 MB per image." },
      { q: "Are my images uploaded?", a: "No." },
    ]);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    const main = ld.mainEntity as Record<string, unknown>[];
    expect(main).toHaveLength(2);
    expect(main[0]).toEqual({
      "@type": "Question",
      name: "Is there a file size limit?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — 25 MB per image." },
    });
  });

  it("produces an empty mainEntity list when there is no FAQ", () => {
    const ld = buildFaqPage([]);
    expect((ld.mainEntity as unknown[]).length).toBe(0);
  });
});

describe("buildWebApplication", () => {
  it("marks the tool free, browser-based, and category ImageProcessing", () => {
    const ld = buildWebApplication({
      name: "Image Compressor",
      description: "Shrink JPG, PNG and WebP images in your browser.",
      url: "https://example.com/image-compressor",
    });
    expect(ld["@type"]).toBe("WebApplication");
    expect(ld.applicationCategory).toBe("ImageProcessingApplication");
    expect(ld.operatingSystem).toBe("Web");
    expect(ld.url).toBe("https://example.com/image-compressor");
    const offers = ld.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.price).toBe("0");
  });
});

describe("buildArticle", () => {
  const base = {
    headline: "JPG vs PNG vs WebP",
    description: "A practical format comparison.",
    datePublished: "2025-01-12",
    url: "https://example.com/guides/jpg-vs-png-vs-webp",
  };

  it("builds an Article graph with author and publisher", () => {
    const ld = buildArticle(base);
    expect(ld["@type"]).toBe("Article");
    expect(ld.headline).toBe(base.headline);
    expect(ld.datePublished).toBe("2025-01-12");
    expect((ld.mainEntityOfPage as Record<string, unknown>)["@id"]).toBe(base.url);
    expect((ld.author as Record<string, unknown>).name).toBe("ImageKitTools");
    expect((ld.publisher as Record<string, unknown>).name).toBe("ImageKitTools");
  });

  it("includes image only when one is provided", () => {
    const withImg = buildArticle({ ...base, image: "https://example.com/cover.webp" });
    const withoutImg = buildArticle(base);
    expect(withImg.image).toBe("https://example.com/cover.webp");
    expect(withoutImg.image).toBeUndefined();
  });

  it("derives a publisher logo from the article origin", () => {
    const ld = buildArticle(base);
    const publisher = ld.publisher as Record<string, unknown>;
    const logo = publisher.logo as Record<string, unknown>;
    expect(logo.url).toBe("https://example.com/icon");
  });

  it("omits the logo when the URL is not absolute", () => {
    const ld = buildArticle({ ...base, url: "/guides/relative" });
    const publisher = ld.publisher as Record<string, unknown>;
    expect(publisher.logo).toBeUndefined();
  });
});

describe("buildBreadcrumbList", () => {
  it("numbers positions from 1 and prefixes relative hrefs with the site URL", () => {
    const ld = buildBreadcrumbList(
      [
        { name: "ImageKitTools", href: "/" },
        { name: "Tools", href: "/tools" },
        { name: "Image Compressor", href: "/image-compressor" },
      ],
      "https://example.com",
    );
    expect(ld["@type"]).toBe("BreadcrumbList");
    const items = ld.itemListElement as Record<string, unknown>[];
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe("ImageKitTools");
    expect(items[0].item).toBe("https://example.com/");
    expect(items[2].position).toBe(3);
    expect(items[2].item).toBe("https://example.com/image-compressor");
  });

  it("leaves absolute hrefs untouched", () => {
    const ld = buildBreadcrumbList(
      [{ name: "Home", href: "https://example.com/" }],
      "https://other.example",
    );
    expect((ld.itemListElement as Record<string, unknown>[])[0].item).toBe("https://example.com/");
  });
});

describe("buildHowTo", () => {
  it("builds a HowTo graph with numbered steps", () => {
    const ld = buildHowTo({
      name: "How to Remove EXIF Metadata",
      description: "Strip metadata from a photo in your browser.",
      url: "https://example.com/guides/remove-exif",
      steps: [
        { name: "Load the image", text: "Drop a JPG or PNG into the tool." },
        { name: "Remove EXIF", text: "Click Remove; the tool re-encodes without metadata." },
      ],
    });
    expect(ld["@type"]).toBe("HowTo");
    expect(ld.name).toBe("How to Remove EXIF Metadata");
    const steps = ld.step as Record<string, unknown>[];
    expect(steps).toHaveLength(2);
    expect(steps[0].position).toBe(1);
    expect(steps[1].position).toBe(2);
    expect(steps[0].name).toBe("Load the image");
  });
});

describe("buildItemList", () => {
  it("builds an ItemList with positioned entries", () => {
    const ld = buildItemList(
      [
        { name: "Instagram Post", url: "/social-media-resizer" },
        { name: "Favicon 32px", url: "/favicon-generator" },
      ],
      "https://example.com",
    );
    expect(ld["@type"]).toBe("ItemList");
    const items = ld.itemListElement as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[0].url).toBe("https://example.com/social-media-resizer");
  });

  it("leaves absolute URLs untouched", () => {
    const ld = buildItemList(
      [{ name: "External", url: "https://other.example/x" }],
      "https://example.com",
    );
    expect((ld.itemListElement as Record<string, unknown>[])[0].url).toBe("https://other.example/x");
  });
});
