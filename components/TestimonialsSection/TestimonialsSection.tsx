import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./TestimonialsSection.module.css";
import { testimonialsApi, HomepageTestimonialItem } from "../../services/api";

interface TestimonialsSectionProps {
  className?: string;
  initialTestimonials?: HomepageTestimonialItem[];
}

const CARD_WIDTH_WITH_GAP = 390 + 24; // keep in sync with CSS

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  className = "",
  initialTestimonials = [],
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] =
    useState<HomepageTestimonialItem[]>(initialTestimonials);
  const [visibleCards, setVisibleCards] = useState<number>(1);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);

  // Observe width changes to recalc visible cards and overflow
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const containerWidth = el.clientWidth || 0;
      const vc = Math.max(1, Math.floor(containerWidth / CARD_WIDTH_WITH_GAP));
      setVisibleCards(vc);
      // overflow when total content width > container width
      const contentWidth = testimonials.length * CARD_WIDTH_WITH_GAP;
      setHasOverflow(contentWidth > containerWidth + 1);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [testimonials.length]);

  // Hydrate from server-provided testimonials
  useEffect(() => {
    if (initialTestimonials && initialTestimonials.length > 0) {
      const sorted = [...initialTestimonials].sort(
        (a, b) => (a.id || 0) - (b.id || 0)
      );
      setTestimonials(sorted);
    }
  }, [initialTestimonials]);

  // Fetch from CMS if none provided
  useEffect(() => {
    if (testimonials.length > 0) return;
    let mounted = true;
    (async () => {
      const res = await testimonialsApi.getHomepageTestimonials();
      if (mounted && res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => (a.id || 0) - (b.id || 0));
        setTestimonials(sorted);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [testimonials.length]);

  // Calculate total slides based on visible cards
  const totalSlides = useMemo(() => {
    if (testimonials.length === 0) return 1;
    const slides = Math.ceil(testimonials.length / visibleCards);
    return Math.max(1, slides);
  }, [testimonials.length, visibleCards]);

  // Reset pagination when dependencies change
  useEffect(() => {
    setCurrentSlide(0);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }
    }, 50);
  }, [testimonials.length, visibleCards]);

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
    if (!scrollContainerRef.current || currentSlide >= totalSlides - 1) return;
    const container = scrollContainerRef.current;
    const scrollAmount = CARD_WIDTH_WITH_GAP * visibleCards;
    const newSlideIndex = Math.min(currentSlide + 1, totalSlides - 1);
    setCurrentSlide(newSlideIndex);
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, [currentSlide, totalSlides, visibleCards]);

  const prevSlide = useCallback(() => {
    if (!scrollContainerRef.current || currentSlide <= 0) return;
    const container = scrollContainerRef.current;
    const scrollAmount = CARD_WIDTH_WITH_GAP * visibleCards;
    const newSlideIndex = Math.max(currentSlide - 1, 0);
    setCurrentSlide(newSlideIndex);
    container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }, [currentSlide, visibleCards]);

  const goToSlide = useCallback(
    (slideIndex: number) => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const scrollPosition = slideIndex * (CARD_WIDTH_WITH_GAP * visibleCards);
      setCurrentSlide(slideIndex);
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    },
    [visibleCards]
  );

  const showControls = hasOverflow && totalSlides > 1;

  // Extract embeddable URL for YouTube if needed
  const toEmbeddableUrl = (url?: string | null): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (
        u.hostname.includes("youtube.com") ||
        u.hostname.includes("youtu.be")
      ) {
        // Handle youtu.be short links or watch?v=
        const videoId = u.hostname.includes("youtu.be")
          ? u.pathname.replace("/", "")
          : u.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <section className={`${styles.testimonials} ${className}`}>
      <div className={styles.testimonials__container}>
        {/* Section Header */}
        <div className={styles.testimonials__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={250}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.testimonials__title}>Testimonials</h2>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.testimonials__content}>
          {/* Testimonials Horizontal Scroll */}
          <div
            className={styles.testimonials__scroll}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {testimonials.map((t) => {
              const cmsThumb =
                t.thumbnail?.formats?.thumbnail?.url || t.thumbnail?.url || "";
              const imgSrc = cmsThumb
                ? testimonialsApi.buildImageUrl(cmsThumb)
                : "/images/testimonials/person.jpeg";

              // Determine content rendering
              const isVideoMode = (t.mode || "").toLowerCase() === "video";
              const sourceType = (t.video_source || "").toLowerCase();
              const urlSource = toEmbeddableUrl(t.video_source_url);
              const hasUrlVideo =
                isVideoMode && sourceType.includes("url") && !!urlSource;
              const hasUploadVideo =
                isVideoMode && !!(t.video_upload && t.video_upload.url);

              return (
                <div key={t.id} className={styles.testimonials__card}>
                  {/* Profile Image or Video */}
                  <div className={styles.testimonials__card__imageContainer}>
                    <img
                      src={imgSrc}
                      alt={t.user_name}
                      className={styles.testimonials__card__image}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (
                          target.src.includes(
                            "/images/testimonials/person.jpeg"
                          )
                        ) {
                          return;
                        }
                        target.src = "/images/testimonials/person.jpeg";
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className={styles.testimonials__card__content}>
                    {hasUrlVideo ? (
                      <div className={styles.testimonials__videoWrapper}>
                        <iframe
                          className={styles.testimonials__video}
                          src={urlSource as string}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={t.user_name}
                        />
                      </div>
                    ) : hasUploadVideo ? (
                      <div className={styles.testimonials__videoWrapper}>
                        <video
                          className={styles.testimonials__video}
                          controls
                          preload="metadata"
                        >
                          <source
                            src={t.video_upload!.url}
                            type={t.video_upload!.mime || "video/mp4"}
                          />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <blockquote className={styles.testimonials__card__quote}>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: t.testimonial || "",
                          }}
                        />
                      </blockquote>
                    )}

                    {/* Attribution */}
                    <div className={styles.testimonials__card__attribution}>
                      <div className={styles.testimonials__card__name}>
                        — {t.user_name}
                      </div>
                      <div className={styles.testimonials__card__position}>
                        {t.user_details}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conditionally render controls only when needed */}
          {showControls && (
            <div className={styles.testimonials__controls}>
              {/* Pagination Dots */}
              <div className={styles.testimonials__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.testimonials__dot} ${
                      index === currentSlide
                        ? styles["testimonials__dot--active"]
                        : ""
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className={styles.testimonials__navigation}>
                <button
                  className={styles.testimonials__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous testimonials"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.testimonials__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next testimonials"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
