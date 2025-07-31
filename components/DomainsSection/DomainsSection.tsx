import React, { useState, useRef } from 'react';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import styles from './DomainsSection.module.css';

interface Domain {
  id: number;
  name: string;
  icon: string;
  alt: string;
}

interface DomainsSectionProps {
  className?: string;
  onDomainSelect?: (domain: string | null) => void;
  selectedDomain?: string | null;
}

const DomainsSection: React.FC<DomainsSectionProps> = ({ 
  className = '', 
  onDomainSelect,
  selectedDomain: selectedDomainName
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSelectedDomain, setLocalSelectedDomain] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Domain data based on your HTML structure
  const domains: Domain[] = [
    { id: 1, name: 'Environment and Climate', icon: '/images/domain_icons/1.png', alt: 'Environment and Climate' },
    { id: 2, name: 'Solid Waste Management', icon: '/images/domain_icons/2.png', alt: 'Solid Waste Management' },
    { id: 3, name: 'WASH - Water, Sanitation and Hygiene', icon: '/images/domain_icons/3.png', alt: 'WASH - Water, Sanitation and Hygiene' },
    { id: 4, name: 'Urban Planning and Housing', icon: '/images/domain_icons/4.png', alt: 'Urban Planning and Housing' },
    { id: 5, name: 'Transport and Mobility', icon: '/images/domain_icons/5.png', alt: 'Transport and Mobility' },
    { id: 6, name: 'Social Aspects', icon: '/images/domain_icons/6.png', alt: 'Social Aspects' },
    { id: 7, name: 'Municipal Finance', icon: '/images/domain_icons/7.png', alt: 'Municipal Finance' },
    { id: 8, name: 'General Administration', icon: '/images/domain_icons/8.png', alt: 'General Administration' },
    { id: 9, name: 'Governance and Urban Management', icon: '/images/domain_icons/9.png', alt: 'Governance and Urban Management' },
    { id: 10, name: 'Miscellaneous/ Others', icon: '/images/domain_icons/1.png', alt: 'Miscellaneous/ Others' }
  ];

  const itemWidth = 180; // Width of each carousel item
  const gap = 16;        // Gap between items
  const visibleItems = 6; // Number of visible items
  const maxIndex = Math.max(0, domains.length - visibleItems);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const scrollAmount = index * (itemWidth + gap);
      carouselRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  };

  const scrollPrev = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const scrollNext = () => {
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  // Keep state in sync when user manually scrolls
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const newIndex = Math.round(scrollLeft / (itemWidth + gap));
    setCurrentIndex(newIndex);
  };

  const handleDomainClick = (domain: Domain) => {
    console.log(`Selected domain: ${domain.name}`);
    const isCurrentlySelected = localSelectedDomain === domain.id;
    const newSelection = isCurrentlySelected ? null : domain.id;
    const domainName = isCurrentlySelected ? null : domain.name;
    
    setLocalSelectedDomain(newSelection);
    
    // Notify parent component about domain selection
    if (onDomainSelect) {
      onDomainSelect(domainName);
    }
  };

  return (
    <section className={`${styles.domains} ${className}`}>      
      <div className={styles.domains__container}>
        {/* Section Title */}
        <h2 className={styles.domains__title}>
          Select a <span className={styles.primary}>Domain</span>
        </h2>

        {/* Carousel Container */}
        <div className={styles.domains__carousel}>
          {/* Navigation Arrow Left */}
          <button
            className={`${styles.domains__arrow} ${styles['domains__arrow--left']}`}
            onClick={scrollPrev}
            disabled={currentIndex === 0}
            aria-label="Previous domains"
          >
            <ArrowBackIos />
          </button>

          {/* Domains Track */}
          <div
            className={styles.domains__track}
            ref={carouselRef}
            onScroll={handleScroll}
          >
            {domains.map((domain) => (
              <div
                key={domain.id}
                className={`${styles.domains__item} ${
                  localSelectedDomain === domain.id ? styles['domains__item--selected'] : ''
                }`}
                onClick={() => handleDomainClick(domain)}
              >
                <div className={styles.domains__icon}>
                  <img
                    src={domain.icon}
                    alt={domain.alt}
                    className={styles.domains__image}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/icons/default-domain.png';
                    }}
                  />
                </div>
                <div className={styles.domains__label}>
                  <p className={styles.domains__text}>{domain.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrow Right */}
          <button
            className={`${styles.domains__arrow} ${styles['domains__arrow--right']}`}
            onClick={scrollNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Next domains"
          >
            <ArrowForwardIos />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;
