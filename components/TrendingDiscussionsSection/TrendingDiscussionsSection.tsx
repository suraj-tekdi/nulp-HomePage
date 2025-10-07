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
import {
  discussionApi,
  transformDiscussionTopic,
  transformDomainDiscussionPost,
  DiscussionTopic,
  DomainDiscussionPost,
  getDynamicNulpUrls,
} from "../../services/api";
import { slidersApi, type TrendingDiscussionItem } from "../../services/sliders";
import domainImages from "../../services/domain-images.json";
import styles from "./TrendingDiscussionsSection.module.css";

interface Discussion {
  id: number;
  title: string;
  description?: string;
  category?: string;
  replies?: number;
  views?: number;
  isSolved?: boolean;
  author?: string;
  designation?: string;
  location?: string;
  slug: string;
}

interface TrendingDiscussionsSectionProps {
  className?: string;
  selectedDomain?: string | null;
}

const TrendingDiscussionsSection: React.FC<TrendingDiscussionsSectionProps> = ({
  className = "",
  selectedDomain,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigationNeeded, setIsNavigationNeeded] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [sliderDescription, setSliderDescription] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Transform TrendingDiscussionItem from sliders API to our Discussion interface
  const transformTrendingDiscussion = useCallback(
    (trendingDiscussion: TrendingDiscussionItem): Discussion => {
      return {
        id: trendingDiscussion.id,
        title: trendingDiscussion.title.trim(),
        slug: trendingDiscussion.slug,
      };
    },
    []
  );

  // Fetch discussions from API
  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        setLoading(true);
        setError(null);

        let response: any;
        let transformedDiscussions: Discussion[] | undefined;

        // If a specific domain is selected -> use domain-specific API
        if (selectedDomain && selectedDomain.trim() !== "") {
          response = await discussionApi.getDiscussionsByDomain(selectedDomain);
          if (response.success && response.data) {
            transformedDiscussions = (
              response.data as DomainDiscussionPost[]
            ).map(transformDomainDiscussionPost) as unknown as Discussion[];
          } else if (!response.success) {
            setError(response.error || "Failed to fetch domain discussions");
          }
        } else {
          // No domain selected -> read sliders to decide mode
          const allRes = await slidersApi.getHomepageSliders();
          if (!allRes.success || !Array.isArray(allRes.data)) {
            setIsVisible(false);
            setDiscussions([]);
            setError(allRes.error || "Failed to get slider slugs");
            return;
          }
          const all = allRes.data || [];

          const disDynamic = (all as any[]).find(
            (i) =>
              (i.name || "").toLowerCase() === "trending discussions" &&
              (i.mode || "").toLowerCase() === "dynamic"
          );
          const disSelected = (all as any[]).find(
            (i) => (i.mode || "").toLowerCase() === "select_discussion"
          );
          const chosen = (disDynamic as any) || (disSelected as any);
          setSliderDescription((chosen?.description as string) || "");

          if (disDynamic) {
            // Use popular discussions as dynamic source
            const popRes = await discussionApi.getPopularDiscussions();
            if (popRes.success && Array.isArray(popRes.data)) {
              const rawTopics = popRes.data as DiscussionTopic[];

              const sf = ((disDynamic as any).sort_field || "").toLowerCase();
              const so = (
                (disDynamic as any).sort_order || "DESC"
              ).toLowerCase();
              const dir = so === "asc" ? 1 : -1;
              const sortedRaw = [...rawTopics].sort((a, b) => {
                if (sf.includes("updated"))
                  return dir * ((a.lastposttime || 0) - (b.lastposttime || 0));
                if (sf.includes("repl"))
                  return dir * ((a.postcount || 0) - (b.postcount || 0));
                if (sf.includes("view"))
                  return dir * ((a.viewcount || 0) - (b.viewcount || 0));
                return dir * ((a.tid || 0) - (b.tid || 0));
              });

              transformedDiscussions = sortedRaw
                .slice(0, 12)
                .map((t) =>
                  transformDiscussionTopic(t)
                ) as unknown as Discussion[];
              setIsVisible((transformedDiscussions || []).length > 0);
            } else {
              setError(popRes.error || "Failed to fetch discussions");
              setIsVisible(false);
              setDiscussions([]);
              return;
            }
          } else {
            // Selected mode: check if discussions are directly provided
            if (disSelected.trending_discussions && Array.isArray(disSelected.trending_discussions) && disSelected.trending_discussions.length > 0) {
              // New API structure: discussions are directly provided
              const transformedDiscussions = disSelected.trending_discussions.map(transformTrendingDiscussion);
              setDiscussions(transformedDiscussions);
              setIsVisible(transformedDiscussions.length > 0);
              return;
            }

            // Fallback: use curated slugs (old API structure)
            const slugs =
              ((disSelected as any)?.trending_discussions as string[])
                ?.filter(Boolean)
                ?.slice(0, 12) || [];

            setIsVisible(slugs.length > 0);
            if (slugs.length === 0) {
              setDiscussions([]);
              return;
            }

            // Fetch each topic by slug path in parallel
            const topicPromises = slugs.map((slugPath) =>
              discussionApi.getTopicBySlugPath(slugPath as string)
            );
            const topicsResults = await Promise.all(topicPromises);
            const topics: DiscussionTopic[] = topicsResults
              .filter((r) => r.success && r.data)
              .map((r) => r.data as DiscussionTopic);

            transformedDiscussions = topics.map((t) =>
              transformDiscussionTopic(t)
            ) as unknown as Discussion[];
          }
        }

        if (transformedDiscussions) {
          setDiscussions(transformedDiscussions || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, [selectedDomain, transformTrendingDiscussion]); // Add selectedDomain and transformTrendingDiscussion as dependencies

  const discussionsPerPage = 4;
  const totalSlides = useMemo(
    () => Math.ceil(discussions.length / discussionsPerPage),
    [discussions.length, discussionsPerPage]
  );

  // Function to check if navigation is needed
  const checkNavigationNeeded = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const isScrollNeeded = container.scrollWidth > container.clientWidth;
    const hasMultipleItems = discussions.length > 1;

    // Show navigation only if content overflows AND there are multiple items
    setIsNavigationNeeded(isScrollNeeded && hasMultipleItems);
  }, [discussions.length]);

  // Check navigation needed after discussions load
  useEffect(() => {
    if (!loading && discussions.length > 0) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(checkNavigationNeeded, 100);
      return () => clearTimeout(timer);
    } else if (!loading && discussions.length === 0) {
      setIsNavigationNeeded(false);
    }
  }, [loading, discussions.length, checkNavigationNeeded]);

  // Check navigation needed on window resize
  useEffect(() => {
    const handleResize = () => {
      checkNavigationNeeded();
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [checkNavigationNeeded]);

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

  const nextSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 340 + 24; // card width + gap (matching other sections)
    const step = isMobile ? cardWidth : cardWidth * 2;
    scrollContainerRef.current.scrollBy({ left: step, behavior: "smooth" });
  }, [isMobile]);

  const prevSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 340 + 24; // card width + gap (matching other sections)
    const step = isMobile ? cardWidth : cardWidth * 2;
    scrollContainerRef.current.scrollBy({ left: -step, behavior: "smooth" });
  }, [isMobile]);

  const goToSlide = useCallback((slideIndex: number) => {
    setCurrentSlide(slideIndex);
  }, []);

  const updateCurrentSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 340 + 24; // card width + gap (matching other sections)
    const sl = scrollContainerRef.current.scrollLeft;
    const newSlide = Math.round(sl / (cardWidth * 2));
    setCurrentSlide(Math.min(newSlide, totalSlides - 1));
  }, [totalSlides]);

  // Handle discussion click to redirect to detailed page
  const handleDiscussionClick = useCallback((slug: string) => {
    const { base } = getDynamicNulpUrls();
    const discussionUrl = `${base}/discussion-forum/topic/${slug}`;
    window.location.href = discussionUrl;
  }, []);

  // Add scroll event listener for pagination dots (only when navigation is needed)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && isNavigationNeeded) {
      container.addEventListener("scroll", updateCurrentSlide);
      return () => container.removeEventListener("scroll", updateCurrentSlide);
    }
  }, [updateCurrentSlide, isNavigationNeeded]);

  // Truncate text function
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Clean HTML tags from description
  const cleanHtmlTags = (html: string | undefined) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <section
        id="trending-discussions"
        className={`${styles.discussions} ${className}`}
      >
        <div className={styles.discussions__container}>
          <div className={styles.discussions__accent}></div>
          <div className={styles.discussions__header}>
            <h2 className={styles.discussions__title}>
              Trending{" "}
              <span className={styles.discussions__title__highlight}>
                Discussions
              </span>
            </h2>
            <h3 className={styles.discussions__subtitle}>
              {selectedDomain || "All Domains"}
            </h3>
          </div>
          <div className={styles.discussions__content}>
            <div className={styles.discussions__loading}>
              Loading discussions...
            </div>
            {sliderDescription && (
              <p
                className={styles.discussions__subtitle}
                style={{ textAlign: "center", marginTop: "12px" }}
              >
                {sliderDescription}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        id="trending-discussions"
        className={`${styles.discussions} ${className}`}
      >
        <div className={styles.discussions__container}>
          <div className={styles.discussions__header}>
            <div className="title-wrapper">
              <Image
                src="/images/Arrow.svg"
                alt="Arrow decoration"
                width={280}
                height={18}
                className="title-arrow"
              />
              <h2 className={styles.discussions__title}>
                Trending{" "}
                <span className={styles.discussions__title__highlight}>
                  Discussions
                </span>
              </h2>
            </div>
            <h3 className={styles.discussions__subtitle}>{selectedDomain}</h3>
          </div>
          <div className={styles.discussions__content}>
            <div className={styles.discussions__error}>
              Error loading discussions: {error}
            </div>
            {sliderDescription && (
              <p
                className={styles.discussions__subtitle}
                style={{ textAlign: "center", marginTop: "12px" }}
              >
                {sliderDescription}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Show "No discussions available" when there are no discussions but no error
  if (!loading && discussions.length === 0) {
    return (
      <section
        id="trending-discussions"
        className={`${styles.discussions} ${className}`}
      >
        <div className={styles.discussions__container}>
          <div className={styles.discussions__header}>
            <div className="title-wrapper">
              <Image
                src="/images/Arrow.svg"
                alt="Arrow decoration"
                width={280}
                height={18}
                className="title-arrow"
              />
              <h2 className={styles.discussions__title}>
                Trending{" "}
                <span className={styles.discussions__title__highlight}>
                  Discussions
                </span>
              </h2>
            </div>
            <h3 className={styles.discussions__subtitle}>
              {selectedDomain || "All Domains"}
            </h3>
          </div>
          <div className={styles.discussions__content}>
            <div className={styles.discussions__empty}>
              <div className={styles.discussions__empty__message}>
                {selectedDomain
                  ? `No discussions available for "${selectedDomain}" domain.`
                  : "No discussions available at the moment."}
              </div>
              <div className={styles.discussions__empty__suggestion}>
                Try selecting a different domain or check back later.
              </div>
            </div>
            {sliderDescription && (
              <p
                className={styles.discussions__subtitle}
                style={{ textAlign: "center", marginTop: "12px" }}
              >
                {sliderDescription}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="trending-discussions"
      className={`${styles.discussions} ${className}`}
    >
      <div className={styles.discussions__container}>
        <div className={styles.discussions__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={280}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.discussions__title}>
              Trending{" "}
              <span className={styles.discussions__title__highlight}>
                Discussions
              </span>
            </h2>
          </div>
          <h3 className={styles.discussions__subtitle}>{selectedDomain}</h3>
        </div>
        <div className={styles.discussions__content}>
          <div
            ref={scrollContainerRef}
            className={`${styles.discussions__items} ${
              !isNavigationNeeded ? styles["discussions__items--no-scroll"] : ""
            }`}
            onMouseDown={isNavigationNeeded ? handleMouseDown : undefined}
            onMouseMove={isNavigationNeeded ? handleMouseMove : undefined}
            onMouseUp={isNavigationNeeded ? handleMouseUp : undefined}
            onMouseLeave={isNavigationNeeded ? handleMouseLeave : undefined}
            onTouchStart={isNavigationNeeded ? handleTouchStart : undefined}
            onTouchMove={isNavigationNeeded ? handleTouchMove : undefined}
            onTouchEnd={isNavigationNeeded ? handleTouchEnd : undefined}
          >
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                className={styles.discussions__card}
                onClick={() => handleDiscussionClick(discussion.slug)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.discussions__card__image}>
                  <img
                    src={
                      (domainImages as Record<string, string>)[
                        discussion.category || "General"
                      ] || "/images/placeholder-img.png"
                    }
                    alt={discussion.title}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/icons/default-placeholder.png";
                    }}
                  />
                </div>
                <div className={styles.discussions__card__content}>
                  {/* Normal State Content */}
                  <div className={styles.discussions__card__normal}>
                    <h4 className={styles.discussions__card__title}>
                      {truncateText(discussion.title, 60)}
                    </h4>
                    <p className={styles.discussions__card__description}>
                      {truncateText(cleanHtmlTags(discussion.description || "Join the discussion and share your thoughts on this topic."), 100)}
                    </p>
                  </div>

                  {/* Hover State Content */}
                  <div className={styles.discussions__card__hover}>
                    <h4 className={styles.discussions__card__title}>
                      {discussion.title}
                    </h4>
                    <p className={styles.discussions__card__description__full}>
                      {truncateText(cleanHtmlTags(discussion.description || "Join the discussion and share your thoughts on this topic."), 200)}
                    </p>
                    <button
                      className={styles.discussions__card__button}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when button is clicked
                        handleDiscussionClick(discussion.slug);
                      }}
                    >
                      Join Discussion
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Only show controls when navigation is needed */}
          {isNavigationNeeded && !isMobile && (
            <div className={styles.discussions__controls}>
              <div className={styles.discussions__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.discussions__dot} ${
                      index === currentSlide
                        ? styles["discussions__dot--active"]
                        : ""
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className={styles.discussions__navigation}>
                <button
                  className={styles.discussions__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous discussions"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.discussions__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next discussions"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}
          {isMobile && (
            <div className={styles.discussions__controls}>
              <div className={styles.discussions__navigation}>
                <button
                  className={styles.discussions__arrow}
                  onClick={prevSlide}
                  aria-label="Previous"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.discussions__arrow}
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
              className={styles.discussions__subtitle}
              style={{ textAlign: "center", marginTop: "12px" }}
            >
              {sliderDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingDiscussionsSection;
