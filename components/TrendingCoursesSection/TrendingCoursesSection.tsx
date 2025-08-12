import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './TrendingCoursesSection.module.css';
import { courseApi, NulpCourse } from '../../services/api';

interface Course {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  organization: string;
}

interface TrendingCoursesSectionProps {
  className?: string;
  selectedDomain?: string | null;
}

const TrendingCoursesSection: React.FC<TrendingCoursesSectionProps> = ({ 
  className = '', 
  selectedDomain = null 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // API-related state
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform NULP API response to our Course interface
  const transformNulpCourse = useCallback((nulpCourse: NulpCourse): Course => {
    // Create a description from available data
    const categoryInfo = nulpCourse.se_boards?.length > 0 ? nulpCourse.se_boards[0] : '';
    const levelInfo = nulpCourse.se_gradeLevels && nulpCourse.se_gradeLevels.length > 0 ? nulpCourse.se_gradeLevels.join(', ') : '';
    const description = `${categoryInfo}${levelInfo ? ` - ${levelInfo}` : ''} course offered by ${nulpCourse.orgDetails.orgName}.`;

    return {
      id: nulpCourse.identifier,
      title: nulpCourse.name.trim(), // Remove any extra whitespace/tabs
      description: description,
      image: nulpCourse.appIcon || undefined,
      category: nulpCourse.se_boards?.length > 0 ? nulpCourse.se_boards[0] : 'General',
      organization: nulpCourse.orgDetails.orgName
    };
  }, []);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await courseApi.getNulpCourses(selectedDomain || undefined);
        
        if (response.success && response.data) {
          const transformedCourses = response.data.map(transformNulpCourse);
          setCourses(transformedCourses);
        } else {
          setError(response.error || 'Failed to fetch courses');
          // Fallback to empty array
          setCourses([]);
        }
      } catch (err) {
        setError('Network error occurred while fetching courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [transformNulpCourse, selectedDomain]);

  // Calculate total slides dynamically
  const totalSlides = useMemo(() => {
    if (courses.length === 0) return 1;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    return Math.max(1, Math.ceil(courses.length / visibleCards));
  }, [courses.length]);

  // Determine if controls should be shown
  const shouldShowControls = useMemo(() => {
    if (loading || error || courses.length === 0) return false;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    // Show controls only if we have more items than can fit in the viewport
    return courses.length > visibleCards && totalSlides > 1;
  }, [courses.length, totalSlides, loading, error]);

  // Reset pagination when courses change
  useEffect(() => {
    setCurrentSlide(0);
    // Small delay to ensure container is rendered
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 100);
  }, [courses]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Update current slide based on scroll position
  const updateCurrentSlide = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const cardWidth = 340 + 24; // card width + gap
    
    // Calculate how many cards are visible
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    // Calculate which "page" we're on based on scroll position
    const scrollPerPage = cardWidth * visibleCards;
    const newSlideIndex = Math.round(scrollLeft / scrollPerPage);
    
    // Ensure we don't go beyond available slides
    const clampedSlideIndex = Math.min(Math.max(0, newSlideIndex), totalSlides - 1);
    
    if (clampedSlideIndex !== currentSlide) {
      setCurrentSlide(clampedSlideIndex);
    }
  }, [currentSlide, totalSlides]);

  // Handle scroll events to update pagination with throttling
  const handleScrollUpdate = useCallback(() => {
    // Use setTimeout to ensure scroll position is stable
    setTimeout(() => {
      updateCurrentSlide();
    }, 100);
  }, [updateCurrentSlide]);

  const nextSlide = useCallback(() => {
    if (!scrollContainerRef.current || currentSlide >= totalSlides - 1) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const scrollAmount = cardWidth * visibleCards;
    
    // Update slide index immediately
    const newSlideIndex = Math.min(currentSlide + 1, totalSlides - 1);
    setCurrentSlide(newSlideIndex);
    
    // Scroll to the new position
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (!scrollContainerRef.current || currentSlide <= 0) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const scrollAmount = cardWidth * visibleCards;
    
    // Update slide index immediately
    const newSlideIndex = Math.max(currentSlide - 1, 0);
    setCurrentSlide(newSlideIndex);
    
    // Scroll to the new position
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, [currentSlide, totalSlides]);

  const goToSlide = useCallback((slideIndex: number) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const scrollPosition = slideIndex * (cardWidth * visibleCards);
    
    // Update slide index immediately
    setCurrentSlide(slideIndex);
    
    // Scroll to the new position
    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  }, []);

  // Handle course navigation
  const handleCourseClick = useCallback((courseId: string) => {
    const courseUrl = `https://devnulp.niua.org/webapp/join-Course?${courseId}`;
    window.location.href = courseUrl;
  }, []);

  // Handle explore button click
  const handleExploreCourse = useCallback((e: React.MouseEvent, courseId: string) => {
    e.stopPropagation(); // Prevent card click if we want different behaviors
    handleCourseClick(courseId);
  }, [handleCourseClick]);


  return (
    <section id="trending-courses" className={`${styles.trending} ${className}`}>
      <div className={styles.trending__container}>

        {/* Section Header */}
        <div className={styles.trending__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={280}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.trending__title}>
              Trending <span className={styles.trending__title__highlight}>Courses</span>
            </h2>
          </div>
          {selectedDomain && (
            <h3 className={styles.trending__subtitle}>{selectedDomain}</h3>
          )}
        </div>

        {/* Courses Grid */}
        <div className={styles.trending__content}>
          <div 
            ref={scrollContainerRef}
            className={styles.trending__courses}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onScroll={handleScrollUpdate}
          >
            {loading ? (
              <div className={styles.trending__loading}>
                <div className={styles.trending__loading__spinner}></div>
                <p>Loading courses...</p>
              </div>
            ) : error ? (
              <div className={styles.trending__error}>
                <div className={styles.trending__error__message}>
                  {selectedDomain 
                    ? `Unable to load courses for "${selectedDomain}" domain.`
                    : 'Unable to load courses at the moment.'
                  }
                </div>
                <div className={styles.trending__error__suggestion}>
                  Please check your internet connection and try again.
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className={styles.trending__empty}>
                <div className={styles.trending__empty__message}>
                  {selectedDomain 
                    ? `No courses available for "${selectedDomain}" domain.`
                    : 'No courses available at the moment.'
                  }
                </div>
                <div className={styles.trending__empty__suggestion}>
                  Try selecting a different domain or check back later.
                </div>
              </div>
            ) : (
              courses.map((course) => (
               <div 
                 key={course.id} 
                 className={styles.trending__card}
                 onClick={() => handleCourseClick(course.id)}
                 style={{ cursor: 'pointer' }}
               >
                 <div className={styles.trending__card__image}>
                   <img 
                     src="/images/placeholder-img.png" 
                     alt={course.title}
                     onError={(e) => {
                       const target = e.target as HTMLImageElement;
                       target.src = '/images/icons/default-placeholder.png';
                     }}
                   />
                 </div>
                 <div className={styles.trending__card__content}>
                   {/* Normal State Content */}
                   <div className={styles.trending__card__normal}>
                     <h4 className={styles.trending__card__title}>{course.title}</h4>
                     <p className={styles.trending__card__description}>
                       {course.description.length > 120 ? 
                         `${course.description.substring(0, 120)}...` : 
                         course.description}
                     </p>
                   </div>
                   
                   {/* Hover State Content */}
                   <div className={styles.trending__card__hover}>
                     <h4 className={styles.trending__card__title}>{course.title}</h4>
                     <p className={styles.trending__card__description__full}>
                       {course.description}
                     </p>
                     <button 
                       className={styles.trending__card__button}
                       onClick={(e) => handleExploreCourse(e, course.id)}
                     >
                       Explore Course
                     </button>
                   </div>
                 </div>
               </div>
             ))
            )}
          </div>

          {/* Conditionally render controls only when needed */}
          {shouldShowControls && (
            <div className={styles.trending__controls}>
              {/* Pagination Dots */}
              <div className={styles.trending__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.trending__dot} ${
                      index === currentSlide ? styles['trending__dot--active'] : ''
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className={styles.trending__navigation}>
                <button
                  className={styles.trending__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous courses"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.trending__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next courses"
                >
                  <ArrowForwardIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingCoursesSection; 