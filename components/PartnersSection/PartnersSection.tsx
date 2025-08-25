import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import styles from './PartnersSection.module.css';
import { partnersApi, HomepagePartnerItem } from '../../services/api';

interface PartnersSectionProps {
  className?: string;
  initialPartners?: HomepagePartnerItem[];
}

const CARD_BASE_FALLBACK = 250; // fallback card width if measurement fails

const PartnersSection: React.FC<PartnersSectionProps> = ({ className = '', initialPartners = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [partners, setPartners] = useState<HomepagePartnerItem[]>(initialPartners);
  const [visibleCards, setVisibleCards] = useState<number>(5);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCardWidthWithGap = useCallback((): number => {
    if (!scrollContainerRef.current) return CARD_BASE_FALLBACK + 24;
    const el = scrollContainerRef.current;
    const firstCard = el.querySelector(`.${styles.partners__card}`) as HTMLElement | null;
    const style = getComputedStyle(el);
    const gapPx = parseFloat((style.columnGap || style.gap || '0').toString());
    const cardWidth = firstCard?.offsetWidth || CARD_BASE_FALLBACK;
    return cardWidth + (isNaN(gapPx) ? 0 : gapPx);
  }, []);

  // Sync with server-provided partners when prop changes
  useEffect(() => {
    if (initialPartners && initialPartners.length > 0) {
      const sorted = [...initialPartners].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setPartners(sorted);
    }
  }, [initialPartners]);

  // Fetch partners from CMS only if none provided
  useEffect(() => {
    if (partners.length > 0) return;
    let isMounted = true;
    (async () => {
      const res = await partnersApi.getHomepagePartners();
      if (isMounted && res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setPartners(sorted);
      }
    })();
    return () => { isMounted = false; };
  }, [partners.length]);

  // Observe container width to compute visible cards and overflow
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const update = () => {
      const containerWidth = el.clientWidth || 0;
      const cardWidthWithGap = getCardWidthWithGap();
      const vc = Math.max(1, Math.floor(containerWidth / cardWidthWithGap));
      setVisibleCards(vc);
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const firstCard = el.querySelector(`.${styles.partners__card}`) as HTMLElement | null;
    if (firstCard) ro.observe(firstCard);
    return () => ro.disconnect();
  }, [partners.length, getCardWidthWithGap]);

  const partnersPerPage = useMemo(() => visibleCards, [visibleCards]);
  const totalSlides = useMemo(() => Math.max(1, Math.ceil(partners.length / partnersPerPage)), [partners.length, partnersPerPage]);

  // Smooth back-and-forth auto-scroll only when multiple slides
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      if (!isDragging && scrollContainerRef.current) {
        setCurrentSlide(prev => {
          let nextSlide: number;
          if (direction === 'forward') {
            if (prev === totalSlides - 1) {
              setDirection('backward');
              nextSlide = Math.max(prev - 1, 0);
            } else {
              nextSlide = prev + 1;
            }
          } else {
            if (prev === 0) {
              setDirection('forward');
              nextSlide = Math.min(prev + 1, totalSlides - 1);
            } else {
              nextSlide = prev - 1;
            }
          }
          const cardWidthWithGap = getCardWidthWithGap();
          const scrollPosition = nextSlide * cardWidthWithGap * partnersPerPage;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
          }
          return nextSlide;
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isDragging, totalSlides, partnersPerPage, direction, getCardWidthWithGap]);

  // Update current slide based on scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isDragging) return;
    const cardWidthWithGap = getCardWidthWithGap();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const newSlide = Math.round(scrollLeft / (cardWidthWithGap * partnersPerPage));
    setCurrentSlide(Math.min(newSlide, totalSlides - 1));
  }, [isDragging, totalSlides, partnersPerPage, getCardWidthWithGap]);

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
    const cardWidthWithGap = getCardWidthWithGap();
    const scrollPosition = slideIndex * cardWidthWithGap * partnersPerPage;
    scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    setCurrentSlide(slideIndex);
  }, [partnersPerPage, getCardWidthWithGap]);

  const showPagination = hasOverflow && totalSlides > 1;

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
                    src={partnersApi.buildLogoUrl(partner.logo?.formats?.thumbnail?.url || partner.logo?.url)}
                    alt={partner.name}
                    width={200}
                    height={120}
                    className={styles.partners__logo}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder-img.png';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Controls - Only Pagination */}
          {showPagination && (
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
          )}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection; 