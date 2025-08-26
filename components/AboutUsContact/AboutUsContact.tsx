import React from 'react';
import styles from './AboutUsContact.module.css';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';

interface AboutUsContactProps {
  className?: string;
}

const AboutUsContact: React.FC<AboutUsContactProps> = ({ className = '' }) => {
  return (
    <section id="contact-us" className={`${styles.contact} ${className}`}>
      <div className={styles.contact__container}>
        <h2 className={styles.contact__title}>Contact Us</h2>

        <div className={styles.contact__infoGrid}>
          <div className={styles.contact__infoItem}>
            <span className={styles.contact__icon} aria-hidden="true">
              <LocationOnRoundedIcon className={styles.contact__iconImg} fontSize="medium" />
            </span>
            <div>
              <h3 className={styles.contact__infoTitle}>National Institute of Urban Affairs</h3>
              <p className={styles.contact__infoText}>
                1st Floor, Core 4B, India Habitat Centre, Lodhi Road, New Delhi - 110003, INDIA
              </p>
            </div>
          </div>

          <div className={styles.contact__infoItem}>
            <span className={styles.contact__icon} aria-hidden="true">
              <CallRoundedIcon className={styles.contact__iconImg} fontSize="medium" />
            </span>
            <div>
              <h3 className={styles.contact__infoTitle}>Email ID:</h3>
              <a href="mailto:nulp@niua.org" className={styles.contact__link}>nulp@niua.org</a>
            </div>
          </div>
        </div>

        <div className={styles.contact__mapWrapper}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.3337971631213!2d77.22044749999999!3d28.5897614!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1d5ebfb73dcf%3A0xc3b5eadedcbcca50!2sNational%20Institute%20of%20Urban%20Affairs!5e0!3m2!1sen!2sin!4v1755681227195!5m2!1sen!2sin"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            aria-label="National Institute of Urban Affairs location on Google Maps"
          />
        </div>
      </div>
    </section>
  );
};

export default AboutUsContact; 