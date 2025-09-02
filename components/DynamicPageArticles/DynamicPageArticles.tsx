import React from "react";
import Image from "next/image";
import styles from "./DynamicPageArticles.module.css";
import { DynamicPageArticle } from "../../services";

interface DynamicPageArticlesProps {
  articles: DynamicPageArticle[];
}

const DynamicPageArticles: React.FC<DynamicPageArticlesProps> = ({
  articles,
}) => {
  if (!articles || articles.length === 0) {
    return (
      <section className={styles.noArticles}>
        <div className={styles.noArticlesContent}>
          <h2>No Articles Available</h2>
          <p>
            Content for this section is being prepared. Please check back later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.articlesSection}>
      <div className={styles.articlesContainer}>
        {articles.map((article, index) => (
          <article key={article.id} className={styles.articleCard}>
            {article.image_url && (
              <div className={styles.articleImageWrapper}>
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className={styles.articleImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}

            <div className={styles.articleContent}>
              <h2 className={styles.articleTitle}>{article.title}</h2>

              {article.excerpt && (
                <div className={styles.articleExcerpt}>
                  <p>{article.excerpt}</p>
                </div>
              )}

              <div
                className={styles.articleBody}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {article.meta?.author && (
                <div className={styles.articleMeta}>
                  <span className={styles.authorInfo}>
                    By {article.meta.author}
                  </span>
                  {article.publishedAt && (
                    <span className={styles.publishDate}>
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Separator line between articles (except for last one) */}
            {index < articles.length - 1 && (
              <div className={styles.articleSeparator} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default DynamicPageArticles;
