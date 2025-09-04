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
  pageContent,
  fullContent,
  menuItem,
}) => {
  const [loading, setLoading] = useState(false);

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
      fallback: false, // Show 404 for non-existent pages
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

// Generate static props for each page at build time
export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;

  if (!slug || typeof slug !== "string") {
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
          // Check if link matches the slug (handle both /privacy and privacy)
          const normalizedLink = link.startsWith("/") ? link.slice(1) : link;
          return normalizedLink === slug || link === `/${slug}`;
        }) || null;
    }

    // If no matching menu item found, return 404
    if (!menuItem) {
      return {
        notFound: true,
      };
    }

    // Try to fetch content from middleware API using new format
    let pageContent: DynamicPageContent | null = null;
    let fullContent: DynamicPageFullContent | null = null;

    try {
      // First, try to get full content (banners + articles) using menu slug
      const fullContentResponse = await contentApi.getFullPageContent(slug);

      if (fullContentResponse.success && fullContentResponse.data) {
        fullContent = fullContentResponse.data;
      } else {
        // If no full content, try legacy approach for backward compatibility
        const contentResponse = await contentApi.getDynamicPageContent(slug);

        if (contentResponse.success && contentResponse.data) {
          pageContent = contentResponse.data;
        } else {
          // Create fallback content if no API content is available
          pageContent = {
            title: menuItem?.title || slug || "Page",
            content: `<div style="text-align: center; padding: 3rem 0;">
              <h2 style="color: #333; margin-bottom: 1rem;">Welcome to ${
                menuItem?.title || slug || "this page"
              }</h2>
              <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
                This page content will be loaded from the CMS API. 
                The content management system will provide the detailed information for this section.
              </p>
              <p style="color: #888; margin-top: 2rem; font-size: 0.9rem;">
                Route: /${slug} | API Status: Content not found
              </p>
            </div>`,
            slug: slug,
            meta: {
              description: `Learn more about ${
                menuItem?.title || slug || "this page"
              } on NULP - National Urban Learning Platform`,
            },
          };
        }
      }
    } catch (contentError) {
      console.warn(`Failed to fetch content for ${slug}:`, contentError);

      // Create error fallback content
      pageContent = {
        title: menuItem?.title || slug || "Page",
        content: `<div style="text-align: center; padding: 3rem 0;">
          <h2 style="color: #333; margin-bottom: 1rem;">${
            menuItem?.title || slug || "Page"
          }</h2>
          <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
            Content is temporarily unavailable. Please try again later.
          </p>
          <p style="color: #888; margin-top: 2rem; font-size: 0.9rem;">
            Route: /${slug} | Error: ${
          contentError instanceof Error ? contentError.message : "Unknown error"
        }
          </p>
        </div>`,
        slug: slug,
        meta: {
          description: `Learn more about ${
            menuItem?.title || slug || "this page"
          } on NULP`,
        },
      };
    }

    return {
      props: {
        slug,
        pageContent,
        fullContent,
        menuItem,
      },
    };
  } catch (error) {
    console.error("Error in getStaticProps for dynamic page:", error);

    return {
      notFound: true,
    };
  }
};
