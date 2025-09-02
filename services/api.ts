// API Base Configuration

// Dynamic NULP URL function
export const getNulpBaseUrl = (): string => {
  // Always check environment variable first (works in both client and server)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're in development environment
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.includes("dev")
    ) {
      return "https://devnulp.niua.org";
    }
    return "https://nulp.niua.org";
  }

  // Server-side fallback based on environment
  if (process.env.NODE_ENV === "development") {
    return "https://devnulp.niua.org";
  }

  return "https://nulp.niua.org";
};
const baseUrl = getNulpBaseUrl();

// Export function to get dynamic URLs
export const getDynamicNulpUrls = () => {
  return {
    base: baseUrl,
    domainList: `${baseUrl}/webapp/domainList`,
    search: (query: string) =>
      `${baseUrl}/webapp?query=${encodeURIComponent(query)}`,
  };
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// NULP Course Types
export interface NulpCourse {
  identifier: string;
  name: string;
  appIcon?: string;
  se_boards: string[];
  se_gradeLevels?: string[];
  se_subjects: string[];
  organisation: string[];
  orgDetails: {
    orgName: string;
    email?: string;
  };
  primaryCategory: string;
  contentType: string;
  resourceType: string;
  trackable: {
    enabled: string;
    autoBatch: string;
  };
}

// NULP Good Practice Types
export interface NulpGoodPractice {
  identifier: string;
  name: string;
  appIcon?: string;
  se_boards?: string[];
  se_gradeLevels?: string[];
  se_subjects?: string[];
  se_mediums?: string[];
  organisation: string[];
  orgDetails: {
    orgName: string;
    email?: string | null;
  };
  primaryCategory: string;
  contentType: string;
  resourceType?: string;
  mimeType: string;
  trackable: {
    enabled: string;
    autoBatch: string;
  };
  board?: string;
  subject?: string[];
  medium?: string[];
  gradeLevel?: string[];
  pkgVersion: number;
  channel: string;
  objectType: string;
}

export interface NulpApiResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: any;
    errmsg: any;
  };
  responseCode: string;
  result: {
    count: number;
    content: NulpCourse[];
    facets: any[];
  };
}

export interface NulpGoodPracticesApiResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
    err: any;
    errmsg: any;
  };
  responseCode: string;
  result: {
    count: number;
    content: NulpGoodPractice[];
    facets: any[];
  };
}

// Search Related Types
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "course" | "discussion" | "practice";
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || "An error occurred",
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}

// Search API Services
export const searchApi = {
  // Log search query (optional analytics)
  logSearch: async (query: string): Promise<ApiResponse> => {
    return apiRequest("/api/search/log", {
      method: "POST",
      body: JSON.stringify({
        query,
        timestamp: new Date().toISOString(),
        source: "header_search",
      }),
    });
  },

  // Get search suggestions (optional)
  getSuggestions: async (query: string): Promise<ApiResponse<string[]>> => {
    return apiRequest(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  },

  // Perform search and redirect to NULP webapp
  performSearch: async (query: string): Promise<string> => {
    try {
      // Optional: Log the search query for analytics
      await searchApi.logSearch(query);
    } catch (error) {
      // Don't block the search if logging fails
    }

    // Generate the search URL dynamically
    const urls = getDynamicNulpUrls();
    return urls.search(query);
  },

  // Redirect to search results in new tab
  redirectToSearch: async (query: string): Promise<void> => {
    const searchUrl = await searchApi.performSearch(query);
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  },

  // Redirect to search results in same tab
  redirectToSearchSameTab: async (query: string): Promise<void> => {
    const searchUrl = await searchApi.performSearch(query);
    window.location.href = searchUrl;
  },
};

// Other API services can be added here
export const courseApi = {
  // Get courses from NULP API
  getNulpCourses: async (
    selectedDomain?: string
  ): Promise<ApiResponse<NulpCourse[]>> => {
    try {
      // Create filters based on selected domain
      const filters: any = {
        status: ["Live"],
        visibility: ["Default", "Parent"],
        identifier: [
          "do_11422330454242099211",
          "do_11420352388390912013",
          "do_1136550052517314561308",
          "do_1141747139141468161258",
          "do_1136598919702609921643",
          "do_1139974386277580801378",
          "do_1140067897586974721570",
          "do_1139973490818334721328",
          "do_114165835604836352120",
          "do_114284738848514048123",
        ],
      };

      // Add domain filter if a domain is selected
      if (selectedDomain) {
        filters.se_boards = [selectedDomain];
      } else {
        filters.se_boards = [null];
      }

      const requestBody = {
        request: {
          filters,
          limit: 100,
          sort_by: { createdOn: "desc" },
          fields: [
            "name",
            "appIcon",
            "mimeType",
            "gradeLevel",
            "identifier",
            "medium",
            "pkgVersion",
            "board",
            "subject",
            "resourceType",
            "primaryCategory",
            "contentType",
            "channel",
            "organisation",
            "trackable",
            "primaryCategory",
            "se_boards",
            "se_gradeLevels",
            "se_subjects",
            "se_mediums",
          ],
          facets: [
            "se_boards",
            "se_gradeLevels",
            "se_subjects",
            "se_mediums",
            "primaryCategory",
          ],
          offset: 0,
        },
      };

      const urls = getDynamicNulpUrls();
      const baseUrl = urls.base;

      const response = await fetch(
        `${baseUrl}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            Connection: "keep-alive",
            "Content-Type": "application/json",
            Origin: baseUrl,
            Referer: `${baseUrl}/webapp/domainList`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NulpApiResponse = await response.json();

      if (data.responseCode === "OK" && data.result?.content) {
        return {
          success: true,
          data: data.result.content,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: "Invalid response from NULP API",
          status: response.status,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch courses",
        status: 0,
      };
    }
  },

  // Get good practices from NULP API
  getNulpGoodPractices: async (
    selectedDomain?: string
  ): Promise<ApiResponse<NulpGoodPractice[]>> => {
    try {
      // Create filters based on selected domain
      const filters: any = {
        status: ["Live"],
        primaryCategory: ["Good Practices", "Reports", "Manual/SOPs"],
        visibility: ["Default", "Parent"],
      };

      // Add domain filter if a domain is selected
      if (selectedDomain) {
        filters.se_boards = [selectedDomain];
      } else {
        filters.se_boards = [null];
      }

      const requestBody = {
        request: {
          filters,
          limit: 20,
          sort_by: { createdOn: "desc" },
          fields: [
            "name",
            "appIcon",
            "mimeType",
            "gradeLevel",
            "identifier",
            "medium",
            "pkgVersion",
            "board",
            "subject",
            "resourceType",
            "primaryCategory",
            "contentType",
            "channel",
            "organisation",
            "trackable",
            "primaryCategory",
            "se_boards",
            "se_gradeLevels",
            "se_subjects",
            "se_mediums",
            "primaryCategory",
          ],
          facets: [
            "se_boards",
            "se_gradeLevels",
            "se_subjects",
            "se_mediums",
            "primaryCategory",
          ],
          offset: 0,
          query: "",
        },
      };

      const urls = getDynamicNulpUrls();
      const baseUrl = urls.base;

      const response = await fetch(
        `${baseUrl}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            Connection: "keep-alive",
            "Content-Type": "application/json",
            Origin: baseUrl,
            Referer: `${baseUrl}/webapp/domainList`,
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            "sec-ch-ua":
              '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Linux"',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NulpGoodPracticesApiResponse = await response.json();

      if (data.responseCode === "OK" && data.result?.content) {
        return {
          success: true,
          data: data.result.content,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: "Invalid response from NULP API",
          status: response.status,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch good practices",
        status: 0,
      };
    }
  },

  // Legacy function for future use
  getTrendingCourses: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest("/api/courses/trending");
  },
};

// Discussion Forum API Types
export interface DiscussionUser {
  uid: number;
  username: string;
  fullname: string;
  displayname: string;
  designation?: string;
  location?: string;
  user_id: string;
}

export interface DiscussionCategory {
  cid: number;
  name: string;
  slug: string;
  bgColor: string;
  color: string;
}

export interface DiscussionTopic {
  anonymous?: boolean;
  isQuestion: number;
  isSolved: number;
  cid: number;
  lastposttime: number;
  mainPid: number;
  postcount: number;
  slug: string;
  tid: number;
  timestamp: number;
  title: string;
  titleRaw: string;
  uid: number;
  viewcount: number;
  postercount: number;
  upvotes: number;
  downvotes: number;
  votes: number;
  category: DiscussionCategory;
  user: DiscussionUser;
  content: string;
  contentRaw: string;
  index: number;
}

export interface DiscussionForumApiResponse {
  nextStart: number;
  topicCount: number;
  topics: DiscussionTopic[];
}

// Domain-based discussion types
export interface DomainDiscussionPost {
  pid: number;
  tid: number;
  content: string;
  uid: number;
  timestamp: number;
  deleted: boolean;
  upvotes: number;
  downvotes: number;
  replies: number;
  votes: number;
  timestampISO: string;
  user: DiscussionUser;
  topic: {
    uid: number;
    tid: number;
    title: string;
    cid: number;
    tags: any[];
    slug: string;
    deleted: number;
    scheduled: boolean;
    postcount: number;
    mainPid: number;
    teaserPid: number;
    timestamp: number;
    titleRaw: string;
    timestampISO: string;
    isQuestion: number;
    isSolved: number;
  };
  category: DiscussionCategory;
  isMainPost: boolean;
}

export interface DomainDiscussionsApiResponse {
  ts: string;
  params: {
    resmsgid: string;
    msgid: string;
    status: string;
  };
  responseCode: string;
  result: {
    domainName: string;
    totalPosts: number;
    posts: DomainDiscussionPost[];
  };
}

// Transform function to convert API response to local Discussion interface
export function transformDiscussionTopic(topic: DiscussionTopic): {
  id: number;
  title: string;
  description: string;
  category: string;
  replies: number;
  views: number;
  isSolved: boolean;
  author: string;
  designation?: string;
  location?: string;
  slug: string;
} {
  return {
    id: topic.tid,
    title: topic.titleRaw || topic.title,
    description:
      topic.content || topic.contentRaw || "No description available",
    category: topic.category.name,
    replies: topic.postcount - 1, // Subtract 1 as postcount includes the original post
    views: topic.viewcount,
    isSolved: topic.isSolved === 1,
    author: topic.user.fullname || topic.user.displayname,
    designation: topic.user.designation,
    location: topic.user.location,
    slug: topic.slug,
  };
}

// Transform function for domain-based discussions
export function transformDomainDiscussionPost(post: DomainDiscussionPost): {
  id: number;
  title: string;
  description: string;
  category: string;
  replies: number;
  views: number;
  isSolved: boolean;
  author: string;
  designation?: string;
  location?: string;
  slug: string;
} {
  // Clean HTML tags from content to get plain text description
  const cleanDescription = (htmlContent: string): string => {
    if (!htmlContent) return "No description available";
    // Remove HTML tags and decode entities
    return (
      htmlContent
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&[^;]+;/g, " ") // Replace HTML entities with spaces
        .trim() || "No description available"
    );
  };

  return {
    id: post.topic.tid,
    title: post.topic.titleRaw || post.topic.title,
    description: cleanDescription(post.content),
    category: post.category.name,
    replies: Math.max(0, (post.topic.postcount || 1) - 1), // Subtract 1 as postcount includes the original post
    views: 0, // View count not available in domain API response
    isSolved: post.topic.isSolved === 1,
    author: post.user.fullname || post.user.displayname || post.user.username,
    designation: post.user.designation,
    location: post.user.location,
    slug: post.topic.slug,
  };
}

// Updated discussionApi with the new function
export const discussionApi = {
  // Get popular discussions directly from external API (hardcoded)
  getPopularDiscussions: async (): Promise<ApiResponse<DiscussionTopic[]>> => {
    try {
      const response = await fetch(`${baseUrl}/discussion-forum/api/popular`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data", data);

      // Format response from external API
      if (data.topics && Array.isArray(data.topics)) {
        return {
          success: true,
          data: data.topics.slice(0, 20), // Limit to 20 discussions
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: "Invalid response format from discussion forum API",
          status: response.status,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch discussions",
        status: 0,
      };
    }
  },

  // Get discussions by domain from NULP forum API via Next.js API route
  getDiscussionsByDomain: async (
    domainName: string
  ): Promise<ApiResponse<DomainDiscussionPost[]>> => {
    try {
      const encodedDomain = encodeURIComponent(domainName);
      const response = await fetch(
        `${baseUrl}/discussion/api/posts/by-domain?domainName=${encodedDomain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle the actual API response structure
      if (data.responseCode === "OK" && data.result?.posts) {
        // Filter to get only main posts (unique topics) and limit to recent ones
        const mainPosts = data.result.posts
          .filter((post: DomainDiscussionPost) => post.isMainPost === true)
          .slice(0, 20); // Limit to 20 topics

        return {
          success: true,
          data: mainPosts,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: "Invalid response format from discussion forum API",
          status: response.status,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch discussions by domain",
        status: 0,
      };
    }
  },

  // Future: Get trending discussions (legacy)
  getTrendingDiscussions: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest("/api/discussions/trending");
  },
};

export const userApi = {
  // Future: User authentication
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse> => {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Future: User registration
  register: async (userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse> => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
};

export interface HomepagePartnerLogoFormatThumb {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
}

export interface HomepagePartnerLogo {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: { thumbnail?: HomepagePartnerLogoFormatThumb };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string; // path like /uploads/xxx.png
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepagePartnerCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepagePartnerItem {
  id: number;
  documentId: string;
  name: string;
  link: string;
  slug: string;
  state: string;
  is_active: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  logo: HomepagePartnerLogo;
  category: HomepagePartnerCategory;
}

export interface HomepagePartnersResponseMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  responseTime: number;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface HomepagePartnersResponse {
  success: boolean;
  data: HomepagePartnerItem[];
  meta: HomepagePartnersResponseMeta;
}

export const partnersApi = {
  getHomepagePartners: async (): Promise<
    ApiResponse<HomepagePartnerItem[]>
  > => {
    try {
      const response = await fetch(
        `${baseUrl}/mw-cms/api/v1/homepage/partners`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HomepagePartnersResponse = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return { success: true, data: data.data, status: response.status };
      }
      return {
        success: false,
        error: "Invalid partners API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch partners",
        status: 0,
      };
    }
  },
  buildLogoUrl: (pathOrUrl?: string): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://"))
      return pathOrUrl;
    const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${baseUrl}${normalized}`;
  },
};

// Testimonials types and API
export interface HomepageTestimonialThumbnailFormats {
  small?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
  thumbnail?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
}

export interface HomepageTestimonialThumbnail {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: HomepageTestimonialThumbnailFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepageTestimonialItem {
  id: number;
  documentId: string;
  user_name: string;
  user_details: string;
  testimonial: string; // HTML content
  state: string;
  start_publish_date: string | null;
  end_publish_date: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  category: {
    id: number;
    documentId: string;
    slug: string;
    name: string;
    description: string | null;
    state: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
  thumbnail?: HomepageTestimonialThumbnail;
}

export interface HomepageTestimonialsResponseMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  responseTime: number;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface HomepageTestimonialsResponse {
  success: boolean;
  data: HomepageTestimonialItem[];
  meta: HomepageTestimonialsResponseMeta;
}

export const testimonialsApi = {
  getHomepageTestimonials: async (): Promise<
    ApiResponse<HomepageTestimonialItem[]>
  > => {
    try {
      const response = await fetch(
        `${baseUrl}/mw-cms/api/v1/homepage/testimonials`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HomepageTestimonialsResponse = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return { success: true, data: data.data, status: response.status };
      }
      return {
        success: false,
        error: "Invalid testimonials API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch testimonials",
        status: 0,
      };
    }
  },
  buildImageUrl: (pathOrUrl?: string): string => {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://"))
      return pathOrUrl;
    const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${baseUrl}${normalized}`;
  },
};

// Homepage Stacks types and API
export interface HomepageStackCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepageStackItem {
  id: number;
  documentId: string;
  title: string;
  order: number;
  mode: string; // "Custom" | "Dynamic"
  enter_count: number;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  dynamic_content: string | null;
  category: HomepageStackCategory;
}

export interface HomepageStacksResponseMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  responseTime: number;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface HomepageStacksResponse {
  success: boolean;
  data: HomepageStackItem[];
  meta: HomepageStacksResponseMeta;
}

export const stacksApi = {
  getHomepageStacks: async (): Promise<ApiResponse<HomepageStackItem[]>> => {
    try {
      const response = await fetch(`${baseUrl}/mw-cms/api/v1/homepage/stacks`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const raw: any = await response.json();

      // Normalize possible shapes:
      // 1) { success: true, data: [] }
      // 2) { success: true, data: { data: [] } }
      // 3) Direct array (edge-case)
      const maybeArray = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : Array.isArray(raw)
        ? raw
        : null;

      if (raw?.success === true && Array.isArray(maybeArray)) {
        return {
          success: true,
          data: maybeArray as HomepageStackItem[],
          status: response.status,
        };
      }

      return {
        success: false,
        error: "Invalid stacks API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch stacks",
        status: 0,
      };
    }
  },
};

export interface HomepageContactCategory {
  id: number;
  documentId: string;
  slug: string;
  name: string;
  description: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Dynamic Page Content Types
export interface DynamicPageContent {
  title: string;
  content: string;
  slug: string;
  meta?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  publishedAt?: string;
  updatedAt?: string;
}

// Banner Types
export interface DynamicPageBanner {
  id: number;
  title: string;
  image_url?: string;
  description?: string;
  display_order: number;
  state: string;
  menu_slug: string;
  createdAt: string;
  updatedAt: string;
}

// Article Types
export interface DynamicPageArticle {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  display_order: number;
  state: string;
  menu_slug: string;
  meta?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Combined content response
export interface DynamicPageFullContent {
  banners: DynamicPageBanner[];
  articles: DynamicPageArticle[];
  menu_slug: string;
  page_title?: string;
}

export interface DynamicPageApiResponse {
  success: boolean;
  data?: DynamicPageContent;
  error?: string;
  status?: number;
}

// Dynamic Content API
export const contentApi = {
  // Get banners for a specific menu slug
  getBannersByMenu: async (
    menuSlug: string
  ): Promise<ApiResponse<DynamicPageBanner[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(
        `${base}/mw-cms/api/v1/homepage/banners?menu=${menuSlug}&state=Published`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [], // No banners found is not an error
            status: response.status,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const raw: any = await response.json();

      // Handle different possible response formats and transform CMS data
      let rawBanners: any[] = [];

      if (raw?.success && Array.isArray(raw?.data)) {
        rawBanners = raw.data;
      } else if (Array.isArray(raw?.data)) {
        rawBanners = raw.data;
      } else if (Array.isArray(raw)) {
        rawBanners = raw;
      }

      // Transform CMS banner data to DynamicPageBanner interface
      const bannersData: DynamicPageBanner[] = rawBanners.map(
        (banner: any) => ({
          id: banner.id || 0,
          title: banner.name || banner.title || "",
          description: banner.content || banner.description || "",
          image_url:
            banner.background_image?.url ||
            banner.background_image?.formats?.large?.url ||
            banner.image_url ||
            "",
          display_order: banner.display_order || 0,
          state: banner.state || "Published",
          menu_slug: menuSlug,
          createdAt: banner.createdAt || new Date().toISOString(),
          updatedAt: banner.updatedAt || new Date().toISOString(),
        })
      );

      // Sort by display_order
      bannersData.sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );

      return {
        success: true,
        data: bannersData,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch banners",
        status: 0,
      };
    }
  },

  // Get articles for a specific menu slug
  getArticlesByMenu: async (
    menuSlug: string
  ): Promise<ApiResponse<DynamicPageArticle[]>> => {
    try {
      const { base } = getDynamicNulpUrls();
      const response = await fetch(
        `${base}/mw-cms/api/v1/homepage/articles?menu=${menuSlug}&state=Published`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: [], // No articles found is not an error
            status: response.status,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const raw: any = await response.json();

      // Handle different possible response formats and transform CMS data
      let rawArticles: any[] = [];

      if (raw?.success && Array.isArray(raw?.data)) {
        rawArticles = raw.data;
      } else if (Array.isArray(raw?.data)) {
        rawArticles = raw.data;
      } else if (Array.isArray(raw)) {
        rawArticles = raw;
      }

      // Transform CMS articles to our interface format
      const articlesData: DynamicPageArticle[] = rawArticles.map(
        (article: any) => ({
          id: article.id || 0,
          title: article.title || article.name || "Untitled Article",
          content: article.content || article.description || "",
          excerpt: article.excerpt || article.summary || "",
          image_url: article.image_url || article.featured_image?.url || "",
          display_order: article.display_order || article.order || 0,
          state: article.state || "Published",
          menu_slug: article.menu_slug || article.menu || "",
          meta: {
            description: article.meta_description || article.description || "",
            keywords: article.meta_keywords || article.keywords || "",
            author: article.author || article.created_by || "",
          },
          createdAt:
            article.createdAt || article.created_at || new Date().toISOString(),
          updatedAt:
            article.updatedAt || article.updated_at || new Date().toISOString(),
          publishedAt: article.publishedAt || article.published_at || undefined,
        })
      );

      // Sort by display_order
      articlesData.sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );

      return {
        success: true,
        data: articlesData,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch articles",
        status: 0,
      };
    }
  },

  // Get complete page content (banners + articles) for a menu slug
  getFullPageContent: async (
    menuSlug: string
  ): Promise<ApiResponse<DynamicPageFullContent>> => {
    try {
      // Fetch both banners and articles concurrently
      const [bannersResponse, articlesResponse] = await Promise.all([
        contentApi.getBannersByMenu(menuSlug),
        contentApi.getArticlesByMenu(menuSlug),
      ]);

      const banners = bannersResponse.success ? bannersResponse.data || [] : [];
      const articles = articlesResponse.success
        ? articlesResponse.data || []
        : [];

      // If neither banners nor articles found, return error
      if (banners.length === 0 && articles.length === 0) {
        return {
          success: false,
          error: "No content found for this menu",
          status: 404,
        };
      }

      return {
        success: true,
        data: {
          banners,
          articles,
          menu_slug: menuSlug,
          page_title: articles[0]?.title || banners[0]?.title || menuSlug,
        },
        status: 200,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch page content",
        status: 0,
      };
    }
  },

  // Legacy methods for backward compatibility
  getDynamicPageContent: async (
    slug: string
  ): Promise<ApiResponse<DynamicPageContent>> => {
    // Convert to new format by fetching full content
    const fullContentResponse = await contentApi.getFullPageContent(slug);

    if (!fullContentResponse.success || !fullContentResponse.data) {
      return {
        success: false,
        error: fullContentResponse.error || "Failed to fetch page content",
        status: fullContentResponse.status || 0,
      };
    }

    const { articles, banners } = fullContentResponse.data;

    // Combine articles content for legacy format
    const combinedContent = articles
      .map((article) => article.content)
      .join("\n\n");
    const title = articles[0]?.title || banners[0]?.title || slug;

    return {
      success: true,
      data: {
        title,
        content: combinedContent,
        slug,
        meta: articles[0]?.meta,
        publishedAt: articles[0]?.publishedAt,
        updatedAt: articles[0]?.updatedAt,
      },
      status: 200,
    };
  },

  getPageContentByRoute: async (
    route: string
  ): Promise<ApiResponse<DynamicPageContent>> => {
    // Clean the route to get menu slug
    const cleanRoute = route.startsWith("/") ? route.slice(1) : route;
    return contentApi.getDynamicPageContent(cleanRoute);
  },
};

export interface HomepageContactLogoFormats {
  large?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
  small?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
  medium?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
  thumbnail?: {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes?: number;
  };
}

export interface HomepageContactLogo {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: HomepageContactLogoFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface HomepageContactItem {
  id: number;
  documentId: string;
  title: string;
  state: string;
  address: string; // HTML string
  phone: string | null;
  email: string | null;
  is_active: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  slug: string;
  category: HomepageContactCategory;
  logo?: HomepageContactLogo | null;
}

export interface HomepageContactResponseMeta {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  responseTime: number;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface HomepageContactResponse {
  success: boolean;
  data: HomepageContactItem[] | { data: HomepageContactItem[] };
  meta: HomepageContactResponseMeta;
}

export const contactsApi = {
  getHomepageContacts: async (): Promise<
    ApiResponse<HomepageContactItem[]>
  > => {
    try {
      const response = await fetch(
        `${baseUrl}/mw-cms/api/v1/homepage/contact`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const raw: HomepageContactResponse | any = await response.json();
      const items = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
        ? raw.data.data
        : [];
      if (raw?.success && Array.isArray(items)) {
        return { success: true, data: items, status: response.status };
      }
      return {
        success: false,
        error: "Invalid contacts API response",
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch contacts",
        status: 0,
      };
    }
  },
};

// Export default API object
export default {
  search: searchApi,
  course: courseApi,
  discussion: discussionApi,
  user: userApi,
  partners: partnersApi,
  testimonials: testimonialsApi,
  stacks: stacksApi,
  contacts: contactsApi,
};
