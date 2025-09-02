// AboutUsHero.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AboutUsHero.module.css";
import { stacksApi, type HomepageStackItem } from "../../services";
import { articlesApi, type HomepageArticleItem } from "../../services";

interface BannerProps {
  className?: string;
}

// Counter hook used to animate numbers once visible
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
    const startTime = Date.now();

    const update = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(target * easeOutQuart);
      setCount(currentValue);
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }, [target, duration, shouldStart, hasAnimated]);

  return count;
};

const AnimatedNumber: React.FC<{
  value: number;
  duration: number;
  start: boolean;
}> = ({ value, duration, start }) => {
  const animated = useAnimatedCounter(value, duration, start);
  if (!start) return <></>;
  return <>{animated.toLocaleString()}</>;
};

// Remove any inline background styles coming from CMS
const sanitizeCmsHtml = (html: string): string => {
  if (!html) return html;
  try {
    if (typeof window !== "undefined") {
      const container = document.createElement("div");
      container.innerHTML = html;
      const removeBg = (el: Element) => {
        const element = el as HTMLElement;
        if (element && element.style) {
          element.style.removeProperty("background");
          element.style.removeProperty("background-color");
        }
        Array.from(el.children).forEach(removeBg);
      };
      Array.from(container.children).forEach(removeBg);
      return container.innerHTML;
    }
  } catch {}
  // SSR-safe fallback: strip background declarations via regex
  return html
    .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
    .replace(/background\s*:\s*[^;"']+;?/gi, "");
};

const AboutUsHero: React.FC<BannerProps> = ({ className = "" }) => {
  // Banner content from CMS "About Us Banner" article
  const [bannerHtml, setBannerHtml] = useState<string>("");
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(
    "/images/banner/banner1.png"
  );

  // Stats from stacks API (same flow as Banner component)
  const [stats, setStats] = useState<
    { number: number; label: string; duration: number }[]
  >([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(true);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  // Fetch About Us articles once and extract the banner item
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const bannerItem =
          items.find(
            (a) => (a.slug || "").toLowerCase() === "about-us-banner"
          ) ||
          items.find(
            (a) => (a.category?.slug || "").toLowerCase() === "about-us-banner"
          );
        const cleaned = sanitizeCmsHtml(bannerItem?.content || "");
        setBannerHtml(cleaned);
        // In future, if background is provided via thumbnail, use it
        if (bannerItem?.thumbnail?.url)
          setBackgroundImage(bannerItem.thumbnail.url);
      } else {
        setBannerHtml("");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stacks and map to stats like Banner
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await stacksApi.getHomepageStacks();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const filtered = (res.data as HomepageStackItem[]).filter(
            (item) =>
              item.category?.slug === "banner-stack" &&
              typeof item.enter_count === "number" &&
              item.title
          );
          const uniqueByTitle = Array.from(
            new Map(filtered.map((it) => [it.title, it])).values()
          );
          uniqueByTitle.sort(
            (a, b) =>
              (typeof a.order === "number" ? a.order : 0) -
              (typeof b.order === "number" ? b.order : 0)
          );
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

  // Observe section to trigger animation once in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAnimateStats)
            setShouldAnimateStats(true);
        });
      },
      { threshold: 0.2, root: null, rootMargin: "0px 0px -10% 0px" }
    );
    const target = sectionRef.current;
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [shouldAnimateStats]);

  // Fallback title if CMS empty
  const hasBannerHtml = useMemo(
    () => !!bannerHtml && bannerHtml.trim().length > 0,
    [bannerHtml]
  );

  return (
    <section ref={sectionRef} className={`${styles.banner} ${className}`}>
      {/* Single Banner */}
      <div className={styles["banner__container"]}>
        <div
          className={styles["banner__slide"]}
          style={{
            backgroundImage: backgroundImage
              ? `url(${backgroundImage})`
              : undefined,
          }}
        >
          <div className={styles["banner__background-overlay"]} />
          <div className={styles.banner__content}>
            <div className={styles["banner__content-wrapper"]}>
              {hasBannerHtml ? (
                <div dangerouslySetInnerHTML={{ __html: bannerHtml }} />
              ) : (
                <h1 className={styles["banner__content-title"]}>About Us</h1>
              )}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className={styles["banner__sidebar"]}>
          <div className={styles["banner__stats"]}>
            {!isLoadingStacks &&
              stats.map((stat, index) => (
                <div
                  key={`${stat.label}-${index}`}
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
    </section>
  );
};

export default AboutUsHero;
