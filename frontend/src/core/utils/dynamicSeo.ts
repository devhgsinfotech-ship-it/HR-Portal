// frontend/src/core/utils/dynamicSeo.ts
import axios from "axios";
import apiClient from "./apiClient";
import { APP_CONFIG } from "../../environment";

export interface SeoData {
  id?: number;
  companyId?: number | null;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
}

export const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `${backendBase}${clean}`;
};

function setMetaTag(key: string, value: string | undefined | null, attr: "name" | "property" = "name") {
  if (!value) {
    const existing = document.querySelector(`meta[${attr}="${key}"]`);
    if (existing) existing.remove();
    return;
  }
  let meta = document.querySelector(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", value);
}

function setLinkTag(rel: string, href: string | undefined | null) {
  if (!href) {
    const existing = document.querySelector(`link[rel="${rel}"]`);
    if (existing) existing.remove();
    return;
  }
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

/**
 * Dynamically applies SEO tags directly into the browser document head.
 */
export function applyDynamicSeo(seo: Partial<SeoData>) {
  if (!seo) return;

  // 1. Browser Tab Title
  if (seo.metaTitle && seo.metaTitle.trim()) {
    document.title = seo.metaTitle.trim();
  }

  // 2. Standard Meta Tags
  setMetaTag("description", seo.metaDescription?.trim() || null);
  setMetaTag("keywords", seo.metaKeywords?.trim() || null);
  setLinkTag("canonical", seo.canonicalUrl?.trim() || null);

  // 3. Open Graph (Facebook, LinkedIn, Slack, WhatsApp)
  const fullOgImage = resolveImageUrl(seo.ogImage);
  setMetaTag("og:title", seo.ogTitle?.trim() || seo.metaTitle?.trim() || null, "property");
  setMetaTag("og:description", seo.ogDescription?.trim() || seo.metaDescription?.trim() || null, "property");
  setMetaTag("og:image", fullOgImage, "property");
  setMetaTag("og:url", seo.canonicalUrl?.trim() || (typeof window !== "undefined" ? window.location.href : null), "property");
  setMetaTag("og:type", "website", "property");

  // 4. Twitter Cards
  setMetaTag("twitter:card", fullOgImage ? "summary_large_image" : "summary");
  setMetaTag("twitter:title", seo.ogTitle?.trim() || seo.metaTitle?.trim() || null);
  setMetaTag("twitter:description", seo.ogDescription?.trim() || seo.metaDescription?.trim() || null);
  setMetaTag("twitter:image", fullOgImage);
}

/**
 * Fetches dynamic SEO settings from backend and applies them to the document.
 * Safely falls back to public endpoint without triggering any auth redirects.
 */
export async function fetchAndApplyDynamicSeo(): Promise<SeoData | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    let seoData: SeoData | null = null;

    if (token) {
      const res = await apiClient.get("/seo-settings").catch(() => null);
      if (res?.data?.success && res.data.seo) {
        seoData = res.data.seo;
      }
    }

    if (!seoData) {
      const backendBase = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
      const pubRes = await axios.get(`${backendBase}/seo-settings/public`).catch(() => null);
      if (pubRes?.data?.success && pubRes.data.seo) {
        seoData = pubRes.data.seo;
      }
    }

    if (seoData) {
      applyDynamicSeo(seoData);
      return seoData;
    }
  } catch (err) {
    console.warn("Could not apply dynamic SEO:", err);
  }
  return null;
}
