import React from 'react';
import styles from './AboutUsPartner.module.css';

interface AboutUsPartnerProps {
  className?: string;
}

const AboutUsPartner: React.FC<AboutUsPartnerProps> = ({ className = '' }) => {
  return (
    <section className={`${styles.partner} ${className}`}>
      <div className={styles.partner__container}>
        <h2 className={styles.partner__title}>Partner with Us</h2>
        
        <div className={styles.partner__cards}>
          <div className={styles.partner__card}>
            <ul className={styles.partner__list}>
              <li>
                NULP invites your contribution towards collaborative learning to enhance the skills and knowledge of Urban Ecosystem participants. Government departments, academic institutions, industries, start-ups, and civil society organizations can provide thought leadership and domain expertise by catering to the existing and emerging learning requirements of the NULP community.
              </li>
            </ul>
          </div>
          
          <div className={styles.partner__card}>
            <ul className={styles.partner__list}>
              <li>
                By creating and facilitating a flow of knowledge & skill resources onto the platform, partners can become pioneers in this initiative on nurturing capacities in the urban development sector for better citizen experience.
                
              </li>
            </ul>
            
            <div className={styles.partner__contact}>
              <p>If you wish to partner with us or would like more information, please mail us at <a href="mailto:nulp@niua.org">nulp@niua.org</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsPartner; 