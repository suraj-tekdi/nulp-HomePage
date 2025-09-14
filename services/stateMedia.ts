import { ApiResponse } from "./api";
import { getDynamicNulpUrls } from "./api";

export interface StateMediaImage {
  src: string;
  caption: string;
  stateId?: string | null;
  stateName?: string | null;
}

export interface StateAvailability {
  stateIds: Set<string>;
  stateNames: Set<string>;
}

// Map API category slug/name to state id and display name
const CATEGORY_TO_STATE_ID: Record<string, { id: string; name: string }> = {
  maharashtra: { id: "mh", name: "Maharashtra" },
  maharashra: { id: "mh", name: "Maharashtra" },
  karnataka: { id: "ka", name: "Karnataka" },
  "uttar-pradesh": { id: "up", name: "Uttar Pradesh" },
  uttarpradesh: { id: "up", name: "Uttar Pradesh" },
  "west-bengal": { id: "wb", name: "West Bengal" },
  west_bengal: { id: "wb", name: "West Bengal" },
  "himachal-pradesh": { id: "hp", name: "Himachal Pradesh" },
  himachalpradesh: { id: "hp", name: "Himachal Pradesh" },
};

function normalizeStateFromCategory(
  category?: { slug?: string | null; name?: string | null } | null
) {
  const key = (category?.slug || category?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (CATEGORY_TO_STATE_ID[key]) return CATEGORY_TO_STATE_ID[key];
  const simplified = key.replace(/[^a-z-]/g, "");
  if (CATEGORY_TO_STATE_ID[simplified]) return CATEGORY_TO_STATE_ID[simplified];
  return { id: "", name: category?.name || "" };
}

function pickBestImageUrl(img: any): string | null {
  return (
    img?.formats?.large?.url ||
    img?.formats?.medium?.url ||
    img?.formats?.small?.url ||
    img?.url ||
    null
  );
}

// Date helpers for visibility window
function parseDateMs(value?: any): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isWithinWindow(
  start?: any,
  end?: any,
  nowMs: number = Date.now()
): boolean {
  const s = parseDateMs(start);
  const e = parseDateMs(end);
  if (s !== null && nowMs < s) return false; // Not started yet
  if (e !== null && nowMs > e) return false; // Already ended
  return true;
}

const CMS_MEDIA_URL = `${
  getDynamicNulpUrls().base
}/mw-cms/api/v1/homepage/media?state=Published`;

export const stateMediaApi = {
  fetchStateEngagement: async (): Promise<
    ApiResponse<{ images: StateMediaImage[]; availability: StateAvailability }>
  > => {
    try {
      const res = await fetch(CMS_MEDIA_URL, { method: "GET" });
      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}`,
          status: res.status,
        } as ApiResponse<any>;
      }
      const json = await res.json();
      const items = Array.isArray(json?.data) ? json.data : [];

      const images: StateMediaImage[] = [];
      const stateIds: Set<string> = new Set();
      const stateNames: Set<string> = new Set();

      const nowMs = Date.now();

      items.forEach((entry: any) => {
        const isPublished = (entry?.state || "").toLowerCase() === "published";
        const menuTitle = (entry?.menu?.title || "").trim().toLowerCase();
        const isStateEngagement = menuTitle === "state engagement";
        const hasImages =
          Array.isArray(entry?.upload_image) && entry.upload_image.length > 0;

        // Visibility window checks
        const entryVisible = isWithinWindow(
          entry?.display_start_date,
          entry?.display_end_date,
          nowMs
        );
        const menuVisible = isWithinWindow(
          entry?.menu?.start_publish_date,
          entry?.menu?.end_publish_date,
          nowMs
        );

        if (
          !isPublished ||
          !isStateEngagement ||
          !hasImages ||
          !entryVisible ||
          !menuVisible
        )
          return;

        const stateInfo = normalizeStateFromCategory(entry?.category);
        const title: string = entry?.title || "Untitled";
        const uploadImages: any[] = entry.upload_image;

        let pushedForThisEntry = false;
        uploadImages.forEach((img: any) => {
          const url = pickBestImageUrl(img);
          if (!url) return;
          images.push({
            src: url,
            caption: title,
            stateId: (stateInfo.id || "").toLowerCase(),
            stateName: stateInfo.name || null,
          });
          pushedForThisEntry = true;
        });

        if (pushedForThisEntry) {
          if (stateInfo?.id) stateIds.add(stateInfo.id.toLowerCase());
          if (stateInfo?.name) stateNames.add(stateInfo.name);
        }
      });

      return {
        success: true,
        data: { images, availability: { stateIds, stateNames } },
        status: res.status,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || "Network error",
      } as ApiResponse<any>;
    }
  },
};
