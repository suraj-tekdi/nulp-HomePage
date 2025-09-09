import { ApiResponse, getDynamicNulpUrls } from "./api";

// Footer: Contacts (address blocks)
export interface HomepageContactCategory {
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

export interface HomepageContactLogoFormatThumb {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
}

export interface HomepageContactLogo {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: { thumbnail?: HomepageContactLogoFormatThumb };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepageContactItem {
  id: number;
  documentId: string;
  title: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  slug: string;
  category: HomepageContactCategory;
  logo?: HomepageContactLogo | null;
}

export interface HomepageContactResponseMeta {
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

export interface HomepageContactResponse {
  success: boolean;
  data: HomepageContactItem[] | { data: HomepageContactItem[] };
  meta: HomepageContactResponseMeta;
}

export const contactsApi = {
  getHomepageContacts: async (): Promise<
    ApiResponse<HomepageContactItem[]>
  > => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/contact`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageContactResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        return { success: true, data: items, status: response.status };
      }
      return {
        success: false,
        error: "Invalid contacts API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch contacts",
        status: 0,
      };
    }
  },
};

// Footer: Social media links
export interface FooterSocialCategory {
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

export interface FooterSocialItem {
  id: number;
  documentId: string;
  state: string;
  link: string;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  select_social_media: string; // e.g., Facebook, Instagram, X, LinkedIn, YouTube
  category: FooterSocialCategory;
}

export interface FooterSocialResponseMeta {
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

export interface FooterSocialResponse {
  success: boolean;
  data: FooterSocialItem[] | { data: FooterSocialItem[] };
  meta: FooterSocialResponseMeta;
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

export const socialApi = {
  getHomepageSocialLinks: async (): Promise<
    ApiResponse<FooterSocialItem[]>
  > => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/social`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: FooterSocialResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        // Filter only Published and footer category, then sort by display_order
        const filtered = (items as FooterSocialItem[])
          .filter((i) => (i.state || "").toLowerCase() === "published")
          .filter((i) => (i.category?.slug || "") === "footer-contact-us")
          .filter((i) => !!i.link && !!i.select_social_media)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return { success: true, data: filtered, status: response.status };
      }
      return {
        success: false,
        error: "Invalid social API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch social links",
        status: 0,
      };
    }
  },
};

// Footer: Menus (footer columns)
export interface FooterMenuCategory {
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

export type FooterMenuTargetWindow = "Parent" | "New_Window" | string;
export type FooterMenuType = "Internal" | "External" | string;

export interface FooterMenuItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  menu_type: FooterMenuType;
  link: string;
  target_window: FooterMenuTargetWindow;
  state: string;
  start_publish_date?: string | null;
  end_publish_date?: string | null;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  category: FooterMenuCategory | null;
  parent_menu: any;
  link_image: any;
}

export interface FooterMenusResponseMeta {
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

export interface FooterMenusResponse {
  success: boolean;
  data: FooterMenuItem[] | { data: FooterMenuItem[] };
  meta: FooterMenusResponseMeta;
}

export const menusApi = {
  getHomepageMenus: async (): Promise<ApiResponse<FooterMenuItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/menus`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: FooterMenusResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        const filtered = (items as FooterMenuItem[])
          .filter((m) => (m.state || "").toLowerCase() === "published")
          .filter((m) => (m.category?.slug || "") === "footer-menus")
          .filter((m) =>
            isWithinPublishWindow(m.start_publish_date, m.end_publish_date)
          );
        return { success: true, data: filtered, status: response.status };
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

  // Convenience: split into two footer columns
  getFooterColumns: async (): Promise<
    ApiResponse<{ internal: FooterMenuItem[]; external: FooterMenuItem[] }>
  > => {
    const res = await menusApi.getHomepageMenus();
    if (!res.success || !Array.isArray(res.data)) {
      return {
        success: false,
        error: res.error || "Failed",
        status: res.status,
      };
    }
    const list = res.data as FooterMenuItem[];
    const internal = list
      .filter((m) => (m.menu_type || "").toLowerCase() === "internal")
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const external = list
      .filter((m) => (m.menu_type || "").toLowerCase() === "external")
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return { success: true, data: { internal, external }, status: res.status };
  },
};

// Aggregate footer API
export const footerApi = {
  contacts: contactsApi,
  social: socialApi,
  menus: menusApi,
};
