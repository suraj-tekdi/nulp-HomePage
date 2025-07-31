// AboutUsHero.tsx
import React from 'react';
import styles from './AboutUsHero.module.css';

interface BannerProps {
  className?: string;
}

const AboutUsHero: React.FC<BannerProps> = ({ className = '' }) => {
  // Single banner content
  const bannerData = {
    title: "About Us",
      buttonText: "Explore Domains",
      buttonAction: () => console.log('Explore Domains clicked'),
      backgroundImage: "/images/banner/banner1.png",
  };

  const stats = [
    { number: "12", label: "PARTICIPATING STATES" },
    { number: "449", label: "URBAN LOCAL BODIES" },
    { number: "107690", label: "NULP COMMUNITY MEMBERS" },
  ];

  return (
    <section className={`${styles.banner} ${className}`}>
      {/* Single Banner */}
      <div className={styles['banner__container']}>
        <div
          className={styles['banner__slide']}
          style={{
            backgroundImage: `url(${bannerData.backgroundImage})`,
              }}
            >
              <div className={styles['banner__background-overlay']} />
                <div className={styles.banner__content}>
                  <div className={styles['banner__content-wrapper']}>
              <h1 className={styles['banner__content-title']}>
                {bannerData.title}
              </h1>
                    <button
                      className={styles['banner__content-button']}
                onClick={bannerData.buttonAction}
                    >
                {bannerData.buttonText}
                    </button>
            </div>
        </div>
      </div>

        {/* Stats Sidebar */}
      <div className={styles['banner__sidebar']}>
        <div className={styles['banner__stats']}>
            {stats.map((stat, index) => (
              <div key={index} className={styles['banner__stats-item']}>
                <div className={styles['banner__stats-number']}>{stat.number}</div>
                <div className={styles['banner__stats-label']}>{stat.label}</div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsHero;
