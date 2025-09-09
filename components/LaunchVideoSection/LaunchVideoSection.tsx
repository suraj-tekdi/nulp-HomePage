import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./LaunchVideoSection.module.css";
import { stacksApi, type HomepageStackItem } from "../../services/api";
import { mediaApi, type LaunchMedia } from "../../services";

interface LaunchVideoSectionProps {
  className?: string;
}

// Custom hook for animated counter
const useAnimatedCounter = (
  target: number,
  duration: number = 1500,
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

      // Easing function for smooth animation (ease-out)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(
        startValue + (target - startValue) * easeOutQuart
      );

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

// Child component to safely use hooks inside list rendering
const AnimatedNumber: React.FC<{
  value: number;
  duration: number;
  start: boolean;
  original: number;
}> = ({ value, duration, start, original }) => {
  const animated = useAnimatedCounter(value, duration, start);
  const formatNumber = (num: number, originalValue: number): string => {
    if (originalValue < 10 && originalValue.toString().length === 1) {
      return num.toString().padStart(2, "0");
    }
    return num.toLocaleString();
  };
  return <>{formatNumber(animated, original)}</>;
};

const LaunchVideoSection: React.FC<LaunchVideoSectionProps> = ({
  className = "",
}) => {
  // Dynamic launch media
  const [launchMedia, setLaunchMedia] = useState<LaunchMedia | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  // State for animation trigger
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // API-driven stats only (no hardcoded defaults)
  const [stats, setStats] = useState<
    { number: number; label: string; duration: number }[]
  >([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(true);

  // Fetch Launch media
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await mediaApi.getLaunchMedia();
        if (isMounted && res.success) {
          setLaunchMedia(res.data || null);
        }
      } catch (e) {
        // ignore
      } finally {
        if (isMounted) setIsLoadingMedia(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stacks from CMS and map to stats (display ALL items)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await stacksApi.getHomepageStacks();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const items = (res.data as HomepageStackItem[])
            .filter((item) => (item.state || "").toLowerCase() === "published")
            .filter((item) => item.category?.slug === "landing-page-stacks")
            .filter(
              (item) => typeof item.enter_count === "number" && item.title
            )
            // Sort strictly by `order` to allow CMS-controlled ordering
            .sort((a, b) => {
              const oa = typeof a.order === "number" ? a.order : 0;
              const ob = typeof b.order === "number" ? b.order : 0;
              return oa - ob;
            });

          const mapped = items.map((item, idx) => ({
            number: item.enter_count || 0,
            label: item.title,
            duration: 1000 + (idx % 6) * 200,
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAnimateStats) {
            setShouldAnimateStats(true);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [shouldAnimateStats]);

  const renderLaunchMedia = () => {
    if (isLoadingMedia) {
      return (
        <div className={styles.launchVideo__videoContainer}>Loading...</div>
      );
    }
    if (!launchMedia) {
      return (
        <div className={styles.launchVideo__videoContainer}>
          <div className={styles.launchVideo__videoFallback}>
            No launch media available
          </div>
        </div>
      );
    }

    if (launchMedia.kind === "video") {
      if (launchMedia.source === "url") {
        // Render external URL via iframe
        return (
          <div className={styles.launchVideo__videoContainer}>
            <iframe
              src={launchMedia.url}
              className={styles.launchVideo__video}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={launchMedia.title || "Launch Video"}
            />
          </div>
        );
      }
      // Uploaded video: use HTML5 video tag
      return (
        <div className={styles.launchVideo__videoContainer}>
          <video
            className={styles.launchVideo__video}
            controls
            preload="metadata"
          >
            <source
              src={launchMedia.url}
              type={launchMedia.mime || "video/mp4"}
            />
          </video>
        </div>
      );
    }

    // Image fallback
    return (
      <div className={styles.launchVideo__videoContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={launchMedia.url}
          alt={launchMedia.title}
          className={styles.launchVideo__video}
        />
      </div>
    );
  };

  return (
    <section className={`${styles.launchVideo} ${className}`} ref={statsRef}>
      <div className={styles.launchVideo__container}>
        <div className={styles.launchVideo__content}>
          {/* Left Side - Video */}
          <div className={styles.launchVideo__videoWrapper}>
            {renderLaunchMedia()}
          </div>

          {/* Right Side - Stats */}
          <div className={styles.launchVideo__statsWrapper}>
            <div className={styles.launchVideo__statsGrid}>
              {!isLoadingStacks &&
                stats.length > 0 &&
                stats.map((stat, index) => (
                  <div
                    key={`${stat.label}-${index}`}
                    className={styles.launchVideo__statCard}
                  >
                    <div className={styles.launchVideo__statIcon}>
                      <Image
                        src="/images/growth-arrow.png"
                        alt="Growth Arrow"
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className={styles.launchVideo__statNumber}>
                      <AnimatedNumber
                        value={stat.number}
                        duration={stat.duration}
                        start={shouldAnimateStats}
                        original={stat.number}
                      />
                    </div>
                    <div className={styles.launchVideo__statLabel}>
                      {stat.label}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LaunchVideoSection;
