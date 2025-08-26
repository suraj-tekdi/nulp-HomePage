import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './LaunchVideoSection.module.css';
import { stacksApi, type HomepageStackItem } from '../../services/api';

interface LaunchVideoSectionProps {
  className?: string;
}

// Custom hook for animated counter
const useAnimatedCounter = (target: number, duration: number = 1500, shouldStart: boolean = false) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!shouldStart || hasAnimated) return;

    setHasAnimated(true);
    let startValue = 0;
    const startTime = Date.now();
    
    const updateCounter = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth animation (ease-out)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(target); // Ensure we end at exact target
      }
    };
    
    requestAnimationFrame(updateCounter);
  }, [target, duration, shouldStart, hasAnimated]);

  return count;
};

// Child component to safely use hooks inside list rendering
const AnimatedNumber: React.FC<{ value: number; duration: number; start: boolean; original: number }>
= ({ value, duration, start, original }) => {
  const animated = useAnimatedCounter(value, duration, start);
  const formatNumber = (num: number, originalValue: number): string => {
    if (originalValue < 10 && originalValue.toString().length === 1) {
      return num.toString().padStart(2, '0');
    }
    return num.toLocaleString();
  };
  return <>{formatNumber(animated, original)}</>;
};

const LaunchVideoSection: React.FC<LaunchVideoSectionProps> = ({ className = '' }) => {
  // Convert Google Drive sharing URL to embeddable URL
  const videoUrl = "https://drive.google.com/file/d/1LTPVB542XGX8bJyc9g4mkiojknJ755zY/preview";

  // State for animation trigger
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // API-driven stats only (no hardcoded defaults)
  const [stats, setStats] = useState<{ number: number; label: string; duration: number }[]>([]);
  const [isLoadingStacks, setIsLoadingStacks] = useState(true);

  // Fetch stacks from CMS and map to stats (display ALL items)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await stacksApi.getHomepageStacks();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const items = (res.data as HomepageStackItem[])
            .filter((item) => item.category?.slug === 'landing-page-stacks')
            .filter((item) => typeof item.enter_count === 'number' && item.title)
            // Stable sort: first by category name to group, then by order within group
            .sort((a, b) => {
              const catA = a.category?.slug || '';
              const catB = b.category?.slug || '';
              if (catA !== catB) return catA.localeCompare(catB);
              const oa = typeof a.order === 'number' ? a.order : 0;
              const ob = typeof b.order === 'number' ? b.order : 0;
              return oa - ob;
            });

          const mapped = items.map((item, idx) => ({
            number: item.enter_count || 0,
            label: item.title,
            duration: 1000 + (idx % 6) * 200,
          }));

          console.log('LaunchVideo stacks mapped:', { count: mapped.length, titles: mapped.map(m => m.label) });
          setStats(mapped);
        } else if (isMounted) {
          console.log('LaunchVideo stacks: empty or invalid response', res);
          setStats([]);
        }
      } catch (e) {
        console.error('LaunchVideo stacks fetch error:', e);
        if (isMounted) setStats([]);
      } finally {
        if (isMounted) setIsLoadingStacks(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldAnimateStats) {
            setShouldAnimateStats(true);
          }
        });
      },
      { 
        threshold: 0.2, 
        rootMargin: '0px 0px -10% 0px' 
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [shouldAnimateStats]);

  return (
    <section className={`${styles.launchVideo} ${className}`} ref={statsRef}>
      <div className={styles.launchVideo__container}>

        <div className={styles.launchVideo__content}>
          {/* Left Side - Video */}
          <div className={styles.launchVideo__videoWrapper}>
            <div className={styles.launchVideo__videoContainer}>
              <iframe 
                src={videoUrl}
                className={styles.launchVideo__video}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="NULP Launch Video"
              />
            </div>
          </div>

          {/* Right Side - Stats */}
          <div className={styles.launchVideo__statsWrapper}>
            <div className={styles.launchVideo__statsGrid}>  
              {!isLoadingStacks && stats.length > 0 && stats.map((stat, index) => (
                <div key={`${stat.label}-${index}`} className={styles.launchVideo__statCard}>
                  <div className={styles.launchVideo__statIcon}>
                    <Image
                      src="/images/growth-arrow.png"
                      alt="Growth Arrow"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className={styles.launchVideo__statNumber}>
                    <AnimatedNumber value={stat.number} duration={stat.duration} start={shouldAnimateStats} original={stat.number} />
                  </div>
                  <div className={styles.launchVideo__statLabel}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LaunchVideoSection; 