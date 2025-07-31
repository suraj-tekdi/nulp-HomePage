import React from 'react';
import Image from 'next/image';
import styles from './LaunchVideoSection.module.css';

interface LaunchVideoSectionProps {
  className?: string;
}

const LaunchVideoSection: React.FC<LaunchVideoSectionProps> = ({ className = '' }) => {
  // Convert Google Drive sharing URL to embeddable URL
  const videoUrl = "https://drive.google.com/file/d/1LTPVB542XGX8bJyc9g4mkiojknJ755zY/preview";

  // Stats data in square format
  const stats = [
    { number: "10", label: "Domains" },
    { number: "114", label: "Courses" },
    { number: "200", label: "Local Urban Solutions" },
    { number: "04", label: "National Certification Programmes" },
    { number: "02", label: "Learning Journeys" },
    { number: "70", label: "Knowledge Partners" }
  ];

  return (
    <section className={`${styles.launchVideo} ${className}`}>
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
                    {stat.number}
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