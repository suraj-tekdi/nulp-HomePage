import { ApiResponse } from "./api";
import { getDynamicNulpUrls } from "./api";

export interface HomepageBannerImageFormats {
  large?: { url: string };
  medium?: { url: string };
  small?: { url: string };
  thumbnail?: { url: string };
}

export interface HomepageBannerImage {
  id: number;
  documentId: string;
  name: string;
  width: number;
  height: number;
  formats?: HomepageBannerImageFormats;
  url: string; // absolute URL from CMS
}

export interface HomepageBannerCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  state: string;
}

export interface HomepageBannerMenuRef {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  link: string;
  target_window: "Parent" | "New_Window";
  state: string;
}

export interface HomepageBannerItem {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  content: string; // HTML string
  state: string; // Published
  start_publish_date: string | null;
  end_publish_date: string | null;
  is_active?: boolean; // some envs may omit this
  display_order: number;
  target_url?: string | null;
  target_window?: "Parent" | "New_Window";
  button_text?: string | null;
  background_image?: HomepageBannerImage | null;
  category: HomepageBannerCategory;
  menu?: HomepageBannerMenuRef | null;
}

export interface HomepageBannersResponseMeta {
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

export interface HomepageBannersResponse {
  success: boolean;
  data: HomepageBannerItem[] | { data: HomepageBannerItem[] };
  meta: HomepageBannersResponseMeta;
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

export const bannersApi = {
  getHomepageBanners: async (): Promise<ApiResponse<HomepageBannerItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/banners`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageBannersResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        // Filter visibility: published, active, within window
        const visible = (items as HomepageBannerItem[])
          .filter((b) =>
            typeof (b as any).is_active === "boolean"
              ? (b as any).is_active
              : true
          )
          .filter((b) => (b.state || "").toLowerCase() === "published")
          .filter((b) =>
            isWithinPublishWindow(b.start_publish_date, b.end_publish_date)
          )
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return { success: true, data: visible, status: response.status };
      }
      return {
        success: false,
        error: "Invalid banners API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch banners",
        status: 0,
      };
    }
  },
};
