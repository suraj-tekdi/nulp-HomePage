import React from 'react';
import styles from './AboutUsContact.module.css';

interface AboutUsContactProps {
  className?: string;
}

const AboutUsContact: React.FC<AboutUsContactProps> = ({ className = '' }) => {
  return (
    <section className={`${styles.contact} ${className}`}>
      <div className={styles.contact__container}>
        <div className={styles.contact__left}>
          <h2 className={styles.contact__title}>Get in Touch!</h2>
          <p className={styles.contact__subtitle}>Write to us or explore content today!</p>
        </div>
          
        <div className={styles.contact__right}>
          <div className={styles.contact__buttons}>
            <button
              className={styles.contact__button_filled}
              onClick={() => { window.location.href = 'https://devnulp.niua.org/webapp'; }}
            >
              Explore Content
            </button>
            <button className={styles.contact__button_outlined}>Contact Us</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsContact; 