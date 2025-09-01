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
}

interface StateData {
  id: string;
  name: string;
  images: GalleryImage[];
}

const IndiaMapSection: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null
  );
  const [stateImages, setStateImages] = useState<StateData[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  useEffect(() => {
    const stateData: StateData[] = [
      {
        id: "mh", // Maharashtra
        name: "Maharashtra",
        images: [
          {
            src: "/images/gallery/maharashtra/maharashtra1.png",
            caption: "Maharashtra event kickoff at Mumbai municipal office",
          },
          {
            src: "/images/gallery/maharashtra/maharashtra2.png",
            caption: "Urban planning workshop with city officials",
          },
          {
            src: "/images/gallery/maharashtra/maharashtra3.png",
            caption: "Community engagement session on waste management",
          },
          {
            src: "/images/gallery/maharashtra/maharashtra4.png",
            caption: "Digital governance showcase and demos",
          },
          {
            src: "/images/gallery/maharashtra/maharashtra5.png",
            caption: "Capacity building program for ULB teams",
          },
          {
            src: "/images/gallery/maharashtra/maharashtra6.png",
            caption: "Closing ceremony and certificates distribution",
          },
        ],
      },
      {
        id: "ka", // Karnataka
        name: "Karnataka",
        images: [
          {
            src: "/images/gallery/karnataka/karnataka1.png",
            caption: "Karnataka orientation on e-learning initiatives",
          },
          {
            src: "/images/gallery/karnataka/karnataka2.png",
            caption: "Hands-on session: data-driven governance",
          },
          {
            src: "/images/gallery/karnataka/karnataka3.png",
            caption: "Peer learning circle with domain experts",
          },
          {
            src: "/images/gallery/karnataka/karnataka4.png",
            caption: "Showcase of local innovations and tools",
          },
          {
            src: "/images/gallery/karnataka/karnataka5.png",
            caption: "City leaders roundtable and feedback",
          },
        ],
      },
      {
        id: "up", // Uttar Pradesh
        name: "Uttar Pradesh",
        images: [
          {
            src: "/images/gallery/uttarpradesh/up1.png",
            caption: "UP training cohort inaugural session",
          },
          {
            src: "/images/gallery/uttarpradesh/up2.png",
            caption: "Interactive module on sanitation best practices",
          },
          {
            src: "/images/gallery/uttarpradesh/up3.png",
            caption: "Experience sharing by participating cities",
          },
          {
            src: "/images/gallery/uttarpradesh/up4.png",
            caption: "Facilitated discussion and Q&A with mentors",
          },
        ],
      },
      {
        id: "wb", // West Bengal
        name: "West Bengal",
        images: [
          {
            src: "/images/gallery/west_bengal/wb1.png",
            caption: "West Bengal urban forum: opening remarks",
          },
          {
            src: "/images/gallery/west_bengal/wb2.png",
            caption: "Demonstration of GIS-based planning tools",
          },
          {
            src: "/images/gallery/west_bengal/wb3.png",
            caption: "Group photo with participants and trainers",
          },
        ],
      },
      {
        id: "hp", // Himachal Pradesh
        name: "Himachal Pradesh",
        images: [
          {
            src: "/images/gallery/himachalpradesh/hp1.png",
            caption: "Himachal onboarding session with ULB teams",
          },
          {
            src: "/images/gallery/himachalpradesh/hp2.png",
            caption: "Capacity enhancement track: service delivery",
          },
          {
            src: "/images/gallery/himachalpradesh/hp3.png",
            caption: "Participants discuss field implementation",
          },
        ],
      },
    ];

    setStateImages(stateData);
    // Set default selected state after data is loaded
    setSelectedState("mh");
    setSelectedStateName("Maharashtra");
  }, []);

  const handleLocationClick = (event: any) => {
    const stateId = event.target.id;
    const stateName =
      event.target.getAttribute("name") ||
      event.target.getAttribute("aria-label") ||
      "Unknown State";

    console.log("🖱️ Map clicked - State ID:", stateId, "Name:", stateName);

    // Always set the selected state and name
    setSelectedState(stateId);
    setSelectedStateName(stateName);

    // Check if we have image data for this state
    const hasStateData = stateImages.some((state) => state.id === stateId);

    if (hasStateData) {
      console.log("✅ Switching to state with images:", stateId);
    } else {
      console.log("ℹ️ State selected but no images available:", stateId);
    }
  };

  const selected = stateImages.find((s) => s.id === selectedState);
  const pics = selected ? selected.images : [];

  // Auto-scroll gallery when images are available
  useEffect(() => {
    if (pics.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % pics.length);
      }, 3500); // Change image every 3.5 seconds (good timing for vertical scrolling)

      return () => clearInterval(interval);
    }
  }, [pics.length]);

  // Reset image index when state changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedState]);

  // Generate visible images for gallery (show 3 images with middle one centered)
  const getVisibleImages = () => {
    if (pics.length === 0)
      return [] as Array<
        GalleryImage & { index: number; position: "top" | "center" | "bottom" }
      >;
    if (pics.length === 1)
      return [{ ...pics[0], index: 0, position: "center" as const }];
    if (pics.length === 2)
      return [
        {
          ...pics[currentImageIndex % pics.length],
          index: currentImageIndex % pics.length,
          position: "center" as const,
        },
        {
          ...pics[(currentImageIndex + 1) % pics.length],
          index: (currentImageIndex + 1) % pics.length,
          position: "bottom" as const,
        },
      ];

    const visibleImages: Array<
      GalleryImage & {
        index: number;
        position: "top" | "center" | "bottom";
        displayIndex: number;
      }
    > = [];

    // Top image (previous)
    const topIndex = (currentImageIndex - 1 + pics.length) % pics.length;
    visibleImages.push({
      ...pics[topIndex],
      index: topIndex,
      position: "top",
      displayIndex: 0,
    });

    // Center image (current)
    visibleImages.push({
      ...pics[currentImageIndex],
      index: currentImageIndex,
      position: "center",
      displayIndex: 1,
    });

    // Bottom image (next)
    const bottomIndex = (currentImageIndex + 1) % pics.length;
    visibleImages.push({
      ...pics[bottomIndex],
      index: bottomIndex,
      position: "bottom",
      displayIndex: 2,
    });

    return visibleImages;
  };

  const visibleImages = getVisibleImages();

  // Handle visual highlighting of selected state
  useEffect(() => {
    // Remove selected class from all paths
    const allPaths = document.querySelectorAll(".mapSection__svgMap path");
    allPaths.forEach((path) => path.classList.remove("selected"));

    // Add selected class to current state
    if (selectedState) {
      const selectedPath = document.querySelector(
        `.mapSection__svgMap path[id="${selectedState}"]`
      );
      if (selectedPath) {
        selectedPath.classList.add("selected");
      }
    }
  }, [selectedState]);

  // Verify our states are available on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const availableStates = ["mh", "ka", "up", "wb", "hp"];
      availableStates.forEach((stateId) => {
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
                Select a State to view images of events!
              </p>
            </div>
          </div>

          {/* Right Sidebar: Image Gallery */}
          <div className={styles.mapSection__gallery}>
            <div className={styles.gallery}>
              {visibleImages.length > 0 ? (
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
                          alt={`${selected?.name} event ${imageData.index + 1}`}
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/400x${
                              imageData.position === "center" ? "280" : "200"
                            }/0097B2/FFFFFF?text=${selected?.name}+Event+${
                              imageData.index + 1
                            }`;
                          }}
                        />
                      </div>
                      {imageData.position === "center" && (
                        <div className={styles.gallery__caption}>
                          {imageData.caption}
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
