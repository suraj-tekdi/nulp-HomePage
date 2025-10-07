import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./TrendingGoodPracticesSection.module.css";
import {
  slidersApi,
  type NulpGoodPractice,
  type TrendingGoodPracticeItem,
  getDynamicNulpUrls,
} from "../../services";
import domainImages from "../../services/domain-images.json";

interface GoodPractice {
  id: string;
  title: string;
  description?: string;
  image?: string;
  category?: string;
  organization?: string;
  primaryCategory?: string;
  mimeType?: string;
}

interface TrendingGoodPracticesSectionProps {
  className?: string;
  selectedDomain?: string | null;
}

const CARDS_PER_PAGE = 5;
const SCROLL_SETTLE_MS = 140;

const TrendingGoodPracticesSection: React.FC<
  TrendingGoodPracticesSectionProps
> = ({ className = "", selectedDomain = null }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollSettleTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // API-related state
  const [goodPractices, setGoodPractices] = useState<GoodPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [sliderDescription, setSliderDescription] = useState<string>("");

  // Pagination state derived from items count
  const [totalSlides, setTotalSlides] = useState<number>(1);
  const [shouldShowControls, setShouldShowControls] = useState<boolean>(false);

  // Measure card width + gap
  const getCardWidthWithGap = useCallback((): number => {
    const container = scrollContainerRef.current;
    if (!container) return 340 + 24; // fallback width + gap
    const firstCard = container.querySelector(
      `.${styles.practices__card}`
    ) as HTMLElement | null;
    const style = getComputedStyle(container);
    const gapPx = parseFloat((style.columnGap || style.gap || "0").toString());
    const cardWidth = firstCard?.offsetWidth || 340;
    return cardWidth + (isNaN(gapPx) ? 0 : gapPx);
  }, []);

  // Transform NULP API response to our GoodPractice interface
  const transformNulpGoodPractice = useCallback(
    (nulpPractice: NulpGoodPractice): GoodPractice => {
      // Create a description from available data
      const categoryInfo = nulpPractice.se_boards?.length
        ? nulpPractice.se_boards[0]
        : "";
      const levelInfo =
        nulpPractice.se_gradeLevels && nulpPractice.se_gradeLevels.length > 0
          ? nulpPractice.se_gradeLevels.join(", ")
          : "";
      const description = `${categoryInfo}${
        levelInfo ? ` - ${levelInfo}` : ""
      } practice shared by ${nulpPractice.orgDetails.orgName}.`;

      return {
        id: nulpPractice.identifier,
        title: nulpPractice.name.trim(), // Remove any extra whitespace/tabs
        description: description,
        image: nulpPractice.appIcon || undefined,
        category: nulpPractice.se_boards?.length
          ? nulpPractice.se_boards[0]
          : "General",
        organization: nulpPractice.orgDetails.orgName,
        primaryCategory: nulpPractice.primaryCategory,
        mimeType: nulpPractice.mimeType,
      };
    },
    []
  );

  // Transform TrendingGoodPracticeItem from sliders API to our GoodPractice interface
  const transformTrendingGoodPractice = useCallback(
    (trendingPractice: TrendingGoodPracticeItem): GoodPractice => {
      return {
        id: trendingPractice.identifier,
        title: trendingPractice.name.trim(),
        description: trendingPractice.description || "Good practice available on NULP platform",
      };
    },
    []
  );

  // Helper: recalculate pagination based on item count
  const recalculatePagination = useCallback(() => {
    const total = Array.isArray(goodPractices) ? goodPractices.length : 0;
    const slides = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));
    setTotalSlides(slides);
    setShouldShowControls(total > CARDS_PER_PAGE);
    setCurrentSlide((prev) => Math.min(prev, slides - 1));
  }, [goodPractices]);

  // Fetch good practices from sliders API
  useEffect(() => {
    const fetchGoodPractices = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Read good-practice configuration from sliders
        const allRes = await slidersApi.getHomepageSliders();
        if (!allRes.success || !Array.isArray(allRes.data)) {
          setIsVisible(false);
          setGoodPractices([]);
          setError(allRes.error || "No trending good practices configured");
          return;
        }
        const all = allRes.data || [];

        // Find the trending good practices slider
        const gpSlider = all.find(
          (i) => (i.mode || "").toLowerCase() === "select_good_practices"
        );

        if (!gpSlider) {
          setIsVisible(false);
          setGoodPractices([]);
          setError("No trending good practices slider found");
          return;
        }

        setSliderDescription(gpSlider.description || "");

        // 2) Check if good practices are directly provided in the slider response
        if (gpSlider.trending_good_practices && Array.isArray(gpSlider.trending_good_practices) && gpSlider.trending_good_practices.length > 0) {
          // New API structure: good practices are directly provided
          const transformedPractices = gpSlider.trending_good_practices.map(transformTrendingGoodPractice);
          setGoodPractices(transformedPractices);
          setIsVisible(transformedPractices.length > 0);
          return;
        }

        // 3) Fallback: try dynamic mode if no direct practices provided
        const gpDynamic = all.find(
          (i) =>
            (i.name || "").toLowerCase() === "trending good practices" &&
            (i.mode || "").toLowerCase() === "dynamic"
        );

        if (gpDynamic) {
          const response = await slidersApi.getGoodPracticesDynamic(
            gpDynamic.sort_field,
            gpDynamic.sort_order,
            selectedDomain || null,
            5
          );
          if (response.success && response.data) {
            const transformed = response.data.map(transformNulpGoodPractice);
            setGoodPractices(transformed);
            setIsVisible((response.data || []).length > 0);
          } else {
            setError(response.error || "Failed to fetch good practices");
            setGoodPractices([]);
            setIsVisible(false);
          }
          return;
        }

        // 4) Final fallback: no good practices available
        setIsVisible(false);
        setGoodPractices([]);
        setError("No good practices available in trending good practices slider");
      } catch (err) {
        setError("Network error occurred while fetching good practices");
        setGoodPractices([]);
        setIsVisible(false);
      } finally {
        setLoading(false);
      }
    };

    fetchGoodPractices();
  }, [transformNulpGoodPractice, transformTrendingGoodPractice, selectedDomain]);

  // After practices change, reset and recalc pagination
  useEffect(() => {
    setCurrentSlide(0);
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        recalculatePagination();
      }
    }, 100);
  }, [goodPractices, recalculatePagination]);

  // Observe container resize to keep pagination accurate
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateIsMobile = () => setIsMobile(window.innerWidth <= 640);
    updateIsMobile();

    const observer = new ResizeObserver(() => {
      recalculatePagination();
    });

    observer.observe(container);
    window.addEventListener("resize", recalculatePagination);
    window.addEventListener("resize", updateIsMobile);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculatePagination);
      window.removeEventListener("resize", updateIsMobile);
      if (scrollSettleTimerRef.current) {
        window.clearTimeout(scrollSettleTimerRef.current);
        scrollSettleTimerRef.current = null;
      }
    };
  }, [recalculatePagination]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Update current slide based on scroll position (cards-per-page pages)
  const updateCurrentSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const pageWidth = getCardWidthWithGap() * CARDS_PER_PAGE;
    // Use half-page offset for stable index
    const newSlideIndex = Math.floor(
      (container.scrollLeft + pageWidth / 2) / pageWidth
    );

    const clampedSlideIndex = Math.min(
      Math.max(0, newSlideIndex),
      totalSlides - 1
    );

    if (clampedSlideIndex !== currentSlide) {
      setCurrentSlide(clampedSlideIndex);
    }
  }, [currentSlide, totalSlides, getCardWidthWithGap]);

  // Handle scroll events to update pagination with debouncing
  const handleScrollUpdate = useCallback(() => {
    if (scrollSettleTimerRef.current) {
      window.clearTimeout(scrollSettleTimerRef.current);
    }
    scrollSettleTimerRef.current = window.setTimeout(() => {
      updateCurrentSlide();
    }, SCROLL_SETTLE_MS);
  }, [updateCurrentSlide]);

  const nextSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const step = isMobile
      ? getCardWidthWithGap()
      : getCardWidthWithGap() * CARDS_PER_PAGE;
    if (!isMobile && currentSlide >= totalSlides - 1) return;
    if (!isMobile) setCurrentSlide(Math.min(currentSlide + 1, totalSlides - 1));
    container.scrollBy({ left: step, behavior: "smooth" });
  }, [currentSlide, totalSlides, getCardWidthWithGap, isMobile]);

  const prevSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const step = isMobile
      ? getCardWidthWithGap()
      : getCardWidthWithGap() * CARDS_PER_PAGE;
    if (!isMobile && currentSlide <= 0) return;
    if (!isMobile) setCurrentSlide(Math.max(currentSlide - 1, 0));
    container.scrollBy({ left: -step, behavior: "smooth" });
  }, [currentSlide, getCardWidthWithGap, isMobile]);

  const goToSlide = useCallback(
    (slideIndex: number) => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const pageWidth = getCardWidthWithGap() * CARDS_PER_PAGE;
      const scrollPosition = slideIndex * pageWidth;

      setCurrentSlide(slideIndex);
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    },
    [getCardWidthWithGap]
  );

  // Handle practice navigation
  const handlePracticeClick = useCallback((practiceId: string) => {
    const { base } = getDynamicNulpUrls();
    const practiceUrl = `${base}/webapp/player?id=${practiceId}`;
    window.location.href = practiceUrl;
  }, []);

  // Handle explore button click
  const handleExplorePractice = useCallback(
    (e: React.MouseEvent, practiceId: string) => {
      e.stopPropagation(); // Prevent card click if we want different behaviors
      handlePracticeClick(practiceId);
    },
    [handlePracticeClick]
  );

  return isVisible ? (
    <section className={`${styles.practices} ${className}`}>
      <div className={styles.practices__container}>
        <div className={styles.practices__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={280}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.practices__title}>
              Trending{" "}
              <span className={styles.practices__title__highlight}>
                Good Practices
              </span>
            </h2>
          </div>
          {selectedDomain && (
            <h3 className={styles.practices__subtitle}>{selectedDomain}</h3>
          )}
        </div>
        <div className={styles.practices__content}>
          <div
            ref={scrollContainerRef}
            className={styles.practices__items}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onScroll={handleScrollUpdate}
          >
            {loading ? (
              <div className={styles.practices__loading}>
                <div className={styles.practices__loading__spinner}></div>
                <p>Loading good practices...</p>
              </div>
            ) : error ? (
              <div className={styles.practices__error}>
                <div className={styles.practices__error__message}>
                  {selectedDomain
                    ? `Unable to load good practices for "${selectedDomain}" domain.`
                    : "Unable to load good practices at the moment."}
                </div>
                <div className={styles.practices__error__suggestion}>
                  Please check your internet connection and try again.
                </div>
              </div>
            ) : goodPractices.length === 0 ? (
              <div className={styles.practices__empty}>
                <div className={styles.practices__empty__message}>
                  {selectedDomain
                    ? `No good practices available for "${selectedDomain}" domain.`
                    : "No good practices available at the moment."}
                </div>
                <div className={styles.practices__empty__suggestion}>
                  Try selecting a different domain or check back later.
                </div>
              </div>
            ) : (
              goodPractices.map((practice) => (
                <div
                  key={practice.id}
                  className={styles.practices__card}
                  onClick={() => handlePracticeClick(practice.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.practices__card__image}>
                    <img
                      src={
                        (domainImages as Record<string, string>)[
                          practice.category || "General"
                        ] || "/images/placeholder-img.png"
                      }
                      alt={practice.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/icons/default-placeholder.png";
                      }}
                    />
                  </div>
                  <div className={styles.practices__card__content}>
                    {/* Normal State Content */}
                    <div className={styles.practices__card__normal}>
                      <h4 className={styles.practices__card__title}>
                        {practice.title}
                      </h4>
                      <p className={styles.practices__card__description}>
                        {practice.description && practice.description.length > 120
                          ? `${practice.description.substring(0, 120)}...`
                          : practice.description || "Good practice available on NULP platform"}
                      </p>
                    </div>

                    {/* Hover State Content */}
                    <div className={styles.practices__card__hover}>
                      <h4 className={styles.practices__card__title}>
                        {practice.title}
                      </h4>
                      <p className={styles.practices__card__description__full}>
                        {practice.description || "Good practice available on NULP platform"}
                      </p>
                      <button
                        className={styles.practices__card__button}
                        onClick={(e) => handleExplorePractice(e, practice.id)}
                      >
                        View Practice
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conditionally render controls only when needed */}
          {shouldShowControls && !isMobile && (
            <div className={styles.practices__controls}>
              <div className={styles.practices__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.practices__dot} ${
                      index === currentSlide
                        ? styles["practices__dot--active"]
                        : ""
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className={styles.practices__navigation}>
                <button
                  className={styles.practices__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous practices"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.practices__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next practices"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}
          {isMobile && (
            <div className={styles.practices__controls}>
              <div className={styles.practices__navigation}>
                <button
                  className={styles.practices__arrow}
                  onClick={prevSlide}
                  aria-label="Previous"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.practices__arrow}
                  onClick={nextSlide}
                  aria-label="Next"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}

          {/* Slider description */}
          {sliderDescription && (
            <p
              className={styles.practices__subtitle}
              style={{ textAlign: "center", marginTop: "12px" }}
            >
              {sliderDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  ) : null;
};

export default TrendingGoodPracticesSection;
