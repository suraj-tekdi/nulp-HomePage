# API Services

This directory contains all API-related logic for the NULP home page application.

## Structure

- `api.ts` - Main API services file with all HTTP request logic
- `index.ts` - Export file for cleaner imports

## Usage

### Search API

```typescript
import { searchApi } from '../services';

// Redirect user to NULP webapp with search query (opens in new tab)
await searchApi.redirectToSearch('machine learning');

// Get search URL without redirecting
const searchUrl = await searchApi.performSearch('javascript');

// Log search query for analytics (optional)
await searchApi.logSearch('data science');
```

### Other APIs (Future Implementation)

```typescript
import { courseApi, discussionApi, userApi } from '../services';

// Get trending courses
const courses = await courseApi.getTrendingCourses();

// Get trending discussions  
const discussions = await discussionApi.getTrendingDiscussions();

// User authentication
await userApi.login({ email: 'user@example.com', password: 'password' });
```

## Configuration

Set the following environment variables:

- `NEXT_PUBLIC_API_URL` - Base URL for your API endpoints (optional)

## Adding New API Services

1. Add new service object to `api.ts`
2. Export it in the default export object
3. Add to exports in `index.ts`
4. Update this README with usage examples

## Error Handling

All API functions return standardized responses with the `ApiResponse<T>` interface:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}
```

The search service includes fallback behavior to ensure user experience isn't disrupted by API failures. All search operations open results in a new tab for better user experience.

## Search Interactions

Users can trigger search in two ways:
1. **Enter Key**: Type query and press Enter
2. **Search Icon Click**: Type query and click the search icon

Both methods open search results in a new tab at `https://nulp.niua.org/webapp?query=[search-term]`.

## Scroll Utilities

The scroll utilities provide smooth scrolling functionality for navigation within the page.

```typescript
import { scrollToElement, scrollToTop, isElementInViewport } from '../services';

// Smoothly scroll to an element with custom options
scrollToElement('trending-courses', { 
  duration: 800,  // Animation duration in ms
  offset: 80      // Offset from top in pixels
});

// Scroll to top of page
scrollToTop(1000); // 1 second duration

// Check if element is visible
const isVisible = isElementInViewport('trending-courses');
```

### Navigation Integration

The Header component uses smooth scrolling for section links:
- **Courses** → Scrolls to "Trending Courses" section
- Other links use normal navigation

This provides a seamless user experience when navigating between sections on the homepage. 