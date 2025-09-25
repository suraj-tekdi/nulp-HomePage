import React, { useState, useEffect } from "react";
// @ts-ignore
import { SVGMap } from "react-svg-map";
// @ts-ignore
import India from "@svg-maps/india";
import "react-svg-map/lib/index.css";
import styles from "./IndiaMapSection.module.css";
import { stateMediaApi, type StateMediaImage } from "../../services";
import { stacksApi } from "../../services";

interface GalleryImage {
  src: string;
  caption: string;
  stateId?: string | null;
  stateName?: string | null;
}

// Utility: map API category slug/name to map state id and display name
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

function getStateFromCategory(
  category: { slug?: string | null; name?: string | null } | null | undefined
) {
  const key = (category?.slug || category?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (CATEGORY_TO_STATE_ID[key]) return CATEGORY_TO_STATE_ID[key];
  // Try removing non-letters
  const simplified = key.replace(/[^a-z-]/g, "");
  if (CATEGORY_TO_STATE_ID[simplified]) return CATEGORY_TO_STATE_ID[simplified];
  return { id: "", name: category?.name || "" };
}

// Prefer larger images from CMS formats
function pickBestImageUrl(img: any): string | null {
  return (
    img?.formats?.large?.url ||
    img?.formats?.medium?.url ||
    img?.formats?.small?.url ||
    img?.url ||
    null
  );
}

function slugifyName(value: string | null | undefined): string {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "");
}

const IndiaMapSection: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null
  );
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStateIds, setAvailableStateIds] = useState<Set<string>>(
    new Set()
  );
  const [availableStateNames, setAvailableStateNames] = useState<Set<string>>(
    new Set()
  );

  // Highlighted states from JSON (public)
  const [highlightedStateIds, setHighlightedStateIds] = useState<Set<string>>(
    new Set()
  );

  // State metric map keyed by state id (e.g., mh, ka)
  const [stateMetricsMap, setStateMetricsMap] = useState<
    Map<string, Array<{ title: string; count: number; order: number | null }>>
  >(new Map());

  // Fetch media + stacks + highlighted states JSON
  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        // 1) Highlighted states JSON
        try {
          const resp = await fetch(`/data/highlighted-states.json`);
          if (resp.ok) {
            const json = await resp.json();
            const fromJson = new Set<string>();
            const arr: string[] = Array.isArray(json?.states)
              ? json.states
              : [];
            arr.forEach((name) => {
              const info = getStateFromCategory({ name });
              const id = (info.id || "").toLowerCase();
              if (id) fromJson.add(id);
            });
            if (isMounted) setHighlightedStateIds(fromJson);
          }
        } catch {}

        // 2) Images for state engagement
        const res = await stateMediaApi.fetchStateEngagement();
        if (!res.success || !res.data) {
          if (isMounted) {
            setAllImages([]);
            setAvailableStateIds(new Set());
            setAvailableStateNames(new Set());
            setError(res.error || "Failed to load images");
          }
        } else if (isMounted) {
          const { images, availability } = res.data;
          setAllImages(images as StateMediaImage[]);
          setAvailableStateIds(availability.stateIds);
          setAvailableStateNames(availability.stateNames);
        }

        // 3) Stacks for ULB count
        const stacksRes = await stacksApi.getHomepageStacks();
        if (isMounted && stacksRes.success && Array.isArray(stacksRes.data)) {
          const byState = new Map<
            string,
            Array<{ title: string; count: number; order: number | null }>
          >();
          (stacksRes.data as any[])
            // published only
            .filter((i) => (i.state || "").toLowerCase() === "published")
            // menu visibility: State Engagement
            .filter((i) => {
              const t = (i?.menu?.title || i?.menu?.slug || "").toLowerCase();
              return t === "state engagement" || t === "state-engagement";
            })
            // a valid category must resolve to a state id
            .map((i) => ({
              item: i,
              st: getStateFromCategory(i.category || null),
            }))
            .filter(({ st }) => !!st.id)
            .forEach(({ item, st }) => {
              const id = (st.id || "").toLowerCase();
              if (!id) return;
              const title: string = (item.title || "Metric").toString();
              const count = Number(item.enter_count || 0);
              const orderVal =
                typeof item.order === "number" ? item.order : null;
              const arr = byState.get(id) || [];
              arr.push({ title, count, order: orderVal });
              byState.set(id, arr);
            });
          setStateMetricsMap(byState);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load content");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply dynamic highlight classes to map based on available states and selection
  useEffect(() => {
    const paths = document.querySelectorAll(
      `.${styles.mapSection__svgMap} path`
    );
    paths.forEach((path) => path.classList.remove("hasData"));

    // Build robust lookup sets (availability + highlighted JSON)
    const idKeys = new Set<string>();
    availableStateIds.forEach((id) => {
      const lc = (id || "").toLowerCase();
      if (!lc) return;
      idKeys.add(lc);
      idKeys.add(`in-${lc}`);
      idKeys.add(`in_${lc}`);
    });
    highlightedStateIds.forEach((id) => {
      const lc = (id || "").toLowerCase();
      if (!lc) return;
      idKeys.add(lc);
      idKeys.add(`in-${lc}`);
      idKeys.add(`in_${lc}`);
    });

    const nameKeys = new Set<string>();
    availableStateNames.forEach((name) => {
      const key = slugifyName(name);
      if (key) nameKeys.add(key);
    });

    paths.forEach((pathEl) => {
      const pid = (pathEl.getAttribute("id") || "").trim().toLowerCase();
      const pname = (
        pathEl.getAttribute("name") ||
        pathEl.getAttribute("aria-label") ||
        ""
      )
        .toString()
        .trim();
      const pnameKey = slugifyName(pname);
      if (
        idKeys.has(pid) ||
        idKeys.has(pid.replace(/_/g, "-")) ||
        nameKeys.has(pnameKey)
      ) {
        pathEl.classList.add("hasData");
      }
    });
  }, [availableStateIds, availableStateNames, highlightedStateIds]);

  const handleLocationClick = (event: any) => {
    const stateId = (event?.target?.id as string | undefined) || null;
    const stateName =
      event?.target?.getAttribute("name") ||
      event?.target?.getAttribute("aria-label") ||
      null;

    // Toggle select/deselect when clicking same state
    if (stateId && selectedState === stateId.toLowerCase()) {
      // Clear selection styling
      const paths = document.querySelectorAll(
        `.${styles.mapSection__svgMap} path`
      );
      paths.forEach((path) => path.classList.remove("selected"));
      setSelectedState(null);
      setSelectedStateName(null);
      return;
    }

    setSelectedState((stateId || "").toLowerCase());
    setSelectedStateName(stateName);

    // Immediately apply selection highlight to clicked path for consistent color
    const paths = document.querySelectorAll(
      `.${styles.mapSection__svgMap} path`
    );
    paths.forEach((path) => path.classList.remove("selected"));
    if (event?.target && (event.target as Element).classList) {
      (event.target as Element).classList.add("selected");
    }
  };

  // Filter images by selection
  const currentImages: GalleryImage[] = selectedState
    ? allImages.filter(
        (img) =>
          img.stateId === selectedState ||
          slugifyName(img.stateName) === slugifyName(selectedStateName)
      )
    : allImages;

  // Auto-rotation
  useEffect(() => {
    if (currentImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [currentImages.length]);

  // Reset index when dataset changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedState, selectedStateName, allImages.length]);

  // Compute 3 visible cards (top/center/bottom)
  const getVisibleImages = () => {
    if (currentImages.length === 0)
      return [] as Array<
        GalleryImage & {
          index: number;
          position: "top" | "center" | "bottom";
          displayIndex?: number;
        }
      >;
    if (currentImages.length === 1)
      return [{ ...currentImages[0], index: 0, position: "center" as const }];
    if (currentImages.length === 2)
      return [
        {
          ...currentImages[currentImageIndex % currentImages.length],
          index: currentImageIndex % currentImages.length,
          position: "center" as const,
        },
        {
          ...currentImages[(currentImageIndex + 1) % currentImages.length],
          index: (currentImageIndex + 1) % currentImages.length,
          position: "bottom" as const,
        },
      ];

    const visible: Array<
      GalleryImage & {
        index: number;
        position: "top" | "center" | "bottom";
        displayIndex: number;
      }
    > = [];
    const topIndex =
      (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    visible.push({
      ...currentImages[topIndex],
      index: topIndex,
      position: "top",
      displayIndex: 0,
    });
    visible.push({
      ...currentImages[currentImageIndex],
      index: currentImageIndex,
      position: "center",
      displayIndex: 1,
    });
    const bottomIndex = (currentImageIndex + 1) % currentImages.length;
    visible.push({
      ...currentImages[bottomIndex],
      index: bottomIndex,
      position: "bottom",
      displayIndex: 2,
    });
    return visible;
  };

  const visibleImages = getVisibleImages();

  // Visual highlight for selected state (kept to sync with state changes)
  useEffect(() => {
    const paths = document.querySelectorAll(
      `.${styles.mapSection__svgMap} path`
    );
    paths.forEach((path) => path.classList.remove("selected"));

    const targetNameKey = slugifyName(selectedStateName || "");
    paths.forEach((el) => {
      const pid = (el.getAttribute("id") || "").trim().toLowerCase();
      const pnameKey = slugifyName(
        (
          el.getAttribute("name") ||
          el.getAttribute("aria-label") ||
          ""
        ).toString()
      );
      if (!selectedState && !targetNameKey) return;
      if (
        (selectedState &&
          (pid === selectedState ||
            pid === `in-${selectedState}` ||
            pid === `in_${selectedState}`)) ||
        (targetNameKey && pnameKey === targetNameKey)
      ) {
        el.classList.add("selected");
      }
    });
  }, [selectedState, selectedStateName]);

  // Resolve metrics for currently selected state
  const stateMetrics = selectedState
    ? stateMetricsMap.get(selectedState)
    : undefined;

  return (
    <section id="state-engagement" className={styles.mapSection}>
      <div className={styles.mapSection__container}>
        <header className={styles.mapSection__header}>
          <h2 className={styles.mapSection__title}>
            Highlight what's great in pictures
          </h2>
          <p className={styles.mapSection__subtitle}>
            On‑boarded States and Union Territories
          </p>
          <p className={styles.mapSection__selectedState}>
            {selectedStateName ? `${selectedStateName}` : ""}
          </p>
          {stateMetrics && stateMetrics.length > 0 && (
            <div className={styles.mapSection__instructionText}>
              {[...stateMetrics]
                .sort((a, b) => {
                  const ao = a.order ?? Number.POSITIVE_INFINITY;
                  const bo = b.order ?? Number.POSITIVE_INFINITY;
                  if (ao !== bo) return ao - bo;
                  return (a.title || "").localeCompare(b.title || "");
                })
                .map((m, idx) => (
                  <div key={`${m.title}-${idx}`}>
                    {m.title}: {m.count}
                  </div>
                ))}
            </div>
          )}
        </header>

        <div className={styles.mapSection__content}>
          {/* Left Sidebar: Map */}
          <div className={styles.mapSection__map}>
            <div className={styles.mapSection__mapContainer}>
              {/* Interactive Map */}
              <div className={styles.mapSection__mapWrapper}>
                <div className={styles.mapSection__svgMapContainer}>
                  <SVGMap
                    map={India}
                    onLocationClick={handleLocationClick}
                    className={styles.mapSection__svgMap}
                  />
                </div>
              </div>
            </div>

            {/* Instruction Text - Below Map */}
            <div className={styles.mapSection__stateInfo}>
              <p>Select a State to filter images, or view all by default.</p>
            </div>
          </div>

          {/* Right Sidebar: Image Gallery */}
          <div className={styles.mapSection__gallery}>
            <div className={styles.gallery}>
              {isLoading ? (
                <div className={styles.mapSection__noImages}>
                  <p>Loading images…</p>
                </div>
              ) : error ? (
                <div className={styles.mapSection__noImages}>
                  <p>{error}</p>
                </div>
              ) : visibleImages.length > 0 ? (
                <div className={styles.gallery__autoScroll}>
                  {visibleImages.map((imageData, i) => (
                    <div
                      key={`${imageData.index}-${i}`}
                      className={`${styles.gallery__scrollItem} ${
                        styles[`gallery__scrollItem--${imageData.position}`]
                      }`}
                    >
                      <div className={styles.gallery__scrollImage}>
                        <img
                          src={imageData.src}
                          alt={`${imageData.stateName || "All States"} event ${
                            imageData.index + 1
                          }`}
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/400x${
                              imageData.position === "center" ? "280" : "200"
                            }/0097B2/FFFFFF?text=${encodeURIComponent(
                              imageData.stateName || "Event"
                            )}`;
                          }}
                        />
                      </div>
                      {imageData.position === "center" && (
                        <div className={styles.gallery__caption}>
                          <div>{imageData.caption}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.mapSection__noImages}>
                  {selectedStateName ? (
                    <div className={styles.mapSection__noGallery}>
                      <h4>No Gallery Available</h4>
                      <p>
                        We don't have event images for {""}
                        <strong>{selectedStateName}</strong> at the moment.
                      </p>
                      <p>
                        Please check back later or explore other states with
                        available galleries.
                      </p>
                    </div>
                  ) : (
                    <p>Select a state to view event images</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndiaMapSection;
