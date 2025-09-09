import React, { useState, useEffect } from "react";
// @ts-ignore
import { SVGMap } from "react-svg-map";
// @ts-ignore
import India from "@svg-maps/india";
import "react-svg-map/lib/index.css";
import styles from "./IndiaMapSection.module.css";

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

const CMS_MEDIA_URL =
  "https://devnulp.niua.org/mw-cms/api/v1/homepage/media?state=Published";

const IndiaMapSection: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null
  );
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch media from CMS and normalize into gallery items
  useEffect(() => {
    let isMounted = true;
    async function fetchMedia() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(CMS_MEDIA_URL);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        const normalized: GalleryImage[] = [];

        items.forEach((entry: any) => {
          const stateInfo = getStateFromCategory(entry?.category);
          const title: string = entry?.title || "Untitled";
          const images: any[] = Array.isArray(entry?.upload_image)
            ? entry.upload_image
            : [];
          images.forEach((img: any) => {
            const url = pickBestImageUrl(img);
            if (!url) return;
            normalized.push({
              src: url,
              caption: title,
              stateId: stateInfo.id || null,
              stateName: stateInfo.name || null,
            });
          });
        });

        if (isMounted) setAllImages(normalized);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load images");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMedia();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLocationClick = (event: any) => {
    const stateId = event?.target?.id as string | undefined;
    const stateName =
      event?.target?.getAttribute("name") ||
      event?.target?.getAttribute("aria-label") ||
      null;

    // Toggle select/deselect when clicking same state
    if (stateId && selectedState === stateId) {
      setSelectedState(null);
      setSelectedStateName(null);
      return;
    }

    setSelectedState(stateId || null);
    setSelectedStateName(stateName);
  };

  // Filter images by selection
  const currentImages: GalleryImage[] = selectedState
    ? allImages.filter((img) => img.stateId === selectedState)
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
  }, [selectedState, allImages.length]);

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

  // Visual highlight for selected state
  useEffect(() => {
    const allPaths = document.querySelectorAll(".mapSection__svgMap path");
    allPaths.forEach((path) => path.classList.remove("selected"));
    if (selectedState) {
      const selectedPath = document.querySelector(
        `.mapSection__svgMap path[id="${selectedState}"]`
      );
      if (selectedPath) selectedPath.classList.add("selected");
    }
  }, [selectedState]);

  // Optional: verify some states are present (dev aid)
  useEffect(() => {
    const timer = setTimeout(() => {
      const checkStates = ["mh", "ka", "up", "wb", "hp"];
      checkStates.forEach((stateId) => {
        const element = document.querySelector(
          `.mapSection__svgMap path[id="${stateId}"]`
        );
        if (element) {
          console.log(`✅ State ${stateId} is clickable`);
        } else {
          console.log(`❌ State ${stateId} not found`);
        }
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
              <p className={styles.mapSection__instructionText}>
                {selectedState
                  ? `Showing images for ${selectedStateName || selectedState}`
                  : "Select a State to filter images, or view all by default"}
              </p>
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
                          <div
                            style={{
                              fontSize: "0.9em",
                              opacity: 0.8,
                              marginTop: 4,
                            }}
                          >
                            {selectedState
                              ? `Selected state: ${
                                  selectedStateName ||
                                  imageData.stateName ||
                                  selectedState
                                }`
                              : imageData.stateName
                              ? `State: ${imageData.stateName}`
                              : "State: Multiple"}
                          </div>
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
