import React from 'react';
import Image from 'next/image';
import styles from './AboutUsMission.module.css';

interface AboutUsMissionProps {
  className?: string;
}

const AboutUsMission: React.FC<AboutUsMissionProps> = ({ className = '' }) => {
  return (
    <section className={`${styles.mission} ${className}`}>
      <div className={styles.mission__container}>
        <div className={styles.mission__content}>
          {/* Left side - Image */}
          <div className={styles.mission__left}>
            <div className={styles.mission__imageWrapper}>
              <Image
                src="/images/aboutus/ourmission.png"
                alt="Mission - Urban Learning Platform visualization"
                width={600}
                height={400}
                className={styles.mission__image}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/500x400/054365/FFFFFF?text=Mission+Vision';
                }}
              />
            </div>
          </div>

          {/* Right side - Text Content */}
          <div className={styles.mission__right}>
            <div className={styles.mission__header}>
              <h2 className={styles.mission__title}><span className={styles.mission__accent}>Our</span> Mission</h2>
            </div>
            <div className={styles.mission__text}>
              <p>
                To create an Urban Learning Platform, supplementing <strong>traditional capacity building with online learning </strong>to
                enhance skills of urban practitioners in an ever-changing ecosystem.              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsMission; 