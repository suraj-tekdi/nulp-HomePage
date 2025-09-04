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
  // Use the data directly from getStaticProps - perfect for static hosting
  const pageContent = initialPageContent;
  const fullContent = initialFullContent;
  const menuItem = initialMenuItem;
  const loading = false;
  const isClient = true; // For static hosting, we can assume client-side rendering

  // Log the data we received from getStaticProps
  useEffect(() => {
    console.log("📋 [DEBUG] Component received from getStaticProps:", {
      slug,
      hasPageContent: !!pageContent,
      hasFullContent: !!fullContent,
      hasMenuItem: !!menuItem,
      pageTitle: fullContent?.page_title || menuItem?.title || slug,
    });
  }, [slug, pageContent, fullContent, menuItem]);

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

  console.log("🎨 [DEBUG] Render state:", {
    slug,
    loading,
    isClient,
    hasFullContent: !!fullContent,
    hasPageContent: !!pageContent,
    hasMenuItem: !!menuItem,
    pageTitle,
    fullContentType: fullContent ? "has-content" : "null",
    bannersCount: fullContent?.banners?.length || 0,
    articlesCount: fullContent?.articles?.length || 0,
  });

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
    <div style="margin-top: 2rem; padding: 1rem; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #007bff;">
      <p style="color: #0066cc; font-size: 0.9rem; margin: 0;">
        🔍 <strong>Debug Info:</strong><br>
        • Client-side: ${isClient ? "Active" : "Loading..."}<br>
        • Loading: ${loading ? "Yes" : "No"}<br>
        • Full Content: ${fullContent ? "Found" : "None"}<br>
        • Menu Item: ${menuItem ? menuItem.title : "None"}<br>
        • Slug: ${slug}
      </p>
    </div>
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
// Generate static props with real data for static hosting
export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;
  console.log("🏗️ [DEBUG] getStaticProps called for slug:", slug);

  if (!slug || typeof slug !== "string") {
    console.log("❌ [DEBUG] Invalid slug, returning 404");
    return {
      notFound: true,
    };
  }

  try {
    // Fetch menu items to validate the route
    const menusResponse = await menusApi.getHomepageMenus();
    let menuItem: HomepageMenuItem | null = null;

    if (menusResponse.success && menusResponse.data) {
      // Find the menu item that matches this slug
      menuItem =
        menusResponse.data.find((item) => {
          const link = item.link || "";
          const menuSlug = link.startsWith("/") ? link.slice(1) : link;
          return menuSlug === slug;
        }) || null;
    }

    console.log(
      "🔍 [DEBUG] Found menu item:",
      menuItem ? menuItem.title : "NOT FOUND"
    );

    // If no matching menu item found, return 404
    if (!menuItem) {
      console.log("❌ [DEBUG] No menu item found, returning 404");
      return {
        notFound: true,
      };
    }

    // Fetch content data
    let fullContent = null;

    try {
      // Try individual API calls
      const [bannersResponse, articlesResponse] = await Promise.all([
        contentApi.getBannersByMenu(slug),
        contentApi.getArticlesByMenu(slug),
      ]);

      console.log("📡 [DEBUG] API responses:", {
        bannersSuccess: bannersResponse.success,
        bannersCount: bannersResponse.data?.length || 0,
        articlesSuccess: articlesResponse.success,
        articlesCount: articlesResponse.data?.length || 0,
      });

      if (bannersResponse.success || articlesResponse.success) {
        fullContent = {
          page_title: menuItem.title || slug,
          menu_slug: slug,
          banners: bannersResponse.success ? bannersResponse.data || [] : [],
          articles: articlesResponse.success ? articlesResponse.data || [] : [],
        };
        console.log("✅ [DEBUG] Created full content with data");
      }
    } catch (contentError) {
      console.warn("⚠️ [DEBUG] Failed to fetch content:", contentError);
    }

    console.log("✅ [DEBUG] Returning props for slug:", slug);
    return {
      props: {
        slug,
        pageContent: null,
        fullContent,
        menuItem,
      },
    };
  } catch (error) {
    console.error("❌ [DEBUG] Error in getStaticProps:", error);

    return {
      notFound: true,
    };
  }
};
