// Smooth scroll utility functions

export interface ScrollOptions {
  duration?: number;
  offset?: number;
}

/**
 * Smoothly scrolls to an element with the given ID
 * @param elementId - The ID of the element to scroll to
 * @param options - Optional scroll configuration
 */
export const scrollToElement = (elementId: string, offset: number = 80): void => {
  const element = document.getElementById(elementId);
  
  if (element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middle = absoluteElementTop - offset;
    
    window.scrollTo({
      top: middle,
      behavior: 'smooth'
    });
  }
  // Element not found - fail silently in production
};

/**
 * Smoothly scrolls to the top of the page
 * @param duration - Animation duration in milliseconds
 */
export const scrollToTop = (duration: number = 800): void => {
  const startPosition = window.pageYOffset;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const ease = progress * (2 - progress); // easeOutQuad
    window.scrollTo(0, startPosition * (1 - ease));

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

/**
 * Checks if an element is in viewport
 * @param elementId - The ID of the element to check
 * @returns boolean indicating if element is visible
 */
export const isElementInViewport = (elementId: string): boolean => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export default {
  scrollToElement,
  scrollToTop,
  isElementInViewport
}; 