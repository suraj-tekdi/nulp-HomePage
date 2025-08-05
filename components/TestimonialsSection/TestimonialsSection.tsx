import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import styles from './TestimonialsSection.module.css';

interface Testimonial {
  id: number;
  name: string;
  position: string;
  organization: string;
  image: string;
  quote: string;
}

interface TestimonialsSectionProps {
  className?: string;
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ className = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sample testimonials data - removed duplicate
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Ms Ayushi Bawsar",
      position: "Nagar Palika Parishad Ashta",
      organization: "",
      image: "/images/testimonials/testimonial.png",
      quote: "The workshop organised was informative and comprehensive. This is a new platform to share ideas with others, and learn from others' ideas and apply them to our ULB. Any ideas shared may be beneficial to us as well. And we can definitely take advantage of this platform and implement some good work for our ULB."
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      position: "Municipal Commissioner",
      organization: "Smart City Mission",
      image: "/images/testimonials/testimonial.png",
      quote: "The NULP platform has transformed how we approach urban governance. The collaborative learning environment and best practices sharing have significantly improved our project implementations and citizen service delivery."
    },
    {
      id: 3,
      name: "Ms. Priya Sharma",
      position: "Urban Planning Officer",
      organization: "City Development Authority",
      image: "/images/testimonials/testimonial.png",
      quote: "Exceptional learning experience! The platform provides access to cutting-edge urban development strategies and connects us with experts nationwide. It has enhanced our team's capabilities tremendously."
    },
    {
      id: 4,
      name: "Mr. Amit Patel",
      position: "City Manager",
      organization: "Municipal Corporation",
      image: "/images/testimonials/testimonial.png",
      quote: "NULP has been instrumental in our capacity building journey. The practical insights and peer-to-peer learning opportunities have helped us implement successful urban initiatives in our city."
    },
    {
      id: 5,
      name: "Dr. Meera Reddy",
      position: "Director",
      organization: "Urban Development Department",
      image: "/images/testimonials/testimonial.png",
      quote: "The platform's comprehensive approach to urban learning is remarkable. It bridges the gap between theoretical knowledge and practical implementation, making it invaluable for urban practitioners."
    }
  ];

  // Calculate total slides dynamically
  const totalSlides = useMemo(() => {
    if (testimonials.length === 0) return 1;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 390 + 24; // max-width from CSS + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    return Math.max(1, Math.ceil(testimonials.length / visibleCards));
  }, [testimonials.length]);

  // Determine if controls should be shown
  const shouldShowControls = useMemo(() => {
    if (testimonials.length === 0) return false;
    
    // Get actual container width if available, otherwise use estimate
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    const cardWidth = 390 + 24; // max-width from CSS + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    
    // Show controls only if we have more items than can fit in the viewport
    return testimonials.length > visibleCards && totalSlides > 1;
  }, [testimonials.length, totalSlides]);

  // Reset pagination when testimonials change
  useEffect(() => {
    setCurrentSlide(0);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 100);
  }, [testimonials]);

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

  const nextSlide = useCallback(() => {
    if (!scrollContainerRef.current || currentSlide >= totalSlides - 1) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const cardWidth = 390 + 24; // max-width from CSS + gap
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
    const cardWidth = 390 + 24; // max-width from CSS + gap
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
    const cardWidth = 390 + 24; // max-width from CSS + gap
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const scrollPosition = slideIndex * (cardWidth * visibleCards);
    
    // Update slide index immediately
    setCurrentSlide(slideIndex);
    
    // Scroll to the new position
    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  }, []);

  return (
    <section className={`${styles.testimonials} ${className}`}>
      <div className={styles.testimonials__container}>
        {/* Section Header */}
        <div className={styles.testimonials__header}>
          <div className="title-wrapper">
            <Image
              src="/images/Arrow.svg"
              alt="Arrow decoration"
              width={250}
              height={18}
              className="title-arrow"
            />
            <h2 className={styles.testimonials__title}>
              Testimonials
            </h2>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.testimonials__content}>
          {/* Testimonials Horizontal Scroll */}
          <div 
            className={styles.testimonials__scroll}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className={styles.testimonials__card}>
                {/* Profile Image */}
                <div className={styles.testimonials__card__imageContainer}>
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className={styles.testimonials__card__image}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/testimonials/default-avatar.svg';
                    }}
                  />
                </div>

                {/* Quote */}
                <div className={styles.testimonials__card__content}>
                  <blockquote className={styles.testimonials__card__quote}>
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Attribution */}
                  <div className={styles.testimonials__card__attribution}>
                    <div className={styles.testimonials__card__name}>
                      — {testimonial.name}
                    </div>
                    <div className={styles.testimonials__card__position}>
                      {testimonial.position}
                      {testimonial.organization && (
                        <span className={styles.testimonials__card__organization}>
                          , {testimonial.organization}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conditionally render controls only when needed */}
          {shouldShowControls && (
            <div className={styles.testimonials__controls}>
              {/* Pagination Dots */}
              <div className={styles.testimonials__pagination}>
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.testimonials__dot} ${
                      index === currentSlide ? styles['testimonials__dot--active'] : ''
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className={styles.testimonials__navigation}>
                <button
                  className={styles.testimonials__arrow}
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  aria-label="Previous testimonials"
                >
                  <ArrowBackIcon />
                </button>
                <button
                  className={styles.testimonials__arrow}
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides - 1}
                  aria-label="Next testimonials"
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

export default TestimonialsSection; 