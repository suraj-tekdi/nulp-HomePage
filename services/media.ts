import { ApiResponse, getDynamicNulpUrls } from "./api";

export interface HomepageMediaCategory {
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

export interface HomepageMediaFile {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width?: number | null;
  height?: number | null;
  formats?: any | null;
  hash: string;
  ext: string | null;
  mime: string | null;
  size?: number | null;
  url: string; // absolute
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepageMediaItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  media_type: "Video" | "Image" | string;
  description?: string | null;
  video_source?: "Upload Video" | "Video Source URL" | string | null;
  video_source_url?: string | null;
  tags?: any[] | null;
  display_start_date?: string | null;
  display_end_date?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  state: string;
  category: HomepageMediaCategory | null;
  menu?: any;
  upload_image?: HomepageMediaFile[] | null;
  upload_video?: HomepageMediaFile[] | null;
  thumbnail?: HomepageMediaFile[] | HomepageMediaFile | null;
}

export interface HomepageMediaResponseMeta {
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

export interface HomepageMediaResponse {
  success: boolean;
  data: HomepageMediaItem[] | { data: HomepageMediaItem[] };
  meta: HomepageMediaResponseMeta;
}

export type LaunchMedia =
  | {
      kind: "video";
      source: "upload" | "url";
      url: string;
      title: string;
      mime?: string | null;
    }
  | {
      kind: "image";
      url: string;
      title: string;
    };

const isPublished = (state?: string) =>
  (state || "").toLowerCase() === "published";

const isLaunchCategory = (cat?: HomepageMediaCategory | null) =>
  (cat?.slug || "").toLowerCase() === "launch-video";

const normalizeUrl = (url?: string | null): string => {
  if (!url) return "";
  return url;
};

export const mediaApi = {
  getHomepageMedia: async (): Promise<ApiResponse<HomepageMediaItem[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(`${base}/mw-cms/api/v1/homepage/media`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageMediaResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        return {
          success: true,
          data: items as HomepageMediaItem[],
          status: response.status,
        };
      }
      return {
        success: false,
        error: "Invalid media API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch media",
        status: 0,
      };
    }
  },

  // Extract only the Launch Video/Image entry
  getLaunchMedia: async (): Promise<ApiResponse<LaunchMedia | null>> => {
    const res = await mediaApi.getHomepageMedia();
    if (!res.success || !Array.isArray(res.data)) {
      return {
        success: false,
        error: res.error || "Failed",
        status: res.status,
      };
    }
    const list = (res.data as HomepageMediaItem[])
      .filter((m) => isPublished(m.state))
      .filter((m) => isLaunchCategory(m.category));

    // Prefer video entries first
    const video = list.find(
      (m) => (m.media_type || "").toLowerCase() === "video"
    );
    if (video) {
      const source = (video.video_source || "Upload Video").toLowerCase();
      if (source.includes("url") && video.video_source_url) {
        return {
          success: true,
          data: {
            kind: "video",
            source: "url",
            url: normalizeUrl(video.video_source_url),
            title: video.title,
          },
          status: res.status,
        };
      }
      const upload = (video.upload_video || [])[0];
      if (upload?.url) {
        return {
          success: true,
          data: {
            kind: "video",
            source: "upload",
            url: normalizeUrl(upload.url),
            title: video.title,
            mime: upload.mime,
          },
          status: res.status,
        };
      }
    }

    // Fallback to image if a video is not available
    const image = list.find(
      (m) => (m.media_type || "").toLowerCase() === "image"
    );
    const imgFile = (image?.upload_image || [])[0];
    if (image && imgFile?.url) {
      return {
        success: true,
        data: {
          kind: "image",
          url: normalizeUrl(imgFile.url),
          title: image.title,
        },
        status: res.status,
      };
    }

    return { success: true, data: null, status: res.status };
  },
};
