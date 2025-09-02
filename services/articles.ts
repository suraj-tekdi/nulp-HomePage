import { ApiResponse } from "./api";
import { getDynamicNulpUrls } from "./api";

export interface HomepageArticleCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description?: string | null;
  state: string;
}

export interface HomepageArticleMenuRef {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  menu_type: string;
  link: string;
  target_window: "Parent" | "New_Window" | string;
  state: string;
}

export interface HomepageArticleImageFormats {
  large?: { url: string; width?: number; height?: number };
  medium?: { url: string; width?: number; height?: number };
  small?: { url: string; width?: number; height?: number };
  thumbnail?: { url: string; width?: number; height?: number };
}

export interface HomepageArticleImage {
  id: number;
  documentId: string;
  name: string;
  width: number;
  height: number;
  formats?: HomepageArticleImageFormats;
  url: string;
}

export interface HomepageArticleItem {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  content: string; // HTML from CMS
  state: string; // Published
  start_publish_date: string | null;
  end_publish_date: string | null;
  display_order?: number | null;
  tags?: Array<{ name: string }> | null;
  category: HomepageArticleCategory;
  menu?: HomepageArticleMenuRef | null;
  thumbnail?: HomepageArticleImage | null;
}

export interface HomepageArticlesResponseMeta {
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

export interface HomepageArticlesResponse {
  success: boolean;
  data: HomepageArticleItem[] | { data: HomepageArticleItem[] };
  meta: HomepageArticlesResponseMeta;
}

const isWithinPublishWindow = (
  start?: string | null,
  end?: string | null
): boolean => {
  const now = new Date();
  const startOk = !start || new Date(start) <= now;
  const endOk = !end || now <= new Date(end);
  return startOk && endOk;
};

export const articlesApi = {
  // Fetch About Us page articles once
  getAboutUsArticles: async (): Promise<ApiResponse<HomepageArticleItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const url = `${base}/mw-cms/api/v1/homepage/articles?menu=about-us&state=Published`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw: HomepageArticlesResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        const visible = (items as HomepageArticleItem[])
          .filter((a) => (a.state || "").toLowerCase() === "published")
          .filter((a) =>
            isWithinPublishWindow(a.start_publish_date, a.end_publish_date)
          )
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return { success: true, data: visible, status: response.status };
      }
      return {
        success: false,
        error: "Invalid articles API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch About Us articles",
        status: 0,
      };
    }
  },

  // Convenience: find a specific article by category slug or item slug
  findArticleBySlug: (
    articles: HomepageArticleItem[] | undefined,
    slug: string
  ): HomepageArticleItem | undefined => {
    if (!Array.isArray(articles)) return undefined;
    const s = slug.toLowerCase();
    return (
      articles.find((a) => (a.slug || "").toLowerCase() === s) ||
      articles.find((a) => (a.category?.slug || "").toLowerCase() === s)
    );
  },
};
