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
import styles from "./TrendingCoursesSection.module.css";
import { slidersApi, type NulpCourse } from "../../services";
import domainImages from "../../services/domain-images.json";

interface Course {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  organization: string;
}

interface TrendingCoursesSectionProps {
  className?: string;
  selectedDomain?: string | null;
}

const CARDS_PER_PAGE = 5;
const SCROLL_SETTLE_MS = 140;

const TrendingCoursesSection: React.FC<TrendingCoursesSectionProps> = ({
  className = "",
  selectedDomain = null,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollSettleTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // API-related state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [sliderDescription, setSliderDescription] = useState<string>("");

  // Pagination state derived from cards-per-page
  const [totalSlides, setTotalSlides] = useState<number>(1);
  const [shouldShowControls, setShouldShowControls] = useState<boolean>(false);

  // Measure card width + gap
  const getCardWidthWithGap = useCallback((): number => {
    const container = scrollContainerRef.current;
    if (!container) return 340 + 24; // fallback (card width + gap)
    const firstCard = container.querySelector(
      `.${styles.trending__card}`
    ) as HTMLElement | null;
    const style = getComputedStyle(container);
    // Try columnGap/gap; fall back to 0
    const gapPx = parseFloat((style.columnGap || style.gap || "0").toString());
    const cardWidth = firstCard?.offsetWidth || 340;
    return cardWidth + (isNaN(gapPx) ? 0 : gapPx);
  }, []);

  // Transform NULP API response to our Course interface
  const transformNulpCourse = useCallback((nulpCourse: NulpCourse): Course => {
    // Create a description from available data
    const categoryInfo =
      nulpCourse.se_boards?.length > 0 ? nulpCourse.se_boards[0] : "";
    const levelInfo =
      nulpCourse.se_gradeLevels && nulpCourse.se_gradeLevels.length > 0
        ? nulpCourse.se_gradeLevels.join(", ")
        : "";
    const description = `${categoryInfo}${
      levelInfo ? ` - ${levelInfo}` : ""
    } course offered by ${nulpCourse.orgDetails.orgName}.`;

    return {
      id: nulpCourse.identifier,
      title: nulpCourse.name.trim(), // Remove any extra whitespace/tabs
      description: description,
      image: nulpCourse.appIcon || undefined,
      category:
        nulpCourse.se_boards?.length > 0 ? nulpCourse.se_boards[0] : "General",
      organization: nulpCourse.orgDetails.orgName,
    };
  }, []);

  // Helper: recalculate pagination based on number of cards
  const recalculatePagination = useCallback(() => {
    const total = Array.isArray(courses) ? courses.length : 0;
    const slides = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));
    setTotalSlides(slides);
    setShouldShowControls(total > CARDS_PER_PAGE);
    setCurrentSlide((prev) => Math.min(prev, slides - 1));
  }, [courses]);

  // Fetch course IDs from sliders, then fetch courses from NULP
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Read course IDs from sliders API and pick description
        const sliderRes = await slidersApi.getHomepageSliders();
        if (!sliderRes.success || !Array.isArray(sliderRes.data)) {
          setIsVisible(false);
          setCourses([]);
          setError(sliderRes.error || "No trending courses configured");
          return;
        }
        const all = sliderRes.data || [];
        const slider = (all as any[]).find(
          (i) => (i.mode || "").toLowerCase() === "select_course"
        );
        setSliderDescription((slider?.description as string) || "");

        const ids = ((slider?.trending_courses as string[]) || []).filter(
          Boolean
        );
        setIsVisible(ids.length > 0);

        // 2) Fetch courses using NULP search constrained to IDs via sliders API
        const response = await slidersApi.getCoursesByIds(
          ids,
          selectedDomain || null
        );

        if (response.success && response.data) {
          const transformedCourses = response.data.map(transformNulpCourse);
          setCourses(transformedCourses);
        } else {
          setError(response.error || "Failed to fetch courses");
          setCourses([]);
        }
      } catch (err) {
        setError("Network error occurred while fetching courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [transformNulpCourse, selectedDomain]);

  // After courses change, reset scroll and recalc pagination
  useEffect(() => {
    setCurrentSlide(0);
    // Small delay to ensure container is rendered and sized
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        recalculatePagination();
      }
    }, 100);
  }, [courses, recalculatePagination]);

  // Observe container resize to keep pagination accurate (based on card width)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      recalculatePagination();
    });

    observer.observe(container);
    window.addEventListener("resize", recalculatePagination);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalculatePagination);
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

  // Update current slide based on scroll position
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
    if (!scrollContainerRef.current || currentSlide >= totalSlides - 1) return;

    const container = scrollContainerRef.current;
    const pageWidth = getCardWidthWithGap() * CARDS_PER_PAGE;

    const newSlideIndex = Math.min(currentSlide + 1, totalSlides - 1);
    setCurrentSlide(newSlideIndex);
    container.scrollBy({ left: pageWidth, behavior: "smooth" });
  }, [currentSlide, totalSlides, getCardWidthWithGap]);

  const prevSlide = useCallback(() => {
    if (!scrollContainerRef.current || currentSlide <= 0) return;

    const container = scrollContainerRef.current;
    const pageWidth = getCardWidthWithGap() * CARDS_PER_PAGE;

    const newSlideIndex = Math.max(currentSlide - 1, 0);
    setCurrentSlide(newSlideIndex);
    container.scrollBy({ left: -pageWidth, behavior: "smooth" });
  }, [currentSlide, getCardWidthWithGap]);

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

  // Handle course navigation
  const handleCourseClick = useCallback((courseId: string) => {
    const courseUrl = `/webapp/join-Course?${courseId}`;
    window.location.href = courseUrl;
  }, []);

  // Handle explore button click
  const handleExploreCourse = useCallback(
    (e: React.MouseEvent, courseId: string) => {
      e.stopPropagation(); // Prevent card click if we want different behaviors
      handleCourseClick(courseId);
    },
    [handleCourseClick]
  );

  return isVisible ? (
    <section
      id="trending-courses"
      className={`${styles.trending} ${className}`}
    >
      <div className={styles.trending__container}>
        {/* Section Header */}
        <div className={styles.trending__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={280}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.trending__title}>
              Trending{" "}
              <span className={styles.trending__title__highlight}>Courses</span>
            </h2>
          </div>
          {selectedDomain && (
            <h3 className={styles.trending__subtitle}>{selectedDomain}</h3>
          )}
        </div>

        {/* Courses Grid */}
        <div className={styles.trending__content}>
          <div
            ref={scrollContainerRef}
            className={styles.trending__courses}
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
              <div className={styles.trending__loading}>
                <div className={styles.trending__loading__spinner}></div>
                <p>Loading courses...</p>
              </div>
            ) : error ? (
              <div className={styles.trending__error}>
                <div className={styles.trending__error__message}>
                  {selectedDomain
                    ? `Unable to load courses for "${selectedDomain}" domain.`
                    : "Unable to load courses at the moment."}
                </div>
                <div className={styles.trending__error__suggestion}>
                  Please check your internet connection and try again.
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className={styles.trending__empty}>
                <div className={styles.trending__empty__message}>
                  {selectedDomain
                    ? `No courses available for "${selectedDomain}" domain.`
                    : "No courses available at the moment."}
                </div>
                <div className={styles.trending__empty__suggestion}>
                  Try selecting a different domain or check back later.
                </div>
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className={styles.trending__card}
                  onClick={() => handleCourseClick(course.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.trending__card__image}>
                    <img
                      src={
                        (domainImages as Record<string, string>)[
                          course.category
                        ] || "/images/placeholder-img.png"
                      }
                      alt={course.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/icons/default-placeholder.png";
                      }}
                    />
                  </div>
                  <div className={styles.trending__card__content}>
                    {/* Normal State Content */}
                    <div className={styles.trending__card__normal}>
                      <h4 className={styles.trending__card__title}>
                        {course.title}
                      </h4>
                      <p className={styles.trending__card__description}>
                        {course.description.length > 120
                          ? `${course.description.substring(0, 120)}...`
                          : course.description}
                      </p>
                    </div>

                    {/* Hover State Content */}
                    <div className={styles.trending__card__hover}>
                      <h4 className={styles.trending__card__title}>
                        {course.title}
                      </h4>
                      <p className={styles.trending__card__description__full}>
                        {course.description}
                      </p>
                      <button
                        className={styles.trending__card__button}
                        onClick={(e) => handleExploreCourse(e, course.id)}
                      >
                        Explore Course
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Conditionally render controls only when needed */}
          {shouldShowControls && (
            <div className={styles.trending__controls}>
              {/* Pagination Dots */}
              <div className={styles.trending__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.trending__dot} ${
                      index === currentSlide
                        ? styles["trending__dot--active"]
                        : ""
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className={styles.trending__navigation}>
                <button
                  className={styles.trending__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous courses"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.trending__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next courses"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}

          {/* Slider description */}
          {sliderDescription && (
            <p
              className={styles.trending__subtitle}
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

export default TrendingCoursesSection;
