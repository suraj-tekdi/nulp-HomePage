// AboutUsWhy.tsx
import React, { useState } from 'react';
import styles from './AboutUsWhy.module.css';

const AboutUsWhy: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={styles.why}>
      {/* Gold divider line */}
      <div className={styles.why__divider} />

      {/* Accordion container: small when closed, full-width when open */}
      <div
        className={
          `${styles.why__content} ` +
          (isExpanded ? styles.expanded : '')
        }
      >
        <button
          className={styles.why__trigger}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          <h2 className={styles.why__title}>Why Does NULP Exist?</h2>
          <div className={styles.why__arrow}>
            <span>{isExpanded ? '↑' : '↓'}</span>
          </div>
        </button>

      </div>

      <div className={`${styles.why__expanded} ${isExpanded ? styles.show : ''}`}>
        <div className={styles.why__expanded__content}>
          <p>
            Urban officials have a variety of functional needs because of the practical
            challenges of urban governance. There is a scope to supplement the skills
            and capacities of city officials to address these functional needs. The
            National Urban Learning Platform (NULP) is a demand-driven digital platform
            that responds to these needs and aims to affect real improvements in the skills
            of urban practitioners.
          </p>
          <p>
            NULP is building a collaborative network where the urban administrators of
            the Indian cities learn from each other and the rest of the urban ecosystem
            via peer-to-peer connections.
          </p>
          <p>
            Therefore, the main elements of NULP include a marketplace via mobile-first
            approach, simple-to-use tools to create, share and consume content, collate
            demand dynamically from the field, reward & recognition frameworks and user
            feedback to ignite a culture of social learning in the community of urban
            practitioners.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUsWhy;