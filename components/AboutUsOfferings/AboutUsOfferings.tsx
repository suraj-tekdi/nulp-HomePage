import React from 'react';
import styles from './AboutUsOfferings.module.css';

interface Offering {
  title: string;
  image: string;
  alt: string;
}

interface AboutUsOfferingsProps {
  className?: string;
}

const AboutUsOfferings: React.FC<AboutUsOfferingsProps> = ({ className = '' }) => {
  const offerings: Offering[] = [
    {
      title: 'Virtual communities and peer discussions',
      image: '/images/aboutus/ouroffering1.png',
      alt: 'Virtual communities and peer discussions',
    },
    {
      title: 'Certification courses for urban domains',
      image: '/images/aboutus/ouroffering2.png',
      alt: 'Certification courses for urban domains',
    },
    {
      title: 'Celebrating user contribution',
      image: '/images/aboutus/ouroffering3.png',
      alt: 'Celebrating user contribution',
    },
  ];

  return (
    <section className={`${styles.offerings} ${className}`}>
      <div className={styles.offerings__container}>
        <div className={styles.offerings__header}>
          <h2 className={styles.offerings__title}>Our Offerings</h2>
        </div>
        <div className={styles.offerings__grid}>
          {offerings.map((offering, index) => (
            <div key={index} className={styles.offerings__card}>
              <img
                src={offering.image}
                alt={offering.alt}
                className={styles.offerings__icon}
              />
              <h3 className={styles.offerings__cardTitle}>{offering.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutUsOfferings;
