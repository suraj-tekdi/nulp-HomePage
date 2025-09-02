import React, { useEffect, useMemo, useState } from "react";
import styles from "./AboutUsApproach.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services";

interface AboutUsApproachProps {
  className?: string;
}

const sanitizeCmsHtml = (html: string): string => {
  if (!html) return html;
  try {
    if (typeof window !== "undefined") {
      const container = document.createElement("div");
      container.innerHTML = html;
      // strip background styles
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

const AboutUsApproach: React.FC<AboutUsApproachProps> = ({
  className = "",
}) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const item =
          items.find((a) => (a.slug || "").toLowerCase() === "our-approach") ||
          items.find((a) => (a.name || "").toLowerCase() === "our approach");
        const cleaned = sanitizeCmsHtml(item?.content || "");
        setHtml(cleaned);
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
    <section className={`${styles.approach} ${className}`}>
      <div className={styles.approach__container}>
        <div className={styles.approach__grid}>
          <div className={styles.approach__left}>
            <div className={styles.approach__line}></div>
            <h2 className={styles.approach__heading}>
              Our <strong>Approach</strong>
            </h2>
          </div>
          <div className={styles.approach__right}>
            {hasHtml ? (
              <div
                className={styles.approach__list}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <ul className={styles.approach__list}>
                <li className={styles.approach__item}>
                  <span className={styles.approach__dot}></span>
                  Provide a digital platform to deliver learning, based on
                  user’s convenience.
                </li>
                <li className={styles.approach__item}>
                  <span className={styles.approach__dot}></span>
                  Built on tenets of peer learning where such users are not only
                  learners, but also creators of content sharing on-ground
                  experience, success stories and insights.
                </li>
                <li className={styles.approach__item}>
                  <span className={styles.approach__dot}></span>
                  Offer a marketplace to create partnerships to address learning
                  needs of the community.
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsApproach;
