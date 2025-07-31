import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import styles from './PartnersSection.module.css';

interface PartnersSectionProps {
  className?: string;
}

const PartnersSection: React.FC<PartnersSectionProps> = ({ className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Partner logos data - dynamically generate for all 29 partners
  const totalPartners = 29;
  const partners = useMemo(() => {
    return Array.from({ length: totalPartners }, (_, index) => ({
      id: index + 1,
      name: `Partner Organization ${index + 1}`,
      logo: `/images/partners/${index + 1}.png`
    }));
  }, []);

  const partnersPerPage = 5;
  const totalSlides = useMemo(() => Math.ceil(partners.length / partnersPerPage), [partners.length, partnersPerPage]);

  // Smooth back-and-forth auto-scroll: 1→2→3→2→1→2→3→2→1...
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && scrollContainerRef.current) {
        setCurrentSlide(prev => {
          let nextSlide: number;
          
          if (direction === 'forward') {
            // Moving forward
            if (prev === totalSlides - 1) {
              // Reached the end, start going backward
              setDirection('backward');
              nextSlide = prev - 1;
            } else {
              // Continue forward
              nextSlide = prev + 1;
            }
          } else {
            // Moving backward
            if (prev === 0) {
              // Reached the beginning, start going forward
              setDirection('forward');
              nextSlide = prev + 1;
            } else {
              // Continue backward
              nextSlide = prev - 1;
            }
          }
          
          // Calculate scroll position for the next slide
          const cardWidth = 274; // card width + gap (250 + 24)
          const scrollPosition = nextSlide * cardWidth * partnersPerPage;
          
          // Smooth scrolling to next position
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
          }
          
          return nextSlide;
        });
      }
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [isDragging, totalSlides, partnersPerPage, direction]);

  // Update current slide based on scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isDragging) return;
    
    const cardWidth = 274; // card width + gap
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const newSlide = Math.round(scrollLeft / (cardWidth * partnersPerPage));
    setCurrentSlide(Math.min(newSlide, totalSlides - 1));
  }, [isDragging, totalSlides, partnersPerPage]);

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

  const goToSlide = useCallback((slideIndex: number) => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 274; // card width + gap
    const scrollPosition = slideIndex * cardWidth * partnersPerPage;
    scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    setCurrentSlide(slideIndex);
  }, [partnersPerPage]);

  return (
    <section className={`${styles.partners} ${className}`}>
      <div className={styles.partners__container}>


        {/* Section Header */}
        <div className={styles.partners__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={240}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.partners__title}>Our Partners</h2>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.partners__content}>
          {/* Partners Horizontal Scroll */}
          <div 
            className={styles.partners__scroll}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onScroll={handleScroll}
          >
            {partners.map((partner) => (
              <div key={partner.id} className={styles.partners__card}>
                <div className={styles.partners__logoWrapper}>
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={200}
                    height={120}
                    className={styles.partners__logo}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/partners/placeholder-partner.svg';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Controls - Only Pagination */}
          <div className={styles.partners__controls}>
            {/* Pagination Dots */}
            <div className={styles.partners__pagination}>
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`${styles.partners__dot} ${
                    index === currentSlide ? styles['partners__dot--active'] : ''
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection; 