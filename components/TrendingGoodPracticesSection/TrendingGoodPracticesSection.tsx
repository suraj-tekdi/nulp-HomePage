import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './TrendingGoodPracticesSection.module.css';
import { courseApi, NulpGoodPractice } from '../../services/api';

interface GoodPractice {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  organization: string;
  primaryCategory: string;
  mimeType: string;
}

interface TrendingGoodPracticesSectionProps {
  className?: string;
  selectedDomain?: string | null;
}

const TrendingGoodPracticesSection: React.FC<TrendingGoodPracticesSectionProps> = ({
  className = '',
  selectedDomain = null
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // API-related state
  const [goodPractices, setGoodPractices] = useState<GoodPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform NULP API response to our GoodPractice interface
  const transformNulpGoodPractice = useCallback((nulpPractice: NulpGoodPractice): GoodPractice => {
    // Create a description from available data
    const categoryInfo = nulpPractice.se_boards?.length ? nulpPractice.se_boards[0] : '';
    const levelInfo = nulpPractice.se_gradeLevels && nulpPractice.se_gradeLevels.length > 0 ? nulpPractice.se_gradeLevels.join(', ') : '';
    const description = `${categoryInfo}${levelInfo ? ` - ${levelInfo}` : ''} practice shared by ${nulpPractice.orgDetails.orgName}.`;

    return {
      id: nulpPractice.identifier,
      title: nulpPractice.name.trim(), // Remove any extra whitespace/tabs
      description: description,
      image: nulpPractice.appIcon || undefined,
      category: nulpPractice.se_boards?.length ? nulpPractice.se_boards[0] : 'General',
      organization: nulpPractice.orgDetails.orgName,
      primaryCategory: nulpPractice.primaryCategory,
      mimeType: nulpPractice.mimeType
    };
  }, []);

  // Fetch good practices from API
  useEffect(() => {
    const fetchGoodPractices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await courseApi.getNulpGoodPractices(selectedDomain || undefined);
        
        if (response.success && response.data) {
          const transformedPractices = response.data.map(transformNulpGoodPractice);
          setGoodPractices(transformedPractices);
        } else {
          setError(response.error || 'Failed to fetch good practices');
          // Fallback to empty array
          setGoodPractices([]);
        }
      } catch (err) {
        setError('Network error occurred while fetching good practices');
        setGoodPractices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoodPractices();
  }, [transformNulpGoodPractice, selectedDomain]);

  // Calculate total slides dynamically
  const totalSlides = useMemo(() => {
    if (goodPractices.length === 0) return 1;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    return Math.max(1, Math.ceil(goodPractices.length / visibleCards));
  }, [goodPractices.length]);

  // Determine if controls should be shown
  const shouldShowControls = useMemo(() => {
    if (loading || error || goodPractices.length === 0) return false;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 340 + 24; // card width + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    // Show controls only if we have more items than can fit in the viewport
    return goodPractices.length > visibleCards && totalSlides > 1;
  }, [goodPractices.length, totalSlides, loading, error]);

  // Reset pagination when practices change
  useEffect(() => {
    setCurrentSlide(0);
    // Small delay to ensure container is rendered
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 100);
  }, [goodPractices]);

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
    // Each page shows visibleCards number of cards
    const scrollPerPage = cardWidth * visibleCards;
    const newSlideIndex = Math.round(scrollLeft / scrollPerPage);
    
    // Ensure we don't go beyond available slides
    const clampedSlideIndex = Math.min(Math.max(0, newSlideIndex), totalSlides - 1);
    
    if (clampedSlideIndex !== currentSlide) {
      setCurrentSlide(clampedSlideIndex);
    }
  }, [currentSlide, totalSlides, goodPractices.length]);

  // Handle scroll events to update pagination with throttling
  const handleScrollUpdate = useCallback(() => {
    // Use setTimeout to ensure scroll position is stable
    setTimeout(() => {
      updateCurrentSlide();
    }, 50);
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

  // Handle practice navigation
  const handlePracticeClick = useCallback((practiceId: string) => {
    const practiceUrl = `https://devnulp.niua.org/webapp/player?id=${practiceId}`;
    window.location.href = practiceUrl;
  }, []);

  // Handle explore button click
  const handleExplorePractice = useCallback((e: React.MouseEvent, practiceId: string) => {
    e.stopPropagation(); // Prevent card click if we want different behaviors
    handlePracticeClick(practiceId);
  }, [handlePracticeClick]);

  return (
    <section className={`${styles.practices} ${className}`}>
      <div className={styles.practices__container}>
        <div className={styles.practices__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={280}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.practices__title}>
              Trending <span className={styles.practices__title__highlight}>Good Practices</span>
            </h2>
          </div>
          {selectedDomain && (
            <h3 className={styles.practices__subtitle}>{selectedDomain}</h3>
          )}
        </div>
        <div className={styles.practices__content}>
          <div 
            ref={scrollContainerRef}
            className={styles.practices__items}
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
              <div className={styles.practices__loading}>
                <div className={styles.practices__loading__spinner}></div>
                <p>Loading good practices...</p>
              </div>
            ) : error ? (
              <div className={styles.practices__error}>
                <div className={styles.practices__error__message}>
                  {selectedDomain 
                    ? `Unable to load good practices for "${selectedDomain}" domain.`
                    : 'Unable to load good practices at the moment.'
                  }
                </div>
                <div className={styles.practices__error__suggestion}>
                  Please check your internet connection and try again.
                </div>
              </div>
            ) : goodPractices.length === 0 ? (
              <div className={styles.practices__empty}>
                <div className={styles.practices__empty__message}>
                  {selectedDomain 
                    ? `No good practices available for "${selectedDomain}" domain.`
                    : 'No good practices available at the moment.'
                  }
                </div>
                <div className={styles.practices__empty__suggestion}>
                  Try selecting a different domain or check back later.
                </div>
              </div>
            ) : (
              goodPractices.map((practice) => (
                <div 
                  key={practice.id} 
                  className={styles.practices__card}
                  onClick={() => handlePracticeClick(practice.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.practices__card__image}>
                    <img 
                      src="/images/placeholder-img.png" 
                      alt={practice.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/icons/default-placeholder.png';
                      }}
                    />
                  </div>
                  <div className={styles.practices__card__content}>
                    {/* Normal State Content */}
                    <div className={styles.practices__card__normal}>
                      <h4 className={styles.practices__card__title}>{practice.title}</h4>
                      <p className={styles.practices__card__description}>
                        {practice.description.length > 120 ? 
                          `${practice.description.substring(0, 120)}...` : 
                          practice.description}
                      </p>
                    </div>

                    {/* Hover State Content */}
                    <div className={styles.practices__card__hover}>
                      <h4 className={styles.practices__card__title}>{practice.title}</h4>
                      <p className={styles.practices__card__description__full}>
                        {practice.description}
                      </p>
                      <button 
                        className={styles.practices__card__button}
                        onClick={(e) => handleExplorePractice(e, practice.id)}
                      >
                        View Practice
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Conditionally render controls only when needed */}
          {shouldShowControls && (
            <div className={styles.practices__controls}>
              <div className={styles.practices__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.practices__dot} ${
                      index === currentSlide ? styles['practices__dot--active'] : ''
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className={styles.practices__navigation}>
                <button
                  className={styles.practices__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous practices"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.practices__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next practices"
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

export default TrendingGoodPracticesSection; 