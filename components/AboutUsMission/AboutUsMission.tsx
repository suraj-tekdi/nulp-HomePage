import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./AboutUsMission.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services";

interface AboutUsMissionProps {
  className?: string;
}

// Remove inline background styles coming from CMS
const sanitizeCmsHtml = (html: string): string => {
  if (!html) return html;
  try {
    if (typeof window !== "undefined") {
      const container = document.createElement("div");
      container.innerHTML = html;
      const cleanse = (el: Element) => {
        const e = el as HTMLElement;
        if (e && e.style) {
          e.style.removeProperty("background");
          e.style.removeProperty("background-color");
        }
        Array.from(el.children).forEach(cleanse);
      };
      Array.from(container.children).forEach(cleanse);
      return container.innerHTML;
    }
  } catch {}
  return html
    .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
    .replace(/background\s*:\s*[^;"']+;?/gi, "");
};

const AboutUsMission: React.FC<AboutUsMissionProps> = ({ className = "" }) => {
  const [html, setHtml] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(
    "/images/aboutus/ourmission.png"
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const item =
          items.find((a) => (a.slug || "").toLowerCase() === "our-mission") ||
          items.find((a) => (a.name || "").toLowerCase() === "our mission");
        const cleaned = sanitizeCmsHtml(item?.content || "");
        setHtml(cleaned);
        if (item?.thumbnail?.url) setImageUrl(item.thumbnail.url);
      } else {
        setHtml("");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasHtml = useMemo(() => !!html && html.trim().length > 0, [html]);

  return (
    <section className={`${styles.mission} ${className}`}>
      <div className={styles.mission__container}>
        <div className={styles.mission__content}>
          {/* Left side - Image */}
          <div className={styles.mission__left}>
            <div className={styles.mission__imageWrapper}>
              <Image
                src={imageUrl}
                alt="Mission - Urban Learning Platform visualization"
                fill
                sizes="(max-width: 968px) 100vw, 560px"
                className={styles.mission__image}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://via.placeholder.com/560x370/054365/FFFFFF?text=Mission";
                }}
              />
            </div>
          </div>

          {/* Right side - Text Content */}
          <div className={styles.mission__right}>
            <div className={styles.mission__header}>
              {hasHtml && (
                <div
                  className={styles.mission__cms}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsMission;
