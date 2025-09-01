// Banner.tsx (Simplified infinite scroll)
import React, { useState, useRef, useEffect } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./Banner.module.css";
import { scrollToElement } from "../../services/scrollUtils";
import { stacksApi, type HomepageStackItem } from "../../services/api";

interface BannerSlide {
  id: number | string;
  content: React.ReactNode;
  backgroundImage?: string;
}

interface BannerProps {
  className?: string;
}

const useAnimatedCounter = (
  target: number,
  duration: number = 2000,
  shouldStart: boolean = false
) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!shouldStart || hasAnimated) return;

    setHasAnimated(true);
    let startValue = 0;
    const startTime = Date.now();

    const updateCounter = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(
        startValue + (target - startValue) * easeOutQuart
      );

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [target, duration, shouldStart, hasAnimated]);

  return count;
};

// Child to safely animate within list rendering
const AnimatedNumber: React.FC<{
  value: number;
  duration: number;
  start: boolean;
}> = ({ value, duration, start }) => {
  const animated = useAnimatedCounter(value, duration, start);
  if (!start) return <></>;
  return <>{animated.toLocaleString()}</>;
};

const Banner: React.FC<BannerProps> = ({ className = "" }) => {
  // Real slides
  const realSlides: BannerSlide[] = [
    {
      id: 1,
      content: (
        <div className={styles["banner__content-wrapper"]}>
          <h2 className={styles["banner__content-subtitle"]}>What we Offer:</h2>
          <h1 className={styles["banner__content-title"]}>
            <span className={styles["banner__content-highlight"]}>Learn</span>{" "}
            from well curated courses and content
          </h1>
          <p className={styles["banner__content-description"]}>
            <span className={styles["banner__content-highlight"]}>
              Co-Learn
            </span>{" "}
            with peers from other cities and domain experts
          </p>
          <button
            className={styles["banner__content-button"]}
            onClick={() => scrollToElement("domains-section", 80)}
          >
            Explore Domains
          </button>
        </div>
      ),
      backgroundImage: "/images/banner/banner1.png",
    },
    {
      id: 2,
      content: (
        <div className={styles["banner__content-wrapper"]}>
          <h2 className={styles["second-banner__content-subtitle"]}>
            Discover the Power of Learning
          </h2>
          <h1 className={styles["second-banner__content-title"]}>
            <span className={styles["banner__content-highlight"]}>अ</span>rban
            Learnathon 2025
          </h1>
          <p className={styles["second-banner__content-description"]}>
            Launched on 8th January 2025, the second edition of the Urban
            Learnathon seeks entries from state/city officials, academic
            institutions and industry partners.
          </p>
          <button
            className={styles["banner__content-button"]}
            style={{ marginTop: "20px" }}
            onClick={() => (window.location.href = "/webapp/domainList")}
          >
            Get Started
          </button>
        </div>
      ),
      backgroundImage: "/images/banner/banner2.jpg",
    },
  ];

  // Create infinite slides: [last, first, second, first] for seamless loop
  const allSlides = [
    { ...realSlides[1], id: "clone-last" }, // Clone of last slide
    ...realSlides, // Real slides
    { ...realSlides[0], id: "clone-first" }, // Clone of first slide
  ];

  const [currentIndex, setCurrentIndex] = useState(1); // Start at first real slide
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll configuration
  const AUTO_SCROLL_INTERVAL = 4000;

  // API-driven Banner stats
  const [stats, setStats] = useState<
    { number: number; label: string; duration: number }[]
  >([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(true);

  // Fetch stacks and filter for banner-stack
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await stacksApi.getHomepageStacks();
        if (isMounted && res.success && Array.isArray(res.data)) {
          // Filter to banner-stack, dedupe by title, sort by order
          const filtered = (res.data as HomepageStackItem[]).filter(
            (item) =>
              item.category?.slug === "banner-stack" &&
              typeof item.enter_count === "number" &&
              item.title
          );

          const uniqueByTitle = Array.from(
            new Map(filtered.map((it) => [it.title, it])).values()
          );

          uniqueByTitle.sort((a, b) => {
            const oa = typeof a.order === "number" ? a.order : 0;
            const ob = typeof b.order === "number" ? b.order : 0;
            return oa - ob;
          });

          const mapped = uniqueByTitle.map((item, idx) => ({
            number: item.enter_count || 0,
            label: item.title,
            duration: 1800 + (idx % 4) * 300,
          }));

          setStats(mapped);
        } else if (isMounted) {
          setStats([]);
        }
      } catch (e) {
        if (isMounted) setStats([]);
      } finally {
        if (isMounted) setIsLoadingStacks(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Clear auto scroll timer
  const clearAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearTimeout(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  // Start auto scroll
  const startAutoScroll = () => {
    if (isPaused) return;

    clearAutoScroll();
    autoScrollTimer.current = setTimeout(() => {
      goToNext();
    }, AUTO_SCROLL_INTERVAL);
  };

  // Go to next slide
  const goToNext = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  // Go to previous slide
  const goToPrev = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Go to specific slide
  const goToSlide = (slideIndex: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentIndex(slideIndex + 1); // +1 because real slides start at index 1
  };

  // Handle transition end
  const handleTransitionEnd = () => {
    setIsTransitioning(false);

    // Handle infinite loop
    if (currentIndex === 0) {
      // Went to clone of last slide, jump to real last slide
      setTimeout(() => {
        setCurrentIndex(realSlides.length);
      }, 10);
    } else if (currentIndex === allSlides.length - 1) {
      // Went to clone of first slide, jump to real first slide
      setTimeout(() => {
        setCurrentIndex(1);
      }, 10);
    }

    // Restart auto scroll
    startAutoScroll();
  };

  // Intersection Observer for stats animation (observe the whole section so it works on first load)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAnimateStats) {
            setShouldAnimateStats(true);
          }
        });
      },
      { threshold: 0.2, root: null, rootMargin: "0px 0px -10% 0px" }
    );

    const target = sectionRef.current;
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [shouldAnimateStats]);

  // Auto scroll effect
  useEffect(() => {
    startAutoScroll();
    return () => clearAutoScroll();
  }, [isPaused]);

  // Mouse event handlers
  const handleMouseEnter = () => {
    setIsPaused(true);
    clearAutoScroll();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Calculate active dot for pagination
  const getActiveDotIndex = () => {
    if (currentIndex === 0) return realSlides.length - 1; // Clone of last
    if (currentIndex === allSlides.length - 1) return 0; // Clone of first
    return currentIndex - 1; // Real slides are offset by 1
  };

  return (
    <section
      ref={sectionRef}
      className={`${styles.banner} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slider */}
      <div className={styles["banner__slider-container"]}>
        <div
          ref={sliderRef}
          className={styles["banner__slider"]}
          style={{
            width: `${allSlides.length * 100}%`,
            transform: `translateX(-${
              currentIndex * (100 / allSlides.length)
            }%)`,
            transition: isTransitioning
              ? "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)"
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {allSlides.map((slide, index) => (
            <div
              key={`${slide.id}-${index}`}
              className={styles["banner__slide"]}
              style={{
                flex: `0 0 ${100 / allSlides.length}%`,
                backgroundImage: slide.backgroundImage
                  ? `url(${slide.backgroundImage})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className={styles["banner__background-overlay"]} />
              <div className={styles.banner__container}>
                <div className={styles.banner__content}>{slide.content}</div>
                {/* Stats inside the slide so they can flow under content on mobile */}
                <div className={styles["banner__sidebar"]}>
                  <div className={styles["banner__stats"]} ref={statsRef}>
                    {!isLoadingStacks &&
                      stats.map((stat, i) => (
                        <div
                          key={`${stat.label}-${i}`}
                          className={styles["banner__stats-item"]}
                        >
                          <div className={styles["banner__stats-number"]}>
                            <AnimatedNumber
                              value={stat.number}
                              duration={stat.duration}
                              start={shouldAnimateStats}
                            />
                          </div>
                          <div className={styles["banner__stats-label"]}>
                            {stat.label}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className={styles["banner__pagination"]}>
          {realSlides.map((_, index) => (
            <button
              key={index}
              className={`${styles["banner__pagination-dot"]} ${
                index === getActiveDotIndex()
                  ? styles["banner__pagination-dot--active"]
                  : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className={styles["banner__navigation"]}>
        <button
          className={styles["banner__navigation-arrow"]}
          onClick={goToPrev}
          disabled={isTransitioning}
          aria-label="Previous slide"
        >
          <ArrowBackIcon />
        </button>
        <button
          className={styles["banner__navigation-arrow"]}
          onClick={goToNext}
          disabled={isTransitioning}
          aria-label="Next slide"
        >
          <ArrowForwardIcon />
        </button>
      </div>
    </section>
  );
};

export default Banner;
