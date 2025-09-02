// AboutUsWhy.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AboutUsWhy.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services";

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
          e.style.removeProperty("text-align");
          e.style.removeProperty("margin");
          e.style.removeProperty("padding");
        }
        Array.from(el.children).forEach(cleanse);
      };
      Array.from(container.children).forEach(cleanse);
      return container.innerHTML;
    }
  } catch {}
  return html
    .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
    .replace(/background\s*:\s*[^;"']+;?/gi, "")
    .replace(/text-align\s*:\s*[^;"']+;?/gi, "")
    .replace(/margin\s*:\s*[^;"']+;?/gi, "")
    .replace(/padding\s*:\s*[^;"']+;?/gi, "");
};

const AboutUsWhy: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true); // default open
  const [html, setHtml] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [contentHeight, setContentHeight] = useState<number>(0);
  const innerContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const item =
          items.find(
            (a) => (a.slug || "").toLowerCase() === "why-does-nulp-exist"
          ) ||
          items.find(
            (a) => (a.name || "").toLowerCase() === "why does nulp exist?"
          );
        const cleaned = sanitizeCmsHtml(item?.content || "");
        setHtml(cleaned);
        setTitle(item?.name || "");
      } else {
        setHtml("");
        setTitle("");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasHtml = useMemo(() => !!html && html.trim().length > 0, [html]);

  // Measure content height to prevent cropping on any viewport
  useEffect(() => {
    const measure = () => {
      if (innerContentRef.current) {
        setContentHeight(innerContentRef.current.scrollHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [html, isExpanded]);

  if (!hasHtml || !title) return null; // strictly CMS-driven

  return (
    <section className={styles.why}>
      {/* Gold divider line */}
      <div className={styles.why__divider} />

      {/* Accordion container */}
      <div
        className={`${styles.why__content} ${
          isExpanded ? styles.expanded : ""
        }`}
      >
        <button
          className={styles.why__trigger}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="why-expanded"
        >
          <h2 className={styles.why__title}>{title}</h2>
          <div className={styles.why__arrow}>
            <span>{isExpanded ? "↑" : "↓"}</span>
          </div>
        </button>
      </div>

      <div
        id="why-expanded"
        className={`${styles.why__expanded} ${isExpanded ? styles.show : ""}`}
        style={{ maxHeight: isExpanded ? contentHeight : 0 }}
      >
        <div className={styles.why__expanded__content} ref={innerContentRef}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </section>
  );
};

export default AboutUsWhy;
