// Banner.tsx (with infinite-loop fix)
import React, { useState, useRef, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './Banner.module.css';
import { scrollToElement } from '../../services/scrollUtils';

interface BannerSlide {
  id: number | string;
  content: React.ReactNode;
  backgroundImage?: string;
}

interface BannerProps {
  className?: string;
}

// Custom hook for animated counter
const useAnimatedCounter = (target: number, duration: number = 2000, shouldStart: boolean = false) => {
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
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(target); // Ensure we end at exact target
      }
    };
    
    requestAnimationFrame(updateCounter);
  }, [target, duration, shouldStart, hasAnimated]);

  return count;
};

const Banner: React.FC<BannerProps> = ({ className = '' }) => {
  // 1) Your "real" slides with hardcoded content
  const realSlides: BannerSlide[] = [
    {
      id: 1,
      content: (
        <div className={styles['banner__content-wrapper']}>
          <h2 className={styles['banner__content-subtitle']}>
            What we Offer:
          </h2>
          <h1 className={styles['banner__content-title']}>
            <span className={styles['banner__content-highlight']}>Learn</span> from well curated courses and content
          </h1>
          <p className={styles['banner__content-description']}>
            <span className={styles['banner__content-highlight']}>Co-Learn</span> with peers from other cities and domain experts
          </p>
          <button
            className={styles['banner__content-button']}
            onClick={() => scrollToElement('domains-section', 80)}
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
        <div className={styles['banner__content-wrapper']}>
          <h2 className={styles['banner__content-subtitle']}>
            Discover the Power of Learning
          </h2>
          <h1 className={styles['banner__content-title']}>
            <span className={styles['banner__content-highlight']}>अ</span>rban Learnathon 2025
          </h1>
          <p className={styles['banner__content-description']}>
            Launched on 8th January 2025, the second edition of the Urban Learnathon seeks entries from state/city officials, academic institutions and industry partners.
          </p>
          <button
            className={styles['banner__content-button']}
            style={{'marginTop': '20px'}}
            onClick={() => window.location.href = 'https://nulp.niua.org/webapp/domainList'}
          >
            Get Started
          </button>
        </div>
      ),
      backgroundImage: "/images/banner/banner2.jpg",
    },
  ];

  // 2) Clone first & last for the infinite‑loop trick with explicit background images
  const slides = [
    { 
      ...realSlides[realSlides.length - 1], 
      id: 'clone-start',
      backgroundImage: realSlides[realSlides.length - 1].backgroundImage
    },
    ...realSlides,
    { 
      ...realSlides[0], 
      id: 'clone-end',
      backgroundImage: realSlides[0].backgroundImage
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll configuration
  const AUTO_SCROLL_INTERVAL = 4000; // 4 seconds

  // Re-enable transition immediately after a snap reset
  useEffect(() => {
    if (!transitionEnabled) {
      const id = requestAnimationFrame(() => setTransitionEnabled(true));
      return () => cancelAnimationFrame(id);
    }
  }, [transitionEnabled]);

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAnimateStats) {
            setShouldAnimateStats(true);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of stats are visible
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [shouldAnimateStats]);

  // Auto scroll effect
  useEffect(() => {
    const startAutoScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (!isPaused) {
        intervalRef.current = setInterval(() => {
          setTransitionEnabled(true);
          setCurrentSlide((s) => s + 1);
        }, AUTO_SCROLL_INTERVAL);
      }
    };

    startAutoScroll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  // Helper function to restart auto-scroll
  const restartAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setTransitionEnabled(true);
        setCurrentSlide((s) => s + 1);
      }, AUTO_SCROLL_INTERVAL);
    }
  };

  const stats = [
    { number: 12, label: "Participating States" },
    { number: 449, label: "Urban Local Bodies" },
    { number: 107690, label: "NULP Community Members" },
  ];

  // Animated counters for each stat
  const animatedStats = [
    useAnimatedCounter(stats[0].number, 2000, shouldAnimateStats),
    useAnimatedCounter(stats[1].number, 2500, shouldAnimateStats),
    useAnimatedCounter(stats[2].number, 3000, shouldAnimateStats),
  ];

  // Format numbers with commas for better readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const handleTransitionEnd = () => {
    // Clear the current interval to prevent overlapping
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (currentSlide === slides.length - 1) {
      // hit clone-end → snap to first real slide
      setTransitionEnabled(false);
      setCurrentSlide(1);
      // Restart auto-scroll after a brief delay
      setTimeout(() => {
        restartAutoScroll();
      }, 50);
    } else if (currentSlide === 0) {
      // hit clone-start → snap to last real slide
      setTransitionEnabled(false);
      setCurrentSlide(slides.length - 2);
      // Restart auto-scroll after a brief delay
      setTimeout(() => {
        restartAutoScroll();
      }, 50);
    }
  };

  const nextSlide = () => {
    setTransitionEnabled(true);
    setCurrentSlide((s) => s + 1);
    // Reset auto-scroll timer when manually navigating
    restartAutoScroll();
  };

  const prevSlide = () => {
    setTransitionEnabled(true);
    setCurrentSlide((s) => s - 1);
    // Reset auto-scroll timer when manually navigating
    restartAutoScroll();
  };

  const goToSlide = (idx: number) => {
    setTransitionEnabled(true);
    setCurrentSlide(idx + 1);
    // Reset auto-scroll timer when manually navigating
    restartAutoScroll();
  };

  // Mouse event handlers for pause/resume
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    // Start auto-scroll again
    restartAutoScroll();
  };

  return (
    <section 
      className={`${styles.banner} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slider */}
      <div className={styles['banner__slider-container']}>
        <div
          ref={sliderRef}
          className={styles['banner__slider']}
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${currentSlide * (100 / slides.length)}%)`,
            transition: transitionEnabled
              ? 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)'
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={styles['banner__slide']}
              style={{
                flex: `0 0 ${100 / slides.length}%`,
                backgroundImage: slide.backgroundImage
                  ? `url(${slide.backgroundImage})`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className={styles['banner__background-overlay']} />
              <div className={styles.banner__container}>
                <div className={styles.banner__content}>
                  {slide.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots - Overlay on banner */}
        <div className={styles['banner__pagination']}>
          {realSlides.map((_, di) => {
            const isActive = di === (currentSlide - 1 + realSlides.length) % realSlides.length;
            return (
              <button
                key={di}
                className={`${styles['banner__pagination-dot']} ${
                  isActive ? styles['banner__pagination-dot--active'] : ''
                }`}
                onClick={() => goToSlide(di)}
                aria-label={`Go to slide ${di + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Stats + Arrows */}
      <div className={styles['banner__sidebar']}>
        <div className={styles['banner__stats']} ref={statsRef}>
          {stats.map((s, i) => (
            <div key={i} className={styles['banner__stats-item']}>
              <div className={styles['banner__stats-number']}>{formatNumber(animatedStats[i])}</div>
              <div className={styles['banner__stats-label']}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className={styles['banner__navigation']}>
          <button
            className={styles['banner__navigation-arrow']}
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ArrowBackIcon />
          </button>
          <button
            className={styles['banner__navigation-arrow']}
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ArrowForwardIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Banner;
