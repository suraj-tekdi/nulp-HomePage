import { ApiResponse } from "./api";
import { getDynamicNulpUrls } from "./api";

export interface HomepageSliderCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  state: string;
}

export interface HomepageSliderItem {
  id: number;
  documentId: string;
  name: string;
  mode: string;
  sort_field?: string | null;
  sort_order?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  trending_courses?: string[] | null;
  trending_good_practices?: string[] | null;
  trending_discussions?: string[] | null;
  state: string;
  display_order: number;
  category: HomepageSliderCategory;
  start_publish_date?: string | null;
  end_publish_date?: string | null;
  is_active?: boolean;
}

export interface HomepageSlidersResponseMeta {
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

export interface HomepageSlidersResponse {
  success: boolean;
  data: HomepageSliderItem[] | { data: HomepageSliderItem[] };
  meta: HomepageSlidersResponseMeta;
}

// NULP Course Types (moved here for sliders flow)
export interface NulpCourse {
  identifier: string;
  name: string;
  appIcon?: string;
  se_boards: string[];
  se_gradeLevels?: string[];
  se_subjects: string[];
  organisation: string[];
  orgDetails: {
    orgName: string;
    email?: string;
  };
  primaryCategory: string;
  contentType: string;
  resourceType: string;
  trackable: {
    enabled: string;
    autoBatch: string;
  };
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

export const slidersApi = {
  getHomepageSliders: async (): Promise<ApiResponse<HomepageSliderItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/sliders`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageSlidersResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        const visible = (items as HomepageSliderItem[])
          .filter((s) =>
            typeof (s as any).is_active === "boolean"
              ? (s as any).is_active
              : true
          )
          .filter((s) => (s.state || "").toLowerCase() === "published")
          .filter((s) =>
            isWithinPublishWindow(
              (s as any).start_publish_date,
              (s as any).end_publish_date
            )
          );
        return { success: true, data: visible, status: response.status };
      }
      return {
        success: false,
        error: "Invalid sliders API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch sliders",
        status: 0,
      };
    }
  },

  // Helper: extract trending course IDs from sliders
  getTrendingCourseIds: async (): Promise<ApiResponse<string[]>> => {
    const res = await slidersApi.getHomepageSliders();
    if (!res.success || !Array.isArray(res.data))
      return {
        success: false,
        error: res.error || "Failed",
        status: res.status,
      };
    const items = res.data as HomepageSliderItem[];
    // Prefer mode Select_Course; fallback to name match
    const slider =
      items.find((i) => (i.mode || "").toLowerCase() === "select_course") ||
      items.find((i) => (i.name || "").toLowerCase() === "trending courses");
    const ids = (slider?.trending_courses || []).filter(Boolean) as string[];
    return { success: true, data: ids, status: res.status };
  },

  // Fetch courses by IDs using the payload shape provided
  getCoursesByIds: async (
    identifiers: string[]
  ): Promise<ApiResponse<NulpCourse[]>> => {
    try {
      if (!identifiers || identifiers.length === 0) {
        return { success: true, data: [] };
      }
      const urls = getDynamicNulpUrls();
      const baseUrl = urls.base;

      const payload = {
        filters: {
          status: ["Live"],
          visibility: ["Default", "Parent"],
          identifier: identifiers,
          se_boards: [null],
        },
        limit: 100,
        sort_by: { createdOn: "desc" },
        fields: [
          "name",
          "appIcon",
          "mimeType",
          "gradeLevel",
          "identifier",
          "medium",
          "pkgVersion",
          "board",
          "subject",
          "resourceType",
          "primaryCategory",
          "contentType",
          "channel",
          "organisation",
          "trackable",
          "primaryCategory",
          "se_boards",
          "se_gradeLevels",
          "se_subjects",
          "se_mediums",
        ],
        facets: [
          "se_boards",
          "se_gradeLevels",
          "se_subjects",
          "se_mediums",
          "primaryCategory",
        ],
        offset: 0,
      } as any;

      const response = await fetch(
        `${baseUrl}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            "Content-Type": "application/json",
            Origin:
              typeof window !== "undefined" ? window.location.origin : baseUrl,
            Referer:
              typeof window !== "undefined"
                ? `${window.location.origin}/`
                : `${baseUrl}/`,
          },
          body: JSON.stringify({ request: payload }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data?.responseCode === "OK" && Array.isArray(data?.result?.content)) {
        return {
          success: true,
          data: data.result.content as NulpCourse[],
          status: response.status,
        };
      }
      return {
        success: false,
        error: "Invalid response from NULP API",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch courses by ids",
        status: 0,
      };
    }
  },

  // Combined helper: from sliders to courses
  getTrendingCourses: async (): Promise<ApiResponse<NulpCourse[]>> => {
    const idsRes = await slidersApi.getTrendingCourseIds();
    if (!idsRes.success)
      return { success: false, error: idsRes.error, status: idsRes.status };
    const ids = (idsRes.data || []).filter(Boolean);
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[Sliders] Trending course IDs:", ids);
    }
    return slidersApi.getCoursesByIds(ids);
  },
};
