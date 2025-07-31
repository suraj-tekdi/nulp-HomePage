import React from 'react';
import Head from 'next/head';
import { Header, Footer } from '../components';
import AboutUsHero from '../components/AboutUsHero/AboutUsHero';
import AboutUsVision from '../components/AboutUsVision/AboutUsVision';
import AboutUsMission from '../components/AboutUsMission/AboutUsMission';
import AboutUsApproach from '../components/AboutUsApproach/AboutUsApproach';
import AboutUsOfferings from '../components/AboutUsOfferings/AboutUsOfferings';
import AboutUsWhy from '../components/AboutUsWhy/AboutUsWhy';
import AboutUsPartner from '../components/AboutUsPartner/AboutUsPartner';
import AboutUsContact from '../components/AboutUsContact/AboutUsContact';

const AboutPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>About Us - NULP | National Urban Learning Platform</title>
        <meta name="description" content="Learn about NULP's vision, mission, and approach to urban learning and capacity building for urban practitioners." />
      </Head>

      {/* Header */}
      <Header />

      {/* About Us Hero Section */}
      <AboutUsHero />

      {/* Vision Section */}
      <AboutUsVision />

      {/* Mission Section */}
      <AboutUsMission />

      {/* Our Approach Section */}
      <AboutUsApproach />

      {/* Our Offerings Section */}
      <AboutUsOfferings />

      {/* Why Does NULP Exist Section */}
      <AboutUsWhy />

      {/* Partner with Us Section */}
      <AboutUsPartner />

      {/* Get in Touch Section */}
      <AboutUsContact />

      {/* Footer */}
      <Footer />
    </>
  );
};

export default AboutPage; 