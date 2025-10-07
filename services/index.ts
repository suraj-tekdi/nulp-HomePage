// Export all API services
export {
  searchApi,
  courseApi,
  discussionApi,
  userApi,
  contentApi,
  getDynamicNulpUrls,
  type ApiResponse,
  type SearchParams,
  type SearchResult,
  type DynamicPageContent,
  type DynamicPageBanner,
  type DynamicPageArticle,
  type DynamicPageFullContent,
  testimonialsApi,
  type HomepageTestimonialItem,
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

// Banners API exports
export { bannersApi, type HomepageBannerItem } from "./banners";

// Sliders API exports - Updated with new trending types
export {
  slidersApi,
  type HomepageSliderItem,
  type NulpCourse,
  type NulpGoodPractice,
  type TrendingCourseItem,
  type TrendingGoodPracticeItem,
  type TrendingDiscussionItem,
} from "./sliders";

// Articles API exports
export {
  articlesApi,
  type HomepageArticleItem,
  type HomepageArticleCategory,
} from "./articles";

// Footer API exports (moved here)
export {
  footerApi,
  contactsApi as footerContactsApi,
  socialApi as footerSocialApi,
  menusApi as footerMenusApi,
  type HomepageContactItem,
  type FooterSocialItem,
  type FooterMenuItem,
} from "./footer";

// Partners API exports (moved out of api.ts)
export { partnersApi, type HomepagePartnerItem } from "./partners";

// Media (Launch Video) API exports
export { mediaApi, type LaunchMedia } from "./media";

export {
  stateMediaApi,
  type StateMediaImage,
  type StateAvailability,
} from "./stateMedia";
