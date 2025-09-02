import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./AboutUsVision.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services";

interface AboutUsVisionProps {
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

const AboutUsVision: React.FC<AboutUsVisionProps> = ({ className = "" }) => {
  const [html, setHtml] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(
    "/images/aboutus/ourvision.png"
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const item =
          items.find((a) => (a.slug || "").toLowerCase() === "our-vision") ||
          items.find((a) => (a.name || "").toLowerCase() === "our vision");
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
    <section className={`${styles.vision} ${className}`}>
      <div className={styles.vision__container}>
        <div className={styles.vision__content}>
          {/* Left side - Text Content */}
          <div className={styles.vision__left}>
            <div className={styles.vision__header}>
              {hasHtml ? (
                <div
                  className={styles.vision__cms}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <h2 className={styles.vision__title}>
                  <span className={styles.vision__accent}>Our</span> Vision
                </h2>
              )}
            </div>
            {!hasHtml ? (
              <div className={styles.vision__text}>
                <p>
                  To be the largest community of {""}
                  <strong>Urban Practitioners</strong> learning from each other.
                </p>
              </div>
            ) : null}
          </div>

          {/* Right side - Image */}
          <div className={styles.vision__right}>
            <div className={styles.vision__imageWrapper}>
              <Image
                src={imageUrl}
                alt="Our Vision - Team collaboration workspace"
                fill
                sizes="(max-width: 968px) 100vw, 600px"
                className={styles.vision__image}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsVision;
