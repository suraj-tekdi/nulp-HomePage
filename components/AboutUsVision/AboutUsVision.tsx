import React from 'react';
import Image from 'next/image';
import styles from './AboutUsVision.module.css';

interface AboutUsVisionProps {
  className?: string;
}

const AboutUsVision: React.FC<AboutUsVisionProps> = ({ className = '' }) => {
  return (
    <section className={`${styles.vision} ${className}`}>
      <div className={styles.vision__container}>
        <div className={styles.vision__content}>
          {/* Left side - Text Content */}
          <div className={styles.vision__left}>
            <div className={styles.vision__header}>
              
              <h2 className={styles.vision__title}><span className={styles.vision__accent}>Our</span> Vision</h2>
            </div>
            <div className={styles.vision__text}>
              <p>
                To be the largest community of <strong>Urban Practitioners</strong> learning from each other.
              </p>
            </div>
          </div>

          {/* Right side - Image */}
          <div className={styles.vision__right}>
            <div className={styles.vision__imageWrapper}>
              <Image
                src="/images/aboutus/ourvision.png"
                alt="Our Vision - Team collaboration workspace"
                width={600}
                height={400}
                className={styles.vision__image}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsVision; 