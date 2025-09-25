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
  // States
  "andhra-pradesh": { id: "ap", name: "Andhra Pradesh" },
  andhrapradesh: { id: "ap", name: "Andhra Pradesh" },
  "arunachal-pradesh": { id: "ar", name: "Arunachal Pradesh" },
  arunachalpradesh: { id: "ar", name: "Arunachal Pradesh" },
  assam: { id: "as", name: "Assam" },
  bihar: { id: "br", name: "Bihar" },
  chhattisgarh: { id: "cg", name: "Chhattisgarh" },
  goa: { id: "ga", name: "Goa" },
  gujarat: { id: "gj", name: "Gujarat" },
  haryana: { id: "hr", name: "Haryana" },
  "himachal-pradesh": { id: "hp", name: "Himachal Pradesh" },
  himachalpradesh: { id: "hp", name: "Himachal Pradesh" },
  "jammu-and-kashmir": { id: "jk", name: "Jammu and Kashmir" },
  jammu: { id: "jk", name: "Jammu and Kashmir" },
  kashmir: { id: "jk", name: "Jammu and Kashmir" },
  jharkhand: { id: "jh", name: "Jharkhand" },
  karnataka: { id: "ka", name: "Karnataka" },
  kerala: { id: "kl", name: "Kerala" },
  "madhya-pradesh": { id: "mp", name: "Madhya Pradesh" },
  madhyapradesh: { id: "mp", name: "Madhya Pradesh" },
  maharashtra: { id: "mh", name: "Maharashtra" },
  maharashra: { id: "mh", name: "Maharashtra" },
  manipur: { id: "mn", name: "Manipur" },
  meghalaya: { id: "ml", name: "Meghalaya" },
  mizoram: { id: "mz", name: "Mizoram" },
  nagaland: { id: "nl", name: "Nagaland" },
  odisha: { id: "od", name: "Odisha" },
  punjab: { id: "pb", name: "Punjab" },
  rajasthan: { id: "rj", name: "Rajasthan" },
  sikkim: { id: "sk", name: "Sikkim" },
  "tamil-nadu": { id: "tn", name: "Tamil Nadu" },
  tamilnadu: { id: "tn", name: "Tamil Nadu" },
  telangana: { id: "tg", name: "Telangana" },
  tripura: { id: "tr", name: "Tripura" },
  "uttar-pradesh": { id: "up", name: "Uttar Pradesh" },
  uttarpradesh: { id: "up", name: "Uttar Pradesh" },
  uttarakhand: { id: "uk", name: "Uttarakhand" },
  "west-bengal": { id: "wb", name: "West Bengal" },
  west_bengal: { id: "wb", name: "West Bengal" },
  // Union Territories
  "andaman-and-nicobar-islands": { id: "an", name: "Andaman & Nicobar" },
  chandigarh: { id: "ch", name: "Chandigarh" },
  "dadra-and-nagar-haveli-and-daman-and-diu": { id: "dn", name: "DNH & DD" },
  daman: { id: "dn", name: "DNH & DD" },
  diu: { id: "dn", name: "DNH & DD" },
  delhi: { id: "dl", name: "Delhi" },
  ladakh: { id: "la", name: "Ladakh" },
  lakshadweep: { id: "ld", name: "Lakshadweep" },
  puducherry: { id: "py", name: "Puducherry" },
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

function hasStarted(start?: any, nowMs: number = Date.now()): boolean {
  const s = parseDateMs(start);
  if (s !== null && nowMs < s) return false;
  return true;
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
        const isStateEngagement =
          !entry?.menu ||
          menuTitle === "state engagement" ||
          menuTitle === "state-engagement";
        const hasImages =
          Array.isArray(entry?.upload_image) && entry.upload_image.length > 0;

        // Relaxed visibility: only require that it has started (ignore end dates)
        const entryVisible = hasStarted(entry?.display_start_date, nowMs);
        const menuVisible = hasStarted(entry?.menu?.start_publish_date, nowMs);

        if (
          !isPublished ||
          !isStateEngagement ||
          !hasImages ||
          !entryVisible ||
          (entry?.menu ? !menuVisible : false)
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
