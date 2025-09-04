import React, { useState, useEffect } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import {
  DynamicPageLayout,
  DynamicPageBanner,
  DynamicPageArticles,
} from "../components";
import {
  menusApi,
  type HomepageMenuItem,
  contentApi,
  type DynamicPageContent,
  type DynamicPageFullContent,
} from "../services";

interface DynamicPageProps {
  slug: string;
  pageContent: DynamicPageContent | null;
  fullContent: DynamicPageFullContent | null;
  menuItem: HomepageMenuItem | null;
}

const DynamicPage: React.FC<DynamicPageProps> = ({
  slug,
  pageContent: initialPageContent,
  fullContent: initialFullContent,
  menuItem: initialMenuItem,
}) => {
  // Client-side state for dynamic data fetching
  const [pageContent, setPageContent] = useState(initialPageContent);
  const [fullContent, setFullContent] = useState(initialFullContent);
  const [menuItem, setMenuItem] = useState(initialMenuItem);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Enable client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch fresh data from CMS on client-side
  useEffect(() => {
    if (!isClient || !slug) return;

    const fetchFreshData = async () => {
      setLoading(true);
      try {
        // Fetch menu data to get the current menu item
        const menusResponse = await menusApi.getHomepageMenus();
        let currentMenuItem = null;

        if (menusResponse.success && menusResponse.data) {
          currentMenuItem = menusResponse.data.find((item) => {
            const link = item.link || "";
            const menuSlug = link.startsWith("/") ? link.slice(1) : link;
            return menuSlug === slug;
          });
          setMenuItem(currentMenuItem || null);
        }

        // Fetch content data
        const fullContentResponse = await contentApi.getFullPageContent(slug);
        if (fullContentResponse.success && fullContentResponse.data) {
          setFullContent(fullContentResponse.data);
        } else {
          // If no full content, try individual API calls
          const [bannersResponse, articlesResponse] = await Promise.all([
            contentApi.getBannersByMenu(slug),
            contentApi.getArticlesByMenu(slug),
          ]);

          if (bannersResponse.success || articlesResponse.success) {
            const combinedContent = {
              page_title: currentMenuItem?.title || slug,
              menu_slug: slug,
              banners: bannersResponse.success
                ? bannersResponse.data || []
                : [],
              articles: articlesResponse.success
                ? articlesResponse.data || []
                : [],
            };
            setFullContent(combinedContent);
          }
        }
      } catch (error) {
        console.error("Error fetching fresh data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have initial data or after a delay to check for updates
    if (!initialFullContent || !initialMenuItem) {
      fetchFreshData();
    } else {
      // Check for updates after initial load
      const timer = setTimeout(fetchFreshData, 1000);
      return () => clearTimeout(timer);
    }
  }, [slug, isClient, initialFullContent, initialMenuItem]);

  // Determine page title and meta information
  const pageTitle =
    fullContent?.page_title ||
    fullContent?.articles[0]?.title ||
    fullContent?.banners[0]?.title ||
    menuItem?.title ||
    slug ||
    "Page";

  const pageDescription =
    fullContent?.articles[0]?.meta?.description ||
    fullContent?.banners[0]?.description ||
    pageContent?.meta?.description ||
    `Learn more about ${pageTitle} on NULP - National Urban Learning Platform`;

  // Show loading state when fetching fresh data
  if (loading && !fullContent && !pageContent) {
    return (
      <DynamicPageLayout
        title="Loading..."
        content={`<div style="text-align: center; padding: 3rem 0;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="color: #666; margin-top: 1rem;">Loading page content...</p>
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </div>`}
        meta={{ description: `Loading ${slug} page` }}
      />
    );
  }

  // If we have full content (banners + articles), use the new layout
  if (fullContent) {
    const { banners, articles } = fullContent;

    return (
      <DynamicPageLayout
        title={pageTitle}
        content="" // We'll use children instead
        meta={{
          description: pageDescription,
          keywords: fullContent.articles[0]?.meta?.keywords,
          author: fullContent.articles[0]?.meta?.author,
        }}
        loading={loading}
        hideTitle={true} // Hide the main title since we have banner/article titles
        fullWidthSections={
          <>
            {loading && (
              <div
                style={{
                  position: "fixed",
                  top: "70px",
                  right: "20px",
                  background: "#007bff",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  zIndex: 1000,
                  opacity: 0.9,
                }}
              >
                🔄 Checking for updates...
              </div>
            )}

            {/* Show banners at top if they exist - full width */}
            {banners && banners.length > 0 && (
              <DynamicPageBanner banners={banners} />
            )}

            {/* Show articles with wider layout */}
            <DynamicPageArticles articles={articles} />
          </>
        }
      >
        {/* Empty children since we're using fullWidthSections */}
      </DynamicPageLayout>
    );
  }

  // Fallback to legacy content display
  const content =
    pageContent?.content ||
    `<div style="text-align: center; padding: 2rem 0;">
    <p style="color: #666; font-size: 1.1rem; margin-bottom: 1rem;">
      Content for this page is being prepared. Please check back later.
    </p>
    <p style="color: #888; font-size: 0.9rem;">
      Page: ${pageTitle}${slug ? ` (${slug})` : ""}
    </p>
  </div>`;

  return (
    <DynamicPageLayout
      title={pageTitle}
      content={content}
      meta={pageContent?.meta}
      loading={loading}
    />
  );
};

export default DynamicPage;

// Generate static paths for all menu items at build time
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Fetch all menu items to generate paths
    const menusResponse = await menusApi.getHomepageMenus();
    const paths: { params: { slug: string } }[] = [];

    if (menusResponse.success && menusResponse.data) {
      menusResponse.data.forEach((item) => {
        const link = item.link || "";
        // Convert link to slug (handle both /privacy and privacy)
        const slug = link.startsWith("/") ? link.slice(1) : link;
        if (slug) {
          paths.push({ params: { slug } });
        }
      });
    }

    return {
      paths,
      fallback: "blocking", // Allow new pages to be generated dynamically
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: "blocking",
    };
  }
};

// Generate static props for each page at build time
// Generate minimal static props - real data will be fetched client-side
export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;

  if (!slug || typeof slug !== "string") {
    return {
      notFound: true,
    };
  }

  // Return minimal props - client-side will fetch fresh data from CMS APIs
  // This allows the static site to work with dynamic content updates
  return {
    props: {
      slug,
      pageContent: null,
      fullContent: null,
      menuItem: null,
    },
  };
};
