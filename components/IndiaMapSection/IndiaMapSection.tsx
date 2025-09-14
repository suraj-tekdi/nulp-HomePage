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
  maharashtra: { id: "mh", name: "Maharashtra" },
  maharashra: { id: "mh", name: "Maharashtra" }, // API typo support
  karnataka: { id: "ka", name: "Karnataka" },
  "uttar-pradesh": { id: "up", name: "Uttar Pradesh" },
  uttarpradesh: { id: "up", name: "Uttar Pradesh" },
  "west-bengal": { id: "wb", name: "West Bengal" },
  west_bengal: { id: "wb", name: "West Bengal" },
  "himachal-pradesh": { id: "hp", name: "Himachal Pradesh" },
  himachalpradesh: { id: "hp", name: "Himachal Pradesh" },
  tamilnadu: { id: "tn", name: "Tamil Nadu" },
  "tamil-nadu": { id: "tn", name: "Tamil Nadu" },
  kerala: { id: "kl", name: "Kerala" },
  rajasthan: { id: "rj", name: "Rajasthan" },
  haryana: { id: "hr", name: "Haryana" },
  punjab: { id: "pb", name: "Punjab" },
  manipur: { id: "mn", name: "Manipur" },
  assam: { id: "as", name: "Assam" },
  chhattisgarh: { id: "cg", name: "Chhattisgarh" },
  odisha: { id: "od", name: "Odisha" },
  gujarat: { id: "gj", name: "Gujarat" },
  uttarakhand: { id: "uk", name: "Uttarakhand" },
  chandigarh: { id: "ch", name: "Chandigarh" },
  delhi: { id: "dl", name: "Delhi" },
  sikkim: { id: "sk", name: "Sikkim" },
  "madhya-pradesh": { id: "mp", name: "Madhya Pradesh" },
  madhyapradesh: { id: "mp", name: "Madhya Pradesh" },
  jharkhand: { id: "jh", name: "Jharkhand" },
  tripura: { id: "tr", name: "Tripura" },
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
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartYRef = useRef<number | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  // Highlighted states from JSON (public)
  const [highlightedStateIds, setHighlightedStateIds] = useState<Set<string>>(
    new Set()
  );

  // ULB Count map keyed by state id (e.g., mh, ka)
  const [ulbMap, setUlbMap] = useState<
    Map<string, { title: string; count: number }>
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
          const map = new Map<string, { title: string; count: number }>();
          (stacksRes.data as any[])
            .filter((i) => (i.state || "").toLowerCase() === "published")
            .filter(
              (i) =>
                (i?.menu?.title || i?.menu?.slug || "").toLowerCase() ===
                  "state engagement" ||
                (i?.menu?.slug || "").toLowerCase() === "state-engagement"
            )
            .filter((i) =>
              (i.title || "").trim().toLowerCase().startsWith("ulb count")
            )
            .forEach((i) => {
              const st = getStateFromCategory(i.category || null);
              const id = (st.id || "").toLowerCase();
              if (!id) return;
              const title = ((i.title || "ULB Count") as string).trim();
              const count = Number(i.enter_count || 0);
              map.set(id, { title, count });
            });
          setUlbMap(map);
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
    if (currentImages.length > 1 && !isInteracting) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [currentImages.length, isInteracting]);

  // Reset index when dataset changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedState, selectedStateName, allImages.length]);

  // Drag/swipe handlers for manual vertical navigation
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsInteracting(true);
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    const threshold = 40; // px to change slide
    if (Math.abs(deltaY) > threshold) {
      setCurrentImageIndex((prev) => {
        if (deltaY > 0) {
          // drag down -> previous
          return (prev - 1 + currentImages.length) % currentImages.length;
        }
        // drag up -> next
        return (prev + 1) % currentImages.length;
      });
      dragStartYRef.current = e.clientY; // allow continued scrolling by chunks
    }
  };

  const endInteraction = () => {
    setIsDragging(false);
    dragStartYRef.current = null;
    // brief delay to avoid instant resume while ending touch
    setTimeout(() => setIsInteracting(false), 200);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!currentImages.length) return;
    setIsInteracting(true);
    if (e.deltaY > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
    } else if (e.deltaY < 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + currentImages.length) % currentImages.length
      );
    }
    // allow auto-rotation to resume shortly
    clearTimeout((onWheel as any)._t);
    (onWheel as any)._t = setTimeout(() => setIsInteracting(false), 400);
  };

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

  // Resolve ULB info for currently selected state
  const ulbInfo = selectedState ? ulbMap.get(selectedState) : undefined;

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
          {ulbInfo && (
            <p className={styles.mapSection__instructionText}>
              {ulbInfo.title}: {ulbInfo.count}
            </p>
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
                <div
                  ref={galleryRef}
                  className={`${styles.gallery__autoScroll} ${
                    isDragging ? "isDragging" : ""
                  }`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endInteraction}
                  onPointerCancel={endInteraction}
                  onPointerLeave={endInteraction}
                  onWheel={onWheel}
                >
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
                        We don't have event images for{" "}
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
