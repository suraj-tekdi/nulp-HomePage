import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "./DynamicPageBanner.module.css";
import { DynamicPageBanner as BannerType } from "../../services";

interface DynamicPageBannerProps {
  banners: BannerType[];
}

const DynamicPageBanner: React.FC<DynamicPageBannerProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

  if (!banners || banners.length === 0) {
    return null;
  }

  // Clear auto scroll timer
  const clearAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearTimeout(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  // Start auto scroll
  const startAutoScroll = () => {
    if (isPaused || banners.length <= 1) return;

    clearAutoScroll();
    autoScrollTimer.current = setTimeout(() => {
      goToNext();
    }, AUTO_SCROLL_INTERVAL);
  };

  // Go to next slide
  const goToNext = () => {
    if (isTransitioning || banners.length <= 1) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Go to previous slide
  const goToPrev = () => {
    if (isTransitioning || banners.length <= 1) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Go to specific slide
  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex || banners.length <= 1)
      return;

    setIsTransitioning(true);
    setCurrentIndex(index);
  };

  // Handle transition end
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Match CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Auto scroll effect
  useEffect(() => {
    startAutoScroll();
    return clearAutoScroll;
  }, [currentIndex, isPaused]);

  // Render carousel banner
  return (
    <section
      className={styles.bannerSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.bannerContainer}>
        <div className={styles.bannerSlider}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`${styles.bannerSlide} ${
                index === currentIndex ? styles.bannerSlideActive : ""
              }`}
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                transition: isTransitioning
                  ? "transform 0.3s ease-in-out"
                  : "none",
              }}
            >
              {/* Background Image */}
              {banner.image_url && (
                <div className={styles.bannerImageWrapper}>
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className={styles.bannerImage}
                    priority={index === 0}
                    sizes="100vw"
                  />
                  <div className={styles.bannerOverlay} />
                </div>
              )}

              {/* Content */}
              <div className={styles.bannerContent}>
                <h1 className={styles.bannerTitle}>{banner.title}</h1>
                {banner.description && (
                  <div
                    className={styles.bannerDescription}
                    dangerouslySetInnerHTML={{ __html: banner.description }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows - only show if multiple banners */}
        {banners.length > 1 && (
          <div className={styles.bannerNavigation}>
            <button
              className={styles.bannerArrow}
              onClick={goToPrev}
              disabled={isTransitioning}
              aria-label="Previous banner"
            >
              <ArrowBackIcon />
            </button>
            <button
              className={styles.bannerArrow}
              onClick={goToNext}
              disabled={isTransitioning}
              aria-label="Next banner"
            >
              <ArrowForwardIcon />
            </button>
          </div>
        )}

        {/* Pagination dots - only show if multiple banners */}
        {banners.length > 1 && (
          <div className={styles.bannerPagination}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.bannerDot} ${
                  index === currentIndex ? styles.bannerDotActive : ""
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DynamicPageBanner;
