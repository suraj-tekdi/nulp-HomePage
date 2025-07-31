import React from 'react';
import styles from './AboutUsApproach.module.css';

interface AboutUsApproachProps {
  className?: string;
}

const AboutUsApproach: React.FC<AboutUsApproachProps> = ({ className = '' }) => {
  const approachPoints = [
    "Provide a digital platform to deliver learning, based on user’s convenience.",
    "Built on tenets of peer learning where such users are not only learners, but also creators of content sharing on-ground experience, success stories and insights.",
    "Offer a marketplace to create partnerships to address learning needs of the community."
  ];

  return (
    <section className={`${styles.approach} ${className}`}>
      <div className={styles.approach__container}>
        <div className={styles.approach__grid}>
          <div className={styles.approach__left}>
            <div className={styles.approach__line}></div>
            <h2 className={styles.approach__heading}>
              Our <strong>Approach</strong>
            </h2>
          </div>
          <div className={styles.approach__right}>
            <ul className={styles.approach__list}>
              {approachPoints.map((point, index) => (
                <li key={index} className={styles.approach__item}>
                  <span className={styles.approach__dot}></span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsApproach;
