import React, { useEffect, useState } from "react";
import styles from "./AboutUsPartner.module.css";
import { articlesApi, type HomepageArticleItem } from "../../services/articles";

interface AboutUsPartnerProps {
  className?: string;
}

const parseArticleCards = (html: string): [string, string] | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const root = doc.body.firstElementChild as HTMLElement | null;
    if (!root) return null;
    const candidates = root.querySelectorAll(":scope > div");
    if (candidates.length >= 2) {
      const left = (candidates[0] as HTMLElement).innerHTML || "";
      const right = (candidates[1] as HTMLElement).innerHTML || "";
      return [left, right];
    }
    const children = Array.from(doc.body.children) as HTMLElement[];
    if (children.length >= 2) {
      return [children[0].innerHTML || "", children[1].innerHTML || ""];
    }
    return null;
  } catch {
    return null;
  }
};

const isWithinPublishWindow = (
  start?: string | null,
  end?: string | null
): boolean => {
  const now = new Date();
  const startOk = !start || new Date(start) <= now;
  const endOk = !end || now <= new Date(end);
  return startOk && endOk;
};

const isArticleVisible = (a: HomepageArticleItem | null): boolean => {
  if (!a) return false;
  const stateOk = (a.state || "").toLowerCase() === "published";
  return (
    stateOk &&
    isWithinPublishWindow(
      a.start_publish_date as any,
      a.end_publish_date as any
    )
  );
};

const AboutUsPartner: React.FC<AboutUsPartnerProps> = ({ className = "" }) => {
  const [article, setArticle] = useState<HomepageArticleItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cards, setCards] = useState<[string, string] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      const res = await articlesApi.getAboutUsArticles();
      if (mounted && res.success && Array.isArray(res.data)) {
        const found =
          articlesApi.findArticleBySlug(res.data, "partner-with-us") || null;
        if (isArticleVisible(found || null)) {
          setArticle(found);
          if (found?.content) {
            const parsed = parseArticleCards(found.content);
            if (parsed) setCards(parsed);
          }
        } else {
          setArticle(null);
        }
      }
      setIsLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const renderDynamicContent = () => {
    if (cards) {
      return (
        <div className={styles.partner__cards}>
          <div
            className={styles.partner__card}
            dangerouslySetInnerHTML={{ __html: cards[0] }}
          />
          <div
            className={styles.partner__card}
            dangerouslySetInnerHTML={{ __html: cards[1] }}
          />
        </div>
      );
    }
    if (!article?.content) return null;
    return (
      <div
        className={styles.partner__cards}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    );
  };

  if (isLoading) return null;
  if (!isArticleVisible(article)) return null;

  const content = renderDynamicContent();
  if (!content) return null;

  const heading = (article?.name || article?.category?.name || "").trim();

  return (
    <section className={`${styles.partner} ${className}`}>
      <div className={styles.partner__container}>
        {heading ? <h2 className={styles.partner__title}>{heading}</h2> : null}
        {content}
      </div>
    </section>
  );
};

export default AboutUsPartner;
