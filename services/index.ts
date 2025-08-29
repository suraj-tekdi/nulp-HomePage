// Export all API services
export {
  searchApi,
  courseApi,
  discussionApi,
  userApi,
  getDynamicNulpUrls,
  type ApiResponse,
  type SearchParams,
  type SearchResult,
} from "./api";

// Export scroll utilities
export {
  scrollToElement,
  scrollToTop,
  isElementInViewport,
  type ScrollOptions,
} from "./scrollUtils";

// Default exports
export { default as api } from "./api";
export { default as scrollUtils } from "./scrollUtils";

// Specific exports for new CMS stacks API
export { stacksApi, type HomepageStackItem } from "./api";

// Menus API exports
export {
  menusApi,
  type HomepageMenuItem,
  type HomepageMenuCategory,
} from "./menus";
