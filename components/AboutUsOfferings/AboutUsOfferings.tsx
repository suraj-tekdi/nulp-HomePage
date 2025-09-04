import React, { useEffect, useMemo, useState } from "react";
import styles from "./AboutUsOfferings.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services";

interface AboutUsOfferingsProps {
  className?: string;
}

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
          e.style.removeProperty("margin");
          e.style.removeProperty("padding");
          e.style.removeProperty("gap");
          e.style.removeProperty("justify-content");
          e.style.removeProperty("align-items");
          e.style.removeProperty("text-align");
          e.style.removeProperty("display");
          e.style.removeProperty("max-width");
          e.style.removeProperty("width");
          e.style.removeProperty("height");
        }
        Array.from(el.children).forEach(cleanse);
      };
      Array.from(container.children).forEach(cleanse);
      // If CMS provided a single wrapper div, unwrap its children so grid can apply directly
      if (
        container.children.length === 1 &&
        container.firstElementChild?.tagName === "DIV"
      ) {
        const first = container.firstElementChild as HTMLElement;
        container.innerHTML = first.innerHTML;
      }
      return container.innerHTML;
    }
  } catch {}
  return html
    .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
    .replace(/background\s*:\s*[^;"']+;?/gi, "")
    .replace(/display\s*:\s*[^;"']+;?/gi, "")
    .replace(/margin\s*:\s*[^;"']+;?/gi, "")
    .replace(/gap\s*:\s*[^;"']+;?/gi, "");
};

const AboutUsOfferings: React.FC<AboutUsOfferingsProps> = ({
  className = "",
}) => {
  const [html, setHtml] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await articlesApi.getAboutUsArticles();
      if (!isMounted) return;
      if (res.success && Array.isArray(res.data)) {
        const items = res.data as HomepageArticleItem[];
        const item =
          items.find((a) => (a.slug || "").toLowerCase() === "our-offerings") ||
          items.find((a) => (a.name || "").toLowerCase() === "our offerings");
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

  if (!hasHtml) return null; // strictly API-driven; render nothing if empty

  return (
    <section className={`${styles.offerings} ${className}`}>
      <div className={styles.offerings__container}>
        {title ? (
          <div className={styles.offerings__header}>
            <h2 className={styles.offerings__title}>{title}</h2>
          </div>
        ) : null}
        <div
          className={styles.offerings__cms}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
};

export default AboutUsOfferings;
