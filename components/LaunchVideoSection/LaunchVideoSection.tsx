import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './LaunchVideoSection.module.css';

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

const LaunchVideoSection: React.FC<LaunchVideoSectionProps> = ({ className = '' }) => {
  // Convert Google Drive sharing URL to embeddable URL
  const videoUrl = "https://drive.google.com/file/d/1LTPVB542XGX8bJyc9g4mkiojknJ755zY/preview";

  // State for animation trigger
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Stats data with numeric values for animation
  const stats = [
    { number: 10, label: "Domains", duration: 1000 },
    { number: 114, label: "Courses", duration: 1800 },
    { number: 200, label: "Local Urban Solutions", duration: 2000 },
    { number: 4, label: "National Certification Programmes", duration: 800 },
    { number: 2, label: "Learning Journeys", duration: 600 },
    { number: 70, label: "Knowledge Partners", duration: 1400 }
  ];

  // Animated counters for each stat
  const animatedStats = [
    useAnimatedCounter(stats[0].number, stats[0].duration, shouldAnimateStats),
    useAnimatedCounter(stats[1].number, stats[1].duration, shouldAnimateStats),
    useAnimatedCounter(stats[2].number, stats[2].duration, shouldAnimateStats),
    useAnimatedCounter(stats[3].number, stats[3].duration, shouldAnimateStats),
    useAnimatedCounter(stats[4].number, stats[4].duration, shouldAnimateStats),
    useAnimatedCounter(stats[5].number, stats[5].duration, shouldAnimateStats),
  ];

  // Format numbers with leading zeros for single digits (like "04")
  const formatNumber = (num: number, originalValue: number): string => {
    if (originalValue < 10 && originalValue.toString().length === 1) {
      return num.toString().padStart(2, '0');
    }
    return num.toLocaleString();
  };

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('LaunchVideo intersection:', entry.isIntersecting, entry.intersectionRatio);
          if (entry.isIntersecting && !shouldAnimateStats) {
            console.log('Starting LaunchVideo stats animation');
            setShouldAnimateStats(true);
          }
        });
      },
      { 
        threshold: 0.2, // Trigger when 20% of stats are visible (more sensitive)
        rootMargin: '0px 0px -10% 0px' // Trigger slightly before fully in view
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
              {stats.map((stat, index) => (
                <div key={index} className={styles.launchVideo__statCard}>
                  <div className={styles.launchVideo__statIcon}>
                    <Image
                      src="/images/growth-arrow.png"
                      alt="Growth Arrow"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className={styles.launchVideo__statNumber}>
                    {formatNumber(animatedStats[index], stat.number)}
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