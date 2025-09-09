import { ApiResponse, getDynamicNulpUrls } from "./api";

export interface HomepagePartnerLogoFormatThumb {
  ext: string;
  url: string; // can be absolute or relative
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
}

export interface HomepagePartnerLogoFormats {
  thumbnail?: HomepagePartnerLogoFormatThumb;
}

export interface HomepagePartnerLogo {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: HomepagePartnerLogoFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string; // can be absolute or relative
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepagePartnerCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepagePartnerItem {
  id: number;
  documentId: string;
  name: string;
  link: string;
  slug: string;
  state: string; // Published/Unpublished
  is_active: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  logo: HomepagePartnerLogo;
  category: HomepagePartnerCategory | null;
}

export interface HomepagePartnersResponseMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  responseTime: number;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface HomepagePartnersResponse {
  success: boolean;
  data: HomepagePartnerItem[] | { data: HomepagePartnerItem[] };
  meta: HomepagePartnersResponseMeta;
}

const isPublished = (state?: string) =>
  (state || "").toLowerCase() === "published";

export const partnersApi = {
  getHomepagePartners: async (): Promise<
    ApiResponse<HomepagePartnerItem[]>
  > => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/partners`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw: HomepagePartnersResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        const visible = (items as HomepagePartnerItem[])
          .filter((p) => isPublished(p.state))
          .filter((p) => p.is_active !== false)
          .filter(
            (p) => !p.category || (p.category?.slug || "") === "our-partners"
          )
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return { success: true, data: visible, status: response.status };
      }
      return {
        success: false,
        error: "Invalid partners API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch partners",
        status: 0,
      };
    }
  },

  buildLogoUrl: (pathOrUrl?: string): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://"))
      return pathOrUrl;
    const { base } = getDynamicNulpUrls();
    const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${base}${normalized}`;
  },
};
