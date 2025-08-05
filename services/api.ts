// API Base Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Dynamic NULP URL function
const getNulpBaseUrl = (): string => {
  // Check if we're in development environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
      return 'https://devnulp.niua.org';
    }
  }
  return 'https://nulp.niua.org';
};

// Static URLs for server-side rendering
const NULP_WEBAPP_URL = 'https://nulp.niua.org/webapp';
const NULP_API_URL = 'https://nulp.niua.org/api';

// Export function to get dynamic URLs
export const getDynamicNulpUrls = () => {
  const baseUrl = getNulpBaseUrl();
  return {
    base: baseUrl,
    domainList: `${baseUrl}/webapp/domainList`,
    search: (query: string) => `${baseUrl}/webapp?query=${encodeURIComponent(query)}`
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
  type: 'course' | 'discussion' | 'practice';
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    return {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.message || 'An error occurred',
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Search API Services
export const searchApi = {
  // Log search query (optional analytics)
  logSearch: async (query: string): Promise<ApiResponse> => {
    return apiRequest('/api/search/log', {
      method: 'POST',
      body: JSON.stringify({ 
        query, 
        timestamp: new Date().toISOString(),
        source: 'header_search'
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
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
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
  getNulpCourses: async (selectedDomain?: string): Promise<ApiResponse<NulpCourse[]>> => {
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
          "do_114284738848514048123"
        ]
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
            "name", "appIcon", "mimeType", "gradeLevel", "identifier", "medium",
            "pkgVersion", "board", "subject", "resourceType", "primaryCategory",
            "contentType", "channel", "organisation", "trackable", "primaryCategory",
            "se_boards", "se_gradeLevels", "se_subjects", "se_mediums"
          ],
          facets: ["se_boards", "se_gradeLevels", "se_subjects", "se_mediums", "primaryCategory"],
          offset: 0
        }
      };

      const urls = getDynamicNulpUrls();
      const baseUrl = urls.base;
      
      const response = await fetch(`${baseUrl}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Referer': `${baseUrl}/webapp/domainList`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NulpApiResponse = await response.json();

      if (data.responseCode === 'OK' && data.result?.content) {
        return {
          success: true,
          data: data.result.content,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from NULP API',
          status: response.status,
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
        status: 0,
      };
    }
  },

  // Get good practices from NULP API
  getNulpGoodPractices: async (selectedDomain?: string): Promise<ApiResponse<NulpGoodPractice[]>> => {
    try {
      // Create filters based on selected domain
      const filters: any = {
        status: ["Live"],
        primaryCategory: ["Good Practices", "Reports", "Manual/SOPs"],
        visibility: ["Default", "Parent"]
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
            "name", "appIcon", "mimeType", "gradeLevel", "identifier", "medium",
            "pkgVersion", "board", "subject", "resourceType", "primaryCategory",
            "contentType", "channel", "organisation", "trackable", "primaryCategory",
            "se_boards", "se_gradeLevels", "se_subjects", "se_mediums", "primaryCategory"
          ],
          facets: ["se_boards", "se_gradeLevels", "se_subjects", "se_mediums", "primaryCategory"],
          offset: 0,
          query: ""
        }
      };

      const urls = getDynamicNulpUrls();
      const baseUrl = urls.base;
      
      const response = await fetch(`${baseUrl}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': baseUrl,
          'Referer': `${baseUrl}/webapp/domainList`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NulpGoodPracticesApiResponse = await response.json();

      if (data.responseCode === 'OK' && data.result?.content) {
        return {
          success: true,
          data: data.result.content,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from NULP API',
          status: response.status,
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch good practices',
        status: 0,
      };
    }
  },

  // Legacy function for future use
  getTrendingCourses: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/api/courses/trending');
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
    description: topic.content || topic.contentRaw || 'No description available',
    category: topic.category.name,
    replies: topic.postcount - 1, // Subtract 1 as postcount includes the original post
    views: topic.viewcount,
    isSolved: topic.isSolved === 1,
    author: topic.user.fullname || topic.user.displayname,
    designation: topic.user.designation,
    location: topic.user.location,
    slug: topic.slug
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
  return {
    id: post.topic.tid,
    title: post.topic.titleRaw || post.topic.title,
    description: post.content || 'No description available',
    category: post.category.name,
    replies: post.topic.postcount - 1, // Subtract 1 as postcount includes the original post
    views: 0, // View count not available in domain API response
    isSolved: post.topic.isSolved === 1,
    author: post.user.fullname || post.user.displayname,
    designation: post.user.designation,
    location: post.user.location,
    slug: post.topic.slug
  };
}

// Updated discussionApi with the new function
export const discussionApi = {
  // Get popular discussions from NULP forum API via Next.js API route
  getPopularDiscussions: async (): Promise<ApiResponse<DiscussionTopic[]>> => {
    try {
      const response = await fetch('/api/discussions/popular', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('data', data);
      // The API route returns the data in the expected format
      return data;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch discussions',
        status: 0,
      };
    }
  },

  // Get discussions by domain from NULP forum API via Next.js API route
  getDiscussionsByDomain: async (domainName: string): Promise<ApiResponse<DomainDiscussionPost[]>> => {
    try {
      const encodedDomain = encodeURIComponent(domainName);
      const response = await fetch(`/api/discussions/by-domain?domainName=${encodedDomain}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // The API route returns the data in the expected format
      return data;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch discussions by domain',
        status: 0,
      };
    }
  },

  // Future: Get trending discussions (legacy)
  getTrendingDiscussions: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/api/discussions/trending');
  },
};

export const userApi = {
  // Future: User authentication
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse> => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Future: User registration
  register: async (userData: { email: string; password: string; name: string }): Promise<ApiResponse> => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// Export default API object
export default {
  search: searchApi,
  course: courseApi,
  discussion: discussionApi,
  user: userApi,
}; 