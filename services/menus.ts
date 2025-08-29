import { ApiResponse } from "./api";
import { getDynamicNulpUrls } from "./api";

export interface HomepageMenuCategory {
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

export interface HomepageMenuItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  menu_type: "Internal" | "External";
  link: string;
  target_window: "Parent" | "New_Window";
  state: string;
  start_publish_date: string | null;
  end_publish_date: string | null;
  is_active: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  category: HomepageMenuCategory;
  parent_menu: HomepageMenuItem | null;
  link_image: any;
}

export interface HomepageMenuResponseMeta {
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

export interface HomepageMenuResponse {
  success: boolean;
  data: HomepageMenuItem[] | { data: HomepageMenuItem[] };
  meta: HomepageMenuResponseMeta;
}

export const menusApi = {
  getHomepageMenus: async (): Promise<ApiResponse<HomepageMenuItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/menus`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageMenuResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        const sorted = [...items].sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        return { success: true, data: sorted, status: response.status };
      }
      return {
        success: false,
        error: "Invalid menus API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch menus",
        status: 0,
      };
    }
  },
};
