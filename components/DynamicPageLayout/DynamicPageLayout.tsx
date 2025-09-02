import React from "react";
import Head from "next/head";
import { Header, Footer } from "../";
import styles from "./DynamicPageLayout.module.css";

interface DynamicPageLayoutProps {
  title: string;
  content: string;
  meta?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
  fullWidthSections?: React.ReactNode; // For sections that need to break out of container
  hideTitle?: boolean; // Hide the main title when using full-width sections
}

const DynamicPageLayout: React.FC<DynamicPageLayoutProps> = ({
  title,
  content,
  meta,
  loading = false,
  error,
  children,
  fullWidthSections,
  hideTitle = false,
}) => {
  const pageTitle = `${title} - NULP | National Urban Learning Platform`;
  const pageDescription =
    meta?.description ||
    `Learn more about ${title} on NULP - National Urban Learning Platform`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {meta?.keywords && <meta name="keywords" content={meta.keywords} />}
        {meta?.author && <meta name="author" content={meta.author} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>

      {/* Fixed Header */}
      <Header />

      {/* Full width sections (like banners) that break out of container */}
      {fullWidthSections}

      {/* Main Content Area */}
      <main className={fullWidthSections ? styles.mainHidden : styles.main}>
        <div
          className={
            fullWidthSections ? styles.containerHidden : styles.container
          }
        >
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading content...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <h1 className={styles.title}>Error Loading Content</h1>
              <p className={styles.errorMessage}>{error}</p>
              <button
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className={styles.content}>
              {!hideTitle && <h1 className={styles.title}>{title}</h1>}

              {/* Custom children if provided, otherwise use content */}
              {children ? (
                children
              ) : (
                <div
                  className={styles.dynamicContent}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Footer */}
      <Footer />
    </>
  );
};

export default DynamicPageLayout;
